"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { parseSteamAppId } from "@/lib/cli-parser";

type AppIdEntryProps = {
  onSubmit(appId: string): void;
  isLoading: boolean;
  disabled?: boolean;
};

export function AppIdEntry({ onSubmit, isLoading, disabled }: AppIdEntryProps) {
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
      className="border-text/20 focus-within:border-text relative flex w-full gap-2.5 border-b font-mono transition-colors"
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
        className="text-text placeholder:text-text/30 relative h-16 w-full min-w-0 bg-transparent px-4 text-2xl font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || isLoading}
      />
      <button
        type="submit"
        aria-label="Inspect App ID"
        disabled={disabled || isLoading || !value}
        className="bg-text absolute top-1/2 right-2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-lg text-black transition-[scale,opacity,background-color] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-42 disabled:hover:scale-100"
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
          className="absolute top-full left-0 mt-2 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
