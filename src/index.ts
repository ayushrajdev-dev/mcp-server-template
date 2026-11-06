#!/usr/bin/env node
/**
 * MCP server entrypoint.
 *
 * Transport is stdio: stdout carries the protocol, stderr carries logs.
 * Never write to stdout outside the SDK.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { log } from "./lib/logger.js";
import { registerPrompts } from "./prompts/index.js";
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";

export const SERVER_NAME = "mcp-server-template";
export const SERVER_VERSION = "1.0.0";

const server = new McpServer(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {}, resources: {}, prompts: {}, logging: {} } },
);

registerTools(server);
registerResources(server);
registerPrompts(server);

async function shutdown(signal: string): Promise<void> {
  log(`received ${signal}, shutting down`);
  await server.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await server.connect(new StdioServerTransport());
log(`${SERVER_NAME} ${SERVER_VERSION} ready on stdio`);
