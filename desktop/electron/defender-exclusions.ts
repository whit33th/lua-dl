import { app } from "electron";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type DefenderExclusionResult =
  | { status: "added"; path: string }
  | { status: "skipped"; path: string; message: string }
  | { status: "unsupported"; path: string; message: string }
  | { status: "failed"; path: string; message: string };

export async function addDefenderExclusion(
  targetPath: string,
): Promise<DefenderExclusionResult> {
  const normalizedPath = validateExclusionPath(targetPath);

  if (process.platform !== "win32") {
    return {
      status: "unsupported",
      path: normalizedPath,
      message: "Windows Defender exclusions are only supported on Windows.",
    };
  }

  await mkdir(normalizedPath, { recursive: true });

  const scriptPath = path.join(
    app.getPath("temp"),
    `lua-dl-defender-exclusion-${Date.now()}.ps1`,
  );
  const script = `Add-MpPreference -ExclusionPath ${toPowerShellString(normalizedPath)}\n`;

  try {
    await writeFile(scriptPath, script, "utf8");
    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Start-Process -FilePath powershell.exe -Verb RunAs -Wait -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',${toPowerShellString(scriptPath)})`,
    ]);

    return { status: "added", path: normalizedPath };
  } catch (error) {
    return {
      status: "failed",
      path: normalizedPath,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await unlink(scriptPath).catch(() => undefined);
  }
}

function validateExclusionPath(targetPath: string) {
  if (typeof targetPath !== "string" || targetPath.trim().length === 0) {
    throw new Error("Defender exclusion path cannot be empty.");
  }
  if (targetPath.includes("\0")) {
    throw new Error("Defender exclusion path cannot contain null bytes.");
  }

  const normalizedPath = path.resolve(targetPath);
  if (!path.isAbsolute(normalizedPath)) {
    throw new Error("Defender exclusion path must be absolute.");
  }
  return normalizedPath;
}

function toPowerShellString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}
