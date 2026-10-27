import type { Logger as ViteLogger } from "vite";

/** Le logger interface, powered by Vite's `Logger` */
export type Logger = Pick<ViteLogger, "info" | "warn" | "error">;

const PREFIX = "[vite-plugin-seo-meta] ";

/**
 * Wraps a logger, adding the plugin prefix. Falls back to the console when no
 * base logger is supplied (for example: in tests or standalone use).
 */
export function createLogger(base?: Partial<Logger>): Logger {
  const info = base?.info?.bind(base);
  const warn = base?.warn?.bind(base);
  const error = base?.error?.bind(base);
  return {
    info: info
      ? (message) => info(PREFIX + message)
      : (message) => console.info(PREFIX + message),
    warn: warn
      ? (message) => warn(PREFIX + message)
      : (message) => console.warn(PREFIX + message),
    error: error
      ? (message) => error(PREFIX + message)
      : (message) => console.error(PREFIX + message),
  };
}
