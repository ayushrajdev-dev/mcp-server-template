import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Prompts are reusable templates the client can surface as slash commands.
 * Keep them short and parameterized; the model fills the rest.
 */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "review-diff",
    {
      title: "Review a diff",
      description: "Ask for a review focused on correctness, not style.",
      argsSchema: {
        diff: z.string().describe("Unified diff or file contents to review"),
        language: z.string().default("typescript").describe("Primary language"),
      },
    },
    ({ diff, language }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Review this ${language} change.`,
              "Report only correctness, security, and data-loss risks.",
              "For each finding give file, line, and the smallest fix.",
              "Say nothing about formatting.",
              "",
              diff,
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
