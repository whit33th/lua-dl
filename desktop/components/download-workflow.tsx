"use client";

import {
  CheckCircle2,
  FolderOpen,
  Globe2,
  HardDrive,
  Package,
  PackageCheck,
  Play,
  RotateCcw,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Border } from "./SkinCard";

type DownloadWorkflowProps = {
  onDownload(args: string[]): Promise<void>;
};

export function DownloadWorkflow({ onDownload }: DownloadWorkflowProps) {
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
      className="border border-line flex-1 h-full bg-panel-strong/40 backdrop-blur-sm p-5 relative overflow-hidden"
      aria-labelledby="download-title"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <label 
            className={`flex items-center justify-center w-10 h-10 border border-line rounded-lg bg-black/50 transition-all hover:bg-black/80 cursor-pointer ${downloadAll ? "text-text" : "text-dim opacity-50 hover:opacity-100"}`}
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
            className="flex items-center justify-center w-10 h-10 border border-line rounded-lg bg-black/50 text-text transition-all hover:bg-black/80 cursor-pointer"
            type="button"
            title={settings.outputDir || "Default folder"}
            onClick={chooseDirectory}
          >
            <FolderOpen size={18} />
          </button>
        </div>
        
        <button
          className="inline-flex items-center justify-center gap-2 bg-text text-panel-strong hover:-translate-y-0.5 transition-transform rounded-lg px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-42"
          type="button"
          disabled={!canDownload}
          onClick={() => void onDownload(buildDownloadArgs())}
        >
          <Play size={17} aria-hidden="true" />
          Start
        </button>
      </div>

      <div 
        className="max-h-[calc(100%-4rem)] overflow-y-auto pr-1 transition-all"
        style={{ opacity: downloadAll ? 0.4 : 1, pointerEvents: downloadAll ? 'none' : 'auto' }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-label="Depot selection">
          {cli.depots.length > 0 && cli.depots
            .filter(depot => depot.kind !== "core")
            .map((depot) => (
              <label
                className="flex flex-col items-start gap-2 border border-line rounded-xl bg-black/40 p-2.5 transition-all cursor-pointer hover:bg-black/60"
                key={depot.id}
                data-kind={depot.kind}
              >
                <div className="flex items-center justify-between w-full">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-text rounded"
                    checked={downloadAll || selectedDepots.includes(depot.id)}
                    disabled={downloadAll}
                    onChange={() => toggleDepot(depot.id)}
                  />
                  <DepotIcon kind={depot.kind} />
                </div>
                
                <div className="flex-1 w-full flex flex-col justify-end">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text/90">
                      {depot.tag ?? depot.kind ?? "depot"}
                    </span>
                    <span className="text-[9px] font-medium text-dim">
                      {depot.size ? depot.size : depot.id}
                    </span>
                  </div>
                </div>
              </label>
            ))}
        </div>
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
