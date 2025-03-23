import { BaseToolbox,IToolbox } from "./BaseToolbox";
import * as Blockly from 'blockly/core';

export class PythonToolbox extends BaseToolbox implements IToolbox{

    /**
     * For Python we have an empty implementation
     * @param workspace 
     */
    DoFinalInitialization(workspace: Blockly.WorkspaceSvg): void {

    }
}