import type { CliEvent } from "@/electron/ipc-contract";
import { normalizeCliOutput } from "./cli-text";
import type { LogEntry, LogLevel } from "./cli-types";

export function cliEventToLog(event: CliEvent): LogEntry | undefined {
  if (event.type !== "output") {
    if (event.type === "exit") {
      return {
        id: `${event.sessionId}-${event.time}-exit`,
        sessionId: event.sessionId,
        text:
          event.exitCode === 0
            ? "Process finished successfully."
            : `Process exited with code ${event.exitCode}.`,
        raw: "",
        level: event.exitCode === 0 ? "success" : "error",
        time: event.time,
      };
    }
    if (event.type === "error") {
      return {
        id: `${event.sessionId}-${event.time}-error`,
        sessionId: event.sessionId,
        text: event.message,
        raw: event.message,
        level: "error",
        time: event.time,
      };
    }
    return undefined;
  }

  const text = normalizeCliOutput(event.clean);
  if (!text) {
    return undefined;
  }

  return {
    id: `${event.sessionId}-${event.time}-${Math.random().toString(16).slice(2)}`,
    sessionId: event.sessionId,
    text,
    raw: event.chunk,
    level: inferLogLevel(text, event),
    time: event.time,
  };
}

function inferLogLevel(text: string, event: CliEvent): LogLevel {
  if (event.type === "output" && event.prompt) {
    return "prompt";
  }
  if (event.type === "output" && event.progress) {
    return "progress";
  }
  if (/^error:|failed|cancelled/i.test(text)) {
    return "error";
  }
  if (/done in|process finished/i.test(text)) {
    return "success";
  }
  return "info";
}
