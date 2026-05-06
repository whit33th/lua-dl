"use client";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

type Skin = {
  id: string;
  name?: string;
  thumbnail?: string;
};

export default function Footer() {
  const [selectedSkins, setSelectedSkins] = useState<Skin[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadSelectedSkins = () => {
    try {
      const raw = localStorage.getItem("selectedSkins");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSelectedSkins(parsed);
      else setSelectedSkins([]);
    } catch {
      setSelectedSkins([]);
    }
  };

  useEffect(() => {
    loadSelectedSkins();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "selectedSkins") loadSelectedSkins();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const clearAll = () => {
    localStorage.removeItem("selectedSkins");
    setSelectedSkins([]);
  };

  const applySkins = () => {
    console.log("Applying skins:", selectedSkins);
  };

  return (
    <footer className="rounded-4xl bg-black  shadow-black/20 mx-6">
      <details
        className="group"
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 ring-1 ring-black/40 transition-transform group-open:rotate-180"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-neutral-50">
                {selectedSkins.length} skins selected
              </span>
              <span className="text-xs text-neutral-500">
                Selected items will show here
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-95"
            >
              Clear All
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                applySkins();
              }}
              className="flex gap-1.5 rounded-full bg-red-500/95 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-95"
            >
              <span>Apply</span>
              <Check className="h-4 w-4" />
            </button>
          </div>
        </summary>

        <div className="border-t border-white/10 bg-black px-6 py-4">
          <h3 className="text-neutral-50 mb-4">Selected skins</h3>
          <div className="flex max-h-80 flex-wrap items-center gap-3 overflow-y-auto">
            {selectedSkins.length === 0 ? (
              <p className="text-neutral-500">No skins selected yet</p>
            ) : (
              selectedSkins.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  {s.thumbnail ? (
                    <img
                      src={s.thumbnail}
                      alt={s.name ?? s.id}
                      className="h-36 w-24 rounded-md border border-neutral-700 object-cover"
                    />
                  ) : (
                    <div className="h-36 w-24 rounded-md border border-neutral-700 bg-neutral-800/60" />
                  )}
                  <span className="max-w-24 truncate text-center text-xs text-neutral-300">
                    {s.name ?? s.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </details>
    </footer>
  );
}
