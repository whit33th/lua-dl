"use client";

import { useLuaDlEvents } from "@/hooks/use-lua-dl-events";
import { useLuaDlSession } from "@/hooks/use-lua-dl-session";
import { buildProbeCommand } from "@/lib/cli-commands";
import { fallbackMetadata, fetchSteamMetadata } from "@/lib/steam-metadata";
import { parseSteamAppId } from "@/lib/steam-app-id";
import { useAppStore } from "@/lib/store";
import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AppIdEntry } from "./app-id-entry";
import { CliFeed } from "./cli-feed";
import { DownloadWorkflow } from "./download-workflow";
import { GameSummaryCard } from "./game-summary-card";
import { ProgressPanel } from "./progress-panel";
import { PromptModal } from "./prompt-modal";
import { SettingsPanel } from "./settings-panel";
import { SetupModal } from "./setup-modal";
import { SplashScreen } from "./splash-screen";
import { Border } from "./ui/border";
import { UpdateModal } from "./update-modal";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

export function AppShell() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const appId = useAppStore((state) => state.appId);
  const metadata = useAppStore((state) => state.metadata);
  const mode = useAppStore((state) => state.mode);
  const settings = useAppStore((state) => state.settings);
  const cli = useAppStore((state) => state.cli);
  const setAppId = useAppStore((state) => state.setAppId);
  const setMetadata = useAppStore((state) => state.setMetadata);
  const setMode = useAppStore((state) => state.setMode);
  const clearRun = useAppStore((state) => state.clearRun);
  const clearLogs = useAppStore((state) => state.clearLogs);
  const { startSession, stopActiveSession } = useLuaDlSession();
  const downloadFoldersBySession = useRef(new Map<string, string>());

  useLuaDlEvents();

  useEffect(() => {
    const unsubscribe = window.luaDl?.onEvent((event) => {
      if (event.type !== "exit") {
        return;
      }

      const gameFolderPath = downloadFoldersBySession.current.get(
        event.sessionId,
      );
      if (!gameFolderPath) {
        return;
      }

      downloadFoldersBySession.current.delete(event.sessionId);
      if (event.exitCode === 0) {
        void window.luaDl?.openFolder(gameFolderPath);
      }
    });

    return () => unsubscribe?.();
  }, []);

  const inspectApp = useCallback(
    (nextAppId: string) => {
      const parsed = parseSteamAppId(nextAppId);
      if (!parsed) {
        setMode("failed");
        return;
      }

      clearRun();
      setAppId(parsed);
      setMetadata(undefined);
      setMode("probing");

      startTransition(() => {
        void fetchSteamMetadata(parsed)
          .then(setMetadata)
          .catch(() => setMetadata(fallbackMetadata(parsed)));
      });

      void startSession(
        buildProbeCommand(parsed, settings),
        `Probe ${parsed}`,
      ).catch(() => {
        setMode("failed");
      });
    },
    [clearRun, setAppId, setMetadata, setMode, settings.verbose, startSession],
  );

  const startDownload = useCallback(
    async (args: string[], gameFolderPath: string) => {
      clearLogs();
      setMode("downloading");
      await startSession(args, `Download ${appId}`)
        .then((sessionId) => {
          downloadFoldersBySession.current.set(sessionId, gameFolderPath);
        })
        .catch(() => {
          setMode("failed");
        });
    },
    [appId, clearLogs, setMode, startSession],
  );

  const isIdle = mode === "idle" && !appId;

  if (isIdle) {
    return (
      <SplashScreen
        isPending={isPending}
        isSettingsOpen={isSettingsOpen}
        onInspect={inspectApp}
        onCloseSettings={() => setIsSettingsOpen(false)}
      />
    );
  }

  return (
    <div className="relative z-0 flex h-full w-full flex-col pt-8">
      <div className="z-20 mx-auto w-full max-w-3xl px-6 pb-6">
        <AppIdEntry
          onSubmit={inspectApp}
          isLoading={mode === "probing" || isPending}
          disabled={mode === "downloading"}
        />
      </div>

      <section className="z-10 flex h-full flex-1 gap-4 overflow-hidden px-6 pt-1 pb-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <GameSummaryCard metadata={metadata} mode={mode} />

          <motion.div
            className="border-line relative min-h-0 flex-1 border"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: cinematicEase }}
          >
            <Border />
            <DownloadWorkflow
              onDownload={startDownload}
              onStop={stopActiveSession}
            />
          </motion.div>
        </div>

        <aside
          className="relative flex w-80 flex-none flex-col gap-4"
          aria-label="Progress and Status"
        >
          <div className="border-line relative flex flex-1 flex-col border p-5">
            <Border />
            <ProgressPanel />
          </div>

          {cli.lastError ? (
            <motion.div
              className="flex gap-2.5 border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-bold text-red-500"
              role="alert"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: cinematicEase }}
            >
              <AlertCircle size={16} aria-hidden="true" className="flex-none" />
              <span>{cli.lastError}</span>
            </motion.div>
          ) : null}
        </aside>
      </section>

      <CliFeed />
      <PromptModal />
      <UpdateModal />
      <SetupModal />
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
