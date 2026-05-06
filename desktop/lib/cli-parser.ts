import type {
  CliEvent,
  DetectedPrompt,
  ParsedProgress,
} from "@/electron/ipc-contract";

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

const depotLineRegex =
  /^\s*(?<key>(?:✓|v|x|\S+\s+key|\s*))\s*(?<id>\d{3,})\s+manifest=(?<manifest>\d+)(?:\s+\((?<size>[^)]+)\))?\s*(?<name>.*)$/i;
const parsedDepotLineRegex =
  /^\s*(?<id>\d{3,})\s+key=(?<key>[^ ]+)(?:\s+manifest=(?<manifest>\d+))?(?:\s+[—-]\s+(?<name>.+))?\s*$/i;
const pickerDepotLineRegex =
  /^\s*(?:>?\s*)?\[(?<selected>[ x])\]\s+\[(?<tag>[^\]]+)\]\s+(?<id>\d{3,})(?:\s+(?<name>.+))?\s*$/i;

const languageTags = [
  "english",
  "german",
  "spanish",
  "latam",
  "french",
  "italian",
  "japanese",
  "koreana",
  "polish",
  "brazilian",
  "russian",
  "turkish",
  "schinese",
  "tchinese",
];

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

  const text = normalizeOutput(event.clean);
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

export function reduceCliState(
  current: ParsedCliState,
  event: CliEvent,
): ParsedCliState {
  if (event.type === "output") {
    const text = normalizeOutput(event.clean);
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

export function parseCommandLine(input: string) {
  const tokens = input.match(/"([^"]*)"|'([^']*)'|\S+/g) ?? [];
  return tokens.map((token) => token.replace(/^["']|["']$/g, ""));
}

export function parseSteamAppId(input: string) {
  const trimmed = input.trim();
  return /^\d{2,12}$/.test(trimmed) ? trimmed : undefined;
}

function normalizeOutput(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

function parsePhase(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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

function parseDepotOptions(text: string): DepotOption[] {
  const out: DepotOption[] = [];
  for (const line of text.split("\n")) {
    const pickerMatch = pickerDepotLineRegex.exec(line);
    if (pickerMatch?.groups) {
      const tag = pickerMatch.groups.tag.trim();
      out.push({
        id: pickerMatch.groups.id,
        name:
          pickerMatch.groups.name?.trim() ||
          depotDisplayName(pickerMatch.groups.id, tag),
        tag,
        kind: tag.toLowerCase() === "dlc" ? "dlc" : "language",
        hasKey: true,
      });
      continue;
    }

    const match = depotLineRegex.exec(line);
    if (match?.groups) {
      out.push({
        id: match.groups.id,
        manifest: match.groups.manifest,
        size: match.groups.size,
        name: match.groups.name.trim() || `Depot ${match.groups.id}`,
        hasKey: /key|✓/i.test(match.groups.key),
      });
      continue;
    }

    const parsedMatch = parsedDepotLineRegex.exec(line);
    if (parsedMatch?.groups) {
      out.push({
        id: parsedMatch.groups.id,
        manifest: parsedMatch.groups.manifest,
        name:
          parsedMatch.groups.name?.trim() || `Depot ${parsedMatch.groups.id}`,
        hasKey: !parsedMatch.groups.key.startsWith("(no"),
      });
    }
  }
  return decorateDepotOptions(out);
}

function decorateDepotOptions(depots: DepotOption[]) {
  if (depots.length === 0 || depots.some((depot) => depot.tag || depot.kind)) {
    return depots;
  }

  // Go's probe output does not expose language/DLC labels. The picker does,
  // and Steam commonly orders language depots this way after required core
  // depots. This keeps the UI readable without changing the Go binary.
  if (depots.length >= 8) {
    const coreCount = depots.length >= languageTags.length + 2 ? 2 : 1;
    return depots.map((depot, index) => {
      if (index < coreCount) {
        return {
          ...depot,
          tag: "core",
          kind: "core" as const,
          name: depot.name.startsWith("Depot ")
            ? `Required depot ${depot.id}`
            : depot.name,
        };
      }

      const language = languageTags[index - coreCount];
      if (language) {
        return {
          ...depot,
          tag: language,
          kind: "language" as const,
          name: depotDisplayName(depot.id, language),
        };
      }

      return {
        ...depot,
        tag: "DLC",
        kind: "dlc" as const,
        name: depot.name.startsWith("Depot ")
          ? `Optional content ${depot.id}`
          : depot.name,
      };
    });
  }

  return depots.map((depot, index) =>
    index === 0
      ? {
          ...depot,
          tag: "core",
          kind: "core" as const,
          name: depot.name.startsWith("Depot ")
            ? `Required depot ${depot.id}`
            : depot.name,
        }
      : depot,
  );
}

function depotDisplayName(id: string, tag: string) {
  const normalized = tag.toLowerCase();
  if (normalized === "dlc") {
    return `Optional content ${id}`;
  }
  if (normalized === "core") {
    return `Required depot ${id}`;
  }
  return `${languageLabel(normalized)} language pack`;
}

function languageLabel(tag: string) {
  const labels: Record<string, string> = {
    english: "English",
    german: "German",
    spanish: "Spanish",
    latam: "Latin American Spanish",
    french: "French",
    italian: "Italian",
    japanese: "Japanese",
    koreana: "Korean",
    polish: "Polish",
    brazilian: "Brazilian Portuguese",
    russian: "Russian",
    turkish: "Turkish",
    schinese: "Simplified Chinese",
    tchinese: "Traditional Chinese",
  };
  return labels[tag] ?? tag;
}

function mergeDepots(existing: DepotOption[], next: DepotOption[]) {
  if (next.length === 0) {
    return existing;
  }

  const byId = new Map(existing.map((depot) => [depot.id, depot]));
  for (const depot of next) {
    const previous = byId.get(depot.id);
    byId.set(depot.id, {
      ...previous,
      ...depot,
      name:
        depot.name && !depot.name.startsWith("Depot ")
          ? depot.name
          : (previous?.name ?? depot.name),
      tag: depot.tag ?? previous?.tag,
      kind: depot.kind ?? previous?.kind,
    });
  }
  return decorateDepotOptions(Array.from(byId.values()));
}
