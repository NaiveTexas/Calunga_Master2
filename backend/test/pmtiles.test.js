import test from 'node:test';
import assert from 'node:assert/strict';
import { PMTiles, FetchSource } from 'pmtiles';
import { app } from '../app.js';

test('L3 PMTiles serves authenticated ranges and PNG images at every zoom', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = process.env.TEST_ACCESS_PASSWORD ? { Authorization: 'Basic ' + Buffer.from(`${process.env.TEST_ACCESS_USER || 'testador'}:${process.env.TEST_ACCESS_PASSWORD}`).toString('base64') } : {};
    try {
        const response = await fetch(base + '/enrc-static/pmtiles-pilot.json', { headers });
        assert.equal(response.status, 200);
        assert.match(response.headers.get('cache-control'), /no-cache/);
        const manifest = await response.json();
        const head = await fetch(base + manifest.url, { headers: { ...headers, Range: 'bytes=0-126' } });
        assert.equal(head.status, 206);
        assert.equal(head.headers.get('content-range'), `bytes 0-126/${manifest.archiveBytes}`);
        assert.equal((await head.arrayBuffer()).byteLength, 127);
        const source = new FetchSource(base + manifest.url, new Headers(headers));
        let transferred = 0, requests = 0;
        const archive = new PMTiles({ getKey: () => source.getKey(), getBytes: async (...args) => {
            const result = await source.getBytes(...args);
            transferred += result.data.byteLength; requests++;
            return result;
        } });
        for (let z = 5; z <= 10; z++) {
            const x = Math.floor((-35 + 180) / 360 * 2 ** z);
            const y = Math.floor((1 - Math.asinh(Math.tan(-8 * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);
            const result = await archive.getZxy(z, x, y);
            assert.ok(result?.data);
            const bytes = Buffer.from(result.data);
            assert.deepEqual([...bytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
            assert.equal(bytes.readUInt32BE(16), 512);
            assert.equal(bytes.readUInt32BE(20), 512);
        }
        assert.ok(transferred < manifest.archiveBytes / 10, 'must not download the whole archive');
        console.log(`PMTiles: ${requests} range requests, ${transferred} bytes for 6 zoom levels; archive ${manifest.archiveBytes} bytes`);
    } finally { await new Promise(resolve => server.close(resolve)); }
});
