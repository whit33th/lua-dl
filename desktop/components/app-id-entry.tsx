"use client";

import { useSteamGameSearch } from "@/hooks/use-steam-game-search";
import { parseSteamAppId } from "@/lib/steam-app-id";
import type { SteamSearchResult } from "@/lib/steam-metadata";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { SteamSearchResults } from "./steam-search-results";
import { Border } from "./ui/border";

type AppIdEntryProps = {
  onSubmit(appId: string): void;
  isLoading: boolean;
  disabled?: boolean;
  isSplash?: boolean;
};

export function AppIdEntry({
  onSubmit,
  isLoading,
  disabled,
  isSplash,
}: AppIdEntryProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { results, isSearching, clearResults } = useSteamGameSearch(value);

  useEffect(() => {
    setShowDropdown(results.length > 0);
    setSelectedIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  useEffect(() => {
    if (selectedIndex >= 0 && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.children[
        selectedIndex
      ] as HTMLElement;
      activeElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (showDropdown && selectedIndex >= 0 && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
      return;
    }

    const appId = parseSteamAppId(value);
    if (!appId) {
      setError("Select a game from search results.");
      return;
    }

    setError("");
    setShowDropdown(false);
    clearResults();
    onSubmit(appId);
    setValue("");
  }

  function handleSelect(result: SteamSearchResult) {
    const appId = result.id.toString();
    setValue("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    setError("");
    clearResults();
    onSubmit(appId);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((previous) => (previous + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (previous) => (previous - 1 + results.length) % results.length,
      );
    } else if (event.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div className="relative w-full">
      <form
        className="border-line relative flex w-full items-stretch bg-black/80 font-mono transition-colors focus-within:bg-black"
        onSubmit={handleSubmit}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
      >
        <Border />
        <label className="sr-only" htmlFor="app-id">
          Game name
        </label>
        <div className="text-text/40 flex items-center pl-4">
          <Search size={20} />
        </div>
        <input
          id="app-id"
          placeholder="Game name"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "app-id-error" : undefined}
          className="text-text placeholder:text-text/30 relative h-16 w-full min-w-0 bg-transparent px-4 text-2xl font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isLoading}
        />
        <button
          type="submit"
          aria-label="Inspect App ID"
          disabled={disabled || isLoading || !value}
          className={cn(
            "border-line relative flex aspect-square h-16 w-auto items-center justify-center border-l transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-42",
            value && !isLoading && !disabled
              ? "bg-text text-black hover:bg-white"
              : "text-text/40 hover:text-text bg-transparent hover:bg-white/10",
          )}
        >
          {isLoading || isSearching ? (
            <Loader2 className="animate-spin" size={24} aria-hidden="true" />
          ) : (
            <ArrowRight size={24} aria-hidden="true" />
          )}
        </button>
      </form>

      <SteamSearchResults
        results={results}
        isOpen={showDropdown && !disabled}
        isSplash={isSplash}
        selectedIndex={selectedIndex}
        scrollContainerRef={scrollContainerRef}
        onSelect={handleSelect}
        onDismiss={() => setShowDropdown(false)}
      />

      {error ? (
        <p
          id="app-id-error"
          className="absolute top-full left-0 mt-2 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
