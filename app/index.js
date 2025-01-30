"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const url_1 = require("url");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const isDevelopment = process.env.NODE_ENV !== "production";
let mainWindow;
function createMainWindow() {
    const window = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });
    if (isDevelopment) {
        // Wait a bit before loading URL to ensure dev server is ready
        setTimeout(() => {
            window.loadURL("http://localhost:3000");
            window.webContents.openDevTools();
        }, 1000);
    }
    else {
        window.loadURL((0, url_1.format)({
            pathname: path.join(__dirname, "../renderer/out/index.html"),
            protocol: "file",
            slashes: true,
        }));
    }
    window.on("closed", () => {
        mainWindow = null;
    });
    return window;
}
// Handle errors
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (mainWindow === null) {
        mainWindow = createMainWindow();
    }
});
// Create main BrowserWindow when electron is ready
electron_1.app.on("ready", () => {
    mainWindow = createMainWindow();
});
// Function to simulate keyboard actions
async function simulateKeyPress(key) {
    if (process.platform === "linux") {
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await execAsync(`xdotool key ${key}`);
        }
        catch (error) {
            console.error("Failed to simulate key press:", error);
        }
    }
}
// Function to simulate paste keystroke
async function simulatePaste() {
    if (process.platform === "linux") {
        try {
            // Increase delay to 500ms to ensure window focus
            await new Promise((resolve) => setTimeout(resolve, 500));
            await execAsync("xdotool key ctrl+v");
        }
        catch (error) {
            console.error("Failed to simulate paste:", error);
        }
    }
}
// Handle keyboard operations
electron_1.ipcMain.handle("keyboard:pressEnter", async () => {
    try {
        await simulateKeyPress("Return");
        return { success: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, error: errorMessage };
    }
});
// Handle clipboard operations
electron_1.ipcMain.handle("clipboard:write", async (_, text) => {
    try {
        electron_1.clipboard.writeText(text);
        return { success: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, error: errorMessage };
    }
});
electron_1.ipcMain.handle("clipboard:writeAndPaste", async (_, text) => {
    try {
        electron_1.clipboard.writeText(text);
        // Wait a bit to ensure the text is in clipboard
        await new Promise((resolve) => setTimeout(resolve, 100));
        await simulatePaste();
        return { success: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, error: errorMessage };
    }
});
electron_1.ipcMain.handle("clipboard:writeAndEnter", async (_, text) => {
    try {
        electron_1.clipboard.writeText(text);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await simulatePaste();
        await new Promise((resolve) => setTimeout(resolve, 100));
        await simulateKeyPress("Return");
        return { success: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, error: errorMessage };
    }
});
electron_1.ipcMain.handle("clipboard:read", async () => {
    try {
        const text = electron_1.clipboard.readText();
        return { success: true, text };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, error: errorMessage };
    }
});
//# sourceMappingURL=index.js.map