"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function CliFeed() {
  const [isOpen, setIsOpen] = useState(false);
  const logs = useAppStore((state) => state.logs);
  const keepRawLogs = useAppStore((state) => state.settings.keepRawLogs);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F8") {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [isOpen, logs.length]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 backdrop-blur">
      <section
        className="w-full max-h-[62vh] m-0 overflow-hidden border border-line rounded-t-2xl bg-panel shadow-lg"
        aria-labelledby="log-title"
      >
        <div className="w-full border-b border-line bg-transparent text-text p-4">
          <div className="flex items-center justify-between">
            <span>
              <span className="m-0 mb-1.5 text-dim text-xs font-bold uppercase block">
                F8
              </span>
              <strong id="log-title" className="block text-base font-bold">
                Session log
              </strong>
            </span>
            <button
              className="w-11 h-11 grid place-items-center border border-line-strong rounded-2xl bg-panel-strong text-text transition-all hover:border-text hover:-translate-y-0.5"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close session log"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="max-h-[calc(62vh-75px)] overflow-auto p-3"
          aria-live="polite"
        >
          {logs.length === 0 ? (
            <p className="text-muted">No output yet.</p>
          ) : null}
          {logs.map((log) => (
            <article
              className="grid grid-cols-[84px_1fr] gap-3 border-b border-gray-900 p-2.25"
              data-level={log.level}
              key={log.id}
            >
              <time className="text-dim text-xs">
                {new Date(log.time).toLocaleTimeString()}
              </time>
              <pre className="m-0 whitespace-pre-wrap break-words text-muted font-mono text-xs leading-[1.55]">
                {keepRawLogs ? log.text : log.text.replace(/\s+/g, " ")}
              </pre>
            </article>
          ))}
          <div ref={endRef} />
        </div>
      </section>
    </div>
  );
}
