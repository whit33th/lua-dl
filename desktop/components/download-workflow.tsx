"use client";

import { useAppStore } from "@/lib/store";
import {
  CheckCircle2,
  FolderOpen,
  Globe2,
  HardDrive,
  Package,
  PackageCheck,
  Play,
  Square,
} from "lucide-react";

type DownloadWorkflowProps = {
  onDownload(args: string[]): Promise<void>;
  onStop?(): void;
};

export function DownloadWorkflow({
  onDownload,
  onStop,
}: DownloadWorkflowProps) {
  const appId = useAppStore((state) => state.appId);
  const mode = useAppStore((state) => state.mode);
  const cli = useAppStore((state) => state.cli);
  const selectedDepots = useAppStore((state) => state.selectedDepots);
  const downloadAll = useAppStore((state) => state.downloadAll);
  const settings = useAppStore((state) => state.settings);
  const toggleDepot = useAppStore((state) => state.toggleDepot);
  const setDownloadAll = useAppStore((state) => state.setDownloadAll);
  const setOutputDir = useAppStore((state) => state.setOutputDir);

  const canDownload =
    Boolean(appId) && mode !== "probing" && mode !== "downloading";

  async function chooseDirectory() {
    const result = await window.luaDl?.chooseDirectory();
    if (!result?.canceled && result?.path) {
      setOutputDir(result.path);
    }
  }

  function buildDownloadArgs() {
    const args = ["download", appId];
    if (downloadAll) {
      args.push("--all");
    } else if (selectedDepots.length > 0) {
      args.push("--depots", selectedDepots.join(","));
    } else {
      args.push("--depots", "0");
    }
    if (settings.outputDir) {
      args.push("--out", settings.outputDir);
    }
    if (settings.verbose) {
      args.push("-v");
    }
    return args;
  }

  return (
    <section
      className="relative h-full flex-1 p-5"
      aria-labelledby="download-title"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <label
            className={`border-line flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border bg-black/50 transition-[color,background-color,border-color,opacity] hover:bg-black/80 ${downloadAll ? "text-text" : "text-dim opacity-50 hover:opacity-100"}`}
            title="All optional content"
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={downloadAll}
              onChange={(event) => setDownloadAll(event.target.checked)}
            />
            {downloadAll ? <PackageCheck size={18} /> : <Package size={18} />}
          </label>

          <button
            className="border-line text-text flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border bg-black/50 opacity-80 transition-[opacity,background-color,border-color] hover:bg-black/80 hover:opacity-100"
            type="button"
            title={settings.outputDir || "Default folder"}
            onClick={chooseDirectory}
          >
            <FolderOpen size={18} />
          </button>
        </div>

        {mode === "downloading" ? (
          <div className="flex gap-2">
            <button
              className="border-line flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
              type="button"
              title="Stop"
              onClick={onStop}
            >
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        ) : (
          <button
            className="bg-text text-panel-strong inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-42"
            type="button"
            disabled={!canDownload}
            onClick={() => void onDownload(buildDownloadArgs())}
          >
            <Play size={17} aria-hidden="true" />
            Start
          </button>
        )}
      </div>

      <div
        className="relative max-h-[calc(100%-4rem)] overflow-y-auto pr-1 transition-opacity"
        style={{
          opacity: downloadAll ? 0.4 : 1,
          pointerEvents: downloadAll ? "none" : "auto",
        }}
      >
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          aria-label="Depot selection"
        >
          {cli.depots.length > 0 &&
            cli.depots
              .filter((depot) => depot.kind !== "core")
              .map((depot) => (
                <label
                  className="border-line flex cursor-pointer flex-col items-start gap-2 rounded-xl border bg-black/40 p-2.5 transition-[background-color,border-color] hover:bg-black/60"
                  key={depot.id}
                  data-kind={depot.kind}
                >
                  <div className="flex w-full items-center justify-between">
                    <input
                      type="checkbox"
                      className="accent-text h-4 w-4 rounded"
                      checked={downloadAll || selectedDepots.includes(depot.id)}
                      disabled={downloadAll}
                      onChange={() => toggleDepot(depot.id)}
                    />
                    <DepotIcon kind={depot.kind} />
                  </div>

                  <div className="flex w-full flex-1 flex-col justify-end">
                    <div className="flex w-full items-center justify-between">
                      <span className="text-text/90 text-[11px] font-bold tracking-wider uppercase">
                        {depot.tag ?? depot.kind ?? "depot"}
                      </span>
                      <span className="text-dim text-[9px] font-medium">
                        {depot.size ? depot.size : depot.id}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
        </div>
        <div className="sticky bottom-0 left-0 z-10 h-6 w-full bg-linear-to-t from-black to-transparent" />
      </div>
    </section>
  );
}

function DepotIcon({ kind }: { kind?: string }) {
  if (kind === "core") {
    return <HardDrive className="depot-icon" size={19} aria-hidden="true" />;
  }
  if (kind === "language") {
    return <Globe2 className="depot-icon" size={19} aria-hidden="true" />;
  }
  if (kind === "dlc") {
    return <Package className="depot-icon" size={19} aria-hidden="true" />;
  }
  return <CheckCircle2 className="depot-icon" size={19} aria-hidden="true" />;
}
