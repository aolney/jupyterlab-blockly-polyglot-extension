import { AbstractToolbox,IntellisenseEntry, IToolbox } from "./AbstractToolbox";
import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';

export class PythonToolbox extends AbstractToolbox implements IToolbox{

    constructor(){
        super();
    }

    isFunction(query:string, info: string): boolean {
        return (info.includes("Signature:") && info.includes("function") ) || (info.includes("Signature:") && info.includes("method"));
    }

    isClass(info: string): boolean {
    return info.includes("signature:") && info.includes("class");
    }

    dotString(): string {
        return "."
    }

    GetSafeChildCompletions(parent: IntellisenseEntry, children : string[] ) : string[] {
        let safeCompletions: string[] = children.filter((s: string) => {
            if (parent.Info.startsWith("Signature: DataFrame") ) {
                return !(s.startsWith("_") ) && !(s.startsWith("style"));
            }
            return true;
        });
        return safeCompletions;

    }

    GetChildrenInspections( parent: IntellisenseEntry, children : string[] ) : Promise<string>[] {
        // See R toolbox for example of dynamic waiting for completion
        // For Python we don't currently seem to have a problem with promises not returning
        const pr: Promise<string>[] = children.map((childCompletion: string, index: number) =>  this.GetKernelInspection(parent.Name + "." + childCompletion));
        return pr;
    }

    InitializeGenerator(): void {
        //get generator from blockly
        this.generator = pythonGenerator;

        //make intellisense blocks
        this.makeMemberIntellisenseBlock("varGetProperty", "from", "get", (ie: IntellisenseEntry): boolean => !ie.isFunction, false, true);
        this.makeMemberIntellisenseBlock("varDoMethod", "with", "do", (ie: IntellisenseEntry): boolean => ie.isFunction, true, true);
        this.makeMemberIntellisenseBlock("varCreateObject", "with", "create", (ie: IntellisenseEntry): boolean => ie.isClass, true, true);        
    }

    /**
     * For Python we have an empty implementation
     * @param workspace 
     */
    DoFinalInitialization(workspace: Blockly.WorkspaceSvg): void {

    }
}