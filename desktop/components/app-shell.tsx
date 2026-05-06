"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { AlertCircle, Download, Settings2, Square } from "lucide-react";
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

  return (
    <>
      {/* <section
        className="flex items-center justify-between gap-4 mb-5"
        aria-label="Application header"
      >
        <div className="flex gap-2.5">
          <button
            className="w-11 h-11 grid place-items-center border border-line-strong rounded-4xl bg-text text-panel-strong transition-all hover:-translate-y-0.5"
            type="button"
            onClick={stopActiveSession}
            aria-label="Stop process"
          >
            <Square size={18} aria-hidden="true" />
          </button>
        </div>
      </section> */}

      <AppIdEntry
        onSubmit={inspectApp}
        isLoading={mode === "probing" || isPending}
      />

      <section className="flex h-full flex-1 gap-4 px-6">
        <div className="grid relative  grid-rows-2 gap-4 w-full">
          <Border />
          <DownloadWorkflow onDownload={startDownload} />

          <ProgressPanel />
        </div>

        <aside
          className="grid min-h-0 relative gap-4 flex-1/3 min-w-50 max-w-125"
          aria-label="Session details"
        >
          <Border />
          <div className="grid  h-full  gap-3.5 p-3.5 border border-line   ">
            <div className="w-28 aspect-video flex items-center justify-center overflow-hidden border border-line rounded-4xl bg-black">
              {metadata?.headerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={metadata.headerImage}
                  alt=""
                  className="w-full h-full object-cover grayscale"
                />
              ) : (
                <Download size={34} aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="m-0 mb-1.5 text-dim text-xs font-bold uppercase">
                {appId ? `App ${appId}` : "No app selected"}
              </p>
              <h3 className="m-0 text-xl">{metadata?.name ?? "Waiting"}</h3>
              <p className="m-1.5 0 0 text-muted">
                {metadata?.isFallback
                  ? "Metadata unavailable"
                  : (metadata?.type ?? "Ready")}
              </p>
            </div>
          </div>

          {cli.lastError ? (
            <div
              className="flex gap-2.5 p-3.5 bg-text text-panel-strong font-bold border border-line rounded-4xl"
              role="alert"
            >
              <AlertCircle size={18} aria-hidden="true" />
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
    </>
  );
}
