import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export function getGoExePath(): string {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, "bin", "lua-dl.exe")]
    : [
        path.join(app.getAppPath(), "resources", "bin", "lua-dl.exe"),
        path.join(app.getAppPath(), "..", "lua-dl.exe"),
      ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      `lua-dl.exe was not found. Expected one of: ${candidates.join(", ")}. Run npm run build:go from desktop.`,
    );
  }

  return found;
}

export function getAppIndexPath(): string {
  return path.join(app.getAppPath(), "out", "index.html");
}
