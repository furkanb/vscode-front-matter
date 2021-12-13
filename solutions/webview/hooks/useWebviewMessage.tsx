import { useState, useEffect } from 'react';

export default function useWebviewMessage() {
  const [message, setMessage] = useState<any>(null);

  // Event listener for all incoming messages
  const msgHandler = (ev: MessageEvent<any>) => {
    if (ev.data.receiver === 'webview') {
      setMessage(ev.data.message);
    }
  };

  // Pass keys to the vscode extension
  const keyHandler = (ev: KeyboardEvent) => {
    const t = {
      altKey: ev.altKey,
      code: ev.code,
      ctrlKey: ev.ctrlKey,
      isComposing: ev.isComposing,
      key: ev.key,
      location: ev.location,
      metaKey: ev.metaKey,
      repeat: ev.repeat,
      shiftKey: ev.shiftKey
    };

    window.parent.postMessage({
      type: "keydown",
      event: t
    }, "*");
  };

  // Handle mouse clicks for the vscode extension
  const mouseHandler = (ev: MouseEvent) => {
    let eventTarget: HTMLElement | null = ev.target as HTMLElement;
    do {
      if (eventTarget) {
        if (eventTarget.localName === "a" && (eventTarget as HTMLAnchorElement).target === "_blank") {
          return void window.parent.postMessage({
            type: "link-click",
            href: (eventTarget as HTMLAnchorElement).href
          }, "*");
        }
        eventTarget = eventTarget.parentElement;
      }
    } while(!!eventTarget?.parentElement);
  }

  // Send messages to the webview
  const sendMessage = (msg: any, receiver: string = "vscode") => {
    parent.postMessage({
      type: "message",
      message: msg,
      receiver
    }, "*");
  };

  useEffect(() => {
    window.addEventListener("message", msgHandler);
    window.document.addEventListener("keydown", keyHandler);
    window.document.addEventListener("click", mouseHandler);

    return () => {
      window.removeEventListener("message", msgHandler);
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("click", mouseHandler);
    }
  }, []);

  return {
    message,
    sendMessage
  };
}