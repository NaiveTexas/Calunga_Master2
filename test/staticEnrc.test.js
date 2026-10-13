import test from 'node:test';
import assert from 'node:assert/strict';
import { createENRCLayer, setENRCCharts } from '../map/enrc/enrcLayer.js';
import { loadStaticEnrc, staticEnrcVisibility } from '../map/enrc/staticEnrc.js';
import { get as getProjection } from 'ol/proj.js';

test('PDF pilot loads independently without modifying the regular chart manifest', async t => {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        calls.push([url, options.cache]);
        return { ok: true, json: async () => ({ chart: 'ENRC_L3', type: 'LOW', extent: [-45,-15,-29,-4],
            minZoom: 5, maxZoom: 10, tilePixelRatio: 2, url: '/enrc-static/pdf-test/{z}/{x}/{y}.png' }) };
    });
    const [entry] = await loadStaticEnrc('/enrc-static/pdf-pilot.json');
    assert.deepEqual(calls, [['/enrc-static/pdf-pilot.json', 'no-cache']]);
    assert.equal(entry.layer.getVisible(), false);
    assert.equal(entry.layer.getSource().getTileGrid().getMaxZoom(), 10);
    assert.equal(entry.failed, false);
});

test('multiple static charts are omitted independently and HIGH uses its own zoom range', () => {
    const layer = createENRCLayer();
    layer.set('staticCharts', ['ENRC_H1', 'ENRC_H2']);
    setENRCCharts(layer, ['ENRC_H1', 'ENRC_H2', 'ENRC_H3']);
    assert.equal(layer.getSource().getParams().LAYERS, 'ENRC_H3');
    layer.set('staticCharts', ['ENRC_H2']);
    setENRCCharts(layer, layer.get('enrcCharts'));
    assert.equal(layer.getSource().getParams().LAYERS, 'ENRC_H1,ENRC_H3');
    const manifest = { type: 'HIGH', minZoom: 5, maxZoom: 10 };
    assert.deepEqual(staticEnrcVisibility(manifest, 10, 'HIGH'), { visible: true, replaceWms: true });
    assert.deepEqual(staticEnrcVisibility(manifest, 11, 'HIGH'), { visible: true, replaceWms: false });
    assert.deepEqual(staticEnrcVisibility(manifest, 10, 'LOW'), { visible: false, replaceWms: false });
});

test('WMS requests smaller retina tiles without reducing pixel density', () => {
    const layer = createENRCLayer(['ENRC_L3']);
    const source = layer.getSource();
    const projection = getProjection('EPSG:3857');
    const url = new URL(source.getTileUrlFunction()([8, 103, 132], 2, projection), 'http://localhost');
    assert.equal(url.searchParams.get('WIDTH'), '512');
    assert.equal(url.searchParams.get('HEIGHT'), '512');
    assert.equal(source.getTileGrid().getTileSize(8), 256);
    assert.equal(layer.getPreload(), 0);
});

test('high zoom keeps static ENRC visible while enabling WMS detail', () => {
    const manifest = { minZoom: 5, maxZoom: 8 };
    assert.deepEqual(staticEnrcVisibility(manifest, 8, 'LOW'), { visible: true, replaceWms: true });
    assert.deepEqual(staticEnrcVisibility(manifest, 12, 'LOW'), { visible: true, replaceWms: false });
    for (const [zoom, type, failed] of [[4, 'LOW', false], [8, 'HIGH', false], [8, 'LOW', true]]) {
        assert.deepEqual(staticEnrcVisibility(manifest, zoom, type, failed), { visible: false, replaceWms: false });
    }
});

test('WMS omits the static chart and restores it for fallback', () => {
    const layer = createENRCLayer();
    layer.set('staticChart', 'ENRC_L3');
    setENRCCharts(layer, ['ENRC_L2', 'ENRC_L3']);
    assert.equal(layer.getSource().getParams().LAYERS, 'ENRC_L2');
    layer.set('staticChart', null);
    setENRCCharts(layer, layer.get('enrcCharts'));
    assert.equal(layer.getSource().getParams().LAYERS, 'ENRC_L2,ENRC_L3');
    layer.set('staticChart', 'ENRC_L3');
    setENRCCharts(layer, ['ENRC_L3']);
    assert.equal(layer.getSource().getTileUrlFunction()([5, 1, 1], 2, null), undefined);
});
