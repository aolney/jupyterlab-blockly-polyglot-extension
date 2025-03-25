import * as Blockly from 'blockly/core';
import { NotebookPanel,INotebookTracker } from "@jupyterlab/notebook";
import { Kernel, KernelMessage } from "@jupyterlab/services";
import { IRenderMime, MimeModel } from "@jupyterlab/rendermime";

/**
 * All language toolboxes must implement IToolbox. BlocklyWidget will call the functions in the interface. 
 */
export interface IToolbox {
    EncodeWorkspace():void;
    DecodeWorkspace(xml:string):void;
    UpdateAllIntellisense():void;
    DoFinalInitialization(workspace: Blockly.WorkspaceSvg): void;
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

      notebooks: INotebookTracker | null = null;

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
       * Determine if entity is a function using inspection info; language specific
       * @param info 
       */
      abstract isFunction( info : string) : boolean;
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
          const parent: IntellisenseEntry = new IntellisenseEntry(parentName, parentInspection, this.isFunction(parentInspection), this.isClass(parentInspection));

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
                    isFunction = this.isFunction(info);
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
        kernel.requestInspect({
          code: queryString,
          cursor_pos: queryString.length,
          detail_level: 0,
        }).then((_arg: KernelMessage.IInspectReplyMsg) => {
          // handle the kernel reply
          // the reply has some kind of funky ascii encoding
          const content = _arg.content;
          if ("found" in content && content.found) {
            const mimeType: string | undefined = widget.content.rendermime.preferredMimeType(content.data);
            const model: MimeModel = new MimeModel({
              data: content.data,
            });
            if(mimeType){
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
      button.setAttribute('text', '%{BKY_NEW_VARIABLE}');
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
}