import { AbstractToolbox,IntellisenseEntry, IToolbox } from "./AbstractToolbox";
import * as Blockly from 'blockly/core';

export class PythonToolbox extends AbstractToolbox implements IToolbox{

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

    /**
     * For Python we have an empty implementation
     * @param workspace 
     */
    DoFinalInitialization(workspace: Blockly.WorkspaceSvg): void {

    }
}