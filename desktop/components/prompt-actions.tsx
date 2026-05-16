"use client";

import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { FormEvent, useState } from "react";

export function YesNoPromptActions({
  onWrite,
}: {
  onWrite(input: string): void;
}) {
  return (
    <div className="mt-3.5 flex flex-wrap gap-2.5">
      <button
        className="bg-text text-panel-strong border-line-strong inline-flex items-center justify-center gap-2.25 rounded-4xl border px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5"
        type="button"
        onClick={() => onWrite("y\r")}
      >
        <Check size={17} aria-hidden="true" />
        Yes
      </button>
      <button
        className="border-line-strong text-text inline-flex items-center justify-center gap-2.25 rounded-4xl border bg-neutral-950 px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5"
        type="button"
        onClick={() => onWrite("n\r")}
      >
        <X size={17} aria-hidden="true" />
        No
      </button>
    </div>
  );
}

export function PickerPromptActions({
  onWrite,
  single = false,
}: {
  onWrite(input: string): void;
  single?: boolean;
}) {
  return (
    <div className="mt-3.5 flex flex-wrap gap-2.5">
      <PickerButton
        onClick={() => onWrite("\u001b[A")}
        ariaLabel="Move selection up"
      >
        <ArrowUp size={17} aria-hidden="true" />
      </PickerButton>
      <PickerButton
        onClick={() => onWrite("\u001b[B")}
        ariaLabel="Move selection down"
      >
        <ArrowDown size={17} aria-hidden="true" />
      </PickerButton>
      <PickerButton onClick={() => onWrite(" ")}>
        {single ? "Choose" : "Toggle"}
      </PickerButton>
      {!single ? (
        <>
          <PickerButton onClick={() => onWrite("a")}>All</PickerButton>
          <PickerButton onClick={() => onWrite("n")}>None</PickerButton>
        </>
      ) : null}
      <button
        className="bg-text text-panel-strong border-line-strong inline-flex items-center justify-center gap-2.25 rounded-4xl border px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5"
        type="button"
        onClick={() => onWrite("\r")}
      >
        Confirm
      </button>
    </div>
  );
}

export function StdinPromptForm({ onWrite }: { onWrite(input: string): void }) {
  const [textValue, setTextValue] = useState("");

  function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (textValue.trim()) {
      onWrite(`${textValue}\r`);
      setTextValue("");
    }
  }

  return (
    <form
      className="mt-3.5 grid grid-cols-[1fr_auto] flex-wrap gap-2.5"
      onSubmit={submitText}
    >
      <input
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
        className="border-line-strong text-text min-w-0 rounded-4xl border bg-neutral-950 px-3 py-2"
      />
      <button
        className="bg-text text-panel-strong border-line-strong inline-flex items-center justify-center gap-2.25 rounded-4xl border px-4 py-2.75 font-bold transition-transform hover:-translate-y-0.5"
        type="submit"
      >
        Send
      </button>
    </form>
  );
}

function PickerButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick(): void;
  ariaLabel?: string;
}) {
  return (
    <button
      className="border-line-strong bg-panel-strong text-text min-h-10.5 rounded-4xl border px-3.25 py-0 transition-transform hover:-translate-y-0.5"
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
