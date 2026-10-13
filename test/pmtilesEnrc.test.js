import test from 'node:test';
import assert from 'node:assert/strict';
import TileState from 'ol/TileState.js';
import { loadArchiveTile } from '../map/enrc/pmtilesEnrc.js';
import { loadStaticEnrc } from '../map/enrc/staticEnrc.js';

test('catalog loads LOW and HIGH archives with their own bounds and zooms', async t => {
    t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ charts:
        ['LOW', 'HIGH'].map((type, i) => ({ chart: `ENRC_${i ? 'H' : 'L'}1`, type,
            format: 'pmtiles', url: `/charts/${type}.pmtiles`, extent: [-45,-15,-29,-4],
            minZoom: 5, maxZoom: 10, tilePixelRatio: 2 })) }) }));
    const entries = await loadStaticEnrc('/enrc-static/pdf-charts.json');
    assert.equal(entries.length, 2);
    for (const entry of entries) {
        assert.equal(entry.layer.getVisible(), false);
        const source = entry.layer.getSource();
        assert.equal(source.getTileGrid().getMaxZoom(), 10);
        assert.equal(source.getTileUrlFunction()([6, 2, 3]), `${entry.manifest.url}#6/2/3`);
    }
});

test('archive tile decodes as PNG and releases its temporary URL', async t => {
    const image = new EventTarget();
    const revoked = [];
    t.mock.method(URL, 'createObjectURL', blob => {
        assert.equal(blob.type, 'image/png'); return 'blob:test';
    });
    t.mock.method(URL, 'revokeObjectURL', url => revoked.push(url));
    await loadArchiveTile({ getTileCoord: () => [10, 412, 535], getImage: () => image,
        setState: () => assert.fail('unexpected error') }, { getZxy: async (...coords) => {
            assert.deepEqual(coords, [10, 412, 535]); return { data: new Uint8Array([1,2,3]) };
        } });
    assert.equal(image.src, 'blob:test');
    image.dispatchEvent(new Event('load'));
    assert.deepEqual(revoked, ['blob:test']);
});

test('missing tiles and network failures report an error for WMS fallback', async () => {
    for (const getZxy of [async () => undefined, async () => { throw new Error('offline'); }]) {
        let state;
        await loadArchiveTile({ getTileCoord: () => [8,1,1], setState: value => { state = value; } }, { getZxy });
        assert.equal(state, TileState.ERROR);
    }
});
