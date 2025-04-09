import { AbstractToolbox,IGenerator,IntellisenseEntry, IToolbox } from "./AbstractToolbox";
import { RGenerator } from "./RGenerator";
import { INotebookTracker } from "@jupyterlab/notebook";
import * as Blockly from 'blockly/core';

export class RToolbox extends AbstractToolbox implements IToolbox{

    generator: IGenerator = RGenerator;

    toolboxDefinition = {
        "kind": "categoryToolbox",
        "contents": [
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "import"
                }
            ],
            "name": "IMPORT",
            "colour": "255"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "dummyOutputCodeBlock"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "dummyNoOutputCodeBlock"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "valueOutputCodeBlock"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "valueNoOutputCodeBlock"
                }
            ],
            "name": "FREESTYLE",
            "colour": "290"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "controls_if"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "logic_compare"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "logic_operation"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "logic_negate"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "logic_boolean"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "logic_null"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "logic_ternary"
                }
            ],
            "name": "LOGIC",
            "colour": "260"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "controlsepeat_ext"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "controls_whileUntil"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "controls_for"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "controls_forEach"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "controls_flow_statements"
                }
            ],
            "name": "LOOPS",
            "colour": "120"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_number"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_arithmetic"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_single"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_trig"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_constant"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_number_property"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "mathound"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_on_list"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_modulo"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_constrain"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "mathandom_int"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "mathandom_float"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "math_atan2"
                }
            ],
            "name": "MATH",
            "colour": "230"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_join"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_append"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_length"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_isEmpty"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_indexOf"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_charAt"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_getSubstring"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_changeCase"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_trim"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_print"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "text_prompt_ext"
                }
            ],
            "name": "TEXT",
            "colour": "160"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_create_with"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_create_with"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "listsepeat"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_length"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_isEmpty"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_indexOf"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_getIndex"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_setIndex"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_getSublist"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "indexer"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "doubleIndexer"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_split"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "lists_sort"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "uniqueBlock"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "reversedBlock"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "unlistBlock"
                }
            ],
            "name": "LISTS",
            "colour": "260"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "colour_picker"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "colourandom"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "colourgb"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "colour_blend"
                }
            ],
            "name": "COLOUR",
            "colour": "20"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "boolConversion"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "intConversion"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "floatConversion"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "strConversion"
                }
            ],
            "name": "CONVERSION",
            "colour": "120"
            },
            {
            "kind": "CATEGORY",
            "contents": [
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "textFromFile"
                },
                {
                "kind": "BLOCK",
                "blockxml": {},
                "type": "readFile"
                }
            ],
            "name": "I/O",
            "colour": "190"
            },
            {
            "kind": "SEP"
            },
            {
            "kind": "CATEGORY",
            "name": "VARIABLES",
            "colour": "330",
            "custom": "VARIABLE"
            },
            {
            "kind": "CATEGORY",
            "name": "FUNCTIONS",
            "colour": "290",
            "custom": "PROCEDURE"
            },
            {
            "kind": "CATEGORY",
            "name": "SPECIAL",
            "colour": "270",
            "custom": "SPECIAL"
            }
        ],
    };

    constructor(notebooks:INotebookTracker,workspace:Blockly.WorkspaceSvg){
        super(notebooks,workspace);
    }

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
    DoFinalInitialization(): void {
        if( this.workspace ){
            this.workspace.registerToolboxCategoryCallback("SPECIAL", (workspace: Blockly.Workspace): any[] => {
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

    InitializeGenerator(): void {
        //connect custom R generator
        this.generator = RGenerator;

        //make intellisense blocks
        this.makeMemberIntellisenseBlock(this,"varGetProperty", "from", "get", (ie: IntellisenseEntry): boolean => !ie.isFunction, false, true);
        this.makeMemberIntellisenseBlock(this,"varDoMethod", "with", "do", (ie: IntellisenseEntry): boolean => ie.isFunction, true, true);   

        //override default blockly functionality

        //define new blocks

    }


}