"use client";

import { parseSteamAppId } from "@/lib/steam-app-id";
import { searchSteamGames, type SteamSearchResult } from "@/lib/steam-metadata";
import { useEffect, useReducer } from "react";

type SearchState = {
  results: SteamSearchResult[];
  isSearching: boolean;
};

type SearchAction =
  | { type: "reset" }
  | { type: "start" }
  | { type: "done"; games: SteamSearchResult[] };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "reset":
      return { results: [], isSearching: false };
    case "start":
      return { ...state, isSearching: true };
    case "done":
      return { results: action.games, isSearching: false };
    default:
      return state;
  }
}

export function useSteamGameSearch(query: string) {
  const [state, dispatch] = useReducer(searchReducer, {
    results: [],
    isSearching: false,
  });

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || parseSteamAppId(trimmed)) {
      dispatch({ type: "reset" });
      return;
    }

    let cancelled = false;
    dispatch({ type: "start" });
    const timeout = setTimeout(() => {
      void searchSteamGames(trimmed)
        .then((games) => {
          if (!cancelled) dispatch({ type: "done", games });
        })
        .catch(() => {
          if (!cancelled) dispatch({ type: "done", games: [] });
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return {
    results: state.results,
    isSearching: state.isSearching,
    clearResults: () => dispatch({ type: "reset" }),
  };
}
