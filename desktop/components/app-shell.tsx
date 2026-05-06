"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { AlertCircle, Download, Gamepad2, Settings2, Square } from "lucide-react";
import { AppIdEntry } from "./app-id-entry";
import { DownloadWorkflow } from "./download-workflow";
import { CliFeed } from "./cli-feed";
import { ProgressPanel } from "./progress-panel";
import { PromptModal } from "./prompt-modal";
import { SettingsPanel } from "./settings-panel";
import { parseSteamAppId } from "@/lib/cli-parser";
import { fallbackMetadata, fetchSteamMetadata } from "@/lib/steam-metadata";
import { useAppStore } from "@/lib/store";
import { Border } from "./SkinCard";
import ASCIIText from "./ASCIIText";
// import SplashCursor from "./SplashCursor";
import Noise from "./Noise";
import ShinyText from "./ShinyText";
import Image from "next/image";
import SplashCursor from "./SplashCursor";

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
  const ingestEvent = useAppStore((state) => state.ingestEvent);

  useEffect(() => {
    return window.luaDl?.onEvent((event) => {
      ingestEvent(event);
    });
  }, [ingestEvent]);

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
      clearRun();
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
      <div className="relative w-full h-full flex flex-col items-center justify-center  z-0">

        <SplashCursor />
        <Noise
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={15}
        />
        <div className="absolute inset-0 pointer-events-none z-0">
          <ASCIIText
            text="LUA-DL"
            enableWaves={true}
            asciiFontSize={8}
            textFontSize={160}
          />
        </div>

        <div className="text-center w-full z-10 max-w-lg mx-auto bg-black/60 backdrop-blur-lg p-6 rounded border border-line-strong shadow-2xl">
          {/* <h1 className="text-3xl font-semibold text-text mb-6 tracking-widest">
              GAME ID
            </h1> */}
          <AppIdEntry
            onSubmit={inspectApp}
            isLoading={isPending}
          />
        </div>

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col pt-8 z-0">
      {/* <SplashCursor /> */}
      <div className="px-6 pb-6 z-10 w-full max-w-3xl mx-auto">
        <AppIdEntry
          onSubmit={inspectApp}
          isLoading={mode === "probing" || isPending}
        />
      </div>

      <section className="flex h-full flex-1 gap-4 px-6 pt-1 pb-6 z-10 overflow-hidden">
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Top Section: Game Metadata */}
          <div className="relative flex-none h-48 border border-line backdrop-blur-sm group">
            <Border />
            <div className="absolute inset-0 overflow-hidden">
              {metadata?.headerImage && (
                <Image
                  src={metadata.headerImage}
                  fill
                  alt=""
                  className="object-cover opacity-50 grayscale blur-xl group-hover:grayscale-0 group-hover:opacity-70 transition-[filter,opacity] ease-in-out duration-150"
                />
              )}
            </div>
            <div className="relative h-full flex items-center gap-6 p-4">
              <div className="h-full w-auto aspect-video relative flex-none border border-line  bg-black overflow-hidden shadow-2xl">
                {metadata?.headerImage ? (
                  <Image
                    src={metadata.headerImage}
                    fill
                    alt=""
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full z-11 h-full flex items-center justify-center  bg-white/5">
                    <Gamepad2 size={48} className="text-white/20" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <h3 className="m-0 text-4xl font-bold text-text truncate leading-tight">
                  <ShinyText text={metadata?.name ?? "Waiting"} disabled={false} speed={3} />
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 border border-line rounded  text-xs font-bold  uppercase text-muted bg-black/90">
                    {metadata?.isFallback ? "Nope." : (metadata?.type ?? "Ready")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Workflow */}
          <div className="relative flex-1 min-h-0 border border-line">
            <Border />
            <DownloadWorkflow onDownload={startDownload} />
          </div>
        </div>

        <aside
          className="flex-none w-80 flex flex-col gap-4 relative"
          aria-label="Progress and Status"
        >
          <div className="flex flex-col flex-1 p-5 border border-line relative">
            <Border />

            <ProgressPanel />
          </div>

          {cli.lastError ? (
            <div
              className="flex gap-2.5 p-3.5 bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20"
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
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
