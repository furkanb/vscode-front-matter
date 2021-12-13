import { Extension } from "./Extension";


export class WebViewHelper {


  public static getContents(port: number | null, viewType: string): string {
    const IS_OSX = process.platform === "darwin";
    
    const isProduction = Extension.getInstance().isProductionMode;
    const localUrl = `http://localhost:${isProduction ? port : (process.env.SITE_DEV_PORT || 3000)}`;

    const ext = Extension.getInstance();
    const version = ext.getVersion();

    const csp = [
      `default-src 'none'`,
      `frame-src ${localUrl}`,
      `style-src ${localUrl} 'self' 'unsafe-inline'`,
      `script-src ${localUrl} 'self' 'unsafe-inline'`,
      `connect-src https://o1022172.ingest.sentry.io ${localUrl} 'self'`,
      `img-src https://api.visitorbadge.io ${localUrl} 'self'`,
    ];

    return `
      <!DOCTYPE html>
      <html lang="en" style="width:100%;height:100%;margin:0;padding:0;">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="${csp.join(`; `)}">
        </head>
        <body style="width:100%;height:100%;margin:0;padding:0;">

          <iframe id="main__frame" src="${localUrl}" style="width:100%;height:100%;margin:0;padding:0;border:0;"></iframe>

          <script>
            (() => {
              const vscode = acquireVsCodeApi();
              let iframe = document.querySelector('iframe#main__frame');

              window.onfocus = iframe.onload = function() {
                setTimeout(function() {
                  document.querySelector('iframe#main__frame').contentWindow.focus();
                }, 100);
              };

              window.addEventListener("message", (e) => {
                const data = e.data;

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
                } else if (data.type === "message" && data.receiver === 'vscode' && e.data.message) {
                  vscode.postMessage(e.data.message);
                } else if (data.type === "message" && data.receiver === 'webview') {
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