"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store";

export function useLuaDlSession() {
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const settings = useAppStore((state) => state.settings);
  const setActiveSession = useAppStore((state) => state.setActiveSession);

  const startSession = useCallback(
    async (args: string[], label: string) => {
      if (!window.luaDl) {
        throw new Error("Electron bridge is not available.");
      }

      const result = await window.luaDl.start(args, {
        cwd: settings.outputDir || undefined,
        label,
        cols: 132,
        rows: 34,
      });
      setActiveSession(result.sessionId);
      return result.sessionId;
    },
    [setActiveSession, settings.outputDir],
  );

  const stopActiveSession = useCallback(() => {
    if (activeSessionId) {
      void window.luaDl?.kill(activeSessionId);
      setActiveSession(undefined);
    }
  }, [activeSessionId, setActiveSession]);

  return {
    startSession,
    stopActiveSession,
  };
}
