"use client";

import { Activity, CheckCircle2, CircleAlert } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Border } from "./SkinCard";

export function ProgressPanel() {
  const mode = useAppStore((state) => state.mode);
  const cli = useAppStore((state) => state.cli);
  const progress = cli.progress;
  const percent = Math.max(
    0,
    Math.min(100, progress?.percent ?? (mode === "finished" ? 100 : 0)),
  );
  const statusIcon =
    mode === "failed" ? (
      <CircleAlert size={19} aria-hidden="true" />
    ) : mode === "finished" ? (
      <CheckCircle2 size={19} aria-hidden="true" />
    ) : (
      <Activity size={19} aria-hidden="true" />
    );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 id="progress-title" className="m-0 text-xl font-bold text-text truncate">
            {cli.phase ??   "Status"}
          </h2>
          <div
            className="flex items-center gap-1.5 text-muted text-sm capitalize"
            data-mode={mode}
          >
            {statusIcon}
            <span>{mode}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold uppercase text-dim">Progress</span>
            <span className="text-sm font-bold text-text">{percent.toFixed(1)}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-black/40 border border-line/50"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span
              className="block h-full bg-text transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 mt-2">
          <div className="flex items-center justify-between p-3 border border-line rounded-xl bg-black/20 backdrop-blur-sm transition-colors hover:bg-black/30">
            <span className="text-[10px] font-bold uppercase text-dim">Speed</span>
            <span className="text-sm font-bold text-text">
              {progress?.mbps ? `${progress.mbps.toFixed(1)} MB/s` : "0.0 MB/s"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 border border-line rounded-xl bg-black/20 backdrop-blur-sm transition-colors hover:bg-black/30">
            <span className="text-[10px] font-bold uppercase text-dim">Files</span>
            <span className="text-sm font-bold text-text">
              {progress?.filesTotal
                ? `${progress.filesDone} / ${progress.filesTotal}`
                : "0 / 0"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 border border-line rounded-xl bg-black/20 backdrop-blur-sm transition-colors hover:bg-black/30">
            <span className="text-[10px] font-bold uppercase text-dim">Downloaded</span>
            <span className="text-sm font-bold text-text">
              {progress?.totalMb
                ? `${progress.downloadedMb?.toFixed(1)} / ${progress.totalMb.toFixed(1)} MB`
                : "0 MB"}
            </span>
          </div>
        </div>
      </div>

      {cli.doneMessage ? (
        <div className="mt-auto p-3 border border-line bg-white/5 text-xs text-text/80 leading-relaxed">
          {cli.doneMessage}
        </div>
      ) : null}
    </div>
  );
}
