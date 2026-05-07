"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { parseSteamAppId } from "@/lib/cli-parser";
import { searchSteamGames, type SteamSearchResult } from "@/lib/steam-metadata";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Border } from "./ui/Squire-Border";

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
  const [results, setResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const skipSearchRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedIndex >= 0 && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      void searchSteamGames(value)
        .then((data) => {
          setResults(data);
          setShowDropdown(data.length > 0);
          setSelectedIndex(data.length > 0 ? 0 : -1);
        })
        .finally(() => setIsSearching(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (showDropdown && selectedIndex >= 0 && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
      return;
    }

    const appId = parseSteamAppId(value);
    if (!appId) {
      setError("Enter a numeric Steam App ID or select from results.");
      return;
    }
    setError("");
    skipSearchRef.current = true;
    onSubmit(appId);
    setShowDropdown(false);
    setResults([]);
  }

  function handleSelect(result: SteamSearchResult) {
    skipSearchRef.current = true;
    setValue(result.id.toString());
    onSubmit(result.id.toString());
    setShowDropdown(false);
    setResults([]);
    setSelectedIndex(-1);
    setError("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
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
          Steam App ID or Name
        </label>
        <div className="flex items-center pl-4 text-text/40">
          <Search size={20} />
        </div>
        <input
          id="app-id"
          placeholder="Steam Game ID or Name"
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
            "relative flex h-16 w-auto items-center aspect-square justify-center border-l border-line transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-42",
            value && !isLoading && !disabled
              ? "bg-text text-black hover:bg-white"
              : "bg-black text-text/40 hover:bg-white/10 hover:text-text",
          )}
        >
          {isLoading || isSearching ? (
            <Loader2 className="animate-spin" size={24} aria-hidden="true" />
          ) : (
            <ArrowRight size={24} aria-hidden="true" />
          )}
        </button>
      </form>

      {/* Results Dropdown */}
      {showDropdown && results.length > 0 && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div
            ref={scrollContainerRef}
            className={cn(
              "border-line absolute top-full left-0 z-50 mt-2 w-full max-h-72 overflow-y-auto rounded-b-xl border p-2 shadow-2xl backdrop-blur-xl",
              isSplash ? "bg-black/60" : "bg-black/80",
            )}
          >
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xs p-2 text-left transition-colors",
                  selectedIndex === index
                    ? "bg-white/20 shadow-lg"
                    : "hover:bg-white/10",
                )}
              >
                <div className="relative aspect-8/3 flex-none overflow-hidden border border-white/10 bg-black/40">
                  <Image
                    width={120}
                    height={45}
                    src={result.tiny_image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-text truncate text-sm font-bold">
                    {result.name}
                  </span>
                  <span className="text-dim text-[10px] font-mono">
                    ID: {result.id}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

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
