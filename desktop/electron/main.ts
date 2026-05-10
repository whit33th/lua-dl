import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  session,
  shell,
} from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log/main";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { addDefenderExclusion } from "./defender-exclusions";
import { GoSessionManager } from "./go-session";
import { getAppIndexPath } from "./paths";
import type { StartOptions } from "./ipc-contract";

let mainWindow: BrowserWindow | undefined;
let sessions: GoSessionManager | undefined;

log.initialize();

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

app.on("second-instance", () => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    },
  );

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icons/win/icon.ico")
    : path.join(app.getAppPath(), "resources/icons/win/icon.ico");

  mainWindow = new BrowserWindow({
    title: "lua-dl",
    icon: iconPath,
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    maxWidth: 1920,
    maxHeight: 1080,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      plugins: true,
    },
  });

  sessions = new GoSessionManager(mainWindow);
  registerIpcHandlers(sessions);
  setupAutoUpdater(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const current = mainWindow?.webContents.getURL();
    if (current && url !== current) {
      event.preventDefault();
    }
  });

  if (!app.isPackaged && process.env.NODE_ENV === "development") {
    await mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadFile(getAppIndexPath());
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void app.whenReady();
  }
});

app.on("before-quit", () => {
  sessions?.killAll();
});

function registerIpcHandlers(manager: GoSessionManager) {
  ipcMain.handle(
    "go:start",
    (_event, args: unknown, options: StartOptions = {}) => {
      assertArgs(args);
      return manager.start(args, sanitizeStartOptions(options));
    },
  );

  ipcMain.handle("go:write", (_event, sessionId: unknown, input: unknown) => {
    if (typeof sessionId !== "string" || typeof input !== "string") {
      throw new Error("Invalid go:write payload.");
    }
    manager.write(sessionId, input);
  });

  ipcMain.handle("go:kill", (_event, sessionId: unknown) => {
    if (typeof sessionId !== "string") {
      throw new Error("Invalid go:kill payload.");
    }
    manager.kill(sessionId);
  });

  ipcMain.handle("dialog:choose-directory", async () => {
    const result = await dialog.showOpenDialog({
      title: "Choose download folder",
      properties: ["openDirectory", "createDirectory"],
    });
    return {
      canceled: result.canceled,
      path: result.filePaths[0],
    };
  });

  ipcMain.handle("fs:ensure-directory", async (_event, value: unknown) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error("Directory path must be a non-empty string.");
    }
    if (value.includes("\0")) {
      throw new Error("Directory path cannot contain null bytes.");
    }

    const directoryPath = path.resolve(value);
    const existing = await stat(directoryPath).catch(() => undefined);
    if (existing?.isDirectory()) {
      return { status: "exists", path: directoryPath };
    }
    if (existing) {
      throw new Error(`Path exists but is not a folder: ${directoryPath}`);
    }

    await dialog.showMessageBox({
      type: "warning",
      buttons: ["Recreate folder"],
      defaultId: 0,
      title: "Games folder was not found",
      message: "The games folder was deleted or moved.",
      detail: `lua-dl will recreate it now:\n\n${directoryPath}`,
    });

    await mkdir(directoryPath, { recursive: true });
    return { status: "created", path: directoryPath };
  });

  ipcMain.handle("shell:open-folder", async (_event, value: unknown) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error("Folder path must be a non-empty string.");
    }
    if (value.includes("\0")) {
      throw new Error("Folder path cannot contain null bytes.");
    }

    await shell.openPath(path.resolve(value));
  });

  ipcMain.handle(
    "security:add-defender-exclusion",
    async (_event, value: unknown) => {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("Defender exclusion path must be a non-empty string.");
      }

      const explanation = await dialog.showMessageBox({
        type: "info",
        buttons: ["Continue", "Cancel"],
        defaultId: 0,
        cancelId: 1,
        title: "Why Windows Defender may ask for confirmation",
        message: "Before adding this folder to Windows Defender exclusions",
        detail:
          "Some game files may look suspicious to Windows Defender because they are new or not officially signed by the original developer.\n\n" +
          "This is normal — the files are safe. Windows will now ask you to confirm adding the game folder to exclusions so the installation can finish without problems.",
      });

      if (explanation.response !== 0) {
        return {
          status: "skipped",
          path: value,
          message: "User canceled Windows Defender explanation.",
        };
      }

      const result = await dialog.showMessageBox({
        type: "question",
        buttons: ["Add exclusion", "Skip"],
        defaultId: 0,
        cancelId: 1,
        title: "Add Windows Defender exclusion?",
        message:
          "Allow lua-dl to add this folder to Windows Defender exclusions?",
        detail:
          `${value}\n\nWindows will show an administrator confirmation. ` +
          "This helps prevent Defender from deleting downloaded game files.",
      });

      if (result.response !== 0) {
        return {
          status: "skipped",
          path: value,
          message: "User skipped Windows Defender exclusion.",
        };
      }

      return addDefenderExclusion(value);
    },
  );
  // Window control handlers
  ipcMain.handle("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.handle("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle("window:close", () => {
    mainWindow?.close();
  });

  ipcMain.handle("update:check", async () => {
    await autoUpdater.checkForUpdates();
  });

  ipcMain.handle("update:download", async () => {
    await autoUpdater.downloadUpdate();
  });

  ipcMain.handle("update:install", () => {
    autoUpdater.quitAndInstall();
  });
}

function setupAutoUpdater(window: BrowserWindow) {
  autoUpdater.autoDownload = false; // We want manual confirmation
  autoUpdater.logger = log;

  autoUpdater.on("checking-for-update", () => {
    window.webContents.send("update:event", { type: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    window.webContents.send("update:event", {
      type: "available",
      version: info.version,
    });
  });

  autoUpdater.on("update-not-available", () => {
    window.webContents.send("update:event", { type: "not-available" });
  });

  autoUpdater.on("error", (err) => {
    window.webContents.send("update:event", {
      type: "error",
      message: err.message,
    });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    window.webContents.send("update:event", {
      type: "downloading",
      progress: progressObj.percent,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    window.webContents.send("update:event", {
      type: "downloaded",
      version: info.version,
    });
  });
}

function assertArgs(args: unknown): asserts args is string[] {
  if (
    !Array.isArray(args) ||
    !args.every((value) => typeof value === "string")
  ) {
    throw new Error("Command args must be an array of strings.");
  }
  if (args.length === 0) {
    throw new Error("Command args cannot be empty.");
  }
  if (args.some((arg) => arg.includes("\0"))) {
    throw new Error("Command args cannot contain null bytes.");
  }
}

function sanitizeStartOptions(options: StartOptions): StartOptions {
  return {
    cwd:
      typeof options.cwd === "string" && options.cwd.length > 0
        ? options.cwd
        : undefined,
    cols: typeof options.cols === "number" ? options.cols : undefined,
    rows: typeof options.rows === "number" ? options.rows : undefined,
    label: typeof options.label === "string" ? options.label : undefined,
  };
}
