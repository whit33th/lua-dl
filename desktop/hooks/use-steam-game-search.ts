"use client";

import { parseSteamAppId } from "@/lib/steam-app-id";
import { searchSteamGames, type SteamSearchResult } from "@/lib/steam-metadata";
import { useEffect, useState } from "react";

export function useSteamGameSearch(query: string) {
  const [results, setResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || parseSteamAppId(trimmed)) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timeout = setTimeout(() => {
      void searchSteamGames(trimmed)
        .then((games) => {
          if (!cancelled) {
            setResults(games);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return { results, isSearching, clearResults: () => setResults([]) };
}
