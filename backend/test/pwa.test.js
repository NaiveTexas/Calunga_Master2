import test from "node:test";
import assert from "node:assert/strict";
import { app } from "../app.js";

test("installation assets are public while app and API remain authenticated", async () => {
    const previous = process.env.TEST_ACCESS_PASSWORD;
    process.env.TEST_ACCESS_PASSWORD = "pwa-test-only";
    const server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        const response = await fetch(`${base}/manifest.webmanifest`);
        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type"), /manifest\+json/);
        const manifest = await response.json();
        assert.equal(manifest.display, "standalone");
        for (const icon of manifest.icons) {
            const result = await fetch(base + icon.src);
            assert.equal(result.status, 200);
            assert.match(result.headers.get("content-type"), /image\/png/);
            const bytes = Buffer.from(await result.arrayBuffer());
            const size = Number(icon.sizes.split("x")[0]);
            assert.equal(bytes.readUInt32BE(16), size);
            assert.equal(bytes.readUInt32BE(20), size);
        }
        assert.equal((await fetch(base + "/")).status, 401);
        assert.equal((await fetch(base + "/api/weather/sigmet")).status, 401);
    } finally {
        await new Promise(resolve => server.close(resolve));
        if (previous === undefined) delete process.env.TEST_ACCESS_PASSWORD;
        else process.env.TEST_ACCESS_PASSWORD = previous;
    }
});
