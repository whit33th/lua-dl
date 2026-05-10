"use client";

import { useState } from "react";
import { buildGamesLibraryPath } from "@/lib/game-install-path";
import { useAppStore } from "@/lib/store";

export function useGamesLibrarySetup() {
  const setOutputDir = useAppStore((state) => state.setOutputDir);
  const setSetupComplete = useAppStore((state) => state.setSetupComplete);
  const [isSelectingLibrary, setIsSelectingLibrary] = useState(false);

  async function chooseAndPrepareLibrary() {
    setIsSelectingLibrary(true);
    try {
      const result = await window.luaDl?.chooseDirectory();
      if (result?.canceled || !result?.path) {
        return undefined;
      }

      const libraryPath = buildGamesLibraryPath(result.path);
      setOutputDir(libraryPath);
      const exclusion = await window.luaDl?.addDefenderExclusion(libraryPath);
      setSetupComplete(true);
      return { parentPath: result.path, libraryPath, exclusion };
    } finally {
      setIsSelectingLibrary(false);
    }
  }

  return { chooseAndPrepareLibrary, isSelectingLibrary };
}
