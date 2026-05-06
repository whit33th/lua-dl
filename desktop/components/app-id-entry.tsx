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
      className="relative flex w-full gap-2.5 border-b border-text/20 font-mono focus-within:border-text transition-colors"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="app-id">
        Steam App ID
      </label>
      <input
        id="app-id"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Steam Game ID"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "app-id-error" : undefined}
        className="h-16 w-full min-w-0 relative bg-transparent text-text px-4 text-2xl outline-none placeholder:text-text/30 font-bold"
      />
      <button
        type="submit"
        aria-label="Inspect App ID"
        disabled={isLoading || !value}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-text text-black w-12 h-12 rounded-lg transition-[scale,opacity,background-color] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-42 disabled:hover:scale-100 grid place-items-center"
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
          className="absolute top-full left-0 mt-2 text-red-500 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
