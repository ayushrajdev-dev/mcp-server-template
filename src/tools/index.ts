import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/** Return the text unchanged. Useful for verifying the transport end to end. */
export function echoText(text: string): string {
  return text;
}

/** ISO 8601 timestamp in the requested IANA time zone. */
export function formatNow(timeZone: string, now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    dateStyle: "full",
    timeStyle: "long",
  });
  return formatter.format(now);
}

/** Throw early when a caller passes a zone the runtime does not know. */
export function assertTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone });
  } catch {
    throw new Error(`unknown time zone: ${timeZone}`);
  }
}

export function newId(): string {
  return randomUUID();
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Return the input text unchanged. Use this to confirm the server is connected.",
      inputSchema: {
        text: z.string().min(1).describe("Text to return unchanged"),
      },
    },
    async ({ text }) => ({
      content: [{ type: "text", text: echoText(text) }],
    }),
  );

  server.registerTool(
    "now",
    {
      title: "Current time",
      description: "Current date and time in an IANA time zone, such as Asia/Kolkata or UTC.",
      inputSchema: {
        timeZone: z
          .string()
          .default("UTC")
          .describe("IANA time zone name, for example Europe/Berlin"),
      },
    },
    async ({ timeZone }) => {
      try {
        assertTimeZone(timeZone);
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: (error as Error).message }],
        };
      }
      return {
        content: [{ type: "text", text: formatNow(timeZone) }],
      };
    },
  );

  server.registerTool(
    "uuid",
    {
      title: "UUID v4",
      description: "Generate a random UUID v4.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: newId() }],
    }),
  );
}
