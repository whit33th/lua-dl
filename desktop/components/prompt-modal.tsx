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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-md">
      <div
        className="border-line bg-panel w-[min(560px,100%)] rounded-4xl border p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        ref={panelRef}
      >
        <p className="text-dim m-0 mb-1.5 text-xs font-bold uppercase">
          Input required
        </p>
        <h2 id="prompt-title" className="m-0 mb-3.5 text-2xl font-bold">
          {prompt.kind === "picker" ? "Choose in CLI picker" : "Continue"}
        </h2>
        <pre className="border-line text-muted max-h-65 overflow-auto rounded-4xl border bg-black p-3.5 font-mono text-xs whitespace-pre-wrap">
          {prompt.text}
        </pre>

        {prompt.kind === "yes-no" ? (
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <button
              className="bg-text text-panel-strong border-line-strong inline-flex items-center justify-center gap-2.25 rounded-4xl border px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={() => write("y\r")}
            >
              <Check size={17} aria-hidden="true" />
              Yes
            </button>
            <button
              className="border-line-strong text-text inline-flex items-center justify-center gap-2.25 rounded-4xl border bg-black px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={() => write("n\r")}
            >
              <X size={17} aria-hidden="true" />
              No
            </button>
          </div>
        ) : prompt.kind === "picker" ? (
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <button
              className="border-line-strong bg-panel-strong text-text min-h-10.5 rounded-4xl border px-3.25 py-0 transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={() => write("\u001b[A")}
              aria-label="Move selection up"
            >
              <ArrowUp size={17} aria-hidden="true" />
            </button>
            <button
              className="border-line-strong bg-panel-strong text-text min-h-10.5 rounded-4xl border px-3.25 py-0 transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={() => write("\u001b[B")}
              aria-label="Move selection down"
            >
              <ArrowDown size={17} aria-hidden="true" />
            </button>
            <button
              className="border-line-strong bg-panel-strong text-text min-h-10.5 rounded-4xl border px-3.25 py-0 transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={() => write(" ")}
            >
              Toggle
            </button>
            <button
              className="border-line-strong bg-panel-strong text-text min-h-10.5 rounded-4xl border px-3.25 py-0 transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={() => write("a")}
            >
              All
            </button>
            <button
              className="border-line-strong bg-panel-strong text-text min-h-10.5 rounded-4xl border px-3.25 py-0 transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={() => write("n")}
            >
              None
            </button>
            <button
              className="bg-text text-panel-strong border-line-strong inline-flex items-center justify-center gap-2.25 rounded-4xl border px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={() => write("\r")}
            >
              Confirm
            </button>
          </div>
        ) : (
          <form
            className="mt-3.5 grid grid-cols-[1fr_auto] flex-wrap gap-2.5"
            onSubmit={submitText}
          >
            <input
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              autoFocus
              className="border-line-strong text-text min-w-0 rounded-4xl border bg-black px-3 py-2"
            />
            <button
              className="bg-text text-panel-strong border-line-strong inline-flex items-center justify-center gap-2.25 rounded-4xl border px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5"
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
