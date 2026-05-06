"use client";
import { Minus, Settings, Square, X } from "lucide-react";
import Link from "next/link";
import React from "react";

import FrameButton from "./frame-btn";
import ASCIIText from "./ASCIIText";

export default function Frame() {
  return (
    <header
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      className="flex flex-row justify-between gap-2 px-4 py-2  border-b border-neutral-200"
    >
      <div className="ml-2 flex items-center gap-2">
        {/* <Image src="/imgs/logo.png" alt="Logo" width={18} height={18} /> */}
        <div className="size-4 bg-black"></div>

      </div>

      <div
        className="flex items-center gap-4"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2">
          <Link className="flex justify-center" href="/">
            <Settings height={18} width={18} />
          </Link>
        </div>

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
