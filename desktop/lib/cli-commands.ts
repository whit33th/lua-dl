import type { DesktopSettings } from "./store";

export type DownloadCommandOptions = {
  appId: string;
  downloadAll: boolean;
  selectedDepotIds: string[];
  settings: Pick<DesktopSettings, "outputDir" | "verbose">;
};

export function buildProbeCommand(
  appId: string,
  settings: Pick<DesktopSettings, "verbose">,
) {
  return ["probe", appId, ...(settings.verbose ? ["-v"] : [])];
}

export function buildDownloadCommand({
  appId,
  downloadAll,
  selectedDepotIds,
  settings,
}: DownloadCommandOptions) {
  const args = ["download", appId];

  if (downloadAll) {
    args.push("--all");
  } else if (selectedDepotIds.length > 0) {
    args.push("--depots", selectedDepotIds.join(","));
  }

  if (settings.outputDir) {
    args.push("--out", settings.outputDir);
  }

  if (settings.verbose) {
    args.push("-v");
  }

  return args;
}
