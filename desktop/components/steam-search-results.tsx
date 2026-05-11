"use client";

import type { SteamSearchResult } from "@/lib/steam-metadata";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { RefObject } from "react";

type SteamSearchResultsProps = {
  results: SteamSearchResult[];
  isOpen: boolean;
  isSplash?: boolean;
  selectedIndex: number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onSelect(result: SteamSearchResult): void;
  onDismiss(): void;
};

export function SteamSearchResults({
  results,
  isOpen,
  isSplash,
  selectedIndex,
  scrollContainerRef,
  onSelect,
  onDismiss,
}: SteamSearchResultsProps) {
  if (!isOpen || results.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onDismiss} />
      <div
        ref={scrollContainerRef}
        className={cn(
          "border-line absolute top-full left-0 z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-b-xl border p-2 shadow-2xl backdrop-blur-xl",
          isSplash ? "bg-black/60" : "bg-black/80",
        )}
      >
        {results.map((result, index) => (
          <button
            key={result.id}
            onClick={() => onSelect(result)}
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
                loading="eager"
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-text truncate text-sm font-bold">
                {result.name}
              </span>
              <span className="text-dim font-mono text-[10px]">
                ID: {result.id}
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
