"use client";

import { useAppStore } from "@/lib/store";
import { Activity, CheckCircle2, CircleAlert } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

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
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2
            id="progress-title"
            className="text-text m-0 truncate text-xl font-bold"
          >
            Status
          </h2>
          <div
            className="text-muted flex items-center gap-1.5 text-sm capitalize"
            data-mode={mode}
          >
            {statusIcon}
            <span>{mode}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end justify-between">
            <span className="text-dim text-[10px] font-bold uppercase">
              Progress
            </span>
            <span className="text-text text-sm font-bold">
              {percent.toFixed(1)}%
            </span>
          </div>
          <div
            className="border-line/50 h-1.5 overflow-hidden rounded-full border bg-black/40"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span
              className="bg-text block h-full shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2">
          <div className="border-line flex items-center justify-between rounded-xl border bg-black/20 p-3 transition-colors hover:bg-black/30">
            <span className="text-dim text-[10px] font-bold uppercase">
              Speed
            </span>
            {mode === "probing" ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="text-text text-sm font-bold">
                {progress?.mbps
                  ? `${progress.mbps.toFixed(1)} MB/s`
                  : "0.0 MB/s"}
              </span>
            )}
          </div>

          <div className="border-line flex items-center justify-between rounded-xl border bg-black/20 p-3 transition-colors hover:bg-black/30">
            <span className="text-dim text-[10px] font-bold uppercase">
              Files
            </span>
            {mode === "probing" ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              <span className="text-text text-sm font-bold">
                {progress?.filesTotal
                  ? `${progress.filesDone} / ${progress.filesTotal}`
                  : "0 / 0"}
              </span>
            )}
          </div>

          <div className="border-line flex items-center justify-between rounded-xl border bg-black/20 p-3 transition-colors hover:bg-black/30">
            <span className="text-dim text-[10px] font-bold uppercase">
              Downloaded
            </span>
            {mode === "probing" ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <span className="text-text text-sm font-bold">
                {progress?.totalMb
                  ? `${progress.downloadedMb?.toFixed(1)} / ${progress.totalMb.toFixed(1)} MB`
                  : "0 MB"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* {cli.doneMessage ? (
        <div className="mt-auto p-3 border border-line bg-white/5 text-xs text-text/80 leading-relaxed">
          {cli.doneMessage}
        </div>
      ) : null} */}
    </div>
  );
}
