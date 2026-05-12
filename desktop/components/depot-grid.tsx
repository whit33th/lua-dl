"use client";

import type { DepotOption } from "@/lib/cli-types";
import type { WorkflowMode } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LazyMotion, m, domAnimation } from "motion/react";
import { memo, useMemo } from "react";
import { DepotIcon } from "./depot-icon";
import { Skeleton } from "./ui/skeleton";

type DepotGridProps = {
  depots: DepotOption[];
  mode: WorkflowMode;
  downloadAll: boolean;
  selectedDepots: string[];
  onToggleDepot(depotId: string): void;
};

const cardEase = [0.16, 1, 0.3, 1] as const;
const cardSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 34,
  mass: 0.7,
};

export function DepotGrid({
  depots,
  mode,
  downloadAll,
  selectedDepots,
  onToggleDepot,
}: DepotGridProps) {
  const optionalDepots = useMemo(
    () => depots.filter((depot) => depot.kind !== "core"),
    [depots],
  );
  const isLoading = optionalDepots.length === 0 && mode === "probing";

  return (
    <div
      className="relative max-h-[calc(100%-4rem)] overflow-y-auto pr-1"
      style={{
        opacity: downloadAll ? 0.4 : 1,
        pointerEvents: downloadAll ? "none" : "auto",
      }}
    >
      <m.div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        aria-label="Depot selection"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.04,
              delayChildren: isLoading ? 0 : 0.08,
            },
          },
        }}
      >
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => (
              <DepotCardSkeleton key={index} />
            ))
          : optionalDepots.map((depot) => (
              <DepotCard
                key={depot.id}
                depot={depot}
                downloadAll={downloadAll}
                isSelected={selectedDepots.includes(depot.id)}
                onToggle={() => onToggleDepot(depot.id)}
              />
            ))}
      </m.div>
      <div className="sticky bottom-0 left-0 z-10 h-6 w-full bg-linear-to-t from-black to-transparent" />
    </div>
  );
}

const DepotCard = memo(function DepotCard({
  depot,
  downloadAll,
  isSelected,
  onToggle,
}: {
  depot: DepotOption;
  downloadAll: boolean;
  isSelected: boolean;
  onToggle(): void;
}) {
  return (
    <m.label
      className={cn(
        "border-line/50 flex cursor-pointer flex-col items-start gap-2 border bg-black/40 p-2.5 hover:bg-black/60",
        (isSelected || downloadAll) && "border-white/10",
      )}
      data-kind={depot.kind}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, ease: cardEase },
        },
      }}
      transition={cardSpring}
    >
      <div className="flex w-full items-center justify-between">
        <input
          type="checkbox"
          className="accent-text size-4 rounded"
          checked={downloadAll || isSelected}
          disabled={downloadAll}
          onChange={onToggle}
        />
        <DepotIcon kind={depot.kind} />
      </div>

      <div className="flex w-full flex-1 flex-col justify-end">
        <div className="flex w-full items-center justify-between">
          <span className="text-text/90 text-[11px] font-bold tracking-wider uppercase">
            {depot.tag ?? depot.kind ?? "depot"}
          </span>
          <span className="text-dim text-[9px] font-medium">
            {depot.size ? depot.size : depot.id}
          </span>
        </div>
      </div>
    </m.label>
  );
});

function DepotCardSkeleton() {
  return (
    <m.div
      className="border-line flex flex-col items-start gap-2 border bg-black/40 p-2.5"
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.38, ease: cardEase },
        },
      }}
    >
      <div className="flex w-full items-center justify-between">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="size-5 rounded-full" />
      </div>
      <div className="flex w-full flex-1 flex-col justify-end">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2 w-10" />
        </div>
      </div>
    </m.div>
  );
}
