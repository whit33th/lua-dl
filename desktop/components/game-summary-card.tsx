"use client";

import type { SteamMetadata } from "@/lib/steam-metadata";
import type { WorkflowMode } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CalendarDays, Gamepad2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Border } from "./ui/border";
import { Skeleton } from "./ui/skeleton";

type SteamMovieWithMp4 = NonNullable<SteamMetadata["movies"]>[number] & {
  mp4: string;
};

type GameSummaryCardProps = {
  metadata?: SteamMetadata;
  mode: WorkflowMode;
};

type GameMedia = {
  id: string;
  kind: "screenshot" | "movie";
  thumbnail?: string;
  src: string;
  label: string;
};

const mediaEase = [0.16, 1, 0.3, 1] as const;
const snapSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.7,
};

export function GameSummaryCard({ metadata, mode }: GameSummaryCardProps) {
  const [activeMedia, setActiveMedia] = useState<GameMedia>();
  const [selectedMedia, setSelectedMedia] = useState<GameMedia>();
  const screenshots = useMemo(
    () => metadata?.screenshots?.slice(0, 6) ?? [],
    [metadata?.screenshots],
  );
  const movies = useMemo(
    () =>
      metadata?.movies
        ?.filter((movie): movie is SteamMovieWithMp4 => Boolean(movie.mp4))
        .slice(0, 2) ?? [],
    [metadata?.movies],
  );
  const mediaItems = useMemo<GameMedia[]>(
    () => [
      ...movies.map((movie) => ({
        id: `movie-${movie.id}`,
        kind: "movie" as const,
        thumbnail: movie.thumbnail,
        src: movie.mp4,
        label: movie.name,
      })),
      ...screenshots.map((screenshot) => ({
        id: `screenshot-${screenshot.id}`,
        kind: "screenshot" as const,
        thumbnail: screenshot.thumbnail,
        src: screenshot.full,
        label: `Screenshot ${screenshot.id}`,
      })),
    ],
    [movies, screenshots],
  );
  const firstMovie = mediaItems.find((item) => item.kind === "movie");
  const effectiveMedia = activeMedia ?? selectedMedia ?? firstMovie;
  const activeSrc = effectiveMedia?.src ?? metadata?.headerImage;
  const backdropSrc = effectiveMedia?.thumbnail ?? metadata?.headerImage;

  useEffect(() => {
    setActiveMedia(undefined);
    setSelectedMedia(undefined);
  }, [metadata?.appId]);

  return (
    <motion.div
      className="border-line group relative flex-none border backdrop-blur-sm"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: mediaEase }}
    >
      <Border />
      <div className="absolute inset-0 overflow-x-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-black/20 to-transparent"></div>
        {backdropSrc && (
          <motion.div
            key={`bg-${backdropSrc}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.34, ease: mediaEase }}
          >
            <Image
              src={backdropSrc}
              width={460}
              height={215}
              alt=""
              className={cn(
                "h-full w-full object-cover blur-lg transition-[filter] duration-300 brightness-85 group-hover:brightness-80",
                mode === "downloading" ? "animate-pulse-slow" : "",
              )}
            />
          </motion.div>
        )}
      </div>

      <motion.div
        className="relative flex gap-5 p-5"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.065,
              delayChildren: 0.06,
            },
          },
        }}
      >
        <motion.div
          className="flex w-[460px] flex-none flex-col gap-2"
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.42, ease: mediaEase },
            },
          }}
        >
          <div className="border-line relative aspect-92/43 w-full overflow-hidden border bg-black shadow-2xl">
            {activeSrc ? (
              <motion.div
                key={`main-${effectiveMedia?.id ?? activeSrc}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.24, ease: mediaEase }}
              >
                {effectiveMedia?.kind === "movie" ? (
                  <video
                    src={effectiveMedia.src}
                    poster={effectiveMedia.thumbnail}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <Image
                    src={activeSrc}
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
                )}
              </motion.div>
            ) : mode === "probing" ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="z-11 flex h-full w-full items-center justify-center bg-white/5">
                <Gamepad2 size={48} className="text-white/95" />
              </div>
            )}
          </div>

          <ScreenshotStrip
            items={mediaItems}
            selectedId={selectedMedia?.id}
            onPreview={setActiveMedia}
            onSelect={setSelectedMedia}
          />
        </motion.div>

        <motion.div
          className="flex min-w-0 flex-1 flex-col justify-start pt-3"
          variants={{
            hidden: { opacity: 0, x: 12 },
            show: {
              opacity: 1,
              x: 0,
              transition: { duration: 0.44, ease: mediaEase },
            },
          }}
        >
          <GameSummaryDetails metadata={metadata} mode={mode} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function GameSummaryDetails({ metadata, mode }: GameSummaryCardProps) {
  if (metadata) {
    const tags = [...(metadata.genres ?? []), ...(metadata.categories ?? [])]
      .map((tag) => tag.description)
      .filter((tag, index, all) => all.indexOf(tag) === index)
      .slice(0, 5);

    return (
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: mediaEase }}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className="text-text m-0 line-clamp-2 text-3xl leading-none font-bold tracking-tight">
            {metadata.name}
          </h3>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <motion.span
              key={tag}
              className="max-w-32 truncate bg-white/12 px-2 py-1 text-[10px] leading-none font-black tracking-wide text-white/85 uppercase shadow-[inset_2px_0_0_rgba(255,255,255,0.35)]"
              whileHover={{ y: -1, backgroundColor: "rgba(255,255,255,0.16)" }}
              transition={snapSpring}
            >
              {tag}
            </motion.span>
          ))}
        </div>

        <div className="text-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
          {metadata.releaseDate ? (
            <span className="flex items-center gap-1.5 leading-none">
              <CalendarDays
                size={16}
                className="text-white/80"
                aria-hidden="true"
              />
              {metadata.releaseDate}
            </span>
          ) : null}
          {metadata.releaseDate && metadata.metacriticScore ? (
            <span className="text-xs text-white/20">|</span>
          ) : null}
          {metadata.metacriticScore ? (
            <span className="flex flex-none items-center gap-1.5 text-sm leading-none font-black text-yellow-300 tabular-nums">
              <Image
                src="https://www.metacritic.com/favicon.ico"
                unoptimized
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
          <p className="text-muted mt-3 line-clamp-6 text-xs leading-relaxed text-shadow-2xs">
            {metadata.shortDescription}
          </p>
        ) : null}
      </motion.div>
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
  items,
  selectedId,
  onPreview,
  onSelect,
}: {
  items: GameMedia[];
  selectedId?: string;
  onPreview(value?: GameMedia): void;
  onSelect?(value: GameMedia): void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

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
        className="absolute top-0 bottom-0 left-0 z-10 flex cursor-pointer items-center border-none bg-black/0 px-1 text-[11px] font-bold text-white/0 group-hover/strip:bg-black/40 group-hover/strip:text-white/60 hover:bg-black/60! hover:text-white!"
        aria-label="Scroll left"
      >
        ‹
      </button>
      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scrollBy(120)}
        className="absolute top-0 right-0 bottom-0 z-10 flex cursor-pointer items-center border-none bg-black/0 px-1 text-[11px] font-bold text-white/0 group-hover/strip:bg-black/40 group-hover/strip:text-white/60 hover:bg-black/60! hover:text-white!"
        aria-label="Scroll right"
      >
        ›
      </button>

      <motion.div
        ref={scrollRef}
        onWheel={onWheel}
        className="scrollbar-hide flex gap-1.5 overflow-x-auto scroll-smooth pr-1"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.035,
              delayChildren: 0.12,
            },
          },
        }}
      >
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <motion.button
              key={item.id}
              type="button"
              className={cn(
                "border-line relative h-12 w-20 flex-none overflow-x-hidden border bg-white/5 opacity-80",
                isSelected && "border-white/20 opacity-100",
              )}
              variants={{
                hidden: { opacity: 0, y: 8},
                show: {
                  opacity: 0.8,
                  y: 0,
                  transition: { duration: 0.36, ease: mediaEase },
                },
              }}
              animate={isSelected ? { opacity: 1, y: -1 } : undefined}
              whileHover={{ opacity: 1, y: -2, scale: 1.025 }}
              whileTap={{ scale: 0.985 }}
              transition={snapSpring}
              onMouseEnter={() => onPreview(item)}
              onFocus={() => onPreview(item)}
              onMouseLeave={() => onPreview(undefined)}
              onBlur={() => onPreview(undefined)}
              onClick={() => onSelect?.(item)}
            >
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  width={120}
                  height={72}
                  alt={item.label}
                  className="h-full w-full object-cover"
                />
              ) : null}
              {item.kind === "movie" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-[10px] font-black text-white">
                  ▶
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
