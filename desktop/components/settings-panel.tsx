"use client";

import { X } from "lucide-react";
import { useGamesLibrarySetup } from "@/hooks/use-games-library-setup";
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
  const { chooseAndPrepareLibrary, isSelectingLibrary } =
    useGamesLibrarySetup();

  if (!isOpen) {
    return null;
  }

  async function chooseDirectory() {
    await chooseAndPrepareLibrary();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-md">
      <aside
        className="border-line bg-panel flex max-h-screen w-[min(560px,100%)] flex-col rounded-4xl border p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-dim m-0 mb-1.5 text-xs font-bold uppercase">
              Preferences
            </p>
            <h2 id="settings-title" className="m-0 text-2xl font-bold">
              Settings
            </h2>
          </div>
          <button
            className="border-line-strong bg-panel-strong text-text hover:border-text grid h-11 w-11 place-items-center rounded-4xl border transition-[border-color,translate,background-color,color] hover:-translate-y-0.5"
            type="button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid flex-1 gap-2.5">
          <label className="border-line flex min-h-14.5 items-center justify-between rounded-4xl border bg-black p-3">
            <span>
              <strong className="block text-sm">Verbose logging</strong>
              <small className="text-muted mt-0.75 block text-xs">
                Adds -v to generated commands
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.verbose}
              onChange={(event) => setVerbose(event.target.checked)}
              className="h-4.5 w-4.5"
            />
          </label>

          <label className="border-line flex min-h-14.5 items-center justify-between rounded-4xl border bg-black p-3">
            <span>
              <strong className="block text-sm">Keep raw logs</strong>
              <small className="text-muted mt-0.75 block text-xs">
                Preserves original line breaks
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.keepRawLogs}
              onChange={(event) => setKeepRawLogs(event.target.checked)}
              className="h-4.5 w-4.5"
            />
          </label>

          <label className="border-line flex min-h-14.5 items-center justify-between rounded-4xl border bg-black p-3">
            <span>
              <strong className="block text-sm">Compact density</strong>
              <small className="text-muted mt-0.75 block text-xs">
                Tighter rows and panels
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.density === "compact"}
              onChange={(event) =>
                setDensity(event.target.checked ? "compact" : "comfortable")
              }
              className="h-4.5 w-4.5"
            />
          </label>

          <button
            className="border-line text-text hover:border-text w-full overflow-hidden rounded-4xl border bg-black p-3 text-left text-ellipsis whitespace-nowrap transition-[border-color,translate,background-color,color] hover:-translate-y-0.5"
            type="button"
            onClick={chooseDirectory}
            disabled={isSelectingLibrary}
          >
            {settings.outputDir || "Games library folder"}
          </button>
        </div>
      </aside>
    </div>
  );
}
