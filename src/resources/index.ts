import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const MANIFEST = fileURLToPath(new URL("../../package.json", import.meta.url));

/**
 * Resources expose read-only data with a URI. Keep the payload small and
 * deterministic: clients cache by URI.
 */
export function registerResources(server: McpServer): void {
  server.registerResource(
    "manifest",
    "config://manifest",
    {
      title: "Server manifest",
      description: "Name, version, license, and runtime of this server.",
      mimeType: "application/json",
    },
    async (uri) => {
      const raw = await readFile(MANIFEST, "utf8");
      const pkg = JSON.parse(raw) as Record<string, unknown>;
      const body = {
        name: pkg["name"],
        version: pkg["version"],
        license: pkg["license"],
        node: process.version,
        mcp_sdk: (pkg["dependencies"] as Record<string, string> | undefined)?.[
          "@modelcontextprotocol/sdk"
        ],
      };
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(body, null, 2) }],
      };
    },
  );
}
