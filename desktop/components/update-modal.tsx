"use client";

import { useAppStore } from "@/lib/store";
import { Download, RefreshCw, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Border } from "./ui/Squire-Border";

export function UpdateModal() {
  const updateState = useAppStore((state) => state.updateState);
  const setUpdateState = useAppStore((state) => state.setUpdateState);

  // We only show the modal when manual confirmation is needed or during active download/error
  // But wait, the user wants a manual trigger from the frame.
  // Actually, we can use a local state to control visibility if needed, 
  // but let's stick to the store's updateState for now and a "showUpdateModal" flag if needed.
  // For now, let's show it if type is NOT 'not-available' AND NOT 'checking' (if we want it persistent)
  // Or better, let's just use it when the user clicks the button.
  
  if (updateState.type === "not-available") return null;

  const handleClose = () => {
    setUpdateState({ type: "not-available" });
  };

  const handleDownload = () => {
    void window.luaDl?.downloadUpdate();
  };

  const handleInstall = () => {
    void window.luaDl?.installUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-md">
      <div className="border-line bg-panel relative w-[min(480px,100%)] border p-6 shadow-2xl">
        <Border />
        
        <button 
          onClick={handleClose}
          className="text-dim hover:text-text absolute top-4 right-4 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
            <RefreshCw size={24} className={updateState.type === "checking" ? "animate-spin" : ""} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Software Update</h2>
            <p className="text-dim text-sm">Version {updateState.version || "..."}</p>
          </div>
        </div>

        <div className="mb-8 min-h-[80px]">
          {updateState.type === "available" && (
            <p className="text-text">A new version of lua-dl is available. Would you like to download it now?</p>
          )}
          {updateState.type === "downloading" && (
            <div className="space-y-3">
              <p className="text-text">Downloading update...</p>
              <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300" 
                  style={{ width: `${updateState.progress || 0}%` }}
                />
              </div>
              <p className="text-dim text-right text-xs">{Math.round(updateState.progress || 0)}%</p>
            </div>
          )}
          {updateState.type === "downloaded" && (
            <div className="flex items-start gap-3 text-green-400">
              <CheckCircle2 size={20} className="mt-0.5 flex-none" />
              <p>Update downloaded successfully. Restart the application to apply the changes.</p>
            </div>
          )}
          {updateState.type === "error" && (
            <div className="flex items-start gap-3 text-red-400">
              <AlertCircle size={20} className="mt-0.5 flex-none" />
              <p>Error checking for updates: {updateState.message}</p>
            </div>
          )}
          {updateState.type === "checking" && (
            <p className="text-dim italic">Checking for updates...</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {updateState.type === "available" && (
            <button
              onClick={handleDownload}
              className="bg-text text-panel-strong flex items-center gap-2 px-6 py-2 font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download size={18} />
              Download
            </button>
          )}
          {updateState.type === "downloaded" && (
            <button
              onClick={handleInstall}
              className="bg-text text-panel-strong flex items-center gap-2 px-6 py-2 font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <RefreshCw size={18} />
              Restart & Install
            </button>
          )}
          {updateState.type === "error" && (
            <button
              onClick={handleClose}
              className="border-line text-text border bg-white/5 px-6 py-2 font-bold transition-colors hover:bg-white/10"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
