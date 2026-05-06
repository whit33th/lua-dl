"use client";

import { create } from "zustand";
import type { CliEvent } from "@/electron/ipc-contract";
import type { DepotOption, LogEntry, ParsedCliState } from "./cli-parser";
import { cliEventToLog, reduceCliState } from "./cli-parser";
import type { SteamMetadata } from "./steam-metadata";

export type WorkflowMode =
  | "idle"
  | "probing"
  | "ready"
  | "downloading"
  | "finished"
  | "failed";

export type DesktopSettings = {
  outputDir: string;
  verbose: boolean;
  keepRawLogs: boolean;
  density: "comfortable" | "compact";
};

export type QueueItem = {
  id: string;
  appId: string;
  metadata: SteamMetadata;
  args: string[];
  status: "pending" | "downloading" | "finished" | "failed";
};

type AppState = {
  mode: WorkflowMode;
  appId: string;
  metadata?: SteamMetadata;
  activeSessionId?: string;
  logs: LogEntry[];
  cli: ParsedCliState;
  selectedDepots: string[];
  downloadAll: boolean;
  settings: DesktopSettings;
  queue: QueueItem[];
  setAppId(appId: string): void;
  setMetadata(metadata?: SteamMetadata): void;
  setMode(mode: WorkflowMode): void;
  setActiveSession(sessionId?: string): void;
  ingestEvent(event: CliEvent): void;
  clearRun(): void;
  toggleDepot(depotId: string): void;
  setDownloadAll(value: boolean): void;
  setOutputDir(path: string): void;
  setVerbose(value: boolean): void;
  setKeepRawLogs(value: boolean): void;
  setDensity(value: DesktopSettings["density"]): void;
  addToQueue(item: Omit<QueueItem, "id" | "status">): void;
  removeFromQueue(id: string): void;
  updateQueueStatus(id: string, status: QueueItem["status"]): void;
  clearQueue(): void;
  killedSessionIds: string[];
  killActiveSession(): void;
};

const defaultCliState: ParsedCliState = {
  depots: [],
};

export const useAppStore = create<AppState>((set) => ({
  mode: "idle",
  appId: "",
  logs: [],
  cli: defaultCliState,
  selectedDepots: [],
  downloadAll: true,
  settings: {
    outputDir: "",
    verbose: false,
    keepRawLogs: true,
    density: "comfortable",
  },
  queue: [],
  killedSessionIds: [],
  setAppId: (appId) => set({ appId }),
  setMetadata: (metadata) => set({ metadata }),
  setMode: (mode) => set({ mode }),
  setActiveSession: (activeSessionId) => set({ activeSessionId }),
  ingestEvent: (event) =>
    set((state) => {
      // Ignore events from explicitly killed sessions
      if (state.killedSessionIds.includes(event.sessionId)) {
        return state;
      }
      // Ignore events from background sessions
      if (state.activeSessionId && event.sessionId !== state.activeSessionId) {
        return state;
      }

      const log = cliEventToLog(event);
      const cli = reduceCliState(state.cli, event);
      const depots = cli.depots;
      const selectedDepots = ensureDepotSelection(state.selectedDepots, depots);
      return {
        cli,
        selectedDepots,
        logs: log ? [...state.logs, log].slice(-600) : state.logs,
        activeSessionId:
          event.type === "exit" ||
          event.type === "error" ||
          (event.type === "state" && event.status === "killed")
            ? undefined
            : state.activeSessionId,
        mode: inferMode(state.mode, event),
      };
    }),
  clearRun: () =>
    set({
      logs: [],
      cli: defaultCliState,
      selectedDepots: [],
      activeSessionId: undefined,
    }),
  killActiveSession: () =>
    set((state) => {
      if (state.activeSessionId) {
        return {
          killedSessionIds: [...state.killedSessionIds, state.activeSessionId],
          logs: [],
          cli: defaultCliState,
          selectedDepots: [],
          activeSessionId: undefined,
        };
      }
      return state;
    }),
  toggleDepot: (depotId) =>
    set((state) => ({
      selectedDepots: state.selectedDepots.includes(depotId)
        ? state.selectedDepots.filter((id) => id !== depotId)
        : [...state.selectedDepots, depotId],
    })),
  setDownloadAll: (downloadAll) => set({ downloadAll }),
  setOutputDir: (outputDir) =>
    set((state) => ({
      settings: { ...state.settings, outputDir },
    })),
  setVerbose: (verbose) =>
    set((state) => ({
      settings: { ...state.settings, verbose },
    })),
  setKeepRawLogs: (keepRawLogs) =>
    set((state) => ({
      settings: { ...state.settings, keepRawLogs },
    })),
  setDensity: (density) =>
    set((state) => ({
      settings: { ...state.settings, density },
    })),
  addToQueue: (item) =>
    set((state) => ({
      queue: [
        ...state.queue,
        {
          ...item,
          id: crypto.randomUUID(),
          status: "pending",
        },
      ],
    })),
  removeFromQueue: (id) =>
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    })),
  updateQueueStatus: (id, status) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    })),
  clearQueue: () => set({ queue: [] }),
}));

function ensureDepotSelection(selected: string[], depots: DepotOption[]) {
  if (selected.length > 0 || depots.length === 0) {
    return selected;
  }
  const english = depots.find(
    (depot) => depot.tag?.toLowerCase() === "english",
  );
  if (english) {
    return [english.id];
  }
  const optional = depots.find(
    (depot) => depot.kind !== "core" && depot.hasKey,
  );
  return optional ? [optional.id] : [];
}

function inferMode(current: WorkflowMode, event: CliEvent): WorkflowMode {
  if (event.type === "exit") {
    // Treat process termination via kill as intentional stop, not failure
    if (event.exitCode === -1073741510 || event.exitCode === -1) {
      return current;
    }
    if (event.exitCode !== 0) {
      return "failed";
    }
    return current === "probing" ? "ready" : "finished";
  }
  if (event.type === "error") {
    return "failed";
  }
  return current;
}
