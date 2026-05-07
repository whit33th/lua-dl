"use client";

import { parseSteamAppId } from "@/lib/cli-parser";
import { fallbackMetadata, fetchSteamMetadata } from "@/lib/steam-metadata";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AlertCircle, Gamepad2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AppIdEntry } from "./app-id-entry";
import { CliFeed } from "./cli-feed";
import { DownloadWorkflow } from "./download-workflow";
import { ProgressPanel } from "./progress-panel";
import { PromptModal } from "./prompt-modal";
import { SettingsPanel } from "./settings-panel";
import Noise from "./ui/Noise";
import ShinyText from "./ui/ShinyText";
import SplashCursor from "./ui/SplashCursor";
import { Border } from "./ui/Squire-Border";
import ASCIIText from "./ui/ASCIIText";
import { Skeleton } from "./ui/skeleton";
import { UpdateModal } from "./update-modal";

export function AppShell() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const appId = useAppStore((state) => state.appId);
  const metadata = useAppStore((state) => state.metadata);
  const mode = useAppStore((state) => state.mode);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const settings = useAppStore((state) => state.settings);
  const cli = useAppStore((state) => state.cli);
  const setAppId = useAppStore((state) => state.setAppId);
  const setMetadata = useAppStore((state) => state.setMetadata);
  const setMode = useAppStore((state) => state.setMode);
  const setActiveSession = useAppStore((state) => state.setActiveSession);
  const clearRun = useAppStore((state) => state.clearRun);
  const clearLogs = useAppStore((state) => state.clearLogs);
  const ingestEvent = useAppStore((state) => state.ingestEvent);
  const setUpdateState = useAppStore((state) => state.setUpdateState);

  useEffect(() => {
    const unsubEvent = window.luaDl?.onEvent((event) => {
      ingestEvent(event);
    });

    const unsubUpdate = window.luaDl?.onUpdateEvent((event) => {
      setUpdateState(event);
    });

    // Check for updates on startup
    void window.luaDl?.checkForUpdates();

    return () => {
      unsubEvent?.();
      unsubUpdate?.();
    };
  }, [ingestEvent, setUpdateState]);

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

  const inspectApp = useCallback(
    (nextAppId: string) => {
      const parsed = parseSteamAppId(nextAppId);
      if (!parsed) {
        setMode("failed");
        return;
      }

      clearRun();
      setAppId(parsed);
      setMode("probing");

      startTransition(() => {
        void fetchSteamMetadata(parsed)
          .then(setMetadata)
          .catch(() => setMetadata(fallbackMetadata(parsed)));
      });

      void startSession(
        ["probe", parsed, ...(settings.verbose ? ["-v"] : [])],
        `Probe ${parsed}`,
      ).catch(() => {
        setMode("failed");
      });
    },
    [clearRun, setAppId, setMetadata, setMode, settings.verbose, startSession],
  );

  const startDownload = useCallback(
    async (args: string[]) => {
      clearLogs();
      setMode("downloading");
      await startSession(args, `Download ${appId}`).catch(() => {
        setMode("failed");
      });
    },
    [appId, clearRun, setMode, startSession],
  );

  const stopActiveSession = useCallback(() => {
    if (activeSessionId) {
      void window.luaDl?.kill(activeSessionId);
      setActiveSession(undefined);
    }
  }, [activeSessionId, setActiveSession]);

  const isIdle = mode === "idle" && !appId;

  if (isIdle) {
    return (
      <div className="relative z-0 flex h-full w-full flex-col items-center justify-center">
        <SplashCursor />
        <Noise
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={15}
        />
        <div className="pointer-events-none absolute inset-0 z-0">
          <ASCIIText
            text="LUA-DL"
            enableWaves={true}
            asciiFontSize={8}
            textFontSize={160}
          />
        </div>

        <div className="border-line-strong z-10 mx-auto w-full max-w-lg rounded border bg-black/60 p-6 text-center shadow-2xl backdrop-blur-lg">
          {/* <h1 className="text-3xl font-semibold text-text mb-6 tracking-widest">
              GAME ID
            </h1> */}
          <AppIdEntry onSubmit={inspectApp} isLoading={isPending} isSplash />
        </div>

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative z-0 flex h-full w-full flex-col pt-8">
      {/* <SplashCursor /> */}
      <div className="z-20 mx-auto w-full max-w-3xl px-6 pb-6">
        <AppIdEntry
          onSubmit={inspectApp}
          isLoading={mode === "probing" || isPending}
          disabled={mode === "downloading"}
        />
      </div>

      <section className="z-10 flex h-full flex-1 gap-4 overflow-hidden px-6 pt-1 pb-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Top Section: Game Metadata */}
          <div className="border-line group relative h-48 flex-none border backdrop-blur-sm">
            <Border />
            <div className="absolute inset-0 overflow-hidden">
              {metadata?.headerImage && (
                <Image
                  src={metadata.headerImage}
                  width={460}
                  height={215}
                  alt=""
                  className={cn(
                    "h-full w-full object-cover opacity-50 blur-xl transition-[filter,opacity,transform] duration-500 ease-in-out group-hover:opacity-70",
                    mode === "downloading"
                      ? "animate-pulse-slow grayscale-0"
                      : "grayscale group-hover:grayscale-0",
                  )}
                />
              )}
            </div>
            <div className="relative flex h-full items-center gap-6 p-4">
              <div className="border-line relative aspect-92/43 h-full w-auto flex-none overflow-hidden border bg-black shadow-2xl">
                {metadata?.headerImage ? (
                  <Image
                    src={metadata.headerImage}
                    width={460}
                    height={215}
                    alt=""
                    className={cn(
                      "object-cover",
                      mode === "downloading" && "animate-pulse-slow",
                    )}
                    loading="eager"
                    priority
                    fetchPriority="high"
                  />
                ) : mode === "probing" ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <div className="z-11 flex h-full w-full items-center justify-center bg-white/5">
                    <Gamepad2 size={48} className="text-white/95" />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {metadata ? (
                  <>
                    <h3 className="text-text m-0 line-clamp-3 text-4xl leading-tight font-bold text-wrap">
                      <ShinyText
                        text={metadata.name}
                        disabled={false}
                        speed={3}
                      />
                    </h3>
                    {/* <div className="mt-1 flex items-center gap-2">
                      <span className="border-line text-muted rounded border bg-black/90 px-2 py-0.5 text-xs font-bold uppercase">
                        {metadata.isFallback ? "" : (metadata.type ?? "Ready")}
                      </span>
                    </div> */}
                  </>
                ) : mode === "probing" ? (
                  <>
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="mt-2 h-5 w-24" />
                  </>
                ) : (
                  <>
                    <h3 className="text-text m-0 truncate text-4xl leading-tight font-bold">
                      <ShinyText text="Waiting" disabled={false} speed={3} />
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="border-line text-muted rounded border bg-black/90 px-2 py-0.5 text-xs font-bold uppercase">
                        Ready
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: Workflow */}
          <div className="border-line relative min-h-0 flex-1 border">
            <Border />
            <DownloadWorkflow
              onDownload={startDownload}
              onStop={stopActiveSession}
            />
          </div>
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
            <div
              className="flex gap-2.5 border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-bold text-red-500"
              role="alert"
            >
              <AlertCircle size={16} aria-hidden="true" className="flex-none" />
              <span>{cli.lastError}</span>
            </div>
          ) : null}
        </aside>
      </section>

      <CliFeed />
      <PromptModal />
      <UpdateModal />
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
