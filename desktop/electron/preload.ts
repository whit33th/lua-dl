import { contextBridge, ipcRenderer } from "electron";
import type { CliEvent, StartOptions } from "./ipc-contract";

contextBridge.exposeInMainWorld("luaDl", {
  start: (args: string[], options?: StartOptions) =>
    ipcRenderer.invoke("go:start", args, options),
  write: (sessionId: string, input: string) =>
    ipcRenderer.invoke("go:write", sessionId, input),
  kill: (sessionId: string) => ipcRenderer.invoke("go:kill", sessionId),
  chooseDirectory: () => ipcRenderer.invoke("dialog:choose-directory"),
  addDefenderExclusion: (path: string) =>
    ipcRenderer.invoke("security:add-defender-exclusion", path),
  ensureDirectory: (path: string) =>
    ipcRenderer.invoke("fs:ensure-directory", path),
  openFolder: (path: string) => ipcRenderer.invoke("shell:open-folder", path),
  onEvent: (callback: (event: CliEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: CliEvent) =>
      callback(payload);
    ipcRenderer.on("go:event", listener);
    return () => ipcRenderer.off("go:event", listener);
  },
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  onUpdateEvent: (callback: (event: any) => void) => {
    const listener = (_event: any, payload: any) => callback(payload);
    ipcRenderer.on("update:event", listener);
    return () => ipcRenderer.off("update:event", listener);
  },
});

contextBridge.exposeInMainWorld("api", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
});
