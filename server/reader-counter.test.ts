import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";
import { sql } from "drizzle-orm";
import { db, pool } from "./db";
import { registerReaderCounter } from "./reader-counter";

test("reader starts are shared, idempotent across reloads, and isolated from invalid submissions", async () => {
  // Use a dedicated disposable database; the test deliberately clears its counter.
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/durga_counter_test");
  const app = express();
  await registerReaderCounter(app);
  await db.execute(sql`TRUNCATE durga_deck_readers`);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/decks/durga-saptashati/readers`;
  const headers = { "Content-Type": "application/json", Origin: "https://rahulbalakavi.github.io" };
  const count = async () => (await (await fetch(url, { headers })).json()).readers;
  const start = (readerId: string) => fetch(url, { method: "POST", headers, body: JSON.stringify({ readerId }) });
  try {
    assert.equal(await count(), 0);
    const first = randomUUID();
    const response = await start(first);
    assert.equal((await response.json()).readers, 1);
    assert.equal(response.headers.get("access-control-allow-origin"), headers.Origin);
    const repeats = await Promise.all(Array.from({ length: 5 }, () => start(first)));
    assert(repeats.every(response => response.ok));
    assert.equal(await count(), 1);
    await start(first.toUpperCase());
    assert.equal(await count(), 1);
    await start(randomUUID());
    assert.equal(await count(), 2);
    const invalid = await start("not-a-reader-id");
    assert.equal(invalid.status, 400);
    const forbidden = await fetch(url, { method: "POST", headers: { ...headers, Origin: "https://unrelated.example" }, body: JSON.stringify({ readerId: randomUUID() }) });
    assert.equal(forbidden.status, 403);
    assert.equal(await count(), 2);
    const options = await fetch(url, { method: "OPTIONS", headers });
    assert.equal(options.status, 204);
    assert.equal(options.headers.get("access-control-allow-origin"), headers.Origin);
    const appAfterRestart = express();
    await registerReaderCounter(appAfterRestart);
    assert.equal(await count(), 2);
  } finally {
    await db.execute(sql`TRUNCATE durga_deck_readers`);
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await pool.end();
  }
});
