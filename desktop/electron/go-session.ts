import type { BrowserWindow } from "electron";
import { app } from "electron";
import log from "electron-log/main";
import * as pty from "node-pty";
import crypto from "node:crypto";
import type { IPty } from "node-pty";
import { getGoExePath } from "./paths";
import type { CliEvent, ParsedProgress, StartOptions } from "./ipc-contract";

const progressRegex =
  /(?<percent>\d+(?:\.\d+)?)%\s+(?<done>\d+(?:\.\d+)?)\s+\/\s+(?<total>\d+(?:\.\d+)?)\s+MB\s+(?<mbps>\d+(?:\.\d+)?)\s+MB\/s\s+(?<filesDone>\d+)\/(?<filesTotal>\d+)\s+files/;

type Session = {
  id: string;
  label?: string;
  pty: IPty;
};

export class GoSessionManager {
  private sessions = new Map<string, Session>();

  constructor(private readonly mainWindow: BrowserWindow) {}

  start(args: string[], options: StartOptions = {}) {
    const sessionId = crypto.randomUUID();
    const goExePath = getGoExePath();
    const cwd = options.cwd || app.getPath("downloads");
    const cols = clampTerminalSize(options.cols, 80, 240, 120);
    const rows = clampTerminalSize(options.rows, 16, 80, 32);

    this.emit({
      type: "state",
      sessionId,
      status: "starting",
      label: options.label,
      time: Date.now(),
    });

    try {
      const ptyProcess = pty.spawn(goExePath, args, {
        name: "xterm-256color",
        cols,
        rows,
        cwd,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          FORCE_COLOR: "1",
        },
      });

      const session: Session = {
        id: sessionId,
        label: options.label,
        pty: ptyProcess,
      };
      this.sessions.set(sessionId, session);
      log.info("Started lua-dl session", { sessionId, args, cwd });

      this.emit({
        type: "state",
        sessionId,
        status: "running",
        label: options.label,
        time: Date.now(),
      });

      ptyProcess.onData((chunk) => {
        this.emit(parseCliChunk(sessionId, chunk));
      });

      ptyProcess.onExit(({ exitCode }) => {
        this.sessions.delete(sessionId);
        this.emit({ type: "exit", sessionId, exitCode, time: Date.now() });
        log.info("Exited lua-dl session", { sessionId, exitCode });
      });

      return { sessionId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit({ type: "error", sessionId, message, time: Date.now() });
      log.error("Failed to start lua-dl session", error);
      throw error;
    }
  }

  write(sessionId: string, input: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} is not running.`);
    }
    session.pty.write(input);
  }

  kill(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    session.pty.kill();
    this.sessions.delete(sessionId);
    this.emit({
      type: "state",
      sessionId,
      status: "killed",
      label: session.label,
      time: Date.now(),
    });
  }

  killAll() {
    for (const session of this.sessions.values()) {
      session.pty.kill();
    }
    this.sessions.clear();
  }

  private emit(event: CliEvent) {
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("go:event", event);
    }
  }
}

function parseCliChunk(sessionId: string, chunk: string): CliEvent {
  const clean = stripAnsi(chunk)
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return {
    type: "output",
    sessionId,
    chunk,
    clean,
    stream: "pty",
    progress: parseProgress(clean),
    prompt: detectPrompt(clean),
    time: Date.now(),
  };
}

function parseProgress(text: string): ParsedProgress | undefined {
  const match = progressRegex.exec(text);
  if (!match?.groups) {
    return undefined;
  }
  return {
    percent: Number(match.groups.percent),
    downloadedMb: Number(match.groups.done),
    totalMb: Number(match.groups.total),
    mbps: Number(match.groups.mbps),
    filesDone: Number(match.groups.filesDone),
    filesTotal: Number(match.groups.filesTotal),
  };
}

function detectPrompt(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return undefined;
  }
  if (/\[(Y\/n|y\/N|yes\/no)\]\s*:?\s*$/i.test(normalized)) {
    return { kind: "yes-no" as const, text: normalized };
  }
  if (
    /Select optional depots:|Pick one:|\bmove\b.*\bspace toggle\b/i.test(
      normalized,
    )
  ) {
    return { kind: "picker" as const, text: normalized };
  }
  if (
    /:\s*$/.test(normalized) &&
    /(enter|input|id|path|install)/i.test(normalized)
  ) {
    return { kind: "stdin" as const, text: normalized };
  }
  return undefined;
}

function stripAnsi(value: string) {
  return value.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g,
    "",
  );
}

function clampTerminalSize(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(value)));
}
