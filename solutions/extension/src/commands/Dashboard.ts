import { MediaHelpers } from './../helpers/MediaHelpers';
import { Express } from "express";
import { join } from "path";
import { existsSync, writeFileSync } from "fs";
import { commands, Uri, ViewColumn, WebviewPanel, window } from "vscode";
import { LocalServer, Settings as SettingsHelper } from '../helpers';
import { DashboardCommand, DashboardMessage, DashboardData, SETTINGS_CONTENT_STATIC_FOLDER, SETTINGS_DASHBOARD_OPENONSTART, ExtensionState } from '@frontmatter/common';
import { Folders } from './Folders';
import { Notifications } from '../helpers/Notifications';
import { Extension } from '../helpers/Extension';
import { decodeBase64Image } from '../helpers/decodeBase64Image';
import { ExplorerView } from '../explorerView/ExplorerView';
import { MediaLibrary } from '../helpers/MediaLibrary';
import { LocalClientSide } from '../helpers/LocalClientSide';
import PagesApi from "../api/PagesApi";
import MediaApi from "../api/MediaApi";
import SettingsApi from "../api/SettingsApi";
import ExtensionApi from "../api/ExtensionApi";
import { CONTEXT } from "../constants";

export class Dashboard {
  private static webview: WebviewPanel | null = null;
  private static isDisposed: boolean = true;
  private static _viewData: DashboardData | undefined;

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
    MediaLibrary.getInstance();
    
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

    console.log(Extension.getInstance().extensionPath.fsPath)

    // Create the preview webview
    Dashboard.webview = window.createWebviewPanel(
      'frontMatterDashboard',
      'FrontMatter Dashboard',
      ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    Dashboard.isDisposed = false;

    Dashboard.webview.iconPath = {
      dark: Uri.file(join(extensionUri.fsPath, 'assets/icons/frontmatter-short-dark.svg')),
      light: Uri.file(join(extensionUri.fsPath, 'assets/icons/frontmatter-short-light.svg'))
    };

    Dashboard.webview.webview.html = await LocalClientSide.getContents(LocalServer.sitePort, "dashboard");

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
      Dashboard.postWebviewMessage({
        command: DashboardCommand.settingsUpdate,
      });
    });

    Dashboard.webview.webview.onDidReceiveMessage(async (msg) => {
      switch(msg.command) {
        case DashboardMessage.getViewType:
          if (Dashboard._viewData) {
            // TODO: Update the view type
            // Dashboard.postWebviewMessage({ command: DashboardCommand.viewData, data: Dashboard._viewData });
          }
          break;
        case DashboardMessage.setPageViewType:
          Extension.getInstance().setState(ExtensionState.PagesView, msg.data, "workspace");
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
      Dashboard.webview?.webview.postMessage({
        type: "message",
        ...msg
      });
    }
  }
}