import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Download, RefreshCw, X, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import { Border } from "./ui/Squire-Border";
import { cn } from "@/lib/utils";

export function UpdateModal() {
  const updateState = useAppStore((state) => state.updateState);
  const isUpdateModalOpen = useAppStore((state) => state.isUpdateModalOpen);
  const setUpdateModalOpen = useAppStore((state) => state.setUpdateModalOpen);
  const [copied, setCopied] = useState(false);

  if (!isUpdateModalOpen) return null;

  const handleClose = () => {
    setUpdateModalOpen(false);
  };

  const handleDownload = () => {
    void window.luaDl?.downloadUpdate();
  };

  const handleInstall = () => {
    void window.luaDl?.installUpdate();
  };

  const copyError = () => {
    if (updateState.message) {
      void navigator.clipboard.writeText(updateState.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <div className="border-line bg-panel relative flex max-h-[85vh] w-full max-w-[520px] flex-col border shadow-2xl">
        <Border />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="bg-text/10 text-text flex h-8 w-8 items-center justify-center rounded-sm">
              <RefreshCw size={18} className={updateState.type === "checking" ? "animate-spin" : ""} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest">Software Update</h2>
              <p className="text-dim text-[10px]">{updateState.version ? `v${updateState.version}` : "System Check"}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-dim hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {updateState.type === "available" && (
            <div className="space-y-4">
              <p className="text-lg font-medium">A new update is ready.</p>
              <p className="text-dim text-sm leading-relaxed">
                We've found a new version of lua-dl. Updating is recommended for better stability and new features.
              </p>
            </div>
          )}

          {updateState.type === "downloading" && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                  <span>Downloading Assets</span>
                  <span>{Math.round(updateState.progress || 0)}%</span>
                </div>
                <div className="bg-white/5 h-1 w-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300 ease-out" 
                    style={{ width: `${updateState.progress || 0}%` }}
                  />
                </div>
              </div>
              <p className="text-dim text-center text-xs italic">Please do not close the application</p>
            </div>
          )}

          {updateState.type === "downloaded" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
              <div className="bg-green-500/20 text-green-400 flex h-12 w-12 items-center justify-center rounded-full">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold">Ready to Install</p>
                <p className="text-dim text-sm">The update has been downloaded. Restart the app to apply changes.</p>
              </div>
            </div>
          )}

          {updateState.type === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={18} />
                <span className="text-sm font-bold uppercase tracking-tight">Update Failed</span>
              </div>
              
              <div className="relative group">
                <pre className="border-line bg-black/40 max-h-[280px] overflow-auto border p-4 font-mono text-[11px] leading-relaxed text-red-300/80 scrollbar-thin scrollbar-thumb-white/10">
                  {updateState.message}
                </pre>
                <button
                  onClick={copyError}
                  className="absolute right-3 top-3 bg-white/5 hover:bg-white/10 border border-white/10 p-1.5 transition-all flex items-center gap-2 text-[10px] uppercase font-bold"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy Log"}
                </button>
              </div>
              <p className="text-dim text-[10px] italic">
                Tip: This usually happens if there's no "Latest Release" published on GitHub yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/5 p-5 bg-white/[0.02]">
          {updateState.type === "available" && (
            <>
              <button onClick={handleClose} className="text-dim hover:text-text px-4 py-2 text-xs font-bold uppercase">Ignore</button>
              <button
                onClick={handleDownload}
                className="bg-white text-black px-6 py-2 text-xs font-bold uppercase transition-transform active:scale-95"
              >
                Update Now
              </button>
            </>
          )}
          {updateState.type === "downloaded" && (
            <button
              onClick={handleInstall}
              className="bg-green-500 text-black px-6 py-2 text-xs font-bold uppercase transition-transform active:scale-95"
            >
              Restart & Install
            </button>
          )}
          {updateState.type === "error" && (
            <button
              onClick={handleClose}
              className="bg-white/10 hover:bg-white/20 text-text px-8 py-2 text-xs font-bold uppercase transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
