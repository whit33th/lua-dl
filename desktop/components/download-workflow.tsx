"use client";

import {
  CheckCircle2,
  FolderOpen,
  Globe2,
  HardDrive,
  Package,
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
      className="border border-line relative flex-1 h-full bg-panel shadow-lg p-5"
      aria-labelledby="download-title"
    >
      <Border />
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="m-0 mb-1.5 text-dim text-xs font-bold uppercase">
            Download
          </p>
          <h2 id="download-title" className="m-0 text-2xl font-bold">
            Package options
          </h2>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2.25 bg-text text-panel-strong hover:-translate-y-0.5 transition-transform border border-line-strong rounded-4xl px-4 py-2.75 font-bold disabled:cursor-not-allowed disabled:opacity-42"
          type="button"
          disabled={!canDownload}
          onClick={() => void onDownload(buildDownloadArgs())}
        >
          <Play size={17} aria-hidden="true" />
          Start
        </button>
      </div>

      <div className="grid grid-cols-[minmax(180px,240px)_minmax(0,1fr)] gap-3 my-5">
        <label className="flex items-center gap-3 min-h-14.5 border border-line  bg-black p-3">
          <input
            type="checkbox"
            checked={downloadAll}
            onChange={(event) => setDownloadAll(event.target.checked)}
          />
          <span>
            <strong className="block text-sm">All optional content</strong>
            <small className="block text-muted text-xs mt-0.75">
              Includes every language and DLC
            </small>
          </span>
        </label>

        <button
          className="w-full flex items-center gap-3 min-h-14.5 border border-line  bg-black p-3 text-left text-text transition-all hover:border-text hover:-translate-y-0.5"
          type="button"
          onClick={chooseDirectory}
        >
          <FolderOpen size={18} aria-hidden="true" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {settings.outputDir || "Default folder"}
          </span>
        </button>
      </div>

      <div className="max-h-65 overflow-auto pr-1" aria-label="Depot selection">
        {cli.depots.length === 0
          ? null
          : cli.depots.map((depot) => (
              <label
                className="flex items-center gap-3 min-h-14.5 border border-line rounded-4xl bg-black p-3 transition-all mb-2 last:mb-0"
                key={depot.id}
                data-kind={depot.kind}
                style={{
                  opacity:
                    downloadAll || depot.kind === "core" || undefined
                      ? 1
                      : 0.55,
                }}
              >
                <input
                  type="checkbox"
                  className="w-4.5 h-4.5"
                  checked={
                    depot.kind === "core" || selectedDepots.includes(depot.id)
                  }
                  disabled={downloadAll || depot.kind === "core"}
                  onChange={() => toggleDepot(depot.id)}
                />
                <DepotIcon kind={depot.kind} />
                <span className="flex-1 min-w-0">
                  <strong className="block text-sm">{depot.name}</strong>
                  <small className="flex flex-wrap gap-1.75 items-center mt-0.75 text-muted text-xs">
                    <span className="inline-flex min-h-5 items-center border border-line-strong rounded-full px-2 py-0.25 text-text text-xs font-bold uppercase">
                      {depot.tag ?? "depot"}
                    </span>
                    <span className="text-dim">{depot.id}</span>
                    {depot.size ? (
                      <span className="text-dim">{depot.size}</span>
                    ) : null}
                    {depot.manifest ? (
                      <span className="text-dim">
                        manifest {depot.manifest}
                      </span>
                    ) : null}
                  </small>
                </span>
              </label>
            ))}
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
