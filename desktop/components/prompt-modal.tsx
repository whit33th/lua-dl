"use client";

import { extractPromptMeta } from "@/lib/prompt-meta";
import { useAppStore } from "@/lib/store";
import { useEffect, useRef } from "react";
import {
  PickerPromptActions,
  StdinPromptForm,
  YesNoPromptActions,
} from "./prompt-actions";

export function PromptModal() {
  const panelRef = useRef<HTMLDivElement>(null);
  const prompt = useAppStore((state) => state.cli.prompt);
  const phase = useAppStore((state) => state.cli.phase);
  const logs = useAppStore((state) => state.logs);
  const sessionId = useAppStore((state) => state.activeSessionId);

  useEffect(() => {
    if (prompt) {
      panelRef.current?.querySelector<HTMLElement>("button, input")?.focus();
    }
  }, [prompt]);

  if (!prompt || !sessionId) {
    return null;
  }

  function write(input: string) {
    if (sessionId) {
      void window.luaDl?.write(sessionId, input);
    }
  }

  const { title, subtitle } = extractPromptMeta(prompt.kind, prompt.text, {
    phase,
    recentText: logs
      .filter((log) => log.sessionId === sessionId)
      .slice(-8)
      .map((log) => log.text)
      .join("\n"),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-md">
      <div
        className="border-line bg-panel w-[min(560px,100%)] rounded-4xl border p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        ref={panelRef}
      >
        <p className="text-dim m-0 mb-1.5 text-xs font-bold uppercase">
          {subtitle}
        </p>
        <h2 id="prompt-title" className="m-0 mb-3.5 text-2xl font-bold">
          {title}
        </h2>
        <pre className="border-line text-muted max-h-65 overflow-auto rounded-4xl border bg-black p-3.5 font-mono text-xs whitespace-pre-wrap">
          {prompt.text}
        </pre>

        {prompt.kind === "yes-no" ? (
          <YesNoPromptActions onWrite={write} />
        ) : prompt.kind === "picker" ? (
          <PickerPromptActions onWrite={write} />
        ) : (
          <StdinPromptForm onWrite={write} />
        )}
      </div>
    </div>
  );
}
