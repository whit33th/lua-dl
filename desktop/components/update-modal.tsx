"use client";

import { useAppStore } from "@/lib/store";
import { RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { Border } from "./ui/border";
import { UpdateModalContent } from "./update-modal-content";
import { UpdateModalFooter } from "./update-modal-footer";

export function UpdateModal() {
  const updateState = useAppStore((state) => state.updateState);
  const isUpdateModalOpen = useAppStore((state) => state.isUpdateModalOpen);
  const setUpdateModalOpen = useAppStore((state) => state.setUpdateModalOpen);
  const [copied, setCopied] = useState(false);

  if (!isUpdateModalOpen) {
    return null;
  }

  function handleClose() {
    setUpdateModalOpen(false);
  }

  function handleDownload() {
    void window.luaDl?.downloadUpdate();
  }

  function handleInstall() {
    void window.luaDl?.installUpdate();
  }

  function copyError() {
    if (updateState.message) {
      void navigator.clipboard.writeText(updateState.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <div className="border-line bg-panel relative flex max-h-[85vh] w-full max-w-[520px] flex-col border shadow-2xl">
        <Border />

        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-text/10 text-text flex h-8 w-8 items-center justify-center rounded-sm">
              <RefreshCw
                size={18}
                className={updateState.type === "checking" ? "animate-spin" : ""}
              />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase">Software Update</h2>
              <p className="text-dim text-[10px]">
                {updateState.version ? `v${updateState.version}` : "System Check"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-dim hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <UpdateModalContent
            updateState={updateState}
            copied={copied}
            onCopyError={copyError}
          />
        </div>

        <UpdateModalFooter
          updateState={updateState}
          onClose={handleClose}
          onDownload={handleDownload}
          onInstall={handleInstall}
        />
      </div>
    </div>
  );
}

