import next from "next";
import express from "express";
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
  
  public static async start(registerEndpoints: (app: express.Express) => void | null) {
    return new Promise(async (resolve, reject) => {
      const expressApp = express();

      if (Extension.getInstance().isProductionMode) {
        const app = next({
          dir: join(Extension.getInstance().extensionPath.fsPath, 'site')
        });
  
        const handle = app.getRequestHandler();
        const expressApp = express();
  
        app.prepare().then(() => {
  
          const wsFolder = Folders.getWorkspaceFolder();
          if (wsFolder) {
            expressApp.use(express.static(wsFolder.fsPath));
            expressApp.use('/', express.static(Extension.getInstance().extensionPath.fsPath));
            console.log(`Configured the static path to ${wsFolder.fsPath}`);
          }
          
          if (registerEndpoints) {
            registerEndpoints(expressApp);
          }

          expressApp.all('*', (req, res) => {
            return handle(req, res)
          });
            
          LocalServer.server = expressApp.listen(0, () => {
            LocalServer.sitePort = (LocalServer.server?.address() as AddressInfo)?.port;
            LocalServer.apiPort = (LocalServer.server?.address() as AddressInfo)?.port;

            Logger.info(`> Server ready on http://localhost:${LocalServer.sitePort}`);

            resolve(null);
          })
        })
        .catch((ex) => {
          Logger.info(ex.stack)
          reject(ex);
        });
      } else {
        expressApp.use(cors({
          origin: 'http://localhost:3000'
        }));
        
        if (registerEndpoints) {
          registerEndpoints(expressApp);
        }
          
        LocalServer.server = expressApp.listen(0, () => {
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