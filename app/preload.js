"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electron", {
    clipboard: {
        writeText: (text) => electron_1.ipcRenderer.invoke("clipboard:write", text),
        writeAndPaste: (text) => electron_1.ipcRenderer.invoke("clipboard:writeAndPaste", text),
        writeAndEnter: (text) => electron_1.ipcRenderer.invoke("clipboard:writeAndEnter", text),
        readText: () => electron_1.ipcRenderer.invoke("clipboard:read"),
    },
    keyboard: {
        pressEnter: () => electron_1.ipcRenderer.invoke("keyboard:pressEnter"),
    },
});
//# sourceMappingURL=preload.js.map