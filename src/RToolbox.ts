import { AbstractToolbox,IntellisenseEntry, IToolbox } from "./AbstractToolbox";
import * as Blockly from 'blockly/core';

export class RToolbox extends AbstractToolbox implements IToolbox{

    isFunction(query: string, info: string): boolean {
        //to handle both parent and children cases, we truncate namespace from the query
        const index: number = query.indexOf("::");
        if( index >= 0 ) {
            query = query.slice(index + 1)
        }
        
        // for %>% and other backticked functions
        if (query.startsWith("`")) {
            return true;
        }
        // indicates it takes parameters
        else if (info.includes( query + "(") ) {
        return true;
        }
        // explicit marking of function in documentation
        else if (info.includes("Class attribute:\n\'function\'") ) {
            return true;
        }
        else if (info.includes("Usage") && info.includes("Arguments")) {
            return true;
        }
        // look for words that otherwise indicate functionhood. These matchers might be too aggressive; hard to say since R is mostly functions
        else if (info.includes("function") || info.includes("Function")) {
        return true;
        }
        else if (info.includes("object") || info.includes("Object")) {
        return true;
        }
        else {
            return false;
        }
    }

    isClass(info: string): boolean {
        return !this.isFunction("", info);
    }

    dotString(): string {
        return "::"
    }

    /**
     * R seems to not need special handling, so no-op
     * @param parent 
     * @param children 
     * @returns 
     */
    GetSafeChildCompletions(parent: IntellisenseEntry, children : string[] ) : string[] {
        // See python toolbox for example of safe completions
        return children;

    }

    GetChildrenInspections( parent: IntellisenseEntry, children : string[] ) : Promise<string>[] {
         // Set up inspections for all children; use a timeout promise so we don't wait forever; make timeout dynamic based on which child this is (assumes serial bottleneck at kernel)
         const pr: Promise<string>[] = children.map((childCompletion: string, index: number) => this.timeoutPromise<string>( 100 * (index+1) , this.GetKernelInspection(childCompletion)) );

        return pr;
    }

    /**
     * For R create the SPECIAL toolbox category
     * @param workspace 
     */
    DoFinalInitialization(workspace: Blockly.WorkspaceSvg): void {
        workspace.registerToolboxCategoryCallback("SPECIAL", (workspace: Blockly.Workspace): any[] => {
            const blockList: any[] = [];
            const label: any = document.createElement("label");
            label.setAttribute("text", "Occassionally blocks appear here as you load libraries (e.g. %>%). See VARIABLES for most cases.");
            void (blockList.push(label));
            if (this.intellisenseLookup.has("dplyr")) {
                const block: any = document.createElement("block");
                block.setAttribute("type", "pipe_R");
                void (blockList.push(block));
            }
            if (this.intellisenseLookup.has("ggplot2")) {
                const block_1: any = document.createElement("block");
                block_1.setAttribute("type", "ggplot_plus_R");
                void (blockList.push(block_1));
            }
            return blockList;
        });
    }
}