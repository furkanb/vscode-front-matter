import { Dashboard } from './../commands/Dashboard';
import { LocalServer } from ".";
import { Extension } from "./Extension";
import { env, Uri } from "vscode";
import { DashboardCommand } from '@frontmatter/common';


export class LocalClientSide {


  public static async getContents(port: number | null, viewType: string): Promise<string> {
    const IS_OSX = process.platform === "darwin";
    
    const isProduction = Extension.getInstance().isProductionMode;
    const apiPort = isProduction ? port : (process.env.SITE_DEV_PORT || 3000);
    const localUrl = `http://localhost:${apiPort}`;

    const ext = Extension.getInstance();
    const version = ext.getVersion();

    const cspSource = Dashboard.getWebview()?.cspSource;

    const fullWebServerUri = await env.asExternalUri(Uri.parse(`http://localhost:${apiPort}`));

    const csp = [
      `default-src 'none';`,
      `frame-src ${fullWebServerUri} ${cspSource} https:;`,
      `style-src ${cspSource} ${cspSource} 'self' 'unsafe-inline'`,
      `script-src ${cspSource} 'self' 'unsafe-inline'`,
      `connect-src https://o1022172.ingest.sentry.io ${localUrl} 'self'`,
      `img-src https://api.visitorbadge.io ${localUrl} 'self' ${cspSource}`
    ];

    return `
      <!DOCTYPE html>
      <html lang="en" style="width:100%;height:100%;margin:0;padding:0;z-index:9999;">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="${csp.join(`; `)}">
        </head>
        <body style="width:100%;height:100%;margin:0;padding:0;">

          <iframe id="main__frame" src="${fullWebServerUri}" style="width:100%;height:100%;margin:0;padding:0;border:0;" sandbox="allow-scripts allow-same-origin"></iframe>
          
          <script>
            (() => {
              const vscode = acquireVsCodeApi();
              let iframe = document.querySelector('iframe#main__frame');

              window.addEventListener('dragenter', (ev) => {
                ev.preventDefault();
                document.querySelector('iframe#main__frame').contentWindow.postMessage({
                  type: 'message',
                  receiver: 'webview',
                  command: '${DashboardCommand.dragEnter}'
                }, '*'); 
              });

              window.addEventListener('dragover', (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                if (ev?.dataTransfer?.files?.length > 0) {
                  try {
                    ev.dataTransfer.dropEffect = 'copy';
                  } catch {}
                }
              });

              window.addEventListener('dragleave', (ev) => {
                document.querySelector('iframe#main__frame').contentWindow.postMessage({
                  type: 'message',
                  receiver: 'webview',
                  command: '${DashboardCommand.dragLeave}'
                }, '*'); 
              });

              window.addEventListener('drop', (ev) => {
                ev.preventDefault();

                const items = [];
                if (ev.dataTransfer.items) {
                  // Use DataTransferItemList interface to access the file(s)
                  for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                    const file = ev.dataTransfer.items[i];

                    if (!file.type.match('image/*')) {
                      continue;
                    }

                    // If dropped items aren't files, reject them
                    if (file.kind === 'file') {
                      const file = ev.dataTransfer.items[i].getAsFile();
                      items.push(file);
                    }
                  }
                } else {
                  // Use DataTransfer interface to access the file(s)
                  for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                    const file = file[' + i + '];
                    
                    if (!file.type.match('image/*')) {
                      continue;
                    }

                    items.push();
                  }
                }
                for (const item of items) {
                  const reader = new FileReader();
                  
                  reader.onload = () => {
                    const contents = reader.result;
                    
                    document.querySelector('iframe#main__frame').contentWindow.postMessage({
                      type: 'message',
                      receiver: 'webview',
                      command: '${DashboardCommand.dragDrop}',
                      message: {
                        item: {
                          fileName: item.name,
                          contents
                        }
                      }
                    }, '*'); 
                  };
            
                  reader.readAsDataURL(item)
                }
              }, false);

              window.onfocus = iframe.onload = function() {
                setTimeout(function() {
                  document.querySelector('iframe#main__frame').contentWindow.focus();
                }, 100);
              };

              window.addEventListener("message", (e) => {
                const data = e.data;

                if (${!isProduction} && data.type !== "keydown") {
                  console.log(data);
                }

                if (data.type === "keydown") {
                  if (${IS_OSX}) {
                    window.dispatchEvent(new KeyboardEvent('keydown', data.event));
                  }
                } else if (data.type === "link-click") { 
                  let tempRef = document.createElement("a");
                  tempRef.setAttribute("href", data.href);
                  main__frame.appendChild(tempRef);
                  tempRef.click();
                  tempRef.parentNode.removeChild(tempRef);
                } else if (data.type === "message" && data.receiver === "api") {
                  document.querySelector('iframe#main__frame').contentWindow.postMessage({
                    type: 'message',
                    receiver: 'webview',
                    message: {
                      apiPort: ${LocalServer.apiPort}
                    }
                  }, '*'); 
                } else if (data.type === "message" && data.receiver === 'vscode' && e.data.message) {
                  vscode.postMessage(e.data.message);
                } else if (data.type === "message" && data.command) {
                  document.querySelector('iframe#main__frame').contentWindow.postMessage({...e.data}, '*'); 
                } else {
                  // I'm just going ignore it
                }
              }, false);
            })();
          </script>

          <img style="display:none" src="https://api.visitorbadge.io/api/combined?user=estruyf&repo=frontmatter-usage&countColor=%23263759&slug=${`${viewType}-${version.installedVersion}`}" alt="Daily usage" />
        </body>
      </html>
    `;
  }
}