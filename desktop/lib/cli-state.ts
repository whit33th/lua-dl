import type { CliEvent } from "@/electron/ipc-contract";
import { mergeDepots, parseDepotOptions } from "./cli-depots";
import { normalizeCliOutput } from "./cli-text";
import type { ParsedCliState } from "./cli-types";

export function reduceCliState(
  current: ParsedCliState,
  event: CliEvent,
): ParsedCliState {
  if (event.type === "output") {
    const text = normalizeCliOutput(event.clean);
    const depots = mergeDepots(current.depots, parseDepotOptions(text));
    return {
      ...current,
      phase: parsePhase(text) ?? current.phase,
      progress: event.progress ?? current.progress,
      prompt: event.prompt ?? current.prompt,
      depots,
      lastError: parseError(text) ?? current.lastError,
      doneMessage: parseDone(text) ?? current.doneMessage,
    };
  }

  if (event.type === "exit") {
    return {
      ...current,
      prompt: undefined,
      doneMessage:
        event.exitCode === 0
          ? (current.doneMessage ?? "Process finished successfully.")
          : current.doneMessage,
      lastError:
        event.exitCode === 0
          ? current.lastError
          : (current.lastError ??
            `Process exited with code ${event.exitCode}.`),
    };
  }

  if (event.type === "error") {
    return {
      ...current,
      lastError: event.message,
      prompt: undefined,
    };
  }

  return current;
}

function parsePhase(text: string) {
  const lines = text.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    return trimmed ? [trimmed] : [];
  });
  return lines.find((line) => line.startsWith("▸"))?.replace(/^▸\s*/, "");
}

function parseError(text: string) {
  const line = text
    .split("\n")
    .find((item) => /^error:/i.test(item.trim()) || /\bfailed:/i.test(item));
  return line?.trim();
}

function parseDone(text: string) {
  const line = text.split("\n").find((item) => /done in/i.test(item));
  return line?.trim();
}
