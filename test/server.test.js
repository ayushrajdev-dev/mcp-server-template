import test from "node:test";
import assert from "node:assert/strict";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { assertTimeZone, echoText, formatNow, newId } from "../dist/tools/index.js";

test("echo returns the input unchanged", () => {
  assert.equal(echoText("hello"), "hello");
});

test("formatNow renders a fixed instant in UTC", () => {
  const instant = new Date("2026-01-01T12:00:00Z");
  const rendered = formatNow("UTC", instant);
  assert.match(rendered, /2026/);
  assert.match(rendered, /12:00/);
});

test("assertTimeZone accepts real zones and rejects nonsense", () => {
  assert.doesNotThrow(() => assertTimeZone("Asia/Kolkata"));
  assert.throws(() => assertTimeZone("Not/AZone"));
});

test("uuid has v4 shape", () => {
  assert.match(newId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("tools round trip over stdio", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/index.js"],
  });
  const client = new Client({ name: "test-client", version: "1.0.0" });

  await client.connect(transport);
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((t) => t.name).sort(),
      ["echo", "now", "uuid"],
    );

    const echoed = await client.callTool({ name: "echo", arguments: { text: "ping" } });
    assert.equal(echoed.content[0].text, "ping");

    const failed = await client.callTool({
      name: "now",
      arguments: { timeZone: "Not/AZone" },
    });
    assert.equal(failed.isError, true);
  } finally {
    await client.close();
  }
});
