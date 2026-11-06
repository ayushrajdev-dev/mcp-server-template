# mcp-server-template

A model context protocol server that already does the boring parts: typed tools, resources, prompts, stderr logging, graceful shutdown, integration tests, and a Docker image. Replace three files, ship your server.

```console
$ npx mcp-server-template
[info] mcp-server-template 1.0.0 ready on stdio
```

Works with Claude Desktop, Claude Code, Cursor, VS Code, and any MCP client that speaks stdio.

---

## Why not start from the SDK example

| Concern | SDK example | This template |
|---|---|---|
| Tool input validation | optional | zod, enforced at the boundary |
| stdout safety | not enforced | logger writes to stderr only, a test guards it |
| Graceful shutdown | none | SIGINT and SIGTERM close the transport |
| Error shape | thrown strings | `isError: true` with a readable message |
| Tests | none | unit plus a real stdio round trip |
| Docker | none | multi-stage, non-root, 60 MB |
| CI | none | Node 20, 22, 24 |

---

## Quickstart

```sh
git clone https://github.com/ayushrajdev-dev/mcp-server-template
cd mcp-server-template
npm ci
npm run build
node dist/index.js        # speaks JSON-RPC on stdio
```

Or run the published package:

```sh
npx mcp-server-template
```

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows:

```json
{
  "mcpServers": {
    "template": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-template/dist/index.js"],
      "env": { "MCP_LOG_LEVEL": "info" }
    }
  }
}
```

Restart the app. Three tools appear: `echo`, `now`, `uuid`.

### Claude Code

```sh
claude mcp add template -- node /absolute/path/to/dist/index.js
```

### Cursor

`.cursor/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "template": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

### Docker

```sh
docker build -t mcp-template .
docker run -i --rm mcp-template
```

The `-i` flag matters: stdio transport needs an open stdin.

---

## Add your own tool

Edit `src/tools/index.ts`. Ten lines, no boilerplate:

```ts
server.registerTool(
  "reverse",
  {
    title: "Reverse text",
    description: "Reverse a string. Use when the user asks to flip text.",
    inputSchema: {
      text: z.string().min(1).describe("Text to reverse"),
    },
  },
  async ({ text }) => ({
    content: [{ type: "text", text: [...text].reverse().join("") }],
  }),
);
```

Rules that keep the server usable:

1. `description` is the model's only instruction. Say what it does and when to call it.
2. `.describe()` on every field. The schema is shown to the model verbatim.
3. Return `isError: true` for expected failures. Throw only for bugs.
4. Never `console.log`. stdout is the protocol.

---

## Layout

```
src/
  index.ts              server wiring, transport, shutdown
  tools/index.ts        echo, now, uuid
  resources/index.ts    config://manifest
  prompts/index.ts      review-diff
  lib/logger.ts         stderr-only logger
test/
  server.test.js        unit tests plus a live stdio round trip
```

### Tools

Functions the model can call. Input is a zod schema; output is `{ content: [...] }`.

### Resources

Read-only data addressed by URI. This template exposes `config://manifest` with the package name, version, license, Node version, and MCP SDK version.

### Prompts

Reusable templates the client surfaces as slash commands. `review-diff` takes a diff and a language, and asks for correctness findings only.

---

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `MCP_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |

Logs go to stderr at every level. There is no configuration file and no network access.

---

## Tests

```sh
npm test        # builds, then runs unit and stdio integration tests
npm run typecheck
```

The integration test spawns `dist/index.js`, connects a real MCP client, lists tools, calls `echo`, and asserts that an invalid time zone returns `isError: true`. If the transport breaks, CI fails.

---

## Deploy

The image is a standard stdio MCP server, so it runs anywhere a container runs. For a hosted deployment, wrap the transport: the SDK ships `StreamableHTTPServerTransport` and `SSEServerTransport`, and the tool, resource, and prompt registrations stay unchanged.

---

## License

MIT. See [LICENSE](LICENSE).
