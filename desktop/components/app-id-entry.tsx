"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { parseSteamAppId } from "@/lib/cli-parser";

type AppIdEntryProps = {
  onSubmit(appId: string): void;
  isLoading: boolean;
};

export function AppIdEntry({ onSubmit, isLoading }: AppIdEntryProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const appId = parseSteamAppId(value);
    if (!appId) {
      setError("Enter a numeric Steam App ID.");
      return;
    }
    setError("");
    onSubmit(appId);
  }

  return (
    <form
      className="relative grid grid-cols-[1fr_58px] gap-2.5"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="app-id">
        Steam App ID
      </label>
      <input
        id="app-id"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="431960"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "app-id-error" : undefined}
        className="h-14 min-w-0 border border-line-strong rounded-lg bg-black text-text px-4.5 text-2xl font-bold"
      />
      <button
        type="submit"
        aria-label="Inspect App ID"
        disabled={isLoading}
        className="border border-line-strong rounded-lg bg-panel-strong text-text transition-all hover:border-text hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-42 grid place-items-center"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={20} aria-hidden="true" />
        ) : (
          <ArrowRight size={20} aria-hidden="true" />
        )}
      </button>
      {error ? (
        <p
          id="app-id-error"
          className="absolute top-full left-0 mt-2 text-text text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
