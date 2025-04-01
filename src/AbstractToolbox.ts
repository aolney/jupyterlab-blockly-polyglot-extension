import * as Blockly from 'blockly/core';
import { NotebookPanel,INotebookTracker } from "@jupyterlab/notebook";
import { Kernel, KernelMessage } from "@jupyterlab/services";
import { IRenderMime, MimeModel } from "@jupyterlab/rendermime";
import { CustomFields } from "./SearchDropdown";

// CustomFieldFilter
/**
 * All language toolboxes must implement IToolbox. BlocklyWidget will call the functions in the interface. 
 */
export interface IToolbox {
    EncodeWorkspace():string;
    DecodeWorkspace(xml:string):void;
    UpdateAllIntellisense():void;
    BlocksToCode():string;
    DoFinalInitialization(): void;
    GetDefaultToolbox():Blockly.utils.toolbox.ToolboxDefinition;
    UpdateToolbox():void;
}

/**
 * We create an interface for Blockly generators because Blockly does not provide one
 */
export interface IGenerator {
  getVariableName(nameOrId: string): string;
  statementToCode(block: Blockly.Block, name: string): string;
  valueToCode(block: Blockly.Block, name: string, outerOrder: number): string;
  workspaceToCode( workspace : Blockly.WorkspaceSvg ) : string;
}
// TODO: may not need IntellisenseEntry and related code with LSP

/**
 * An entry for a single name (var/function/whatever)
 */
export class IntellisenseEntry{
    readonly Name: string;
    readonly Info: string;
    readonly isFunction: boolean;
    readonly isClass: boolean;
    constructor(Name: string, Info: string, isFunction: boolean, isClass: boolean) {
        this.Name = Name;
        this.Info = Info;
        this.isFunction = isFunction;
        this.isClass = isClass;
    }
}
/**
 * An entry for a complex name, e.g. object, that has associated properties and/or methods
 */
class IntellisenseVariable{
    readonly VariableEntry: IntellisenseEntry;
    readonly ChildEntries: IntellisenseEntry[];
    constructor(VariableEntry: IntellisenseEntry, ChildEntries: IntellisenseEntry[]) {
        this.VariableEntry = VariableEntry;
        this.ChildEntries = ChildEntries;
    }
}


/**
 * Base class for toolboxes. Implements common functionality.
 */
export abstract class AbstractToolbox {

  /**
   * We need a reference to the notebook to get the correct kernel, which we need for intellisense
   */
  notebooks: INotebookTracker | null = null;
  /**
   * Reference to the blockly workspace
   */
  workspace : Blockly.WorkspaceSvg | null = null;
  /**
   * Generator converts blocks to code; will be set by a language specific method
   */
  generator : IGenerator | null  = null;
  /**
   * Toolbox definition; defines the blocks available and how they appear in the blockly menu
   */
  abstract toolboxDefinition : Blockly.utils.toolbox.ToolboxDefinition;

  /**
   * Cache intellisense requests. Keyed on variable name
   */
  intellisenseLookup: Map<string, IntellisenseVariable> = new Map<string, IntellisenseVariable>([]);
  /**
   * Annotation for selecting property intelliblocks from Blockly. Probably needs to be set by subclasses for their language suffix
   */
  intelliblockPropertyLabel = "varGetProperty"
  /**
   * Annotation for selecting method intelliblocks from Blockly. Probably needs to be set by subclasses for their language suffix
   */
  intelliblockMethodLabel = "varDoMethod"
  /**
   * Annotation for selecting constructor intelliblocks from Blockly. Probably needs to be set by subclasses for their language suffix
   */
  intelliblockConstructorLabel = "varCreateObject"

  /**
   * Intitialize using notebook kernel and blockly workspace; calls initialize generator
   * @param notebooks 
   * @param workspace 
   */
  constructor(notebooks:INotebookTracker,workspace:Blockly.WorkspaceSvg){

    this.notebooks = notebooks;
    this.workspace = workspace;

    this.InitializeGenerator();

    //register custom flyout for intelliblocks (VARIABLES category)
    Blockly.Variables.flyoutCategoryBlocks = this.flyoutCategoryBlocks;
    
  }

  /**
   * Determine if entity is a function using inspection info; language specific
   * @param info 
   */
  abstract isFunction( query: string, info : string) : boolean;
  /**
   * Determine if entity is a class using inspection info; language specific
   * @param info 
   */
  abstract isClass( info :string) : boolean;
  /**
   * String used as a separator in scope/namespace; language specific
   * Examples: Python uses "." between class and methods/properties/etc, but R uses "::" between a namespace/package and a function/element in that namespace/package
   */
  abstract dotString(): string;
  /**
   * Get completions for a list of children. Filters completions in a language specific way
   * @param parent
   * @param children 
   */
  abstract GetSafeChildCompletions(parent: IntellisenseEntry, children : string[] ) : string[]
  /**
   * Get inspections for a list of children. Different langauges may need different error handling for this step
   * @param children 
   */
  abstract GetChildrenInspections(parent: IntellisenseEntry,  children : string[] ) : Promise<string>[]
  /**
   * Set up the language specific generator. Needed for adding new blocks to the generator in language subclasses
   */
  abstract InitializeGenerator() : void;

  /**
   * Encode the current Blockly workspace as an XML string
   * @returns 
   */
  EncodeWorkspace(): string {
      const xml: Element = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
      return Blockly.Xml.domToText(xml);
  };

  /**
   * Decode an XML string and load the represented blocks into the Blockly workspace
   * @param xmlText 
   */
  DecodeWorkspace(xmlText: string): void {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const xmlElement = xmlDoc.documentElement;
      Blockly.Xml.domToWorkspace(xmlElement, Blockly.getMainWorkspace() as Blockly.WorkspaceSvg);
  }

  /**
   * Return the code fro the blocks on the workspace, using the toolbox generator
   * @returns 
   */
  BlocksToCode() : string {
    if( this.generator && this.workspace ) {
      return this.generator.workspaceToCode(this.workspace);
    }
    else {
      return "";
    }
  }


  /**
   * Updated the intellisense options on all intelliblocks.
   */
  UpdateAllIntellisense(): void {
      const workspace: Blockly.Workspace = Blockly.getMainWorkspace();
      
      const blocks: Blockly.Block[] = workspace.getBlocksByType(this.intelliblockPropertyLabel, false);
      workspace.getBlocksByType(this.intelliblockMethodLabel, false).forEach(block => blocks.push(block));
      
      blocks.forEach((block: any) => {
          block.updateIntellisense(block, null, ((varName: string): string[][] => this.requestAndStubOptions(block, varName)));
      });

      (workspace as Blockly.WorkspaceSvg).registerToolboxCategoryCallback(
          'VARIABLE', this.flyoutCategoryBlocks);
  }

  /**
   * Try to get intellsense options for a single block. Fail gracefully.
   * @param block 
   * @param varName 
   * @returns 
   */
  requestAndStubOptions(block: Blockly.Block, varName: string): string[][] {
      if ((varName !== "") && !block.isInFlyout) {
          this.RequestIntellisenseVariable(block, varName);
      }
      if (block.isInFlyout) {
          return [[" ", " "]];
      }
      else if ((varName !== "") && this.intellisenseLookup.has(varName)) {
          return [["!Waiting for kernel to respond with options.", "!Waiting for kernel to respond with options."]];
      }
      else {
          return [["!Not defined until you execute code.", "!Not defined until you execute code."]];
      }
  }
  
  /**
   * Request an intellisense variable. Complications arise from caching (which is problematic if the variable changes types or is otherwise redefined) and our UI decision to disambiguate this.dotString() into functions/methods, properties, and constructors (depending on language). 
   * @param block 
   * @param parentName 
   */
  RequestIntellisenseVariable(block: Blockly.Block, parentName: string): void {
      // the variable we are querying is hereafter called the "parent" and the elements underneath it (its properties/methods/etc) are hereafter called "children"
      // start by inspecting the parent 
      this.GetKernelInspection(parentName).then((parentInspection: string) => {
          // process the parent information
          const parent: IntellisenseEntry = new IntellisenseEntry(parentName, parentInspection, this.isFunction(parentName,parentInspection), this.isClass(parentInspection));

          // Assume we need to get children
          let shouldGetChildren: boolean = true;
          // Check the cache to see if we have found children before
          let cached_variable: IntellisenseVariable | undefined = this.intellisenseLookup.get(parent.Name);
          if( cached_variable != null ) {
            // Even if we have a cached variable, update it if the parent Info does not match or if child entries is short
            if (cached_variable.VariableEntry.Info !== parent.Info || cached_variable.ChildEntries.length <= 1) {
              shouldGetChildren = true;
            // Only avoid getting children if the cached variable looks good
            } else {
              shouldGetChildren = false;
            }
          }
        
          if (!shouldGetChildren) {
            console.log("Not refreshing intellisense for " + parent.Name);
            // Trigger update intellisense even if we are cached (this could be reconsidered, but original code does this)
            this.fireIntellisenseEvent(block);

          // We need to get the children of the parent; i.e. this is a new variable or one whose type has changed
          } else {
            // Get children by prefixing on parent's name 
            this.GetKernelCompletion(parentName + this.dotString()).then((children: string[]) => {
              // Get inspections for all children (language specific to be robust)
              let safeCompletions = this.GetSafeChildCompletions(parent,children);
              const pr = this.GetChildrenInspections(parent,children);

              // Synchronize on inspections to yield the final result
              Promise.allSettled(pr).then((results : PromiseSettledResult<string>[]) => {
                // Create an intellisense entries for children, sorted alphabetically
                let children: IntellisenseEntry[] = safeCompletions.map((childCompletion: string, index: number) => {
                  let info = "";
                  let isFunction = true;
                  let isClass = false;
                  if( results[index].status === "fulfilled") {
                    info = (results[index] as PromiseFulfilledResult<string>).value;
                    //TODO: R implementation asks for additional parameter; might be workaround
                    isFunction = this.isFunction(parentName, info);
                    isClass = this.isClass(info);
                  } 
                  return new IntellisenseEntry(childCompletion, info, isFunction, isClass)}).sort((a, b) => (a.Name < b.Name ? -1 : 1));
                // Package up IntellisenseVariable (parent + children)
                let intellisenseVariable: IntellisenseVariable = new IntellisenseVariable(parent, children);
                // Add to cache
                this.intellisenseLookup.set(parentName, intellisenseVariable);
      
                // Fire event; this causes Blockly to refresh
                this.fireIntellisenseEvent(block);
              }).catch(error => {
                console.log("Intellisense error getting inspections for children of " + parentName, error);
              });
            }).catch(error => {
              console.log("Intellisense error getting child completions of " + parentName, error);
            });
          }
        }).catch((error) => {
          console.log("Intellisense error getting inspection of intellisense variable candidate (parent) " + parentName, error);
        });
  }


  /**
   * Wrap a promise inside another with a timeout in milliseconds
   * https://github.com/JakeChampion/fetch/issues/175#issuecomment-216791333
   * @param ms 
   * @param promise 
   * @returns 
   */
  timeoutPromise<T>(ms: number, promise: Promise<T>) {
    return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        reject(new Error("promise timeout"))
    }, ms);
    promise.then(
        (res) => {
        clearTimeout(timeoutId);
        resolve(res);
        },
        (err) => {
        clearTimeout(timeoutId);
        reject(err);
        }
    );
    })
  }

  /**
   * Get the current notebook widget and the kernel; used by various internal functions
   * @returns a widget,kernel tuple
   */
    GetKernel():  [NotebookPanel | null | undefined, Kernel.IKernelConnection | null | undefined] {
      let widget = this.notebooks?.currentWidget;
      let kernel = widget?.sessionContext.session?.kernel;
      return [widget,kernel];
      
  }

  /**
   * Get an inspection (shift+tab) using the kernel
   * @param queryString 
   * @returns 
   */
  GetKernelInspection(queryString: string): Promise<string> {
    let [widget,kernel] = this.GetKernel();
    if( widget && kernel ){
      return new Promise<string>((resolve, reject) => {
        // request an inspection from the kernel
        // @ts-ignore
        kernel.requestInspect({
          code: queryString,
          cursor_pos: queryString.length,
          detail_level: 0,
        }).then((_arg: KernelMessage.IInspectReplyMsg) => {
          // handle the kernel reply
          // the reply has some kind of funky ascii encoding
          const content = _arg.content;
          if ("found" in content && content.found) {
            // @ts-ignore
            const mimeType: string | undefined = widget.content.rendermime.preferredMimeType(content.data);
            const model: MimeModel = new MimeModel({
              data: content.data,
            });
            if(mimeType){
              // @ts-ignore
              const renderer: IRenderMime.IRenderer = widget.content.rendermime.createRenderer(mimeType);
              renderer.renderModel(model).then(() => {
                resolve(renderer.node.innerText);
              }).catch((error) => {
                // we cannot render the kernel reply
                console.log(queryString + ":RENDER_ERROR");
                reject(error);
              });
            }
          } else {
              // kernel can't match the query
              console.log(queryString + ":UNDEFINED");
              resolve("UNDEFINED");
            }
        }).catch((_arg_2: Error) => {
          // kernel inspection throws an error before matching
          console.log(queryString + ":UNAVAILABLE");
          reject(new Error(queryString + " is unavailable"));
        });
      });
    } else {
      // kernel is not available
      console.log("kernel inspection promise rejected: no kernel");
      return Promise.reject("kernel inspection promise rejected: no kernel");
    }
  }

  /**
   * Get a completion (tab+tab) using the kernel. Typically this will be following a this.dotString() but it could also be to match a known identifier against a few initial letters.
   * @param queryString 
   * @returns 
   */
  GetKernelCompletion(queryString: string): Promise<string[]> {
    let [_,kernel] = this.GetKernel();
    if( kernel ) {
      return new Promise<string[]>((resolve, reject) => {
        // setTimeout(() => {
          // request a completion from the kernel
          // @ts-ignore
          kernel.requestComplete({
            code: queryString,
            cursor_pos: queryString.length,
          }).then((_arg: KernelMessage.ICompleteReplyMsg) => {
            // handle the kernel reply
            const content = _arg.content;
            if ('matches' in content) {
              resolve(content.matches.slice());
            }
          }).catch((_arg_1: Error) => {
            reject([queryString + " is unavailable"]);
          });
        // }, 100);
      });
    } else {
      return Promise.reject("kernel completion promise rejected: no kernel");
    }
  }

  /**
   * Fire intellisense event that causes Blockly to refresh intellisense-driven options.
   * Typically called by RequestIntellisenseVariable
   * @param block 
   */
  fireIntellisenseEvent(block: Blockly.Block) {
    try {
    // Create event on this block
    const intellisenseUpdateEvent = new Blockly.Events.BlockChange(block, "field", "VAR", 0, 1);
    // Set the event group; this allows event listners to focus on only relevant messages
    intellisenseUpdateEvent.group = "INTELLISENSE";
    // Do some state tracking; this helps with debugging events
    // TODO: if disabled_ is a custom flag, make it a class property
    // @ts-ignore
    console.log("event status is " + Blockly.Events.disabled_);
    // @ts-ignore
    Blockly.Events.disabled_ = 0;
    Blockly.Events.fire(intellisenseUpdateEvent);
    } 
    catch(e){
      if (e instanceof Error) {
        console.log("Intellisense event failed to fire; " + e.message);
      }
    }
  }

  /**
   * Create the blockly workspace palette flyout for the intelliblocks
   * @param workspace 
   * @returns 
   */
  flyoutCategoryBlocks(workspace: Blockly.Workspace): Element[] {
      const variableModelList: Blockly.VariableModel[] = workspace.getVariablesOfType("");
      const xmlList: Element[] = [];

      const button = document.createElement('button');
      button.setAttribute('text', "Create variable...");
      button.setAttribute('callbackKey', 'CREATE_VARIABLE');
      (workspace as Blockly.WorkspaceSvg).registerButtonCallback('CREATE_VARIABLE', function (button) {
          Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
      });
      xmlList.push(button);

      if (variableModelList.length > 0) {
          const lastVarFieldXml: Blockly.VariableModel = variableModelList[variableModelList.length - 1];
          if (Blockly.Blocks.variables_set) {
              const xml: Element = Blockly.utils.xml.createElement("block");
              xml.setAttribute("type", "variables_set");
              xml.setAttribute("gap", Blockly.Blocks.math_change ? "8" : "24");
              xml.appendChild(Blockly.Variables.generateVariableFieldDom(lastVarFieldXml));
              xmlList.push(xml);
          }
          if (Blockly.Blocks.math_change) {
              const xml_1: Element = Blockly.utils.xml.createElement("block");
              xml_1.setAttribute("type", "math_change");
              xml_1.setAttribute("gap", Blockly.Blocks.math_change ? "20" : "8");
              xml_1.appendChild(Blockly.Variables.generateVariableFieldDom(lastVarFieldXml));
              const shadowBlockDom: Element = Blockly.utils.xml.textToDom("<value name=\'DELTA\'><shadow type=\'math_number\'><field name=\'NUM\'>1</field></shadow></value>");
              xml_1.appendChild(shadowBlockDom);
              xmlList.push(xml_1);
          }
          if (Blockly.Blocks.varGetProperty) {
              const xml_2: Element = Blockly.utils.xml.createElement("block");
              xml_2.setAttribute("type", this.intelliblockPropertyLabel);
              xml_2.setAttribute("gap", Blockly.Blocks.varGetProperty ? "20" : "8");
              xml_2.appendChild(Blockly.Variables.generateVariableFieldDom(lastVarFieldXml));
              xmlList.push(xml_2);
          }
          if (Blockly.Blocks.varDoMethod) {
              const xml_3: Element = Blockly.utils.xml.createElement("block");
              xml_3.setAttribute("type", this.intelliblockMethodLabel);
              xml_3.setAttribute("gap", Blockly.Blocks.varDoMethod ? "20" : "8");
              xml_3.appendChild(Blockly.Variables.generateVariableFieldDom(lastVarFieldXml));
              xmlList.push(xml_3);
          }
          if (Blockly.Blocks.varCreateObject) {
              const xml_4: Element = Blockly.utils.xml.createElement("block");
              xml_4.setAttribute("type", this.intelliblockConstructorLabel);
              xml_4.setAttribute("gap", Blockly.Blocks.varCreateObject ? "20" : "8");
              xml_4.appendChild(Blockly.Variables.generateVariableFieldDom(lastVarFieldXml));
              xmlList.push(xml_4);
          }
          //TODO: Make one block all variables (with a dropdown) rather than a new block created for each variable
          if (Blockly.Blocks.variables_get) {
              for (const variableModel of variableModelList) {
                  const xml_5: Element = Blockly.utils.xml.createElement("block");
                  xml_5.setAttribute("type", "variables_get");
                  xml_5.setAttribute("gap", "8");
                  xml_5.appendChild(Blockly.Variables.generateVariableFieldDom(variableModel));
                  xmlList.push(xml_5);
              }
          }
      }
      return xmlList;
  }

  /**
   * Properties for this intellisense variable
   * @param memberSelectionFunction 
   * @param varName 
   * @returns 
   */
  getIntellisenseMemberOptions(memberSelectionFunction: ((arg0: IntellisenseEntry) => boolean), varName: string): string[][] {
    //See if the variable is defined
    const intellisense_variable: IntellisenseVariable | undefined = this.intellisenseLookup.get(varName);
    //If it's defined
    if (intellisense_variable != null) {
      //if it is not a function and has child entries, filter those and return
      if (!intellisense_variable.VariableEntry.isFunction && intellisense_variable.ChildEntries.length > 0) {
        return intellisense_variable.ChildEntries.filter(memberSelectionFunction).map((ie: IntellisenseEntry) => [ie.Name, ie.Name]);
      //if it is in the cache but undefined, return that message
      } else if (intellisense_variable.VariableEntry.Info === "UNDEFINED") {
        return [["!Not defined until you execute code.", "!Not defined until you execute code."]];
      //something's wrong, likely we have no properties to show
      } else {
        return [["!No properties available.", "!No properties available."]];
      }
    //it's not defined/ not in cache
    } else {
      return [["!Not defined until you execute code.", "!Not defined until you execute code."]];
    }
  }

  /**
   * Get intellisense variable info to display in tooltip or elsewhere
   * @param varName 
   * @returns 
   */
  getIntellisenseVarTooltip(varName: string): string {
    const intellisense_variable: IntellisenseVariable | undefined = this.intellisenseLookup.get(varName);
    //if in cache/defined, return its info
    if (intellisense_variable) {
      return intellisense_variable.VariableEntry.Info;
    } else {
      return "!Not defined until you execute code.";
    }
  }

  /**
   * Get info for child/member of intellisense variable to display in tooltip or elsewhere
   * @param varName 
   * @param memberName 
   * @returns 
   */
  getIntellisenseMemberTooltip(varName: string, memberName: string): string {
    const intellisense_variable: IntellisenseVariable | undefined = this.intellisenseLookup.get(varName);
  
    //if in cache/defined, search for named child
    if (intellisense_variable) {
      const child: IntellisenseEntry | undefined = intellisense_variable?.ChildEntries.find(c => c.Name === memberName);
  
      //if found, return its info
      if (child ) {
        return child.Info;
      } else {
        return "!Not defined until you execute code.";
      }
    // parent not in cache
    } else {
      return "!Not defined until you execute code.";
    }
  }

  /**
   * Remove a field from a block safely, even if it doesn't exist
   * @param block 
   * @param fieldName 
   * @param inputName 
   */
  SafeRemoveField(block: Blockly.Block, fieldName: string, inputName: string): void {
    const field: Blockly.Field | null = block.getField(fieldName);
    const input: Blockly.Input | null = block.getInput(inputName);
    //if the field does not exist, do nothing
    if (!field) {}
    //if the input does not exist, give an error message
    else if (!input) {
      console.log(((("error removing (" + fieldName) + ") from block; input (") + inputName) + ") does not exist");
    }
    //both exist, perform the removal op
    else {
      input.removeField(fieldName);
    }
  }

  /**
   * Remove an input safely, even if it doesn't exist
   * @param block 
   * @param inputName 
   */
  SafeRemoveInput(block: Blockly.Block, inputName: string): void {
    //if the input does not exist, do nothing
    if (!block.getInput(inputName)) {}
    //input exists, do the removal op
    else {
      block.removeInput(inputName);
    }
  }
  // TODO: MAKE BLOCK THAT ALLOWS USER TO MAKE AN ASSIGNMENT TO A PROPERTY (SETTER)
  // TODO: CHANGE OUTPUT CONNECTOR DEPENDING ON INTELLISENSE: IF FUNCTION DOESN'T HAVE AN OUTPUT, REMOVE CONNECTOR
  /**
   * Template function for making a block that has an intellisense-populated member dropdown. The member type is property or method, defined by the filter function
   * @param blockName 
   * @param preposition 
   * @param verb 
   * @param memberSelectionFunction 
   * @param hasArgs 
   * @param hasDot 
   */
  makeMemberIntellisenseBlock(blockName: string, preposition: string, verb: string, memberSelectionFunction: ((arg0: IntellisenseEntry) => boolean), hasArgs: boolean, hasDot: boolean): void {
    // Note the "blockName" given to these is hardcoded elsewhere, e.g. the toolbox and intellisense update functions
    Blockly.Blocks[blockName] = {
      //Get the user-facing name of the selected variable; on creation, defaults to created name
      varSelectionUserName(block: Blockly.Block, selection: string): string {
        const fieldVariable = block.getField("VAR") as Blockly.FieldVariable;
        //Get the last var created. Insane but works because by default, the flyout specifically lists this var in the block. User then expects to change if needed
        const lastVar: Blockly.VariableModel = block.workspace.getAllVariables().slice(-1)[0];
        //Attempt to get XML serialized data
        const dataString: string | null = block.data;
        const data: string[] = dataString && dataString.indexOf(":") >= 0 ? dataString.split(":") : [""];

        //if variable has been selected
        if (selection) {
          const options = fieldVariable.getOptions();
          const matching_option = options.find((option: Blockly.MenuOption) => option[1] === selection);
          //if we matched the selection to an option (not null), check if element 0 is string and return it if so, otherwise return ""
          return matching_option ? (typeof matching_option[0] === 'string' ? matching_option[0] : "") : "";
        } else {
          //various error handling
          //Previously we returned empty ""; now as a last resort we return the last var created
          if( fieldVariable.getText() == "" && data[0] == "" ){
            return lastVar.name;
          //prefer XML data over last var when XML data exists
          } else if( fieldVariable.getText() == "" &&  data[0] != null) {
            return data[0];
          //prefer current var name over all others when it exists
          } else if(  fieldVariable.getText() != null ) {
            fieldVariable.getText();
          }
        }
        // this should never fire but typescript is complaining without it here
        return "";
      },

      //back up the current member selection so it is not lost every time a cell is run
      selectedMember: "",


      updateIntellisense(block: any, selectedVarOption: string, optionsFunction: (varUserName: string) => string[][]){
        const input: Blockly.Input | null = block.getInput("INPUT");
        this.SafeRemoveField(block, "MEMBER", "INPUT");
        this.SafeRemoveField(block, "USING", "INPUT");
        const varUserName: string = block.varSelectionUserName(block, selectedVarOption);
        // Remove extra data from options
        const flatOptions: string[] = optionsFunction(varUserName).map(arr => arr[0]);
  
        // Restore stored value from XML if it exists
        const dataString: string = block.data ? block.data : "";

        // We must enforce a default selection for the UI to match user expectations. When a dropdown appears, the first option is highlighted by default as though it is selected by default. We also have to reify and persist this selection to block.data for proper blocks to code behavior when no selection has been made by the user
        let defaultSelection: string = "";
        //we have options but no selection; saving the default choice in `data` is critical 
        if( dataString.endsWith(":") && flatOptions.length > 0 ){
          defaultSelection = flatOptions[0];
          block.data = varUserName + ":" + defaultSelection;
        // we have some kind of selected option; use it
        } else if ( dataString.indexOf(":") >= 0 ) {
          defaultSelection = dataString.split(":")[1]
        }
        
        if(input ){ //&& CustomFields && Blockly){
          // junk debug code to get CustomFields loaded but not do anything with it
          // => mere loading triggers error
          let TODO = CustomFields;
          console.log(TODO);
          // let customfield = new CustomFields.FieldFilter(defaultSelection, flatOptions, (thisBlock: any, newMemberSelectionIndex: any) => {
          //   // cast 'thisBlock' to a search dropdown (see SearchDropdown.ts for CustomFields). we will also continue to use 'thisBlock' to refer to the block
          //   const thisSearchDropdown: typeof CustomFields = thisBlock;

          //   // Get a selection from the search dropdown, defaulting to defaultSelection
          //   // NOTE: newMemberSelectionIndex is an index into WORDS not INITWORDS
          //   // this is weird: the type of newMemberSelectionIndex seems to switch from string to int...
          //   const newMemberSelection: string = newMemberSelectionIndex === "" ? defaultSelection : thisSearchDropdown.WORDS[newMemberSelectionIndex];      
          //   // Set the tooltip on the dropdown using intellisense functionality  
          //   thisSearchDropdown.setTooltip(this.getIntellisenseMemberTooltip(varUserName, newMemberSelection));          

          //   //back up the current member selection so it is not lost every time a cell is run; ignore status selections that start with !
          //   if(thisBlock.selectedMember == "") {
          //     block.data = newMemberSelection;
          //   }
          //   else if(newMemberSelection.startsWith("!")){
          //     block.data = thisBlock.selectedMember;
          //   }
          //   else {
          //     block.data = newMemberSelection
          //   }
        
          //   //back up to XML data if valid
          //   if (varUserName !== "" && block.selectedMember !== "") {
          //     block.data = varUserName + ":" + block.selectedMember;
          //   }
          //   return newMemberSelection;
          // })

          // input.appendField(customfield, "MEMBER");
        } //end handling search dropdown approach

        //back up to XML data if valid; when the deserialized XML contains data, we should never overwrite it here
        if (block.data === undefined || block.data === null) {
            block.data = varUserName + ":" + block.selectedMember;
        }

        //set up the initial member tooltip
        const memberField: Blockly.Field | null = block.getField("MEMBER");
        if(memberField){
          memberField.setTooltip(this.getIntellisenseMemberTooltip(varUserName, memberField.getText()));
        }
      },

      init: function(): void{
        console.log(blockName + " init");

        // original (non-mutator) approach
        // let input = if hasArgs then thisBlock.appendValueInput("INPUT") else thisBlock.appendDummyInput("INPUT")
        // mutator approach
        const input: Blockly.Input = this.appendDummyInput("INPUT");

        //Use the validator called on variable selection to change the member dropdown so that we get correct members when variable changes
        input.appendField(preposition).appendField(new Blockly.FieldVariable(
          "variable name",
          ((newSelection: string): any => {
          // update the options FieldDropdown by recreating it with the newly selected variable name
          this.updateIntellisense(this, newSelection, ((varName: string): string[][] => this.requestAndStubOptions(this, varName)));
          //Since we are leveraging the validator, we return the selected value without modification
          return newSelection;
          })
        ) as Blockly.Field, "VAR").appendField(verb);

        // Create the options FieldDropdown using "optionsGenerator" with the selected name, currently None
        this.updateIntellisense(this, null, ((varName: string): string[][] => this.requestAndStubOptions(this, varName)));

        // original (non mutator) approach
        // if hasArgs then thisBlock.setInputsInline(true)
        this.setOutput(true);
        this.setColour(230);
        this.setTooltip("!Not defined until you execute code.");
        this.setHelpUrl("");

        //New mutator approach: must apply mutator on init
        //SafeRemoveInput thisBlockClosure "EMPTY"
        if (hasArgs) {
          this.appendDummyInput("EMPTY");
          Blockly.Extensions.apply("intelliblockMutator", this, true);
        }
      },

      //Listen for intellisense ready events
      onchange: function(e: Blockly.Events.BlockChange): void {
        if ((this.workspace && !this.isInFlyout) && (e.group === "INTELLISENSE")) {
          //deserialize data from xml, var:member
          const data: string[] = this.data ? this.data.toString() : "";
          // update the options FieldDropdown by recreating it with fresh intellisense
          this.updateIntellisense(this, null, ((varName: string): string[][] => this.getIntellisenseMemberOptions(memberSelectionFunction, varName)));
          //restore previous member selection if possible
          const memberField: Blockly.Field = this.getField("MEMBER");
          //prevent setting to ""
          if (data[1] !== "") {
            memberField.setValue(data[1]);
          }
          // update tooltip
          const varName: string = this.varSelectionUserName(this, null);
          this.setTooltip(this.getIntellisenseVarTooltip(varName));
        }
      },
    };

    // Generate intellisense member block conversion code
    // @ts-ignore
    this.generator[blockName] = ((block: any): string => {
      if(this.generator != null) {
        // get the variable and member names
        const varName: string | undefined = this.generator.getVariableName(block.getFieldValue("VAR"));
        const memberName: string = block.getFieldValue("MEMBER").toString();

        let code = "";
        // member is not defined, generate nothing
        if (memberName.indexOf("!") === 0) {
          code = "";
        // if arguments, generate code for multiple arguments
        } else if (hasArgs) {
          let args = [];
          for(let i = 0; i < block.itemCount_ ; i++){
            args.push(this.generator.valueToCode(block, "ADD" + i.toString(), 2.1));
          }
        // assumes commas are univeral separators for arguments...
        const cleanArgs: string = args.join(",");
        code = varName + (hasDot ? this.dotString() : "") + memberName + "(" + cleanArgs + ")";
        // member without arguments, generate
        } else {
          code = varName + (hasDot ? this.dotString() : "") + memberName;
        }
        return code;
      }
    });   
  }

  /**
   * Given a list of blocks to ignore, grey out all other blocks. Provides hint to students on what blocks they need and what they can ignore
   * @param ignore_blocks 
   */
  GreyOutBlocks(ignore_blocks : string[]):void {
    // Originally I was thinking I'd get the blocks from blockly and then modify their color
    // However, that is nonobvious. Instead it seems better just to reload them from the local definition

    // if(this.workspace){
    //   let toolbox = this.workspace.getToolbox() as Blockly.Toolbox;

    //   for( let item of toolbox.getToolboxItems() ) {
    //     item
    //     //set color of all but no op blocks
    //     // block.setColour(166);
  
    //   }
    //   // TODO provide toolbox def below
    //   // this.workspace.updateToolbox()
    // }

    // TODO get the toolbox definition here (XML or JSON)
    // TODO update the definition here
    // TODO provide toolbox def below
      // this.workspace.updateToolbox()
   
  }

  GetDefaultToolbox(){
    return this.toolboxDefinition;
  }

  /**
   * Using the current toolbox definition, update the toolbox
   */
  UpdateToolbox(){
    // let toolboxJSON = JSON.stringify( this.toolboxDefinition );
    // this.workspace?.updateToolbox(toolboxJSON);

    // @ts-ignore
    let starterToolbox =  
    // { "kind": "categoryToolbox",  "contents": [] };
    {
      "kind": "categoryToolbox",
      "contents": [
        {
          "kind": "category",
          "name": "LOGIC",
          "contents": [
            {
              "kind": "block",
              // "type": "comprehensionForEach_Python"
              "type": "controls_if"
            },
          ]
        }
      ]
    };
    // TODO stopped here; this works so this.toolboxDefinition must be flawed somehow 
    // Flaw is not as simple as block does not exist; for that we get a different error 
    // Invalid block definition for type: comprehensionForEach_Python
    this.workspace?.updateToolbox(starterToolbox);
    // this.workspace?.updateToolbox(this.toolboxDefinition);

    console.log("updated toolbox")
  }
}