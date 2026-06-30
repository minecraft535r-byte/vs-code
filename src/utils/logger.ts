/**
 * Centralized Logging System
 * Captures errors, warnings, and user actions.
 * Stores last 200 entries in memory for diagnostics.
 * Can be extended to send to external monitoring service.
 */

type LogLevel = "info" | "warn" | "error" | "action";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  user?: string;
}

const MAX_ENTRIES = 200;
const _logs: LogEntry[] = [];

function getUser(): string {
  try { return localStorage.getItem("username") || "anonymous"; } catch { return "anonymous"; }
}

function addEntry(level: LogLevel, message: string, data?: any) {
  const entry: LogEntry = {
    level,
    message,
    data: data ? JSON.parse(JSON.stringify(data, (_, v) => v instanceof Error ? { message: v.message, stack: v.stack } : v)) : undefined,
    timestamp: new Date().toISOString(),
    user: getUser(),
  };
  _logs.push(entry);
  if (_logs.length > MAX_ENTRIES) _logs.shift();

  // Console output in development only
  if (import.meta.env?.DEV) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    fn(`[${level.toUpperCase()}] ${message}`, data || "");
  }
}

export const logger = {
  info: (msg: string, data?: any) => addEntry("info", msg, data),
  warn: (msg: string, data?: any) => addEntry("warn", msg, data),
  error: (msg: string, data?: any) => addEntry("error", msg, data),
  action: (msg: string, data?: any) => addEntry("action", msg, data),
  getLogs: () => [..._logs],
  getErrors: () => _logs.filter(l => l.level === "error"),
  clear: () => { _logs.length = 0; },
  export: () => JSON.stringify(_logs, null, 2),
};

// Global unhandled error/rejection handlers
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    logger.error("Unhandled error", { message: e.message, filename: e.filename, lineno: e.lineno });
  });
  window.addEventListener("unhandledrejection", (e) => {
    logger.error("Unhandled promise rejection", { reason: String(e.reason) });
  });
}
