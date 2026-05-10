"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function useLuaDlEvents() {
  const ingestEvent = useAppStore((state) => state.ingestEvent);
  const setUpdateState = useAppStore((state) => state.setUpdateState);

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
