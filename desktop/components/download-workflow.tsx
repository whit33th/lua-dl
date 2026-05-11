"use client";

import { buildDownloadCommand } from "@/lib/cli-commands";
import { useGamesLibrarySetup } from "@/hooks/use-games-library-setup";
import { buildGameInstallPath } from "@/lib/game-install-path";
import { useAppStore } from "@/lib/store";
import { DepotGrid } from "./depot-grid";
import { DownloadToolbar } from "./download-toolbar";

type DownloadWorkflowProps = {
  onDownload(args: string[], gameFolderPath: string): Promise<void>;
  onStop?(): void;
};

export function DownloadWorkflow({
  onDownload,
  onStop,
}: DownloadWorkflowProps) {
  const appId = useAppStore((state) => state.appId);
  const mode = useAppStore((state) => state.mode);
  const cli = useAppStore((state) => state.cli);
  const metadata = useAppStore((state) => state.metadata);
  const selectedDepots = useAppStore((state) => state.selectedDepots);
  const downloadAll = useAppStore((state) => state.downloadAll);
  const settings = useAppStore((state) => state.settings);
  const toggleDepot = useAppStore((state) => state.toggleDepot);
  const setDownloadAll = useAppStore((state) => state.setDownloadAll);
  const { chooseAndPrepareLibrary, isSelectingLibrary } =
    useGamesLibrarySetup();

  const canDownload =
    Boolean(appId) && mode !== "probing" && mode !== "downloading";

  async function chooseDirectory() {
    await chooseAndPrepareLibrary();
  }

  async function startDownload() {
    const gameInstallPath = buildGameInstallPath(
      settings.outputDir,
      metadata?.name ?? appId,
    );
    const downloadSettings = {
      ...settings,
      outputDir: gameInstallPath || settings.outputDir,
    };

    if (settings.outputDir) {
      await window.luaDl?.ensureDirectory(settings.outputDir);
    }

    void onDownload(
      buildDownloadCommand({
        appId,
        downloadAll,
        selectedDepotIds: selectedDepots,
        settings: downloadSettings,
      }),
      downloadSettings.outputDir,
    );
  }

  return (
    <section
      className="relative h-full flex-1 p-5"
      aria-labelledby="download-title"
    >
      <DownloadToolbar
        canDownload={canDownload}
        downloadAll={downloadAll}
        outputDir={settings.outputDir}
        isDownloading={mode === "downloading" || isSelectingLibrary}
        onChooseDirectory={chooseDirectory}
        onDownloadAllChange={setDownloadAll}
        onDownload={startDownload}
        onStop={onStop}
      />

      <DepotGrid
        depots={cli.depots}
        mode={mode}
        downloadAll={downloadAll}
        selectedDepots={selectedDepots}
        onToggleDepot={toggleDepot}
      />
    </section>
  );
}
