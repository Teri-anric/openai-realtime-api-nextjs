import {
  app,
  BrowserWindow,
  ipcMain,
  clipboard,
  globalShortcut,
} from "electron";
import * as path from "path";
import { format as formatUrl } from "url";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const isDevelopment = process.env.NODE_ENV !== "production";

let mainWindow: BrowserWindow | null;

function createMainWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
    frame: true,
  });

  if (isDevelopment) {
    setTimeout(() => {
      window.loadURL("http://localhost:3000");
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

// Add a helper function for command execution with logging
async function execWithLogging(
  command: string,
  context: string
): Promise<{ stdout: string; stderr: string }> {
  console.log(`[${context}] Executing command: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(`[${context}] stdout:`, stdout.trim());
    if (stderr) console.warn(`[${context}] stderr:`, stderr.trim());
    return { stdout, stderr };
  } catch (error) {
    console.error(`[${context}] Command failed:`, error);
    throw error;
  }
}

// Add helper function to try different Spotify launch methods
async function tryLaunchSpotify(context: string): Promise<boolean> {
  console.log(
    `[${context}] Attempting to launch Spotify using different methods...`
  );

  // Try methods in sequence
  const methods = [
    {
      name: "flatpak",
      cmd: "flatpak run com.spotify.Client",
      check: async () => {
        try {
          await execWithLogging("flatpak list | grep spotify", context);
          return true;
        } catch {
          return false;
        }
      },
    },
    {
      name: "snap",
      cmd: "snap run spotify",
      check: async () => {
        try {
          await execWithLogging("snap list | grep spotify", context);
          return true;
        } catch {
          return false;
        }
      },
    },
    {
      name: "native",
      cmd: "spotify --no-zygote", // Try with --no-zygote to avoid GBM issues
      check: async () => {
        try {
          await execWithLogging("which spotify", context);
          return true;
        } catch {
          return false;
        }
      },
    },
  ];

  for (const method of methods) {
    if (await method.check()) {
      console.log(
        `[${context}] Found ${method.name} installation, attempting to launch...`
      );
      try {
        // Use spawn instead of exec for better process handling
        const process = spawn(
          method.cmd.split(" ")[0],
          method.cmd.split(" ").slice(1),
          {
            detached: true,
            stdio: "ignore",
          }
        );

        process.unref(); // Detach from parent process

        // Wait a bit and check if process is running
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const { stdout } = await execWithLogging("pidof spotify", context);
          console.log(
            `[${context}] Successfully launched using ${method.name}, PID:`,
            stdout.trim()
          );
          return true;
        } catch (error) {
          console.error(
            `[${context}] Process check failed after ${method.name} launch:`,
            error
          );
        }
      } catch (error) {
        console.error(
          `[${context}] Failed to launch using ${method.name}:`,
          error
        );
      }
    }
  }

  console.error(`[${context}] All launch methods failed`);
  return false;
}

// Handle system operations for music control
ipcMain.handle("system:test", () => {
  return new Promise((resolve) => {
    exec('echo "Test from Electron"', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        resolve({ success: false, error: error.message });
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Output: ${stdout}`);
      resolve({ success: true, output: stdout });
    });
  });
});

ipcMain.handle("system:openSpotify", () => {
  return new Promise((resolve) => {
    // Use spawn with shell option to handle the command better
    const spotify = spawn("spotify", [], {
      detached: true,
      stdio: "ignore",
      shell: true,
      env: {
        ...process.env,
        DISPLAY: process.env.DISPLAY || ":0", // Ensure X11 display is set
      },
    });

    spotify.on("error", (error) => {
      console.error("Failed to start Spotify:", error);
      resolve({ success: false, error: error.message });
    });

    // Detach from parent process
    spotify.unref();

    // Wait a bit to check if process started
    setTimeout(async () => {
      try {
        const { stdout } = await execAsync("pidof spotify");
        console.log("Spotify started, PID:", stdout.trim());
        resolve({ success: true });
      } catch (error) {
        console.error("Failed to verify Spotify process:", error);
        resolve({
          success: false,
          error: "Failed to verify if Spotify started",
        });
      }
    }, 1000);
  });
});

ipcMain.handle("system:controlMusic", (_, action: "play" | "pause") => {
  return new Promise((resolve) => {
    const command =
      "dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.PlayPause";
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        resolve({ success: false, error: error.message });
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Output: ${stdout}`);
      resolve({ success: true });
    });
  });
});

ipcMain.handle("system:adjustVolume", (_, percentage: number) => {
  return new Promise((resolve) => {
    // Convert percentage to decimal (0-1 range)
    const volume = Math.min(Math.max(percentage, 0), 100) / 100;

    // Use D-Bus to set Spotify's volume specifically with correct variant syntax
    const command = `dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Set string:"org.mpris.MediaPlayer2.Player" string:"Volume" variant:double:${volume}`;

    console.log(`[Volume] Executing command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        resolve({ success: false, error: error.message });
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Output: ${stdout}`);
      resolve({ success: true });
    });
  });
});

ipcMain.handle("system:adjustSystemVolume", (_, percentage: number) => {
  return new Promise((resolve) => {
    // Format volume value as a percentage
    const command = `wpctl set-volume @DEFAULT_AUDIO_SINK@ ${percentage}%`;

    console.log(`[SystemVolume] Executing command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        resolve({ success: false, error: error.message });
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Output: ${stdout}`);
      resolve({ success: true });
    });
  });
});
