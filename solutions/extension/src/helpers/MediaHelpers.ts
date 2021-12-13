import { EditorHelper } from "@estruyf/vscode";
import { MediaInfo, MediaPaths, parseWinPath, SortingOption } from "@frontmatter/common";
import { basename, dirname, join } from "path";
import { commands, Position, window } from "vscode";
import { Extension } from ".";
import { Dashboard } from "../commands/Dashboard";
import { Folders } from "../commands/Folders";
import { ExplorerView } from "../explorerView/ExplorerView";


export class MediaHelpers {
  public static media: MediaInfo[] = [];

  /**
   * Reset media array
   */
  public static resetMedia() {
    MediaHelpers.media = [];
  }

  /**
   * Retrieve all media files
   */
   public static async getFiles(page: number = 0, requestedFolder: string = '', sort: SortingOption | null = null): Promise<MediaPaths> {
     return {} as MediaPaths;
   }

  /**
   * Insert a media file into the editor
   */
  public static async insert({ file, image, position, snippet, alt, caption, fieldName }: any) {
    if (file && image) {
      if (!position) {
        await commands.executeCommand(`workbench.view.extension.frontmatter-explorer`);
      }
  
      await EditorHelper.showFile(file);
      Dashboard.resetViewData();
      
      const extensionUri = Extension.getInstance().extensionPath;
      const panel = ExplorerView.getInstance(extensionUri);
  
      if (position) {
        const wsFolder = Folders.getWorkspaceFolder();
        const editor = window.activeTextEditor;
        const line = position.line;
        const character = position.character;
        if (line) {
          let imgPath = image;
          const filePath = file;
          const absImgPath = join(parseWinPath(wsFolder?.fsPath || ""), imgPath);
  
          const imgDir = dirname(absImgPath);
          const fileDir = dirname(filePath);
  
          if (imgDir === fileDir) {
            imgPath = join('/', basename(imgPath));
  
            // Snippets are already parsed, so update the URL of the image
            if (snippet) {
              snippet = snippet.replace(image, imgPath);
            }
          }
  
          await editor?.edit(builder => builder.insert(new Position(line, character), snippet || `![${alt || caption || ""}](${imgPath})`));
        }
        panel.getMediaSelection();
      } else {
        panel.getMediaSelection();
        panel.updateMetadata({field: fieldName, value: image });
      }
    }
  }
}