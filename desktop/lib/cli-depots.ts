import type { DepotOption } from "./cli-types";

const depotLineRegex =
  /^\s*(?<key>(?:✓|v|x|\S+\s+key|\s*))\s*(?<id>\d{3,})\s+manifest=(?<manifest>\d+)(?:\s+\((?<size>[^)]+)\))?\s*(?<name>.*)$/i;
const parsedDepotLineRegex =
  /^\s*(?<id>\d{3,})\s+key=(?<key>[^ ]+)(?:\s+manifest=(?<manifest>\d+))?(?:\s+[—-]\s+(?<name>.+))?\s*$/i;
const pickerDepotLineRegex =
  /^\s*(?:>?\s*)?\[(?<selected>[ x])\]\s+\[(?<tag>[^\]]+)\]\s+(?<id>\d{3,})(?:\s+(?<name>.+))?\s*$/i;

export function parseDepotOptions(text: string): DepotOption[] {
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
        kind: depotKindFromBackendTag(tag),
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

export function mergeDepots(existing: DepotOption[], next: DepotOption[]) {
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

function decorateDepotOptions(depots: DepotOption[]) {
  if (depots.length === 0) {
    return depots;
  }

  if (depots.some((depot) => depot.tag || depot.kind)) {
    return depots.map((depot) => ({
      ...depot,
      kind: depot.kind ?? depotKindFromBackendTag(depot.tag),
    }));
  }

  return depots;
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

function depotKindFromBackendTag(tag?: string): DepotOption["kind"] {
  const normalized = tag?.toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized === "core") {
    return "core";
  }
  if (normalized === "dlc") {
    return "dlc";
  }
  return "language";
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
