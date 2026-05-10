"use client";

import type { SteamMetadata } from "@/lib/steam-metadata";
import type { WorkflowMode } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Gamepad2 } from "lucide-react";
import Image from "next/image";
import ShinyText from "./ui/shiny-text";
import { Border } from "./ui/border";
import { Skeleton } from "./ui/skeleton";

type GameSummaryCardProps = {
  metadata?: SteamMetadata;
  mode: WorkflowMode;
};

export function GameSummaryCard({ metadata, mode }: GameSummaryCardProps) {
  return (
    <div className="border-line group relative h-48 flex-none border backdrop-blur-sm">
      <Border />
      <div className="absolute inset-0 overflow-hidden">
        {metadata?.headerImage && (
          <Image
            src={metadata.headerImage}
            width={460}
            height={215}
            alt=""
            className={cn(
              "h-full w-full object-cover opacity-50 blur-xl transition-[filter,opacity,transform] duration-500 ease-in-out group-hover:opacity-70",
              mode === "downloading"
                ? "animate-pulse-slow grayscale-0"
                : "grayscale group-hover:grayscale-0",
            )}
          />
        )}
      </div>
      <div className="relative flex h-full items-center gap-6 p-4">
        <div className="border-line relative aspect-92/43 h-full w-auto flex-none overflow-hidden border bg-black shadow-2xl">
          {metadata?.headerImage ? (
            <Image
              src={metadata.headerImage}
              width={460}
              height={215}
              alt=""
              className={cn(
                "object-cover",
                mode === "downloading" && "animate-pulse-slow",
              )}
              loading="eager"
              priority
              fetchPriority="high"
            />
          ) : mode === "probing" ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <div className="z-11 flex h-full w-full items-center justify-center bg-white/5">
              <Gamepad2 size={48} className="text-white/95" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <GameSummaryTitle metadata={metadata} mode={mode} />
        </div>
      </div>
    </div>
  );
}

function GameSummaryTitle({ metadata, mode }: GameSummaryCardProps) {
  if (metadata) {
    return (
      <h3 className="text-text m-0 line-clamp-3 text-4xl leading-tight font-bold text-wrap">
        <ShinyText text={metadata.name} disabled={false} speed={3} />
      </h3>
    );
  }

  if (mode === "probing") {
    return (
      <>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-2 h-5 w-24" />
      </>
    );
  }

  return (
    <>
      <h3 className="text-text m-0 truncate text-4xl leading-tight font-bold">
        <ShinyText text="Waiting" disabled={false} speed={3} />
      </h3>
      <div className="mt-1 flex items-center gap-2">
        <span className="border-line text-muted rounded border bg-black/90 px-2 py-0.5 text-xs font-bold uppercase">
          Ready
        </span>
      </div>
    </>
  );
}

