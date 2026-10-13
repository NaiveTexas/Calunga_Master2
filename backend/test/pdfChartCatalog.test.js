import test from 'node:test';
import assert from 'node:assert/strict';
import { PMTiles, FetchSource } from 'pmtiles';
import { app } from '../app.js';

test('PDF catalog serves all nine LOW and nine HIGH charts', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = process.env.TEST_ACCESS_PASSWORD ? { Authorization: 'Basic ' + Buffer.from(`${process.env.TEST_ACCESS_USER || 'testador'}:${process.env.TEST_ACCESS_PASSWORD}`).toString('base64') } : {};
    try {
        const response = await fetch(base + '/enrc-static/pdf-charts.json', { headers });
        assert.equal(response.status, 200);
        assert.match(response.headers.get('cache-control'), /no-cache/);
        const { charts } = await response.json();
        assert.equal(charts.length, 18);
        assert.equal(new Set(charts.map(chart => chart.chart)).size, 18);
        assert.equal(charts.filter(chart => chart.type === 'LOW').length, 9);
        assert.equal(charts.filter(chart => chart.type === 'HIGH').length, 9);
        for (const chart of charts) {
            assert.equal(chart.maxZoom, 10);
            assert.ok(chart.georeferenceResidualMeters < 2);
            assert.ok(chart.maxWarpErrorPixels <= .1);
            const lon = (chart.extent[0] + chart.extent[2]) / 2;
            const lat = (chart.extent[1] + chart.extent[3]) / 2;
            const x = Math.floor((lon + 180) / 360 * 1024);
            const y = Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 1024);
            assert.equal(chart.format, 'pmtiles');
            const archive = new PMTiles(new FetchSource(base + chart.url, new Headers(headers)));
            const tile = await archive.getZxy(10, x, y);
            assert.ok(tile?.data, chart.chart);
            const bytes = Buffer.from(tile.data);
            assert.equal(bytes.readUInt32BE(16), 512, chart.chart);
            assert.equal(bytes.readUInt32BE(20), 512, chart.chart);
        }
    } finally { await new Promise(resolve => server.close(resolve)); }
});
