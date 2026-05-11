"use client";

import { useAppStore } from "@/lib/store";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useLuaDlEvents() {
  const ingestEvent = useAppStore((state) => state.ingestEvent);
  const setUpdateState = useAppStore((state) => state.setUpdateState);
  const lastError = useAppStore((state) => state.cli.lastError);
  const prevErrorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (lastError && lastError !== prevErrorRef.current) {
      toast.error(lastError);
      prevErrorRef.current = lastError;
    }
  }, [lastError]);

  useEffect(() => {
    const unsubEvent = window.luaDl?.onEvent((event) => {
      ingestEvent(event);
    });

    const unsubUpdate = window.luaDl?.onUpdateEvent((event) => {
      setUpdateState(event);
    });

    void window.luaDl?.checkForUpdates();

    return () => {
      unsubEvent?.();
      unsubUpdate?.();
    };
  }, [ingestEvent, setUpdateState]);
}
