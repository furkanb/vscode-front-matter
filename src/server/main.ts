
import express from "express";
import cors from 'cors';
import { Server } from 'http';
import { AddressInfo } from "net";
import { Endpoints } from './Endpoints';
import { Logger, Extension } from '../helpers';

export class LocalServer {
  public static apiPort: number | null = null;
  private static server: Server | null = null;

  public static isRunning() {
    return LocalServer.server !== null;
  }
  
  public static async start() {
    return new Promise(async (resolve, reject) => {
      const ext = Extension.getInstance();
      const isProduction = ext.isProductionMode;
      const expressApp = express();
      expressApp.use(cors())
      expressApp.use(express.json())
        
      if (Endpoints) {
        for (const endpoint of Endpoints) {
          if (endpoint.handler)
            endpoint.handler(expressApp);
        }
      }

      LocalServer.server = expressApp.listen(isProduction ? 0 : (process.env.API_DEV_PORT || 3001), () => {
        LocalServer.apiPort = (LocalServer.server?.address() as AddressInfo)?.port;

        Logger.info(`> Server ready on http://localhost:${LocalServer.apiPort}`);

        resolve(null);
      });
    });
  }

  public static async stop() {
    if (LocalServer.server) {
      LocalServer.server.close();
      LocalServer.server = null;
      LocalServer.apiPort = null;
    }
  }
}