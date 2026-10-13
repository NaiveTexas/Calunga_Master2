import test from 'node:test';
import assert from 'node:assert/strict';
import { PMTiles, FetchSource } from 'pmtiles';
import { app } from '../app.js';

test('compatibility catalogs serve PMTiles with partial immutable responses', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = process.env.TEST_ACCESS_PASSWORD ? { Authorization: 'Basic ' +
        Buffer.from(`${process.env.TEST_ACCESS_USER || 'testador'}:${process.env.TEST_ACCESS_PASSWORD}`).toString('base64') } : {};
    try {
        for (const path of ['/manifest.json', '/pdf-pilot.json']) {
            const response = await fetch(base + '/enrc-static' + path, { headers });
            assert.equal(response.status, 200);
            assert.match(response.headers.get('cache-control'), /no-cache/);
            const catalog = await response.json();
            const chart = (catalog.charts || [catalog]).find(c => c.chart === 'ENRC_L3');
            assert.equal(chart.format, 'pmtiles');
            const range = await fetch(base + chart.url, { headers: { ...headers, Range: 'bytes=0-126' } });
            assert.equal(range.status, 206);
            assert.match(range.headers.get('cache-control'), /immutable/);
            const archive = new PMTiles(new FetchSource(base + chart.url, new Headers(headers)));
            const tile = await archive.getZxy(10, 412, 535);
            const bytes = Buffer.from(tile.data);
            assert.equal(bytes.readUInt32BE(16), 512);
            assert.equal(bytes.readUInt32BE(20), 512);
        }
    } finally { await new Promise(resolve => server.close(resolve)); }
});
