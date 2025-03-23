import { ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { Widget } from '@lumino/widgets';
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { Cell } from "@jupyterlab/cells";
import * as Blockly from 'blockly/core';
import { ICommandPalette, MainAreaWidget, IWidgetTracker, ISessionContext, WidgetTracker } from '@jupyterlab/apputils';
// import { IStateDB } from "@jupyterlab/statedb";
// import * as notebook from "@jupyterlab/notebook";
import * as cells from "@jupyterlab/cells";
import { ICellModel } from "@jupyterlab/cells";
import { Kernel, Session, KernelMessage } from "@jupyterlab/services";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { CommandRegistry } from "@lumino/commands";

// TODO: seems like logging is not wired up throughout

// import toolbox functions here
// TODO: make toolbox/generator selectable or discover from kernel
// import { toolbox, encodeWorkspace, decodeWorkspace, setNotebooksInstance as notebooks_1, DoFinalInitialization, UpdateAllIntellisense_R } from "./Toolbox";

// TODO import generator here
// import { RGenerator } from './RGenerator';

/**
 * BlocklyWidget is a wrapper for Blockly. It does all the integration between Blockly and Jupyter. Language specific issues are handled by respective geneators and toolboxes
 */
export class BlocklyWidget extends Widget {
  /**
   * Notebooks we have open
   */
  notebooks: INotebookTracker;
  /**
   * Blockly workspace (basically Blockly session state)
   */
  workspace: Blockly.Workspace | null;
  /**
   * Flag for  whether the widget is attached to Jupyter
   */
  notHooked: boolean
  /**
   * Language generator in use
   */
  generator: any;
  /** 
   * last cell for blocks to code state managment
   */
  lastCell: Cell | null;
  /** 
   * blocks rendered flag for state managment. Set to false every time a block is created. Set to true when blocks have been deserialized OR have been serialized
   */
  blocksInSyncWithXML: boolean;


  constructor(notebooks: INotebookTracker) {
    super();

    //--------------------
    // Initialize state
    //--------------------
    //track notebooks
    this.notebooks = notebooks;

    //listen for notebook cell changes
    this.notebooks.activeCellChanged.connect(this.onActiveCellChanged(), this);

    // TODO see toolbox imports
    // inject notebooks into toolbox
    // notebooks_1(this.notebooks);

    // TODO discover generator from kernel
    // this.generator = RGenerator;

    this.lastCell = null;
    this.blocksInSyncWithXML = false;
    this.workspace = null;
    this.notHooked = true;

    //---------------------
    // Widget UI in Jupyter
    //---------------------
    //div to hold blockly
    const div: any = document.createElement("div");

    //initial size will be immediately resized
    div.setAttribute("style", "height: 480px; width: 600px;");

    //id for debug and to refer to during injection
    div.id = "blocklyDivPoly";
    this.node.appendChild(div);

    //div for buttons    
    const buttonDiv: any = document.createElement("div");
    buttonDiv.id = "buttonDivPoly";

    //button to trigger code generation
    const blocksToCodeButton: any = document.createElement("button");
    blocksToCodeButton.innerText = "Blocks to Code";
    blocksToCodeButton.addEventListener("click", (_arg: any): void => {
      this.BlocksToCode(this.notebooks.activeCell,true);
    });
    buttonDiv.appendChild(blocksToCodeButton);

    //button to reverse xml to blocks
    const codeToBlocksButton: any = document.createElement("button");
    codeToBlocksButton.innerText = "Code to Blocks";
    codeToBlocksButton.addEventListener("click", (_arg_1: any): void => {
      this.DeserializeBlocksFromXML();
    });
    buttonDiv.appendChild(codeToBlocksButton);

    //button for bug reports
    const bugReportButton: any = document.createElement("button");
    bugReportButton.innerText = "Report Bug";
    bugReportButton.addEventListener("click", (_arg_2: any): void => {
      const win: any = window.open("https://jupyterlab-blockly-polyglot-extension/issues", "_blank");
      win.focus();
    });     
    buttonDiv.appendChild(bugReportButton);

    //checkbox for JLab sync (if cell is selected and has serialized blocks, decode them to workspace; if cell is empty, empty workspace)
    const syncCheckbox: any = document.createElement("input");
    syncCheckbox.setAttribute("type", "checkbox");
    syncCheckbox.checked = true;
    syncCheckbox.id = "syncCheckboxPoly";
    const syncCheckboxLabel: any = document.createElement("label");
    syncCheckboxLabel.innerText = "Notebook Sync";
    syncCheckboxLabel.setAttribute("for", "syncCheckboxPoly");
    buttonDiv.appendChild(syncCheckbox);
    buttonDiv.appendChild(syncCheckboxLabel);

    // TODO remove cache; should not be needed with LSP...
    // const cacheCheckbox: any = document.createElement("input");
    // cacheCheckbox.setAttribute("type", "checkbox");
    // cacheCheckbox.id = "cacheCheckboxPoly";
    // cacheCheckbox.onchange = ((e: any): void => {
    //   const url: string = window.location.href;
    //   if ((e.currentTarget as any).checked) {
    //     if (!(url.indexOf("workspaces/cache") >= 0)) {
    //       const parts = url.split("/lab");
    //       const newUrl = parts[0] + "/lab/workspaces/cache" + parts[1];
    //       window.location.assign(newUrl);
    //     }
    //   }
    //   else {
    //     const baseUrl: string = url.slice(0, url.indexOf("/lab"));
    //     window.location.assign(baseUrl + "/lab/workspaces/cache?reset");
    //   }
    // });
    // cacheCheckbox.checked = true;
    // cacheCheckbox.dispatchEvent(new Event("change"));
    // const cacheCheckboxLabel: any = document.createElement("label");
    // cacheCheckboxLabel.innerText = "Use cache";
    // cacheCheckboxLabel.setAttribute("for", "cacheCheckboxPoly");
    // buttonDiv.appendChild(cacheCheckbox);
    // buttonDiv.appendChild(cacheCheckboxLabel);

    this.node.appendChild(buttonDiv);
  }

  /**
   * Remove blocks from workspace without affecting variable map like blockly.getMainWorkspace().clear() would
   */
  clearBlocks(): void {
    const workspace: Blockly.Workspace = Blockly.getMainWorkspace();
    const blocks = workspace.getAllBlocks(false);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      block.dispose(false);
    }
  }

  /**
   * !!!UNUSED Experimental function!!! that could replace 'blocksRendered' flag. Checks if blocks are saved/serialized. Blocks are considered saved if serialization of the current blocks matches xml in the cell. 
   */
  AreBlocksSaved(): boolean {
    const cellSerializedBlocks: string | null = this.GetActiveCellSerializedBlockXML();
    // TODO toolbox function
    const workspaceSerializedBlocks = "" //encodeWorkspace();
    if( cellSerializedBlocks == workspaceSerializedBlocks) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * The kernel has executed. Refresh intellisense and log execution and error if it exists
   * @returns 
   */
  onKernelExecuted(): ((arg0: Kernel.IKernelConnection, arg1: KernelMessage.IIOPubMessage<any>) => boolean) {
    return (sender: Kernel.IKernelConnection, args: KernelMessage.IIOPubMessage<any>): boolean => {
        const messageType: string = args.header.msg_type.toString();
        switch (messageType) {
          case "execute_input": {
              console.log(`jupyterlab_blockly_polyglot_extension: kernel '${sender.name}' executed code, updating intellisense`);
            // LogToServer(JupyterLogEntry082720_Create("execute-code", args.content.code));
            // TODO toolbox function
            // UpdateAllIntellisense_R();
            break;
          }
          case "error": {
            // LogToServer(JupyterLogEntry082720_Create("execute-code-error", JSON.stringify(args.content)));
            break;
          }
          default: 0;
        }
      
      return true;
    };
  };

  /**
   * The active cell in the notebook has changed. Update state, particularly involving the clearing/serialization/deserialization of blocks.
   * @returns 
   */
  onActiveCellChanged(): (arg0: INotebookTracker, arg1: Cell<ICellModel> | null) => boolean {
    return (sender: INotebookTracker, args: Cell<ICellModel> | null): boolean => {
      if (args) {
        // LogToServer(JupyterLogEntry082720_Create("active-cell-change", args.node.outerText));
        const syncCheckbox: HTMLInputElement | null = document.getElementById("syncCheckboxPoly") as HTMLInputElement;
        const autosaveCheckbox: HTMLInputElement | null = document.getElementById("autosaveCheckbox") as HTMLInputElement;

        // if autosave enabled, attempt to save our current blocks to the previous cell we just navigated off (to prevent losing work)
        if (autosaveCheckbox?.checked && this.lastCell) {
          // this.RenderCodeToLastCell(); //refactoring to BlocksToCode
          this.BlocksToCode(this.lastCell)
          // set lastCell to current cell
          this.lastCell = args;
        }

        // if sync enabled, the blocks workspace should:
        // clear itself when encountering a new empty cell
        // replace itself with serialized blocks if they exist
        // however, if we have blocks are not in sync with XML, we don't want to lose them by clearing the workspace
        if (syncCheckbox?.checked && this.notebooks.activeCell) {
          //if blocks are in sync and the active cell has no xml to load, just clear the workspace;
          if (this.blocksInSyncWithXML && this.GetActiveCellSerializedBlockXML() == null) {
            this.clearBlocks();
          }
          //otherwise try to to create blocks from xnl string (fails gracefully)
          else {
            this.DeserializeBlocksFromXML();
          }
          // TODO toolbox function
          //Update intellisense on blocks we just created
          // UpdateAllIntellisense_R();
        }


      }
      return true;
    };
  };

  /**
   * Widget has attached to DOM and is ready for interaction. Inject blockly into div and set up event listeners for blockly events
   */
  onAfterAttach(): void {
    // Inject blockly into page. We do so without definiting the toolbox/palette b/c that will change with kernel
    this.workspace = Blockly.inject("blocklyDivPoly");
    // TODO: move toolbox initialization elsewhere; should change with kernel
    // console.log("jupyterlab_blockly_polyglot_extension: blockly palette initialized");

    const logListener = (e: Blockly.Events.Abstract): void => {
      //TODO reconsider how blocksRendered is working
      //this fires when user creates blocks AND when blocks are deserialized
      if (e.type === "create") {
        this.blocksInSyncWithXML = false
      }
      // "finished loading" event seems to only fire when deserializing
      if (e.type === "finished_loading") {
        this.blocksInSyncWithXML = true
      }
      // LogToServer(BlocklyLogEntry082720_Create<Blockly_Events_Abstract__Class>(e.type, e));
    };
    this.workspace.removeChangeListener(logListener);
    this.workspace.addChangeListener(logListener);
    // TODO toolbox function
    // DoFinalInitialization(this.workspace(this$) as Blockly.WorkspaceSvg);
  }

  /**
   * Widget has been resized; update UI 
   */
  onResize(msg: Widget.ResizeMessage): void {
    const blocklyDiv: any = document.getElementById("blocklyDivPoly");
    const buttonDiv: any = document.getElementById("buttonDivPoly");
    const adjustedHeight: number = msg.height - 30;
    blocklyDiv.setAttribute("style", "position: absolute; top: 0px; left: 0px; width: " + msg.width.toString() + "px; height: " + adjustedHeight.toString() + "px");
    buttonDiv.setAttribute("style", "position: absolute; top: " + adjustedHeight.toString() + "px; left: " + "0" + "px; width: " + msg.width.toString() + "px; height: " + "30" + "px");
    Blockly.svgResize(this.workspace as Blockly.WorkspaceSvg);
  }

/**
 * Get the XML comment string of the active cell if the string exists
 * @returns 
 */
GetActiveCellSerializedBlockXML(): string | null {
  if (this.notebooks.activeCell) {
    const cellText: string = this.notebooks.activeCell.model.sharedModel.getSource();
    if (cellText.indexOf("xmlns") >= 0) {
      const regex = /(<xml[\s\S]+<\/xml>)/;
      let match = cellText.match(regex);
      //if we match overall and the capture group, return the capture group
      if (match && match[0]) {
        return match[0]
      }
    }
    //No xml to match against
    else {
      return null;
    }
  }
  //No active cell
  return null;
}

/**
 * Render blocks to code and serialize blocks at the same time. Do error checking to prevent user error IF this action was user-initiated (not autosave).
 */
BlocksToCode(cell : Cell | null, userInitated: boolean = false): void {
  const code: string = this.generator.workspaceToCode(this.workspace);
  if (cell != null) {
    // if user called blocks to code on a markdown cell, complain
    if( userInitated && cells.isMarkdownCellModel(cell.model) ) {
      window.alert("You are calling \'Blocks to Code\' on a MARKDOWN cell. Select an empty CODE cell and try again.");
    // if this is a code cell, do blocks to code
    } else if(cells.isCodeCellModel(cell.model)) {
      // TODO toolbox function
      // this$.notebooks.activeCell.model.sharedModel.setSource(code + "\n#" + encodeWorkspace());
      console.log(("jupyterlab_blockly_polyglot_extension: wrote to cell\n" + code) + "\n");
      // LogToServer(JupyterLogEntry082720_Create("blocks-to-code", this$.notebooks.activeCell.model.value.text));
      this.blocksInSyncWithXML = true;
    }
  }
  else {
    console.log(("jupyterlab_blockly_polyglot_extension: cell is null, could not execute blocks to code for\n" + code) + "\n");
  }
};

/**
 * Render blocks in workspace using xml. Defaults to xml present in active cell
 */
DeserializeBlocksFromXML(): void {
  if (this.notebooks.activeCell) {
    const xmlOption = this.GetActiveCellSerializedBlockXML();
    if( xmlOption != null ){
      try {
        //clear existing blocks so we don't junk up the workspace
        this.clearBlocks();
        // TODO toolbox function
        // decodeWorkspace(xmlString);
        // TODO delete the following line
        console.log(xmlOption);
        // LogToServer(JupyterLogEntry082720_Create("xml-to-blocks", xmlString));
        } catch (e: any) {
          window.alert("Unable to perform \'Code to Blocks\': XML is either invald or renames existing variables. Specific error message is: " + e.message);
          console.log("jupyterlab_blockly_polyglot_extension: unable to decode blocks, last line is invald xml");
        }
      }
      else {
        console.log("jupyterlab_blockly_polyglot_extension: unable to decode blocks, active cell is null");
      }
    }
};

// Refactoring; seems overly complex and does not really implement autosave
// /**
//  * Auto-save: Render blocks to code if we are on a code cell, we've previously saved to it, and have any blocks on the workspace
//  */
// RenderCodeToLastCell(): void {
//   let model: ICellModel;
//   const code: string = this.generator.workspaceToCode(this.workspace);
//   if (this.lastCell) {
//     if (this.lastCell.model) {
//       if ((model = this.lastCell.model, cells.isCodeCellModel(model))) {
//         if ((() => {
//           try {
//             const xmlString: string = this.lastCell.model.sharedModel.getSource();
//             if (xmlString.indexOf("xmlns") >= 0) {
//               const regex = /(<xml[\s\S]+<\/xml>)/;
//               let xmlStringOption = xmlString.match(regex);
//               if (xmlStringOption && xmlStringOption[0]) {
//                 return xmlStringOption[0]
//               }
//             }
//           }
//           catch (matchValue: any) {
//             return false;
//           }
//         })()) {
//           // const workspace: Blockly.Workspace = this.workspace;
//           const blocks: Blockly.Block[] = this.workspace?.getAllBlocks(false) ?? []
//           if (blocks.length > 0) {
//             // TODO toolbox function
//             // this.lastCell.model.sharedModel.setSource(code + "\n#" + encodeWorkspace());
//             console.log(("jupyterlab_blockly_polyglot_extension: wrote to active cell\n" + code) + "\n");
//             // LogToServer(JupyterLogEntry082720_Create("blocks-to-code-autosave", this$.notebooks.activeCell.model.value.text));
//           }
//         }
//       }
//     }
//   }
//   else {
//     console.log(("jupyterlab_blockly_polyglot_extension: no cell active, flushed instead of autosave\n" + code) + "\n");
//   }
// }


} //end BlocklyWidget


/**
 * Return a MainAreaWidget wrapping a BlocklyWidget
 */
export function createMainAreaWidget(bw: BlocklyWidget): MainAreaWidget<BlocklyWidget> {
  const w: MainAreaWidget<BlocklyWidget> = new MainAreaWidget({
    content: bw as any,
  });
  w.id = "blockly-jupyterlab-polyglot";
  w.title.label = "Blockly Polyglot";
  w.title.closable = true;
  return w;
};

/**
 * Attach a MainAreaWidget by splitting the viewing area and placing in the left hand pane, if possible
 */
export function attachWidget(app: JupyterFrontEnd, notebooks: INotebookTracker, widget: MainAreaWidget): void {
  if (!widget.isAttached) {
    if( notebooks.currentWidget != null ) {
      const options: DocumentRegistry.IOpenOptions = {
        ref: notebooks.currentWidget.id,
        mode: "split-left",
      };
      notebooks.currentWidget.context.addSibling(widget, options);
    //Forcing a left split when there is no notebook open results in partially broken behavior, so we must add to the main area
    } else {
      app.shell.add(widget, "main");
    }
  app.shell.activateById(widget.id);
  }
};

/**
 * Catch notebook changed event for enabling extension and attaching to left side when query string command is given
 * @param this 
 * @param sender 
 * @param args 
 * @returns 
 */
export const runCommandOnNotebookChanged = function (this: any, sender: IWidgetTracker<NotebookPanel>, args: NotebookPanel | null): boolean {
  if( sender.currentWidget != null ) {
    console.log("jupyterlab_blockly_polyglot_extension: notebook changed, autorunning blockly polyglot command");
    this.commands.execute("blockly_polyglot:open");
  }
  return true;
};

/**
 * The kernel has changed. TODO handle kernel swapping. Make sure we are logging kernel messages
 * @param this
 * @param sender 
 * @param args 
 * @returns 
 */
export function onKernelChanged(this: any, sender: ISessionContext, args: Session.ISessionConnection.IKernelChangedArgs): boolean {
  const widget: BlocklyWidget = this;
  if (widget.notHooked) {
    if(sender.session?.kernel != null ) {
      sender.session.kernel.iopubMessage.connect(widget.onKernelExecuted(), widget);
      console.log("jupyterlab_blockly_polyglot_extension: Listening for kernel messages");
      widget.notHooked = false;
    }
    return true;
  }
  else {
    return false;
  }
};

/**
 * The notebook has changed
 * @param this 
 * @param sender 
 * @param args 
 * @returns 
 */
export function onNotebookChanged(this: any, sender: IWidgetTracker<NotebookPanel>, args: NotebookPanel | null): boolean {
  const blocklyWidget: BlocklyWidget = this;
  if( sender.currentWidget != null) {
    console.log("jupyterlab_blockly_polyglot_extension: notebook changed to " +  sender.currentWidget.context.path);
    // LogToServer(JupyterLogEntry082720_Create("notebook-changed", notebook.context.path));
    sender.currentWidget.sessionContext.kernelChanged.connect(onKernelChanged, blocklyWidget);
  }
  return true;
};

/**
 * Plugin definition for Jupyter; makes use of BlocklyWidget
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_blockly_polyglot_extension',
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker, ILayoutRestorer],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette, notebooks: INotebookTracker, restorer: ILayoutRestorer) => {
    console.log("jupyterlab_blockly_polyglot_extension: activated");

     //Create a blockly widget and place inside main area widget
    const blocklyWidget: BlocklyWidget = new BlocklyWidget(notebooks);
    let widget: MainAreaWidget<BlocklyWidget> = createMainAreaWidget(blocklyWidget);

    //Set up widget tracking to restore state
    const tracker: WidgetTracker<MainAreaWidget<BlocklyWidget>> = new WidgetTracker({
      namespace: "blockly_polyglot",
    });
    if (restorer) {
      restorer.restore(tracker, {
        command: "blockly_polyglot:open",
        name: (): string => "blockly_polyglot",
      });
    }

    //wait until a notebook is displayed to hook kernel messages
    notebooks.currentChanged.connect(onNotebookChanged, blocklyWidget);

    //Add application command to display
    app.commands.addCommand("blockly_polyglot:open", {
      label: "Blockly Polyglot",
      execute: (): void => {
        //Recreate the widget if the user previously closed it
        if (widget == null || widget.isDisposed) {
          widget = createMainAreaWidget(blocklyWidget);
        }
        //Attach the widget to the UI in a smart way
        attachWidget(app, notebooks, widget);
        //Track the widget to restore its state if the user does a refresh
        if (!tracker.has(widget)) {
          tracker.add(widget);
        }
      },
    } as CommandRegistry.ICommandOptions);

     //Add command to command palette
    palette.addItem({ command: "blockly_polyglot:open", category: 'Blockly' });

    //----------------------
    // Process query string
    //----------------------
    const searchParams: any = new URLSearchParams(window.location.search);

    //If query string has bl=1, trigger the open command once the application is ready
    if( searchParams.get("bl") == "1"){
        console.log("jupyterlab_blockly_polyglot_extension: triggering open command based on query string input");
        //wait until a notebook is displayed so we dock correctly (e.g. nbgitpuller deployment)
        //NOTE: workspaces are stateful, so the notebook must be closed, then openned in the workspace for this to fire
        app.restored.then<void>((): void => {
          notebooks.currentChanged.connect(runCommandOnNotebookChanged, app);
          //If we force blockly to be open, do not allow blockly to be closed; useful for classes and experiments
          widget.title.closable = false;
        });
    }
    
    //If query string has id=, set up logging with this id
    if( searchParams.get("id") == "1"){
      //TODO set up logging with this id
    }

    //If query string has log=, set up logging with this log endpoint url
    if( searchParams.get("log") == "1"){
      //TODO set up logging with this url
    }

  }
};

export default plugin;