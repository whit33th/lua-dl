import { Box, Heart } from "lucide-react";
import Image from "next/image";
import React from "react";

type Props = {
  championKey: string; // e.g. "Jinx"
  skinNum: number; // skin num like 60
  skinName?: string;
  index?: number; // for loading priority
};

export default function SkinCard({
  championKey,
  skinNum,
  skinName,
  index = 0,
}: Props) {
  // CommunityDragon splash path pattern uses champion key (lowercase) and skin num
  // We'll build a conservative URL that should work for most skins. If a skinNum is 0, use square champion icon instead.
  // Use DataDragon splash images which follow a stable pattern:
  // https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{ChampionKey}_{skinNum}.jpg
  // Fallback to champion icon when skinNum is 0 or not provided.
  const splashUrl =
    typeof skinNum === "number" && skinNum > 0
      ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${encodeURIComponent(
        championKey,
      )}_${skinNum}.jpg`
      : `https://ddragon.leagueoflegends.com/cdn/15.20.1/img/champion/${encodeURIComponent(
        championKey,
      )}.png`;

  return (
    <div className="group relative aspect-[2/3] border border-white/10 bg-gradient-to-b from-transparent to-black/20">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Image
          src={splashUrl}
          alt={`${championKey} ${skinName ?? ""}`}
          fill
          className="h-full w-full object-cover object-center p-3"
          loading={index > 8 ? "lazy" : "eager"}
          priority={index <= 8}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/80 to-transparent" />
      </div>
      <Details skinName={skinName} />
      <Border />
    </div>
  );
}

function Details({ skinName }: { skinName?: string }) {
  return (
    <div className="group/detail">
      <div className="absolute right-0 bottom-0 left-0 flex min-w-0 flex-col bg-black/60 p-4 backdrop-blur-md">
        <p className="truncate text-sm font-semibold">
          {skinName ?? "Unknown Skin"}
        </p>

        <div className="max-h-0 overflow-hidden transition-[max-height] duration-200 ease-in-out group-hover/detail:max-h-12">
          <div className="mt-2 ml-auto flex items-center gap-2">
            <button
              aria-label="Like"
              className="items-center justify-center rounded-md p-2 text-white/90 transition-colors hover:bg-white/10"
            >
              <Heart size={16} />
            </button>

            <button
              aria-label="3D Preview"
              className="items-center justify-center rounded-md p-2 text-white/90 transition-colors hover:bg-white/10"
            >
              <Box size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Border() {
  return (
    <>
      <figure className="absolute top-0 left-0 h-1 w-1 origin-top-left -translate-x-1/2 -translate-y-1/2 bg-white/80  " />
      <figure className="absolute top-0 right-0 h-1 w-1 origin-top-right translate-x-1/2 -translate-y-1/2 bg-white/80  " />
      <figure className="translate-y/1/2 absolute right-0 bottom-0 h-1 w-1 origin-bottom-right translate-x-1/2 translate-y-1/2 bg-white/80  " />
      <figure className="absolute bottom-0 left-0 h-1 w-1 origin-bottom-left -translate-x-1/2 translate-y-1/2 bg-white/80  " />
    </>
  );
}
