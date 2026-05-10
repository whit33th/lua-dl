import type { DetectedPrompt, ParsedProgress } from "@/electron/ipc-contract";

export type LogLevel = "info" | "success" | "error" | "prompt" | "progress";

export type LogEntry = {
  id: string;
  sessionId: string;
  text: string;
  raw: string;
  level: LogLevel;
  time: number;
};

export type DepotOption = {
  id: string;
  manifest?: string;
  size?: string;
  name: string;
  tag?: string;
  kind?: "core" | "language" | "dlc" | "optional";
  hasKey: boolean;
};

export type ParsedCliState = {
  phase?: string;
  progress?: ParsedProgress;
  prompt?: DetectedPrompt;
  depots: DepotOption[];
  lastError?: string;
  doneMessage?: string;
};
