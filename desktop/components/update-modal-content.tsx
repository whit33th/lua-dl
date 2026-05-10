"use client";

import type { UpdateEvent } from "@/electron/ipc-contract";
import { AlertCircle, Check, CheckCircle2, Copy } from "lucide-react";

type UpdateModalContentProps = {
  updateState: UpdateEvent;
  copied: boolean;
  onCopyError(): void;
};

export function UpdateModalContent({
  updateState,
  copied,
  onCopyError,
}: UpdateModalContentProps) {
  if (updateState.type === "available") {
    return (
      <div className="space-y-4">
        <p className="text-lg font-medium">A new update is ready.</p>
        <p className="text-dim text-sm leading-relaxed">
          We've found a new version of lua-dl. Updating is recommended for
          better stability and new features.
        </p>
      </div>
    );
  }

  if (updateState.type === "downloading") {
    return (
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold tracking-tighter uppercase">
            <span>Downloading Assets</span>
            <span>{Math.round(updateState.progress || 0)}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden bg-white/5">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${updateState.progress || 0}%` }}
            />
          </div>
        </div>
        <p className="text-dim text-center text-xs italic">
          Please do not close the application
        </p>
      </div>
    );
  }

  if (updateState.type === "downloaded") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-400">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-bold">Ready to Install</p>
          <p className="text-dim text-sm">
            The update has been downloaded. Restart the app to apply changes.
          </p>
        </div>
      </div>
    );
  }

  if (updateState.type === "error") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm font-bold tracking-tight uppercase">
            Update Failed
          </span>
        </div>

        <div className="group relative">
          <pre className="border-line scrollbar-thin scrollbar-thumb-white/10 max-h-70 overflow-auto border bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-red-300/80">
            {updateState.message}
          </pre>
          <button
            onClick={onCopyError}
            className="absolute top-3 right-3 flex items-center gap-2 border border-white/10 bg-white/5 p-1.5 text-[10px] font-bold uppercase transition-all hover:bg-white/10"
          >
            {copied ? (
              <Check size={12} className="text-green-400" />
            ) : (
              <Copy size={12} />
            )}
            {copied ? "Copied" : "Copy Log"}
          </button>
        </div>
        <p className="text-dim text-[10px] italic">
          Tip: This usually happens if there's no "Latest Release" published on
          GitHub yet.
        </p>
      </div>
    );
  }

  return null;
}
