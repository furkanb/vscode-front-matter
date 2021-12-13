import { EditorHelper } from "@estruyf/vscode";
import { ExtensionState, HOME_PAGE_NAVIGATION_ID, MediaInfo, MediaPaths, parseWinPath, SETTINGS_CONTENT_STATIC_FOLDER, Sorting, SortingOption, SortOrder, SortType } from "@frontmatter/common";
import { existsSync, readdirSync, statSync } from "fs";
import imageSize from "image-size";
import { basename, dirname, extname, join, parse } from "path";
import { commands, Position, Uri, window, workspace } from "vscode";
import { Extension, MediaLibrary, Settings } from ".";
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
    const wsFolder = Folders.getWorkspaceFolder();
    const staticFolder = Settings.get<string>(SETTINGS_CONTENT_STATIC_FOLDER);
    const contentFolders = Folders.get();
    const viewData = Dashboard.viewData;
    let selectedFolder = requestedFolder;

    const ext = Extension.getInstance();
    const crntSort = sort === null ? await ext.getState<SortingOption | undefined>(ExtensionState.Dashboard.Media.Sorting, "workspace") : sort;

    // If the static folder is not set, retreive the last opened location
    if (!selectedFolder) {
      const stateValue = await ext.getState<string | undefined>(ExtensionState.SelectedFolder, "workspace");

      if (stateValue !== HOME_PAGE_NAVIGATION_ID) {
        // Support for page bundles
        if (viewData?.data?.filePath && viewData?.data?.filePath.endsWith('index.md')) {
          const folderPath = parse(viewData.data.filePath).dir;
          selectedFolder = folderPath;
        } else if (stateValue && existsSync(stateValue)) {
          selectedFolder = stateValue;
        }
      }
    }

    // Go to the home folder
    if (selectedFolder === HOME_PAGE_NAVIGATION_ID) {
      selectedFolder = '';
    }

    let relSelectedFolderPath = selectedFolder;
    const parsedPath = parseWinPath(wsFolder?.fsPath || "");
    if (selectedFolder && selectedFolder.startsWith(parsedPath)) {
      relSelectedFolderPath = selectedFolder.replace(parsedPath, '');
    }

    if (relSelectedFolderPath.startsWith('/')) {
      relSelectedFolderPath = relSelectedFolderPath.substring(1);
    }

    let allMedia: MediaInfo[] = [];

    if (relSelectedFolderPath) {
      const files = await workspace.findFiles(join(relSelectedFolderPath, '/*'));
      const media = await MediaHelpers.updateMediaData(MediaHelpers.filterMedia(files));

      allMedia = [...media];
    } else {
      if (staticFolder) {
        const folderSearch = join(staticFolder || "", '/*');
        const files = await workspace.findFiles(folderSearch);
        const media = await MediaHelpers.updateMediaData(MediaHelpers.filterMedia(files));

        allMedia = [...media];
      }

      if (contentFolders && wsFolder) {
        for (let i = 0; i < contentFolders.length; i++) {
          const contentFolder = contentFolders[i];
          const relFolderPath = contentFolder.path.substring(wsFolder.fsPath.length + 1);
          const folderSearch = relSelectedFolderPath ? join(relSelectedFolderPath, '/*') : join(relFolderPath, '/*');
          const files = await workspace.findFiles(folderSearch);
          const media = await MediaHelpers.updateMediaData(MediaHelpers.filterMedia(files));
    
          allMedia = [...allMedia, ...media];
        }
      }
    }

    if (crntSort?.type === SortType.string) {
      allMedia = allMedia.sort(Sorting.alphabetically("fsPath"));
    } else if (crntSort?.type === SortType.date) {
      allMedia = allMedia.sort(Sorting.dateWithFallback("mtime", "fsPath"));
    } else {
      allMedia = allMedia.sort(Sorting.alphabetically("fsPath"));
    }

    if (crntSort?.order === SortOrder.desc) {
      allMedia = allMedia.reverse();
    }

    MediaHelpers.media = Object.assign([], allMedia);

    let files: MediaInfo[] = MediaHelpers.media;

    // Retrieve the total after filtering and before the slicing happens
    const total = files.length;

    // Get media set
    files = files.slice(page * 16, ((page + 1) * 16));
    files = files.map((file) => {
      try {
        const metadata = MediaLibrary.getInstance().get(file.fsPath);

        return {
          ...file,
          dimensions: imageSize(file.fsPath),
          ...metadata
        };
      } catch (e) {
        return {...file};
      }
    });
    files = files.filter(f => f.mtime !== undefined);

    // Retrieve all the folders
    let allContentFolders: string[] = [];
    let allFolders: string[] = [];

    if (selectedFolder) {
      if (existsSync(selectedFolder)) {
        allFolders = readdirSync(selectedFolder, { withFileTypes: true }).filter(dir => dir.isDirectory()).map(dir => parseWinPath(join(selectedFolder, dir.name)));
      }
    } else {
      for (const contentFolder of contentFolders) {
        const contentPath = contentFolder.path;
        if (contentPath && existsSync(contentPath)) {
          const subFolders = readdirSync(contentPath, { withFileTypes: true }).filter(dir => dir.isDirectory()).map(dir => parseWinPath(join(contentPath, dir.name)));
          allContentFolders = [...allContentFolders, ...subFolders];
        }
      }
  
      const staticPath = join(parseWinPath(wsFolder?.fsPath || ""), staticFolder || "");
      if (staticPath && existsSync(staticPath)) {
        allFolders = readdirSync(staticPath, { withFileTypes: true }).filter(dir => dir.isDirectory()).map(dir => parseWinPath(join(staticPath, dir.name)));
      }
    }

    // Store the last opened folder
    await Extension.getInstance().setState(ExtensionState.SelectedFolder, requestedFolder === HOME_PAGE_NAVIGATION_ID ? HOME_PAGE_NAVIGATION_ID : selectedFolder, "workspace");
    
    let sortedFolders = [...allContentFolders, ...allFolders];
    sortedFolders = sortedFolders.sort((a, b) => {
      if (a.toLowerCase() < b.toLowerCase()) {
        return -1;
      }
      if (a.toLowerCase() > b.toLowerCase()) {
        return 1;
      }
      return 0;
    });

    if (crntSort?.order === SortOrder.desc) {
      sortedFolders = sortedFolders.reverse();
    }

    return {
      media: files,
      total: total,
      folders: sortedFolders,
      selectedFolder
    };
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

  /**
   * Update the metadata of the retrieved files
   * @param files 
   */
  private static async updateMediaData(files: MediaInfo[]) {
    files = files.map((m: MediaInfo) => {
      const stats = statSync(m.fsPath);
      return Object.assign({}, m, stats);
    });

    return Object.assign([], files);
  }

  /**
   * Filter the media files
   */
  private static filterMedia(files: Uri[]) {
    return files.filter(file => {
      const ext = extname(file.fsPath);
      return ['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext);
    }).map((file) => ({
      fsPath: file.fsPath,
      vsPath: Dashboard.getWebview()?.asWebviewUri(file).toString(),
      stats: undefined
    } as MediaInfo));
  }
}