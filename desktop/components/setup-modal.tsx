"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { useGamesLibrarySetup } from "@/hooks/use-games-library-setup";
import { gamesLibraryFolderName } from "@/lib/game-install-path";
import { useAppStore } from "@/lib/store";

export function SetupModal() {
  const hasCompletedSetup = useAppStore((state) => state.hasCompletedSetup);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const outputDir = useAppStore((state) => state.settings.outputDir);
  const [selectedParentFolder, setSelectedParentFolder] = useState("");
  const [error, setError] = useState("");
  const { chooseAndPrepareLibrary, isSelectingLibrary } =
    useGamesLibrarySetup();
  const libraryPath = outputDir;

  if (!hasHydrated || hasCompletedSetup) {
    return null;
  }

  async function chooseLibraryFolder() {
    setError("");
    try {
      const result = await chooseAndPrepareLibrary();
      if (result) {
        setSelectedParentFolder(result.parentPath);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  }

  function finishSetup() {
    if (!libraryPath) {
      setError("Choose where to create the games folder.");
      return;
    }
  }

  return (
    <div className="fixed inset-0 z-60 grid place-items-center bg-black/80 p-5 backdrop-blur-md">
      <section
        className="border-line bg-panel w-[min(560px,100%)] rounded-4xl border p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-title"
      >
        <div className="mb-5 flex items-start gap-4">
          <div className="border-line bg-panel-strong grid size-12 flex-none place-items-center rounded-4xl border">
            <FolderOpen size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-dim m-0 mb-1.5 text-xs font-bold uppercase">
              First launch setup
            </p>
            <h2 id="setup-title" className="m-0 text-2xl font-bold">
              Choose install location
            </h2>
          </div>
        </div>

        <p className="text-muted mb-5 text-sm leading-relaxed">
          Select where lua-dl should create its games folder.
        </p>

        <button
          type="button"
          onClick={chooseLibraryFolder}
          disabled={isSelectingLibrary}
          className="border-line text-text hover:border-text mb-4 w-full overflow-hidden rounded-4xl border bg-black p-3 text-left text-ellipsis whitespace-nowrap transition-[border-color,translate,background-color,color] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {selectedParentFolder || "Choose location"}
        </button>

        <div className="border-line mb-5 rounded-4xl border bg-black/60 p-4">
          <p className="text-dim m-0 mb-2 text-[10px] font-bold uppercase">
            Folder to be created
          </p>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-3xl bg-white/10">
              <FolderOpen size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <strong className="text-text block text-sm">
                {gamesLibraryFolderName}
              </strong>
              <small className="text-muted block truncate text-xs">
                {libraryPath || "Choose a location first"}
              </small>
            </div>
          </div>
        </div>

        {error ? (
          <p className="mb-4 text-sm font-bold text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={finishSetup}
          disabled={isSelectingLibrary || !libraryPath}
          className="bg-text text-panel-strong border-line-strong inline-flex w-full items-center justify-center gap-2.25 rounded-4xl border px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </section>
    </div>
  );
}
