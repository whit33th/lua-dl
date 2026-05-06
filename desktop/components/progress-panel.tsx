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
    <section
      className="border  border-line  bg-panel  p-5"
      aria-labelledby="progress-title"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="m-0 mb-1.5 text-dim text-xs font-bold uppercase">
            Status
          </p>
          <h2 id="progress-title" className="m-0 text-2xl font-bold">
            {cli.phase ?? "Idle"}
          </h2>
        </div>
        <div
          className="inline-flex items-center gap-2 border border-line rounded-full px-3 py-2 text-muted capitalize"
          data-mode={mode}
        >
          {statusIcon}
          <span>{mode}</span>
        </div>
      </div>

      <div
        className="h-2 my-6 overflow-hidden border border-line-strong  bg-black"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span
          className="block h-full bg-text transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <dl className="grid grid-cols-4 gap-2.5">
        <div className="border border-line bg-panel-strong p-3">
          <dt className="text-dim text-xs">Progress</dt>
          <dd className="mt-1.25 font-bold">{percent.toFixed(1)}%</dd>
        </div>
        <div className="border border-line bg-panel-strong p-3">
          <dt className="text-dim text-xs">Speed</dt>
          <dd className="mt-1.25 font-bold">
            {progress?.mbps ? `${progress.mbps.toFixed(1)} MB/s` : "0.0 MB/s"}
          </dd>
        </div>
        <div className="border border-line bg-panel-strong p-3">
          <dt className="text-dim text-xs">Files</dt>
          <dd className="mt-1.25 font-bold">
            {progress?.filesTotal
              ? `${progress.filesDone}/${progress.filesTotal}`
              : "0/0"}
          </dd>
        </div>
        <div className="border border-line bg-panel-strong p-3">
          <dt className="text-dim text-xs">Downloaded</dt>
          <dd className="mt-1.25 font-bold">
            {progress?.totalMb
              ? `${progress.downloadedMb?.toFixed(1)} / ${progress.totalMb.toFixed(1)} MB`
              : "0 MB"}
          </dd>
        </div>
      </dl>

      {cli.doneMessage ? (
        <p className="mt-4 text-text">{cli.doneMessage}</p>
      ) : null}
    </section>
  );
}
