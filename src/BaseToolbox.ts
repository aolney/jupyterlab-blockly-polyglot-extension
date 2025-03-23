import * as Blockly from 'blockly/core';
import { NotebookPanel,INotebookTracker } from "@jupyterlab/notebook";
import { Kernel, KernelMessage } from "@jupyterlab/services";

/**
 * All language toolboxes must implement IToolbox. BlocklyWidget will call the functions in the interface. BaseToolbox does not implement IToolbox because functions may have empty implementations for some languages.
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
class IntellisenseEntry{
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
    export class BaseToolbox {

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
    
    RequestIntellisenseVariable(block: Blockly.Block, parentName: string): void {
        this.GetKernelInspection(parentName).then((parentInspection: string) => {
            const parent: IntellisenseEntry = new IntellisenseEntry(parentName, parentInspection, isFunction_Python(parentInspection), isClass_Python(parentInspection));
            // Assume we need to get children
            let shouldGetChildren: boolean = true;
            // Check the cache to see if we have found children before
            let cached: IntellisenseVariable | undefined = intellisenseLookup.get(parent.Name);
            if( cached ) {
              // Even if we have a cached variable, update it if the parent Info does not match or if child entries is short
              if (cached.VariableEntry.Info !== parent.Info || cached.ChildEntries.length <= 1) {
                shouldGetChildren = true;
              // Only avoid getting children if the cached variable looks good
              } else {
                shouldGetChildren = false;
              }
            }
          
            if (!shouldGetChildren) {
              console.log("Not refreshing intellisense for " + parent.Name);
              // Trigger update intellisense even if we are cached (this could be reconsidered, but original code does this)
              fireIntellisenseEvent(block);
            } else {
              // Get children by prefixing on parent's name (package completions)
              GetKernelCompletion(parentName + ".").then((childCompletions: string[]) => {
                // Filter out bad completions (Python specific)
                let safeCompletions: string[] = childCompletions.filter((s: string) => {
                  if (parent.Info.startsWith("Signature: DataFrame") ) {
                    return !(s.startsWith("_") ) && !(s.startsWith("style"));
                  }
                  return true;
                });
                // Set up inspections for filtered children; use a timeout promise so we don't wait forever; make timeout dynamic based on which child this is (assumes serial bottleneck at kernel)
                // const pr: Promise<string>[] = safeCompletions.map((childCompletion: string, index: number) => timeoutPromise<string>( 100 * (index+1) , this.GetKernelInspection(childCompletion)) );
                // For Python we don't currently seem to have a problem with promises not returning
                const pr: Promise<string>[] = safeCompletions.map((childCompletion: string, index: number) =>  this.GetKernelInspection(parentName + "." + childCompletion));
                // Synchronize on inspections to yield the final result
                Promise.allSettled(pr).then((results : PromiseSettledResult<string>[]) => {
                  // Create an intellisense entries for children, sorted alphabetically
                  let children: IntellisenseEntry[] = safeCompletions.map((childCompletion: string, index: number) => {
                    let info = "";
                    let isFunction = true;
                    let isClass = false;
                    if( results[index].status === "fulfilled") {
                      info = (results[index] as PromiseFulfilledResult<string>).value;
                      isFunction = isFunction_Python(info);
                      isClass = isClass_Python(info);
                    } 
                    return new IntellisenseEntry(childCompletion, info, isFunction, isClass)}).sort((a, b) => (a.Name < b.Name ? -1 : 1));
                  // Package up IntellisenseVariable (parent + children)
                  let intellisenseVariable: IntellisenseVariable = new IntellisenseVariable(parent, children);
                  // Add to cache
                  intellisenseLookup.set(parentName, intellisenseVariable);
        
                  // Fire event; this causes Blockly to refresh
                  fireIntellisenseEvent(block);
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

    GetKernelInspection(queryString: string): Promise<string> {
        //TODO stopped here
        const matchValue: [NotebookPanel, Kernel.IKernelConnection] | undefined = this.GetKernel();
        if (matchValue == null) {
          console.log("NOKERNEL");
          return Promise.reject((() => {
            throw 1;
          })());
        }
        else {
          const widget: NotebookPanel = matchValue[0];
          const kernel: Kernel.IKernelConnection = matchValue[1];
          return new Promise<string>((resolve, reject) => {
            kernel.requestInspect({
              code: queryString,
              cursor_pos: queryString.length,
              detail_level: 0,
            }).then((_arg: KernelMessage.IInspectReplyMsg) => {
              const content = _arg.content;
              if ("found" in content && content.found) {
                const mimeType: string | undefined = widget.content.rendermime.preferredMimeType(content.data);
                const payload = content.data;
                const model: MimeModel = new rendermime.MimeModel({
                  data: payload,
                });
                if(mimeType){
                  const renderer: IRenderMime.IRenderer = widget.content.rendermime.createRenderer(mimeType);
                  renderer.renderModel(model).then(() => {
                    resolve(renderer.node.innerText);
                  }).catch((error) => {
                    console.log(queryString + ":RENDER_ERROR");
                    reject(error);
                  });
                }
              } else {
                  console.log(queryString + ":UNDEFINED");
                  resolve("UNDEFINED");
                }
            }).catch((_arg_2: Error) => {
              console.log(queryString + ":UNAVAILABLE");
              reject(new Error(queryString + " is unavailable"));
            });
          });
        }
      }
    
    GetKernel(): Kernel.IKernelConnection | null | undefined {
        return this.notebooks?.currentWidget?.sessionContext.session?.kernel
    }

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