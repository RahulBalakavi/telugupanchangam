import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";
import { sql } from "drizzle-orm";
import { db, pool } from "./db";
import { registerPrayerViews } from "./prayer-views";

test("prayer page openings count separately, retries count once, and totals survive restart", async () => {
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/durga_counter_test");
  const app = express();
  await registerPrayerViews(app);
  await db.execute(sql`TRUNCATE prayer_page_views`);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const root = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const headers = { "Content-Type": "application/json", Origin: "https://mytelugupanchangam.space" };
  const read = async (slug: string) => (await (await fetch(`${root}/api/vrathams/${slug}/views`)).json()).views;
  const open = (slug: string, viewId: string) => fetch(`${root}/api/vrathams/${slug}/views`, { method: "POST", headers, body: JSON.stringify({ viewId }) });
  try {
    assert.equal(await read("durga-saptashati"), 0);
    const first = randomUUID();
    assert.equal((await (await open("durga-saptashati", first)).json()).views, 1);
    const retries = await Promise.all(Array.from({ length: 5 }, () => open("durga-saptashati", first)));
    assert(retries.every(response => response.ok));
    assert.equal(await read("durga-saptashati"), 1);
    await open("durga-saptashati", randomUUID());
    await open("varalakshmi", randomUUID());
    assert.equal(await read("durga-saptashati"), 2);
    assert.equal(await read("varalakshmi"), 1);
    assert.equal(await read("vinayaka"), 0);
    assert.equal((await open("durga-saptashati", "invalid")).status, 400);
    assert.equal((await open("unknown", randomUUID())).status, 404);
    const blocked = await fetch(`${root}/api/vrathams/durga-saptashati/views`, { method: "POST", headers: { ...headers, Origin: "https://unrelated.example" }, body: JSON.stringify({ viewId: randomUUID() }) });
    assert.equal(blocked.status, 403);
    const restartedApp = express();
    await registerPrayerViews(restartedApp);
    const restarted = restartedApp.listen(0, "127.0.0.1");
    await once(restarted, "listening");
    try {
      const response = await fetch(`http://127.0.0.1:${(restarted.address() as AddressInfo).port}/api/vrathams/durga-saptashati/views`);
      assert.deepEqual(await response.json(), { views: 2 });
    } finally {
      await new Promise<void>((resolve, reject) => restarted.close(error => error ? reject(error) : resolve()));
    }
  } finally {
    await db.execute(sql`TRUNCATE prayer_page_views`);
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await pool.end();
  }
});
