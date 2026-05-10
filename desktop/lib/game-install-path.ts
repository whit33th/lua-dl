const forbiddenWindowsPathChars = /[<>:"|?*\\/\x00-\x1f]/g;
const repeatedSpaces = /\s+/g;
const trailingDotsOrSpaces = /[. ]+$/g;
const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

export const gamesLibraryFolderName = "LuaDL Games";

export function buildGamesLibraryPath(parentFolder: string) {
  if (!parentFolder) {
    return "";
  }

  if (parentFolder.replace(/[\\/]+$/, "").endsWith(gamesLibraryFolderName)) {
    return parentFolder.replace(/[\\/]+$/, "");
  }

  return joinPath(parentFolder, gamesLibraryFolderName);
}

export function buildGameInstallPath(libraryRoot: string, gameName: string) {
  if (!libraryRoot) {
    return "";
  }

  return joinPath(libraryRoot, sanitizeGameFolderName(gameName));
}

export function sanitizeGameFolderName(name: string) {
  let sanitized = name
    .replace(forbiddenWindowsPathChars, "-")
    .replace(repeatedSpaces, " ")
    .replace(trailingDotsOrSpaces, "")
    .trim();

  if (!sanitized) {
    sanitized = "game";
  }

  if (reservedWindowsNames.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }

  if (sanitized.length > 120) {
    sanitized = sanitized.slice(0, 120).trimEnd();
  }

  return sanitized;
}

function joinPath(parent: string, child: string) {
  const separator = parent.includes("/") && !parent.includes("\\") ? "/" : "\\";
  return `${parent.replace(/[\\/]+$/, "")}${separator}${child}`;
}
