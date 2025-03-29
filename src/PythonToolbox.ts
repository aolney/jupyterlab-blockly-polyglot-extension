import { AbstractToolbox, IntellisenseEntry, IToolbox } from "./AbstractToolbox";
import { INotebookTracker } from "@jupyterlab/notebook";
import * as Blockly from 'blockly/core';
import { Order, pythonGenerator } from 'blockly/python';

export class PythonToolbox extends AbstractToolbox implements IToolbox {

    toolboxDefinition = {
        "kind": "categoryToolbox",
        "contents": [
            {
                "kind": "CATEGORY",
                "contents": [
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "importAs"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
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
                        "type": "dummyOutputCommentBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "dummyNoOutputCommentBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "valueOutputCommentBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "valueNoOutputCommentBlock"
                    }
                ],
                "name": "COMMENT",
                "colour": "%{BKY_COLOUR_HUE}"
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
                "colour": "%{BKY_LOGIC_HUE}"
            },
            {
                "kind": "CATEGORY",
                "contents": [
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "controls_repeat_ext"
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
                        "type": "comprehensionForEach"
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
                "colour": "%{BKY_LOOPS_HUE}"
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
                        "type": "math_round"
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
                        "type": "math_random_int"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "math_random_float"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "math_atan2"
                    }
                ],
                "name": "MATH",
                "colour": "%{BKY_MATH_HUE}"
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
                "colour": "%{BKY_TEXTS_HUE}"
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
                        "type": "lists_repeat"
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
                        "type": "setBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "sortedBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "zipBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "dictBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "listBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "tupleBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "tupleConstructorBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "reversedBlock"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "selector_train_test_split"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "train_test_split"
                    }
                ],
                "name": "LISTS",
                "colour": "%{BKY_LISTS_HUE}"
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
                        "type": "colour_random"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "colour_rgb"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "colour_blend"
                    }
                ],
                "name": "COLOUR",
                "colour": "%{BKY_COLOUR_HUE}"
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
                        "type": "withAs"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "textFromFile"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
                        "type": "openReadFile"
                    },
                    {
                        "kind": "BLOCK",
                        "blockxml": {},
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
                "colour": "%{BKY_VARIABLES_HUE}",
                "custom": "VARIABLE"
            },
            {
                "kind": "CATEGORY",
                "name": "FUNCTIONS",
                "colour": "%{BKY_PROCEDURES_HUE}",
                "custom": "PROCEDURE"
            }
        ],
        // "xmlns": "https://developers.google.com/blockly/xml",
        // "id": "toolbox",
        // "style": "display: none"
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

        Blockly.Blocks["comprehensionForEach_Python"] = {
            init: function () {
                console.log("comprehensionForEach_Python init");
                this.appendValueInput("LIST").setCheck(null).appendField("for each item").appendField(new Blockly.FieldVariable("i") as Blockly.Field, "VAR").appendField("in list");
                this.appendValueInput("YIELD").setCheck(null).setAlign(Blockly.inputs.Align.RIGHT).appendField("yield");
                this.setOutput(true, null);
                this.setColour(230);
                this.setTooltip("Use this to generate a sequence of elements, also known as a comprehension. Often used for list comprehensions.");
                this.setHelpUrl("https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions");
            },
        };
        // @ts-ignore
        pythonGenerator["comprehensionForEach_Python"] = ((block: Blockly.Block): string => {
            const var$: string = pythonGenerator.getVariableName(block.getFieldValue("VAR"))
            const list: string = pythonGenerator.valueToCode(block, "LIST", Order.ATOMIC);
            const yieldValue : string = pythonGenerator.valueToCode(block, "YIELD", Order.ATOMIC);
            const code = yieldValue + " for " + var$ + " in " + list;
            return code;
        });

        Blockly.Blocks["withAs_Python"] = {
            init: function () {
                console.log("withAs_Python init");
                this.appendValueInput("EXPRESSION").setCheck(null).appendField("with");
                this.appendDummyInput().appendField("as").appendField(new Blockly.FieldVariable("item") as Blockly.Field, "TARGET");
                this.appendStatementInput("SUITE").setCheck(null);
                this.setNextStatement(true);
                this.setPreviousStatement(true);
                // const value_3: any = this.setInputsInline(true);
                this.setColour(230);
                this.setTooltip("Use this to open resources (usually file-type) in a way that automatically handles errors and disposes of them when done. May not be supported by all libraries.");
                this.setHelpUrl("https://docs.python.org/3/reference/compound_stmts.html#with");
            },
        };
        // @ts-ignore
        pythonGenerator["withAs_Python"] = ((block: Blockly.Block): string => {
            let copyOfStruct: any = (pythonGenerator.statementToCode(block, "SUITE"));
            let expression: string = pythonGenerator.valueToCode(block, "EXPRESSION", Order.ATOMIC);
            let target: string = pythonGenerator.getVariableName(block.getFieldValue("TARGET"));
            let code = "with " + expression + " as " + target + ":\n" + copyOfStruct.toString();
            return code
        });

        Blockly.Blocks["textFromFile_Python"] = {
            init: function () {
                console.log("textFromFile_Python init");
                this.appendValueInput("FILENAME").setCheck("String").appendField("read text from file");
                this.setOutput(true, null);
                this.setColour(230);
                this.setTooltip("Use this to read a text file. It will output a string.");
                this.setHelpUrl("https://docs.python.org/3/tutorial/inputoutput.html");
            },
        };
        // @ts-ignore
        pythonGenerator["textFromFile_Python"] = ((block: Blockly.Block): string => {
            let fileName = pythonGenerator.valueToCode(block, "FILENAME", Order.ATOMIC);
            let code = "open(" + fileName + ",encoding=\'utf-8\').read()";
            return code;
        });

        //TODO stopped here
        Blockly.Blocks["openReadFile_Python"] = {
            init: function () {
                console.log("openReadFile_Python init");
                this.appendValueInput("FILENAME").setCheck("String").appendField("open file for reading");
                this.setOutput(true, null);
                this.setColour(230);
                this.setTooltip("Use this to read a file. It will output a file, not a string.");
                this.setHelpUrl("https://docs.python.org/3/tutorial/inputoutput.html");
            },
        };
        // @ts-ignore
        pythonGenerator["openReadFile_Python"] = ((block: Blockly.Block): string => {
            let filename = pythonGenerator.valueToCode(block, "FILENAME", Order.ATOMIC);
            let code = "open(" + filename + ",encoding=\'utf-8\')";
            return code;
        });

        Blockly.Blocks["openWriteFile_Python"] = {
            init: function () {
                console.log("openWriteFile_Python init");
                this.appendValueInput("FILENAME").setCheck("String").appendField("open file for writing");
                this.setOutput(true, null);
                this.setColour(230);
                this.setTooltip("Use this to write to a file. It will output a file, not a string.");
                this.setHelpUrl("https://docs.python.org/3/tutorial/inputoutput.html");
            },
        };
        // @ts-ignore
        pythonGenerator["openWriteFile_Python"] = ((block: Blockly.Block): string => {
            let filename= pythonGenerator.valueToCode(block, "FILENAME", Order.ATOMIC) ;
            let code = "open(" + filename + ",\'w\',encoding=\'utf-8\')";
            return code;
        });


        // attach generator to this; needed b/c intellisense block generators below assume this.generator
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
    DoFinalInitialization(): void {

    }
}