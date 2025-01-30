import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  clipboard: {
    writeText: (text: string) => ipcRenderer.invoke("clipboard:write", text),
    writeAndPaste: (text: string) =>
      ipcRenderer.invoke("clipboard:writeAndPaste", text),
    writeAndEnter: (text: string) =>
      ipcRenderer.invoke("clipboard:writeAndEnter", text),
    readText: () => ipcRenderer.invoke("clipboard:read"),
  },
  keyboard: {
    pressEnter: () => ipcRenderer.invoke("keyboard:pressEnter"),
  },
});
