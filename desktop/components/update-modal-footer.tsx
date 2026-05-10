"use client";

import type { UpdateEvent } from "@/electron/ipc-contract";

type UpdateModalFooterProps = {
  updateState: UpdateEvent;
  onClose(): void;
  onDownload(): void;
  onInstall(): void;
};

export function UpdateModalFooter({
  updateState,
  onClose,
  onDownload,
  onInstall,
}: UpdateModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-white/5 bg-white/2 p-5">
      {updateState.type === "available" && (
        <>
          <button
            onClick={onClose}
            className="text-dim hover:text-text px-4 py-2 text-xs font-bold uppercase"
          >
            Ignore
          </button>
          <button
            onClick={onDownload}
            className="bg-white px-6 py-2 text-xs font-bold text-black uppercase transition-transform active:scale-95"
          >
            Update Now
          </button>
        </>
      )}
      {updateState.type === "downloaded" && (
        <button
          onClick={onInstall}
          className="bg-green-500 px-6 py-2 text-xs font-bold text-black uppercase transition-transform active:scale-95"
        >
          Restart & Install
        </button>
      )}
      {updateState.type === "error" && (
        <button
          onClick={onClose}
          className="text-text bg-white/10 px-8 py-2 text-xs font-bold uppercase transition-colors hover:bg-white/20"
        >
          Close
        </button>
      )}
    </div>
  );
}
