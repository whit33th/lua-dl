type SessionStatus = "starting" | "running" | "exited" | "failed" | "killed";

export type StartOptions = {
  cwd?: string;
  cols?: number;
  rows?: number;
  label?: string;
};

type StartResult = {
  sessionId: string;
};

type DirectoryResult = {
  canceled: boolean;
  path?: string;
};

type DefenderExclusionResult =
  | { status: "added"; path: string }
  | { status: "skipped"; path: string; message: string }
  | { status: "unsupported"; path: string; message: string }
  | { status: "failed"; path: string; message: string };

type EnsureDirectoryResult =
  | { status: "exists"; path: string }
  | { status: "created"; path: string };

export type ParsedProgress = {
  percent?: number;
  downloadedMb?: number;
  totalMb?: number;
  mbps?: number;
  filesDone?: number;
  filesTotal?: number;
};

type PromptKind = "yes-no" | "picker" | "stdin";

export type DetectedPrompt = {
  kind: PromptKind;
  text: string;
};

export type CliEvent =
  | {
      type: "state";
      sessionId: string;
      status: SessionStatus;
      label?: string;
      time: number;
    }
  | {
      type: "output";
      sessionId: string;
      chunk: string;
      clean: string;
      stream: "pty";
      progress?: ParsedProgress;
      prompt?: DetectedPrompt;
      time: number;
    }
  | {
      type: "exit";
      sessionId: string;
      exitCode: number;
      time: number;
    }
  | {
      type: "error";
      sessionId: string;
      message: string;
      time: number;
    };

type UpdateStatus =
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export type UpdateEvent = {
  type: UpdateStatus;
  version?: string;
  progress?: number;
  message?: string;
};

type LuaDlApi = {
  start(args: string[], options?: StartOptions): Promise<StartResult>;
  write(sessionId: string, input: string): Promise<void>;
  kill(sessionId: string): Promise<void>;
  chooseDirectory(): Promise<DirectoryResult>;
  addDefenderExclusion(path: string): Promise<DefenderExclusionResult>;
  ensureDirectory(path: string): Promise<EnsureDirectoryResult>;
  openFolder(path: string): Promise<void>;
  onEvent(callback: (event: CliEvent) => void): () => void;
  // Update related
  checkForUpdates(): Promise<void>;
  downloadUpdate(): Promise<void>;
  installUpdate(): Promise<void>;
  onUpdateEvent(callback: (event: UpdateEvent) => void): () => void;
};

type WindowControlApi = {
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  close(): Promise<void>;
};

declare global {
  interface Window {
    luaDl?: LuaDlApi;
    api: WindowControlApi;
  }
}

export {};
