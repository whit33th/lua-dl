"use client";

import { cn } from "@/lib/utils";

type TechChipProps = {
  videoSrc: string;
  videoClassName?: string;
};

function TechChip({ videoSrc, videoClassName }: TechChipProps) {
  return (
    <div className="relative size-12 overflow-hidden rounded-[1px]">
      {/* Corner crosshairs */}
      <div className="absolute -top-3 left-4 h-3 w-[0.5px] bg-white/20" />
      <div className="absolute top-4 -left-3 h-[0.5px] w-3 bg-white/20" />
      <div className="absolute -top-3 right-4 h-3 w-[0.5px] bg-white/20" />
      <div className="absolute top-4 -right-3 h-[0.5px] w-3 bg-white/20" />
      <div className="absolute -bottom-3 left-4 h-3 w-[0.5px] bg-white/20" />
      <div className="absolute bottom-4 -left-3 h-[0.5px] w-3 bg-white/20" />
      <div className="absolute right-4 -bottom-3 h-3 w-[0.5px] bg-white/20" />
      <div className="absolute -right-3 bottom-4 h-[0.5px] w-3 bg-white/20" />

      <video
        src={videoSrc}
        autoPlay
        loop
        muted
        preload="auto"
        playsInline
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          videoClassName,
        )}
      />
    </div>
  );
}

export function TechDecorativeCards() {
  return (
    <div className="mt-auto flex w-full justify-end">
      <TechChip videoSrc="videos/circle.mp4" videoClassName="grayscale" />
    </div>
  );
}
