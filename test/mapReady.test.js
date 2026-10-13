import test from "node:test";
import assert from "node:assert/strict";
import Observable from "ol/Observable.js";
import { waitForMapReady } from "../map/engine/mapReady.js";

function setup() {
    const map = new Observable();
    map.render = () => {};
    const source = new Observable();
    return { map, source };
}

test("startup waits for rendercomplete, not just a downloaded tile", async () => {
    const { map, source } = setup();
    let ready = false;
    const promise = waitForMapReady(map, [source]).then(() => { ready = true; });
    source.dispatchEvent("tileloadend");
    await Promise.resolve();
    assert.equal(ready, false);
    map.dispatchEvent("rendercomplete");
    await promise;
    assert.equal(ready, true);
    assert.equal(source.hasListener("tileloaderror"), false);
});

test("tile failure cannot unlock startup even if rendering subsequently completes", async () => {
    const { map, source } = setup();
    const promise = waitForMapReady(map, [source]);
    source.dispatchEvent("tileloaderror");
    map.dispatchEvent("rendercomplete");
    await assert.rejects(promise, /imagem do mapa/);
    assert.equal(map.hasListener("rendercomplete"), false);
});

test("stalled rendering fails rather than allowing startup", async () => {
    const { map, source } = setup();
    await assert.rejects(waitForMapReady(map, [source], 5), /demorou demais/);
    assert.equal(source.hasListener("tileloaderror"), false);
});
