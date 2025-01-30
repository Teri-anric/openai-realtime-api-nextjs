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
    system: {
        test: () => electron_1.ipcRenderer.invoke("system:test"),
        openSpotify: () => electron_1.ipcRenderer.invoke("system:openSpotify"),
        controlMusic: (action) => electron_1.ipcRenderer.invoke("system:controlMusic", action),
        adjustVolume: (percentage) => electron_1.ipcRenderer.invoke("system:adjustVolume", percentage),
        adjustSystemVolume: (percentage) => electron_1.ipcRenderer.invoke("system:adjustSystemVolume", percentage),
    },
});
//# sourceMappingURL=preload.js.map