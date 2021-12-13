import express, { Express } from "express";
import cors from "cors";
import { Extension } from "./Extension";
import { join } from "path";
import { Folders } from "../commands/Folders";
import { Server } from 'http';
import { AddressInfo } from "net";
import { Logger } from "./Logger";

export class LocalServer {
  public static sitePort: number | null = null;
  public static apiPort: number | null = null;
  private static server: Server | null = null;

  public static isRunning() {
    return LocalServer.server !== null;
  }
  
  public static async start(registerEndpoints: (app: Express) => void | null) {
    return new Promise(async (resolve, reject) => {
      const isProduction = Extension.getInstance().isProductionMode;
      const expressApp = express();

      if (!isProduction) {
        expressApp.use(cors());
      }
        
      if (registerEndpoints) {
        registerEndpoints(expressApp);
      }

      expressApp.use(express.static(Extension.getInstance().extensionPath.fsPath));
      expressApp.use(express.static(join(Extension.getInstance().extensionPath.fsPath, 'site')));

      const wsFolder = Folders.getWorkspaceFolder();
      if (wsFolder) {
        expressApp.use(express.static(wsFolder.fsPath));
        Logger.info(`Static serving workspace folder: ${wsFolder.fsPath}`);
      }

      if (isProduction) {
        expressApp.all('*', (req, res) => {
          return res.sendFile(join(Extension.getInstance().extensionPath.fsPath, req.url));
        });
          
        LocalServer.server = expressApp.listen(0, () => {
          LocalServer.sitePort = (LocalServer.server?.address() as AddressInfo)?.port;
          LocalServer.apiPort = (LocalServer.server?.address() as AddressInfo)?.port;

          Logger.info(`> Server ready on http://localhost:${LocalServer.sitePort}`);

          resolve(null);
        })
      } else {          
        LocalServer.server = expressApp.listen(`${process.env.API_DEV_PORT || 3001}`, () => {
          LocalServer.apiPort = (LocalServer.server?.address() as AddressInfo)?.port;

          Logger.info(`> API ready on http://localhost:${LocalServer.apiPort}`);
          resolve(null);
        })
        return;
      }
    });
  }

  public static async stop() {
    if (LocalServer.server) {
      LocalServer.server.close();
      LocalServer.server = null;
      LocalServer.apiPort = null;
      LocalServer.sitePort = null;
    }
  }
}