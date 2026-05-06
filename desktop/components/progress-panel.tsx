"use client";

import { useAppStore } from "@/lib/store";
import { Activity, CheckCircle2, CircleAlert, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProgressPanel() {
  const mode = useAppStore((state) => state.mode);
  const cli = useAppStore((state) => state.cli);
  const queue = useAppStore((state) => state.queue);
  const removeFromQueue = useAppStore((state) => state.removeFromQueue);

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
            <span className="text-text text-sm font-bold">
              {progress?.mbps ? `${progress.mbps.toFixed(1)} MB/s` : "0.0 MB/s"}
            </span>
          </div>

          <div className="border-line flex items-center justify-between rounded-xl border bg-black/20 p-3 transition-colors hover:bg-black/30">
            <span className="text-dim text-[10px] font-bold uppercase">
              Files
            </span>
            <span className="text-text text-sm font-bold">
              {progress?.filesTotal
                ? `${progress.filesDone} / ${progress.filesTotal}`
                : "0 / 0"}
            </span>
          </div>

          <div className="border-line flex items-center justify-between rounded-xl border bg-black/20 p-3 transition-colors hover:bg-black/30">
            <span className="text-dim text-[10px] font-bold uppercase">
              Downloaded
            </span>
            <span className="text-text text-sm font-bold">
              {progress?.totalMb
                ? `${progress.downloadedMb?.toFixed(1)} / ${progress.totalMb.toFixed(1)} MB`
                : "0 MB"}
            </span>
          </div>
        </div>
      </div>

      {/* Queue Section */}
      {queue.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-dim text-[10px] font-bold uppercase tracking-wider">
              Download Queue ({queue.length})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
            {queue.map((item, index) => (
              <div
                key={item.id}
                onClick={() => {
                  useAppStore.getState().setAppId(item.appId);
                  useAppStore.getState().setMetadata(item.metadata);
                  useAppStore.getState().setMode("ready"); // Ensure it's in ready state for viewing
                }}
                className={cn(
                  "border-line group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-black/40 transition-all hover:bg-black/60",
                  item.status === "downloading" &&
                    "border-white/40 ring-1 ring-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]",
                  item.status === "finished" && "opacity-50 grayscale",
                )}
              >
                {/* Pos Indicator */}
                <div className="absolute top-1.5 left-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-md bg-black/80 text-[10px] font-black text-white shadow-lg backdrop-blur-md border border-white/20">
                  {index + 1}
                </div>

                {/* Status Indicator */}
                {item.status === "downloading" && (
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                )}

                {/* Thumbnail */}
                <div className="relative aspect-[460/215] w-full overflow-hidden bg-black/20">
                  {item.metadata.headerImage ? (
                    <Image
                      src={item.metadata.headerImage}
                      alt={item.metadata.name}
                      width={230}
                      height={108}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-text/40">
                      NO IMG
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex items-center justify-between p-2">
                  <span className="text-text truncate text-[10px] font-bold">
                    {item.metadata.name}
                  </span>
                  {item.status !== "downloading" && (
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="text-dim hover:text-red-500 ml-1 transition-colors"
                      title="Remove from queue"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
