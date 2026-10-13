import test from "node:test";
import assert from "node:assert/strict";
import { createChartTileCache } from "../cache/chartTileCache.js";
test("tile cache deduplicates requests, bounds memory and retries failures", async () => {
    const cache = createChartTileCache(8);
    let calls = 0;
    const load = async () => { calls++; return { data: Buffer.alloc(8), headers: { "content-type": "image/png" } }; };
    await Promise.all([cache("a", load), cache("a", load)]);
    assert.equal(calls, 1);
    await cache("a", load); assert.equal(calls, 1);
    await cache("b", load); await cache("a", load); assert.equal(calls, 3);
    await assert.rejects(cache("error", async () => { throw new Error("offline"); }));
    await cache("error", load); assert.equal(calls, 4);
});
test("tile cache does not retain non-image responses", async () => {
    const cache = createChartTileCache(); let calls = 0;
    const load = async () => { calls++; return { data: Buffer.from("error"), headers: { "content-type": "text/xml" } }; };
    await cache("a", load); await cache("a", load); assert.equal(calls, 2);
});
