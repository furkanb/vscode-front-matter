import { MediaHelpers } from './../helpers/MediaHelpers';
import { Express } from "express";
import { extname, join, parse } from "path";
import { existsSync, readdirSync, statSync, writeFileSync } from "fs";
import { commands, Uri, ViewColumn, WebviewPanel, window, workspace, env, Position } from "vscode";
import { LocalServer, Settings as SettingsHelper } from '../helpers';
import { CustomScript as ICustomScript, DraftField, parseWinPath, ScriptType, SortingSetting, SortOrder, SortType, TaxonomyType, DashboardCommand, DashboardMessage, Settings, MediaInfo, MediaPaths, DashboardData, SortingOption, Sorting, HOME_PAGE_NAVIGATION_ID, SETTINGS_CONTENT_STATIC_FOLDER, SETTINGS_DASHBOARD_OPENONSTART, SETTINGS_DASHBOARD_MEDIA_SNIPPET, SETTING_TAXONOMY_CONTENT_TYPES, ExtensionState, SETTINGS_FRAMEWORK_ID, SETTINGS_CONTENT_DRAFT_FIELD, SETTINGS_CONTENT_SORTING, SETTING_CUSTOM_SCRIPTS, SETTINGS_CONTENT_SORTING_DEFAULT, SETTINGS_MEDIA_SORTING_DEFAULT, ContentsViewType } from '@frontmatter/common';
import { Folders } from './Folders';
import { Template } from './Template';
import { Notifications } from '../helpers/Notifications';
import { Extension } from '../helpers/Extension';
import { decodeBase64Image } from '../helpers/decodeBase64Image';
import { ExplorerView } from '../explorerView/ExplorerView';
import { MediaLibrary } from '../helpers/MediaLibrary';
import { FrameworkDetector } from '../helpers/FrameworkDetector';
import imageSize from 'image-size';
import { LocalClientSide } from '../helpers/LocalClientSide';
import PagesApi from "../api/PagesApi";
import MediaApi from "../api/MediaApi";
import SettingsApi from "../api/SettingsApi";
import ExtensionApi from "../api/ExtensionApi";
import { CONTEXT } from "../constants";

export class Dashboard {
  private static webview: WebviewPanel | null = null;
  private static isDisposed: boolean = true;
  private static timers: { [folder: string]: any } = {};
  private static _viewData: DashboardData | undefined;
  private static mediaLib: MediaLibrary;

  public static get viewData(): DashboardData | undefined {
    return Dashboard._viewData;
  }

  /**
   * Init the dashboard
   */
  public static async init() {
    const openOnStartup = SettingsHelper.get(SETTINGS_DASHBOARD_OPENONSTART);
    if (openOnStartup) {
      Dashboard.open();
    }
  }

  /**
   * Open or reveal the dashboard
   */
  public static async open(data?: DashboardData) {
    this.mediaLib = MediaLibrary.getInstance();
    
    Dashboard._viewData = data;

    if (Dashboard.isOpen) {
			Dashboard.reveal();
		} else {
			Dashboard.create();
		}

    await commands.executeCommand('setContext', CONTEXT.isDashboardOpen, true);
  }

  /**
   * Check if the dashboard is still open
   */
  public static get isOpen(): boolean {
    return !Dashboard.isDisposed;
  }

  /**
   * Reveal the dashboard if it is open
   */
  public static reveal() {
    if (Dashboard.webview) {
      Dashboard.webview.reveal();
    }
  }

  public static close() {
    Dashboard.webview?.dispose();
  }
  
  /**
   * Create the dashboard webview
   */
  public static async create() {
    const extensionUri = Extension.getInstance().extensionPath;

    if (!LocalServer.isRunning()) {
      await LocalServer.start((expressApp: Express) => {
        if (Extension.getInstance().isProductionMode) {
          expressApp.get('/', (req, res) => {
            return res.sendFile(join(extensionUri.fsPath, 'site/index.html'));
          });
          expressApp.get('/media', (req, res) => {
            return res.sendFile(join(extensionUri.fsPath, 'site/media.html'));
          });
        }

        // API Paths
        expressApp.use('/api/pages', PagesApi);
        expressApp.use('/api/media', MediaApi);
        expressApp.use('/api/settings', SettingsApi);
        expressApp.use('/api/extension', ExtensionApi);
      });
    }

    // Create the preview webview
    Dashboard.webview = window.createWebviewPanel(
      'frontMatterDashboard',
      'FrontMatter Dashboard',
      ViewColumn.One,
      {
        enableScripts: true
      }
    );

    Dashboard.isDisposed = false;

    Dashboard.webview.iconPath = {
      dark: Uri.file(join(extensionUri.fsPath, 'assets/icons/frontmatter-short-dark.svg')),
      light: Uri.file(join(extensionUri.fsPath, 'assets/icons/frontmatter-short-light.svg'))
    };

    Dashboard.webview.webview.html = LocalClientSide.getContents(LocalServer.sitePort, "dashboard");

    Dashboard.webview.onDidChangeViewState(async () => {
      if (!this.webview?.visible) {
        Dashboard._viewData = undefined;
        const panel = ExplorerView.getInstance(extensionUri);
        panel.getMediaSelection();
      }

      await commands.executeCommand('setContext', CONTEXT.isDashboardOpen, this.webview?.visible);
    });

    Dashboard.webview.onDidDispose(async () => {
      Dashboard.isDisposed = true;
      Dashboard._viewData = undefined;
      const panel = ExplorerView.getInstance(extensionUri);
      panel.getMediaSelection();
      await commands.executeCommand('setContext', CONTEXT.isDashboardOpen, false);
      LocalServer.stop();
    });

    SettingsHelper.onConfigChange((global?: any) => {
      Dashboard.getSettings();
    });

    Dashboard.webview.webview.onDidReceiveMessage(async (msg) => {
      switch(msg.command) {
        case DashboardMessage.getViewType:
          if (Dashboard._viewData) {
            Dashboard.postWebviewMessage({ command: DashboardCommand.viewData, data: Dashboard._viewData });
          }
          break;
        case DashboardMessage.setPageViewType:
          Extension.getInstance().setState(ExtensionState.PagesView, msg.data, "workspace");
          break;
        case DashboardMessage.getMedia:
          Dashboard.getMedia(msg?.data?.page, msg?.data?.folder, msg?.data?.sorting);
          break;
        case DashboardMessage.uploadMedia:
          Dashboard.saveFile(msg?.data);
          break;
      }
    });
  }

  /**
   * Reload the dashboard
   */
  public static reload() {
    if (!Dashboard.isDisposed) {
      Dashboard.webview?.dispose();
      setTimeout(() => {
        Dashboard.open();
      }, 100);
    }
  }

  public static switchFolder(folderPath: string) {
    MediaHelpers.resetMedia();
    MediaHelpers.getFiles(0, folderPath);
  }

  /**
   * Retrieve the webview
   * @returns 
   */
  public static getWebview() {
    return Dashboard.webview?.webview;
  }

  /**
   * Reset view data when inserting an image
   */
  public static resetViewData() {
    Dashboard._viewData = undefined;
  }

  /**
   * Post data to the dashboard
   * @param msg 
   */
  public static postWebviewMessage(msg: { command: DashboardCommand, data?: any }) {
    if (Dashboard.isDisposed) {
      return;
    }

    if (Dashboard.webview) {
      Dashboard.webview?.webview.postMessage(msg);
    }
  }

  /**
   * Retrieve the settings for the dashboard
   */
  private static async getSettings() { 
    const ext = Extension.getInstance();
    const wsFolder = Folders.getWorkspaceFolder();
    const isInitialized = await Template.isInitialized();
    
    Dashboard.postWebviewMessage({
      command: DashboardCommand.settings,
      data: {
        beta: ext.isBetaVersion(),
        wsFolder: wsFolder ? wsFolder.fsPath : '',
        staticFolder: SettingsHelper.get<string>(SETTINGS_CONTENT_STATIC_FOLDER),
        folders: Folders.get(),
        initialized: isInitialized,
        tags: SettingsHelper.getTaxonomy(TaxonomyType.Tag),
        categories: SettingsHelper.getTaxonomy(TaxonomyType.Category),
        openOnStart: SettingsHelper.get(SETTINGS_DASHBOARD_OPENONSTART),
        versionInfo: ext.getVersion(),
        pageViewType: await ext.getState<ContentsViewType | undefined>(ExtensionState.PagesView, "workspace"),
        mediaSnippet: SettingsHelper.get<string[]>(SETTINGS_DASHBOARD_MEDIA_SNIPPET) || [],
        contentTypes: SettingsHelper.get(SETTING_TAXONOMY_CONTENT_TYPES) || [],
        draftField: SettingsHelper.get<DraftField>(SETTINGS_CONTENT_DRAFT_FIELD),
        customSorting: SettingsHelper.get<SortingSetting[]>(SETTINGS_CONTENT_SORTING),
        contentFolders: Folders.get(),
        crntFramework: SettingsHelper.get<string>(SETTINGS_FRAMEWORK_ID),
        framework: (!isInitialized && wsFolder) ? FrameworkDetector.get(wsFolder.fsPath) : null,
        scripts: (SettingsHelper.get<ICustomScript[]>(SETTING_CUSTOM_SCRIPTS) || []).filter(s => s.type && s.type !== ScriptType.Content),
        dashboardState: {
          contents: {
            sorting: await ext.getState<SortingOption | undefined>(ExtensionState.Dashboard.Contents.Sorting, "workspace"),
            defaultSorting: SettingsHelper.get<string>(SETTINGS_CONTENT_SORTING_DEFAULT)
          },
          media: {
            sorting: await ext.getState<SortingOption | undefined>(ExtensionState.Dashboard.Media.Sorting, "workspace"),
            defaultSorting: SettingsHelper.get<string>(SETTINGS_MEDIA_SORTING_DEFAULT)
          }
        }
      } as Settings
    });
  }

  /**
   * Retrieve all media files
   */
  private static async getMedia(page: number = 0, requestedFolder: string = '', sort: SortingOption | null = null) {
    const wsFolder = Folders.getWorkspaceFolder();
    const staticFolder = SettingsHelper.get<string>(SETTINGS_CONTENT_STATIC_FOLDER);
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
      const media = await Dashboard.updateMediaData(Dashboard.filterMedia(files));

      allMedia = [...media];
    } else {
      if (staticFolder) {
        const folderSearch = join(staticFolder || "", '/*');
        const files = await workspace.findFiles(folderSearch);
        const media = await Dashboard.updateMediaData(Dashboard.filterMedia(files));

        allMedia = [...media];
      }

      if (contentFolders && wsFolder) {
        for (let i = 0; i < contentFolders.length; i++) {
          const contentFolder = contentFolders[i];
          const relFolderPath = contentFolder.path.substring(wsFolder.fsPath.length + 1);
          const folderSearch = relSelectedFolderPath ? join(relSelectedFolderPath, '/*') : join(relFolderPath, '/*');
          const files = await workspace.findFiles(folderSearch);
          const media = await Dashboard.updateMediaData(Dashboard.filterMedia(files));
    
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
        const metadata = Dashboard.mediaLib.get(file.fsPath);

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

    Dashboard.postWebviewMessage({
      command: DashboardCommand.media,
      data: {
        media: files,
        total: total,
        folders: sortedFolders,
        selectedFolder
      } as MediaPaths
    });
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
      vsPath: Dashboard.webview?.webview.asWebviewUri(file).toString(),
      stats: undefined
    } as MediaInfo));
  }

  /**
   * Save the dropped file in the current folder
   * @param fileData 
   */
  private static async saveFile({fileName, contents, folder}: { fileName: string; contents: string; folder: string | null }) {
    if (fileName && contents) {
      const wsFolder = Folders.getWorkspaceFolder();
      const staticFolder = SettingsHelper.get<string>(SETTINGS_CONTENT_STATIC_FOLDER);
      const wsPath = wsFolder ? wsFolder.fsPath : "";
      let absFolderPath = join(wsPath, staticFolder || "");

      if (folder) {
        absFolderPath = folder;
      }

      if (!existsSync(absFolderPath)) {
        absFolderPath = join(wsPath, folder || "");
      }

      if (!existsSync(absFolderPath)) {
        Notifications.error(`We couldn't find your selected folder.`);
        return;
      }

      const staticPath = join(absFolderPath, fileName);
      const imgData = decodeBase64Image(contents);

      if (imgData) {
        writeFileSync(staticPath, imgData.data);
        Notifications.info(`File ${fileName} uploaded to: ${folder}`);
        
        const folderPath = `${folder}`;
        if (Dashboard.timers[folderPath]) {
          clearTimeout(Dashboard.timers[folderPath]);
          delete Dashboard.timers[folderPath];
        }
        
        Dashboard.timers[folderPath] = setTimeout(() => {
          MediaHelpers.resetMedia();
          MediaHelpers.getFiles(0, folder || "");
          delete Dashboard.timers[folderPath];
        }, 500);
      } else {
        Notifications.error(`Something went wrong uploading ${fileName}`);
      }
    }
  }
}