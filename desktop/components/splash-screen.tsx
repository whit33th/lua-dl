"use client";

import { AppIdEntry } from "./app-id-entry";
import ASCIIText from "./ui/ascii-text";
import Noise from "./ui/noise";
import SplashCursor from "./ui/splash-cursor";
import { SettingsPanel } from "./settings-panel";

type SplashScreenProps = {
  isPending: boolean;
  isSettingsOpen: boolean;
  onInspect(appId: string): void;
  onCloseSettings(): void;
};

export function SplashScreen({
  isPending,
  isSettingsOpen,
  onInspect,
  onCloseSettings,
}: SplashScreenProps) {
  return (
    <div className="relative z-0 flex h-full w-full flex-col items-center justify-center">
      <SplashCursor />
      <Noise
        patternSize={250}
        patternScaleX={1}
        patternScaleY={1}
        patternRefreshInterval={2}
        patternAlpha={15}
      />
      <div className="pointer-events-none absolute inset-0 z-0">
        <ASCIIText
          text="LUA-DL"
          enableWaves={true}
          asciiFontSize={8}
          textFontSize={160}
        />
      </div>

      <div className="border-line-strong z-10 mx-auto w-full max-w-lg rounded border bg-black/60 p-6 text-center shadow-2xl backdrop-blur-lg">
        <AppIdEntry onSubmit={onInspect} isLoading={isPending} isSplash />
      </div>

      <SettingsPanel isOpen={isSettingsOpen} onClose={onCloseSettings} />
    </div>
  );
}

