"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";

type SettingsPanelProps = {
  isOpen: boolean;
  onClose(): void;
};

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const settings = useAppStore((state) => state.settings);
  const setVerbose = useAppStore((state) => state.setVerbose);
  const setKeepRawLogs = useAppStore((state) => state.setKeepRawLogs);
  const setDensity = useAppStore((state) => state.setDensity);
  const setOutputDir = useAppStore((state) => state.setOutputDir);

  if (!isOpen) {
    return null;
  }

  async function chooseDirectory() {
    const result = await window.luaDl?.chooseDirectory();
    if (!result?.canceled && result?.path) {
      setOutputDir(result.path);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-5 bg-black/70 backdrop-blur-md">
      <aside
        className="w-[min(560px,100%)] max-h-screen border border-line rounded-lg bg-panel shadow-lg p-5 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="m-0 mb-1.5 text-dim text-xs font-bold uppercase">
              Preferences
            </p>
            <h2 id="settings-title" className="m-0 text-2xl font-bold">
              Settings
            </h2>
          </div>
          <button
            className="w-11 h-11 grid place-items-center border border-line-strong rounded-lg bg-panel-strong text-text transition-all hover:border-text hover:-translate-y-0.5"
            type="button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-2.5 flex-1">
          <label className="flex items-center justify-between min-h-14.5 border border-line rounded-lg bg-black p-3">
            <span>
              <strong className="block text-sm">Verbose logging</strong>
              <small className="block text-muted text-xs mt-0.75">
                Adds -v to generated commands
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.verbose}
              onChange={(event) => setVerbose(event.target.checked)}
              className="w-4.5 h-4.5"
            />
          </label>

          <label className="flex items-center justify-between min-h-14.5 border border-line rounded-lg bg-black p-3">
            <span>
              <strong className="block text-sm">Keep raw logs</strong>
              <small className="block text-muted text-xs mt-0.75">
                Preserves original line breaks
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.keepRawLogs}
              onChange={(event) => setKeepRawLogs(event.target.checked)}
              className="w-4.5 h-4.5"
            />
          </label>

          <label className="flex items-center justify-between min-h-14.5 border border-line rounded-lg bg-black p-3">
            <span>
              <strong className="block text-sm">Compact density</strong>
              <small className="block text-muted text-xs mt-0.75">
                Tighter rows and panels
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.density === "compact"}
              onChange={(event) =>
                setDensity(event.target.checked ? "compact" : "comfortable")
              }
              className="w-4.5 h-4.5"
            />
          </label>

          <button
            className="w-full text-left border border-line rounded-lg bg-black p-3 text-text transition-all hover:border-text hover:-translate-y-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
            type="button"
            onClick={chooseDirectory}
          >
            {settings.outputDir || "Default downloads folder"}
          </button>
        </div>
      </aside>
    </div>
  );
}
