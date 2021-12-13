import { window } from "vscode";
import { Logger } from ".";
import { EXTENSION_NAME } from "@frontmatter/common";


export class Notifications {

  public static info(message: string, items?: any): Thenable<string> {
    if (!items) { Logger.info(`${message}`); }
    return window.showInformationMessage(`${EXTENSION_NAME}: ${message}`, items);
  }

  public static warning(message: string, items?: any): Thenable<string> {
    if (!items) { Logger.info(`${message}`); }
    return window.showWarningMessage(`${EXTENSION_NAME}: ${message}`, items);
  }

  public static error(message: string, items?: any): Thenable<string> {
    if (!items) { Logger.info(`${message}`); }
    return window.showErrorMessage(`${EXTENSION_NAME}: ${message}`, items);
  }
}