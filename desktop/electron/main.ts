import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  session,
  shell,
} from "electron";
import log from "electron-log/main";
import path from "node:path";
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

  mainWindow = new BrowserWindow({
    title: "lua-dl",
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
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
