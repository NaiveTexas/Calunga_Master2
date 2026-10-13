import test from "node:test";
import assert from "node:assert/strict";
import { loadSuggestedRoute } from "../js/services/suggestedRoute.js";

test("missing terminal endpoint identifies an outdated backend instead of a generic provider failure", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async url => url.endsWith("/terminals")
        ? { ok: false, status: 404 }
        : { ok: true, json: async () => [] };
    try { await assert.rejects(loadSuggestedRoute({}, {}), /Reinicie o backend/); }
    finally { globalThis.fetch = original; }
});
