"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function PromptModal() {
  const [textValue, setTextValue] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const prompt = useAppStore((state) => state.cli.prompt);
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

  function submitText(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (textValue.trim()) {
      write(`${textValue}\r`);
      setTextValue("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-5 bg-black/70 backdrop-blur-md">
      <div
        className="w-[min(560px,100%)] border border-line rounded-2xl bg-panel shadow-lg p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        ref={panelRef}
      >
        <p className="m-0 mb-1.5 text-dim text-xs font-bold uppercase">
          Input required
        </p>
        <h2 id="prompt-title" className="m-0 text-2xl font-bold mb-3.5">
          {prompt.kind === "picker" ? "Choose in CLI picker" : "Continue"}
        </h2>
        <pre className="max-h-65 overflow-auto border border-line rounded-2xl bg-black p-3.5 whitespace-pre-wrap text-muted font-mono text-xs">
          {prompt.text}
        </pre>

        {prompt.kind === "yes-no" ? (
          <div className="flex flex-wrap gap-2.5 mt-3.5">
            <button
              className="inline-flex items-center justify-center gap-2.25 bg-text text-panel-strong hover:-translate-y-0.5 transition-transform border border-line-strong rounded-2xl px-4 py-2.75 font-bold"
              type="button"
              onClick={() => write("y\r")}
            >
              <Check size={17} aria-hidden="true" />
              Yes
            </button>
            <button
              className="inline-flex items-center justify-center gap-2.25 bg-black border border-line-strong text-text hover:-translate-y-0.5 transition-transform rounded-2xl px-4 py-2.75 font-bold"
              type="button"
              onClick={() => write("n\r")}
            >
              <X size={17} aria-hidden="true" />
              No
            </button>
          </div>
        ) : prompt.kind === "picker" ? (
          <div className="flex flex-wrap gap-2.5 mt-3.5">
            <button
              className="min-h-10.5 border border-line-strong rounded-2xl bg-panel-strong text-text hover:-translate-y-0.5 transition-transform px-3.25 py-0"
              type="button"
              onClick={() => write("\u001b[A")}
              aria-label="Move selection up"
            >
              <ArrowUp size={17} aria-hidden="true" />
            </button>
            <button
              className="min-h-10.5 border border-line-strong rounded-2xl bg-panel-strong text-text hover:-translate-y-0.5 transition-transform px-3.25 py-0"
              type="button"
              onClick={() => write("\u001b[B")}
              aria-label="Move selection down"
            >
              <ArrowDown size={17} aria-hidden="true" />
            </button>
            <button
              className="min-h-10.5 border border-line-strong rounded-2xl bg-panel-strong text-text hover:-translate-y-0.5 transition-transform px-3.25 py-0"
              type="button"
              onClick={() => write(" ")}
            >
              Toggle
            </button>
            <button
              className="min-h-10.5 border border-line-strong rounded-2xl bg-panel-strong text-text hover:-translate-y-0.5 transition-transform px-3.25 py-0"
              type="button"
              onClick={() => write("a")}
            >
              All
            </button>
            <button
              className="min-h-10.5 border border-line-strong rounded-2xl bg-panel-strong text-text hover:-translate-y-0.5 transition-transform px-3.25 py-0"
              type="button"
              onClick={() => write("n")}
            >
              None
            </button>
            <button
              className="inline-flex items-center justify-center gap-2.25 bg-text text-panel-strong hover:-translate-y-0.5 transition-transform border border-line-strong rounded-2xl px-4 py-2.75 font-bold"
              type="button"
              onClick={() => write("\r")}
            >
              Confirm
            </button>
          </div>
        ) : (
          <form
            className="grid grid-cols-[1fr_auto] flex-wrap gap-2.5 mt-3.5"
            onSubmit={submitText}
          >
            <input
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              autoFocus
              className="min-w-0 border border-line-strong rounded-2xl bg-black text-text px-3 py-2"
            />
            <button
              className="inline-flex items-center justify-center gap-2.25 bg-text text-panel-strong hover:-translate-y-0.5 transition-transform border border-line-strong rounded-2xl px-4 py-2.75 font-bold"
              type="submit"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
