import { AbstractToolbox, IntellisenseEntry, IToolbox } from "./AbstractToolbox";
import { INotebookTracker } from "@jupyterlab/notebook";
import * as Blockly from 'blockly/core';
// import { Order, pythonGenerator } from 'blockly/python';
import { pythonGenerator } from 'blockly/python';
// Import the default blocks. We just need to load them here (side effect). Ignore usage check.
import * as libraryBlocks from 'blockly/blocks';
// Import English message file (determines language of blocks)
import * as en from 'blockly/msg/en';

export class PythonToolbox extends AbstractToolbox implements IToolbox {

    toolboxDefinition = {
        "kind": "categoryToolbox",
        "contents": [
            {
                "kind": "CATEGORY",
                "contents": [
                    {
                        "kind": "BLOCK",
                        "type": "importAs"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "importFrom"
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
                        "type": "dummyOutputCodeBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "dummyNoOutputCodeBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "valueOutputCodeBlock"
                    },
                    {
                        "kind": "BLOCK",
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
                        "type": "dummyOutputCommentBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "dummyNoOutputCommentBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "valueOutputCommentBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "valueNoOutputCommentBlock"
                    }
                ],
                "name": "COMMENT",
                "colour": "20"
            },
            {
                "kind": "CATEGORY",
                "contents": [
                    {
                        "kind": "BLOCK",
                        "type": "controls_if"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "logic_compare"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "logic_operation"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "logic_negate"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "logic_boolean"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "logic_null"
                    },
                    {
                        "kind": "BLOCK",
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
                        "type": "controls_repeat_ext"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "controls_whileUntil"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "controls_for"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "comprehensionForEach"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "controls_forEach"
                    },
                    {
                        "kind": "BLOCK",
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
                        "type": "math_number"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_arithmetic"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_single"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_trig"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_constant"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_number_property"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_round"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_on_list"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_modulo"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_constrain"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_random_int"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "math_random_float"
                    },
                    {
                        "kind": "BLOCK",
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
                        "type": "text"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_join"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_append"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_length"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_isEmpty"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_indexOf"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_charAt"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_getSubstring"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_changeCase"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_trim"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "text_print"
                    },
                    {
                        "kind": "BLOCK",
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
                        "type": "lists_create_with"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_create_with"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_repeat"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_length"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_isEmpty"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_indexOf"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_getIndex"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_setIndex"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_getSublist"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "indexer"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_split"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "lists_sort"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "setBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "sortedBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "zipBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "dictBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "listBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "tupleBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "tupleConstructorBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "reversedBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "selector_train_test_split"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "train_test_split"
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
                        "type": "colour_picker"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "colour_random"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "colour_rgb"
                    },
                    {
                        "kind": "BLOCK",
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
                        "type": "boolConversion"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "intConversion"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "floatConversion"
                    },
                    {
                        "kind": "BLOCK",
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
                        "type": "withAs"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "textFromFile"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "openReadFile"
                    },
                    {
                        "kind": "BLOCK",
                        "type": "openWriteFile"
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
            }
        ],
    };

    constructor(notebooks: INotebookTracker, workspace: Blockly.WorkspaceSvg) {
        super(notebooks, workspace);
    }


    isFunction(query: string, info: string): boolean {
        return (info.includes("Signature:") && info.includes("function")) || (info.includes("Signature:") && info.includes("method"));
    }

    isClass(info: string): boolean {
        return info.includes("signature:") && info.includes("class");
    }

    dotString(): string {
        return "."
    }

    GetSafeChildCompletions(parent: IntellisenseEntry, children: string[]): string[] {
        let safeCompletions: string[] = children.filter((s: string) => {
            if (parent.Info.startsWith("Signature: DataFrame")) {
                return !(s.startsWith("_")) && !(s.startsWith("style"));
            }
            return true;
        });
        return safeCompletions;

    }

    GetChildrenInspections(parent: IntellisenseEntry, children: string[]): Promise<string>[] {
        // See R toolbox for example of dynamic waiting for completion
        // For Python we don't currently seem to have a problem with promises not returning
        const pr: Promise<string>[] = children.map((childCompletion: string, index: number) => this.GetKernelInspection(parent.Name + "." + childCompletion));
        return pr;
    }

    InitializeGenerator(): void {

        // Blockly.Blocks is empty at this point
        // We have to do a no-op with libraryBlocks for them to attach to Blockly.Blocks (side effect)
        if(libraryBlocks) {} //you're not supposed to understand this :)

        // Set blocks language to English; override the type error
        // @ts-ignore
        Blockly.setLocale(en);

        //get generator from blockly
        // let generator = pythonGenerator;

        //-------------------------------------
        //override default blockly functionality
        //-------------------------------------
        // We use @ts-ignore to override the protected class attributes we need to modify; an alternative would be to extend pythonGenerator and then do these overrides within that new class

        pythonGenerator.finish = ((code: string): string => {
            const imports: string[] = [];
            const functions: string[] = [];
            // @ts-ignore
            let enumerator: any = Object.keys(pythonGenerator.definitions_);
            for (let i in enumerator) {
                // @ts-ignore
                const definitions: any = pythonGenerator.definitions_;
                const def: string = definitions[enumerator[i]];
                if (def.indexOf("import") >= 0) {
                    void (imports.push(def));
                }
                if ((def.indexOf("def ") === 0) ? true : (def.indexOf("# ") === 0)) {
                    void (functions.push(def));
                }
            }
            // @ts-ignore
            delete pythonGenerator.definitions_;
            // @ts-ignore
            delete pythonGenerator.functionNames_;
            // @ts-ignore
            pythonGenerator.nameDB_.reset();
            return ((("\n" + imports) + ("\n" + functions)) + "\n\n") + code;
        });

        //-----------------
        //define new blocks
        //-----------------
        
        // Blockly.Blocks["comprehensionForEach_Python"] = {
        //     init: function () {
        //         console.log("comprehensionForEach_Python init");
        //         this.appendValueInput("LIST").setCheck(null).appendField("for each item").appendField(new Blockly.FieldVariable("i") as Blockly.Field, "VAR").appendField("in list");
        //         this.appendValueInput("YIELD").setCheck(null).setAlign(Blockly.inputs.Align.RIGHT).appendField("yield");
        //         this.setOutput(true, null);
        //         this.setColour(230);
        //         this.setTooltip("Use this to generate a sequence of elements, also known as a comprehension. Often used for list comprehensions.");
        //         this.setHelpUrl("https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions");
        //     },
        // };
        //TODO looks like different approach needed to define generator for block, see https://developers.google.com/blockly/guides/configure/web/custom-blocks
        // EXAMPLE
        // const test_block = {
        //     init: function() {
        //       this.appendDummyInput('the name')
        //         .appendField('please enter your name');
        //       this.appendValueInput('NAME');
        //       this.setTooltip('');
        //       this.setHelpUrl('');
        //       this.setColour(225);
        //     }
        //   };
        //   Blockly.common.defineBlocks({test_block: test_block});
        //   pythonGenerator.forBlock['test_block'] = function() {
        //     // TODO: change Order.ATOMIC to the correct operator precedence strength
        //     const value_name = generator.valueToCode(block, 'NAME', Order.ATOMIC);
        //     // TODO: Assemble python into the code variable.
        //     const code = '...';
        //     return code;
        //   }

        // // @ts-ignore
        // pythonGenerator["comprehensionForEach_Python"] = ((block: Blockly.Block): string => {
        //     const var$: string = pythonGenerator.getVariableName(block.getFieldValue("VAR"))
        //     const list: string = pythonGenerator.valueToCode(block, "LIST", Order.ATOMIC);
        //     const yieldValue : string = pythonGenerator.valueToCode(block, "YIELD", Order.ATOMIC);
        //     const code = yieldValue + " for " + var$ + " in " + list;
        //     return code;
        // });

        // Blockly.Blocks["withAs_Python"] = {
        //     init: function () {
        //         console.log("withAs_Python init");
        //         this.appendValueInput("EXPRESSION").setCheck(null).appendField("with");
        //         this.appendDummyInput().appendField("as").appendField(new Blockly.FieldVariable("item") as Blockly.Field, "TARGET");
        //         this.appendStatementInput("SUITE").setCheck(null);
        //         this.setNextStatement(true);
        //         this.setPreviousStatement(true);
        //         // const value_3: any = this.setInputsInline(true);
        //         this.setColour(230);
        //         this.setTooltip("Use this to open resources (usually file-type) in a way that automatically handles errors and disposes of them when done. May not be supported by all libraries.");
        //         this.setHelpUrl("https://docs.python.org/3/reference/compound_stmts.html#with");
        //     },
        // };
        // // @ts-ignore
        // pythonGenerator["withAs_Python"] = ((block: Blockly.Block): string => {
        //     let copyOfStruct: any = (pythonGenerator.statementToCode(block, "SUITE"));
        //     let expression: string = pythonGenerator.valueToCode(block, "EXPRESSION", Order.ATOMIC);
        //     let target: string = pythonGenerator.getVariableName(block.getFieldValue("TARGET"));
        //     let code = "with " + expression + " as " + target + ":\n" + copyOfStruct.toString();
        //     return code
        // });

        // Blockly.Blocks["textFromFile_Python"] = {
        //     init: function () {
        //         console.log("textFromFile_Python init");
        //         this.appendValueInput("FILENAME").setCheck("String").appendField("read text from file");
        //         this.setOutput(true, null);
        //         this.setColour(230);
        //         this.setTooltip("Use this to read a text file. It will output a string.");
        //         this.setHelpUrl("https://docs.python.org/3/tutorial/inputoutput.html");
        //     },
        // };
        // // @ts-ignore
        // pythonGenerator["textFromFile_Python"] = ((block: Blockly.Block): string => {
        //     let fileName = pythonGenerator.valueToCode(block, "FILENAME", Order.ATOMIC);
        //     let code = "open(" + fileName + ",encoding=\'utf-8\').read()";
        //     return code;
        // });

        // //TODO stopped here
        // Blockly.Blocks["openReadFile_Python"] = {
        //     init: function () {
        //         console.log("openReadFile_Python init");
        //         this.appendValueInput("FILENAME").setCheck("String").appendField("open file for reading");
        //         this.setOutput(true, null);
        //         this.setColour(230);
        //         this.setTooltip("Use this to read a file. It will output a file, not a string.");
        //         this.setHelpUrl("https://docs.python.org/3/tutorial/inputoutput.html");
        //     },
        // };
        // // @ts-ignore
        // pythonGenerator["openReadFile_Python"] = ((block: Blockly.Block): string => {
        //     let filename = pythonGenerator.valueToCode(block, "FILENAME", Order.ATOMIC);
        //     let code = "open(" + filename + ",encoding=\'utf-8\')";
        //     return code;
        // });

        // Blockly.Blocks["openWriteFile_Python"] = {
        //     init: function () {
        //         console.log("openWriteFile_Python init");
        //         this.appendValueInput("FILENAME").setCheck("String").appendField("open file for writing");
        //         this.setOutput(true, null);
        //         this.setColour(230);
        //         this.setTooltip("Use this to write to a file. It will output a file, not a string.");
        //         this.setHelpUrl("https://docs.python.org/3/tutorial/inputoutput.html");
        //     },
        // };
        // // @ts-ignore
        // pythonGenerator["openWriteFile_Python"] = ((block: Blockly.Block): string => {
        //     let filename= pythonGenerator.valueToCode(block, "FILENAME", Order.ATOMIC) ;
        //     let code = "open(" + filename + ",\'w\',encoding=\'utf-8\')";
        //     return code;
        // });


        // attach generator to this; needed b/c intellisense block generators below assume this.generator
        this.generator = pythonGenerator;

        // //make intellisense blocks
        // this.makeMemberIntellisenseBlock("varGetProperty", "from", "get", (ie: IntellisenseEntry): boolean => !ie.isFunction, false, true);
        // this.makeMemberIntellisenseBlock("varDoMethod", "with", "do", (ie: IntellisenseEntry): boolean => ie.isFunction, true, true);
        // this.makeMemberIntellisenseBlock("varCreateObject", "with", "create", (ie: IntellisenseEntry): boolean => ie.isClass, true, true);

    }

    /**
     * For Python we have an empty implementation
     * @param workspace 
     */
    DoFinalInitialization(): void {

    }
}