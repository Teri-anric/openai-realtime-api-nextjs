import {
  app,
  BrowserWindow,
  ipcMain,
  clipboard,
  globalShortcut,
} from "electron";
import * as path from "path";
import { format as formatUrl } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const isDevelopment = process.env.NODE_ENV !== "production";

let mainWindow: BrowserWindow | null;

function createMainWindow() {
  const window = new BrowserWindow({
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
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, "../renderer/out/index.html"),
        protocol: "file",
        slashes: true,
      })
    );
  }

  window.on("closed", () => {
    mainWindow = null;
  });

  return window;
}

// Handle errors
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// Create main BrowserWindow when electron is ready
app.on("ready", () => {
  mainWindow = createMainWindow();
});

// Function to simulate keyboard actions
async function simulateKeyPress(key: string) {
  if (process.platform === "linux") {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await execAsync(`xdotool key ${key}`);
    } catch (error) {
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
    } catch (error) {
      console.error("Failed to simulate paste:", error);
    }
  }
}

// Handle keyboard operations
ipcMain.handle("keyboard:pressEnter", async () => {
  try {
    await simulateKeyPress("Return");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
});

// Handle clipboard operations
ipcMain.handle("clipboard:write", async (_, text: string) => {
  try {
    clipboard.writeText(text);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle("clipboard:writeAndPaste", async (_, text: string) => {
  try {
    clipboard.writeText(text);
    // Wait a bit to ensure the text is in clipboard
    await new Promise((resolve) => setTimeout(resolve, 100));
    await simulatePaste();
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle("clipboard:writeAndEnter", async (_, text: string) => {
  try {
    clipboard.writeText(text);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await simulatePaste();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await simulateKeyPress("Return");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle("clipboard:read", async () => {
  try {
    const text = clipboard.readText();
    return { success: true, text };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
});
