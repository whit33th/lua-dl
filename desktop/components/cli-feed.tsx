"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";

function FormattedTime({ time }: { time: number }) {
  const [timeStr, setTimeStr] = useState(() =>
    new Date(time).toLocaleTimeString(),
  );
  useEffect(() => {
    setTimeStr(new Date(time).toLocaleTimeString());
  }, [time]);
  return <time className="text-dim text-xs">{timeStr}</time>;
}

export function CliFeed() {
  const [isOpen, setIsOpen] = useState(false);
  const logs = useAppStore((state) => state.logs);
  const keepRawLogs = useAppStore((state) => state.settings.keepRawLogs);
  const endRef = useRef<HTMLDivElement>(null);
  const prevLogsLengthRef = useRef(logs.length);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F8") {
        event.preventDefault();
        setIsOpen((value) => {
          const next = !value;
          if (next) {
            requestAnimationFrame(() =>
              endRef.current?.scrollIntoView({ block: "end" }),
            );
          }
          return next;
        });
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (logs.length > prevLogsLengthRef.current) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs.length]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 backdrop-blur">
          <section
            className="border-line bg-panel m-0 max-h-[62vh] w-full overflow-hidden rounded-t-2xl border"
            aria-labelledby="log-title"
          >
            <div className="border-line text-text w-full border-b bg-transparent p-4">
              <div className="flex items-center justify-between">
                <span>
                  <span className="text-dim m-0 mb-1.5 block text-xs font-bold uppercase">
                    F8
                  </span>
                  <strong id="log-title" className="block text-base font-bold">
                    Session log
                  </strong>
                </span>
                <button
                  className="border-line-strong bg-panel-strong text-text hover:border-text grid size-11 place-items-center rounded-4xl border transition-[border-color,translate,background-color,color] hover:-translate-y-0.5"
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
                  className="border-line/50 grid grid-cols-[84px_1fr] gap-3 border-b p-2.25"
                  data-level={log.level}
                  key={log.id}
                >
                  <FormattedTime time={log.time} />
                  <pre className="text-muted m-0 font-mono text-xs leading-[1.55] wrap-break-word whitespace-pre-wrap">
                    {keepRawLogs ? log.text : log.text.replace(/\s+/g, " ")}
                  </pre>
                </article>
              ))}
              <div ref={endRef} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
