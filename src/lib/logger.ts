/**
 * Logging must go to stderr. Anything on stdout corrupts the MCP stream.
 */
const LEVELS = ["debug", "info", "warn", "error"] as const;
export type Level = (typeof LEVELS)[number];

const configured = (process.env["MCP_LOG_LEVEL"] ?? "info") as Level;
const threshold = LEVELS.indexOf(configured) === -1 ? 1 : LEVELS.indexOf(configured);

export function log(message: string, level: Level = "info"): void {
  if (LEVELS.indexOf(level) < threshold) {
    return;
  }
  process.stderr.write(`[${level}] ${message}\n`);
}
