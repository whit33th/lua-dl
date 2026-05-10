"use client";

import type { DepotOption } from "@/lib/cli-types";
import type { WorkflowMode } from "@/lib/store";
import { DepotIcon } from "./depot-icon";
import { Skeleton } from "./ui/skeleton";

type DepotGridProps = {
  depots: DepotOption[];
  mode: WorkflowMode;
  downloadAll: boolean;
  selectedDepots: string[];
  onToggleDepot(depotId: string): void;
};

export function DepotGrid({
  depots,
  mode,
  downloadAll,
  selectedDepots,
  onToggleDepot,
}: DepotGridProps) {
  const optionalDepots = depots.filter((depot) => depot.kind !== "core");
  const isLoading = optionalDepots.length === 0 && mode === "probing";

  return (
    <div
      className="relative max-h-[calc(100%-4rem)] overflow-y-auto pr-1 transition-opacity"
      style={{
        opacity: downloadAll ? 0.4 : 1,
        pointerEvents: downloadAll ? "none" : "auto",
      }}
    >
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        aria-label="Depot selection"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
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
      </div>
      <div className="sticky bottom-0 left-0 z-10 h-6 w-full bg-linear-to-t from-black to-transparent" />
    </div>
  );
}

function DepotCard({
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
    <label
      className="border-line flex cursor-pointer flex-col items-start gap-2 rounded-xl border bg-black/40 p-2.5 transition-[background-color,border-color] hover:bg-black/60"
      data-kind={depot.kind}
    >
      <div className="flex w-full items-center justify-between">
        <input
          type="checkbox"
          className="accent-text h-4 w-4 rounded"
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
    </label>
  );
}

function DepotCardSkeleton() {
  return (
    <div className="border-line flex flex-col items-start gap-2 rounded-xl border bg-black/40 p-2.5">
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="flex w-full flex-1 flex-col justify-end">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2 w-10" />
        </div>
      </div>
    </div>
  );
}
