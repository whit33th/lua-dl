"use client";
import { Minus, Settings, Square, X, RefreshCw, AlertCircle, CheckCircle2, Download } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

import FrameButton from "./frame-btn";

export default function Frame() {
  return (
    <header
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      className="flex flex-row justify-between gap-2 border-b border-neutral-200 px-4 py-2"
    >
      <div className="ml-2 flex items-center gap-2">
        {/* <Image src="/imgs/logo.png" alt="Logo" width={18} height={18} /> */}
        <div className="size-4 bg-black"></div>
      </div>

      <div
        className="flex items-center gap-4"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <UpdateIndicator />

        <div className="flex items-center">
          <FrameButton
            height={18}
            width={18}
            icon={Minus}
            onClick={() => (window as any).api.minimize()}
          />
          <FrameButton
            height={12}
            width={12}
            icon={Square}
            onClick={() => (window as any).api.maximize()}
          />
          <FrameButton
            height={18}
            width={18}
            icon={X}
            onClick={() => (window as any).api.close()}
            type="close"
          />
        </div>
      </div>
    </header>
  );
}
function UpdateIndicator() {
  const updateState = useAppStore((state) => state.updateState);
  const setUpdateState = useAppStore((state) => state.setUpdateState);

  const handleClick = () => {
    if (updateState.type === "not-available") {
      void window.luaDl?.checkForUpdates();
    } else {
      // The modal will handle the rest if we ensure it's visible.
      // If it was error or not-available, we might want to reset it or just show it.
    }
  };

  const getIcon = () => {
    switch (updateState.type) {
      case "available":
        return <Download size={16} className="text-blue-400" />;
      case "downloading":
        return <RefreshCw size={16} className="animate-spin text-blue-400" />;
      case "downloaded":
        return <CheckCircle2 size={16} className="text-green-400" />;
      case "error":
        return <AlertCircle size={16} className="text-red-400" />;
      case "checking":
        return <RefreshCw size={16} className="animate-spin text-dim" />;
      default:
        return <RefreshCw size={16} className="text-dim" />;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5",
        updateState.type !== "not-available" && "bg-white/5",
      )}
      title={
        updateState.type === "not-available"
          ? "Check for updates"
          : `Update ${updateState.type}`
      }
    >
      {getIcon()}
      {updateState.type === "available" && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
      )}
    </button>
  );
}
