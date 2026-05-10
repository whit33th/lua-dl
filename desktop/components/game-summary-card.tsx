"use client";

import type { SteamMetadata } from "@/lib/steam-metadata";
import type { WorkflowMode } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Gamepad2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Border } from "./ui/border";
import { Skeleton } from "./ui/skeleton";

type GameSummaryCardProps = {
  metadata?: SteamMetadata;
  mode: WorkflowMode;
};

export function GameSummaryCard({ metadata, mode }: GameSummaryCardProps) {
  const [previewImage, setPreviewImage] = useState<string>();
  const screenshots = useMemo(
    () => metadata?.screenshots?.slice(0, 6) ?? [],
    [metadata?.screenshots],
  );
  const displayImage = previewImage ?? metadata?.headerImage;

  return (
    <div className="border-line group relative flex-none border backdrop-blur-sm">
      <Border />
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence initial={false}>
          {displayImage && (
            <motion.div
              key={`bg-${displayImage}`}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            >
              <Image
                src={displayImage}
                fill
                sizes="100vw"
                alt=""
                className={cn(
                  "object-cover opacity-50 blur-xl transition-[filter,opacity,transform] duration-500 ease-in-out group-hover:opacity-70",
                  mode === "downloading"
                    ? "animate-pulse-slow grayscale-0"
                    : "grayscale group-hover:grayscale-0",
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex gap-5 p-5">
        {/* Left: main image + horizontal thumbnails */}
        <div className="flex w-[460px] flex-none flex-col gap-2">
          <div className="border-line relative aspect-92/43 w-full overflow-hidden border bg-black shadow-2xl">
            {displayImage ? (
              <AnimatePresence initial={false}>
                <motion.div
                  key={`main-${displayImage}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                >
                  <Image
                    src={displayImage}
                    fill
                    sizes="460px"
                    alt=""
                    className={cn(
                      "object-cover",
                      mode === "downloading" && "animate-pulse-slow",
                    )}
                    loading="eager"
                    priority
                    fetchPriority="high"
                  />
                </motion.div>
              </AnimatePresence>
            ) : mode === "probing" ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="z-11 flex h-full w-full items-center justify-center bg-white/5">
                <Gamepad2 size={48} className="text-white/95" />
              </div>
            )}
          </div>

          <ScreenshotStrip
            screenshots={screenshots}
            onPreview={setPreviewImage}
          />
        </div>

        {/* Right: info */}
        <div className="flex min-w-0 flex-1 flex-col justify-start pt-3">
          <GameSummaryDetails metadata={metadata} mode={mode} />
        </div>
      </div>
    </div>
  );
}

function GameSummaryDetails({ metadata, mode }: GameSummaryCardProps) {
  if (metadata) {
    const tags = [...(metadata.genres ?? []), ...(metadata.categories ?? [])]
      .map((tag) => tag.description)
      .filter((tag, index, all) => all.indexOf(tag) === index)
      .slice(0, 5);

    return (
      <div className="flex flex-col gap-1">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className="text-text m-0 line-clamp-2 text-3xl leading-none font-bold tracking-tight">
            {metadata.name}
          </h3>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="max-w-32 truncate bg-white/12 px-2 py-1 text-[10px] leading-none font-black tracking-wide text-white/85 uppercase shadow-[inset_2px_0_0_rgba(255,255,255,0.35)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="text-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
          {metadata.releaseDate ? <span>{metadata.releaseDate}</span> : null}
          {metadata.metacriticScore ? (
            <span className="flex flex-none items-center gap-1.5 text-sm leading-none font-black text-yellow-300 tabular-nums">
              <Image
                src="https://www.metacritic.com/favicon.ico"
                width={14}
                height={14}
                alt=""
                className="rounded-xs"
              />
              {metadata.metacriticScore}
            </span>
          ) : null}
          {metadata.developers?.[0] ? (
            <span className="truncate">{metadata.developers[0]}</span>
          ) : null}
        </div>

        {metadata.shortDescription ? (
          <p className="text-muted mt-3 line-clamp-3 text-xs leading-relaxed">
            {metadata.shortDescription}
          </p>
        ) : null}
      </div>
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
        Waiting
      </h3>
      <div className="mt-1 flex items-center gap-2">
        <span className="border-line text-muted rounded border bg-black/90 px-2 py-0.5 text-xs font-bold uppercase">
          Ready
        </span>
      </div>
    </>
  );
}

function ScreenshotStrip({
  screenshots,
  onPreview,
}: {
  screenshots: NonNullable<SteamMetadata["screenshots"]>;
  onPreview(value?: string): void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (screenshots.length === 0) return null;

  const scrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scrollRef.current.scrollBy({ left: e.deltaY, behavior: "auto" });
    }
  };

  return (
    <div className="group/strip relative w-full">
      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scrollBy(-120)}
        className="absolute top-0 bottom-0 left-0 z-10 flex cursor-pointer items-center border-none bg-black/0 px-1 text-[11px] font-bold text-white/0 transition-all duration-200 group-hover/strip:bg-black/40 group-hover/strip:text-white/60 hover:!bg-black/60 hover:!text-white"
        aria-label="Scroll left"
      >
        ‹
      </button>
      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scrollBy(120)}
        className="absolute top-0 right-0 bottom-0 z-10 flex cursor-pointer items-center border-none bg-black/0 px-1 text-[11px] font-bold text-white/0 transition-all duration-200 group-hover/strip:bg-black/40 group-hover/strip:text-white/60 hover:!bg-black/60 hover:!text-white"
        aria-label="Scroll right"
      >
        ›
      </button>

      <div
        ref={scrollRef}
        onWheel={onWheel}
        className="scrollbar-hide flex gap-1.5 overflow-x-auto scroll-smooth pr-1"
      >
        {screenshots.map((screenshot) => (
          <button
            key={screenshot.id}
            type="button"
            className="border-line relative h-12 w-20 flex-none overflow-hidden border bg-white/5 opacity-80 transition hover:opacity-100"
            onMouseEnter={() => onPreview(screenshot.full)}
            onFocus={() => onPreview(screenshot.full)}
            onMouseLeave={() => onPreview(undefined)}
            onBlur={() => onPreview(undefined)}
          >
            <Image
              src={screenshot.thumbnail}
              width={120}
              height={72}
              alt={`Screenshot ${screenshot.id}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
