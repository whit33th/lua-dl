"use client";

import { FolderOpen, Package, PackageCheck, Play, Square } from "lucide-react";

type DownloadToolbarProps = {
  canDownload: boolean;
  downloadAll: boolean;
  outputDir: string;
  isDownloading: boolean;
  onChooseDirectory(): void;
  onDownloadAllChange(value: boolean): void;
  onDownload(): void;
  onStop?(): void;
};

export function DownloadToolbar({
  canDownload,
  downloadAll,
  outputDir,
  isDownloading,
  onChooseDirectory,
  onDownloadAllChange,
  onDownload,
  onStop,
}: DownloadToolbarProps) {
  return (
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
            onChange={(event) => onDownloadAllChange(event.target.checked)}
          />
          {downloadAll ? <PackageCheck size={18} /> : <Package size={18} />}
        </label>

        <button
          className="border-line text-text flex size-10 cursor-pointer items-center justify-center rounded-lg border bg-black/50 opacity-80 transition-[opacity,background-color,border-color] hover:bg-black/80 hover:opacity-100"
          type="button"
          title={outputDir || "Default folder"}
          onClick={onChooseDirectory}
        >
          <FolderOpen size={18} />
        </button>
      </div>

      {isDownloading ? (
        <div className="flex gap-2">
          <button
            className="border-line flex size-10 cursor-pointer items-center justify-center rounded-lg border bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
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
          onClick={onDownload}
        >
          <Play
            size={16}
            aria-hidden="true"
            className="fill-black text-black"
          />
          Start
        </button>
      )}
    </div>
  );
}
