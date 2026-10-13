import test from 'node:test';
import assert from 'node:assert/strict';
import { getCachedResponse } from '../cache/responseCache.js';
import { deceaClient } from '../clients/deceaClient.js';
import { loadAirports } from '../services/navigationService.js';

test('airport request is reduced and uses its own timeout', async t => {
    t.mock.method(deceaClient, 'get', async (url, options) => {
        assert.equal(options.timeout, 45_000);
        assert.equal(options.params.propertyName, 'localidade_id,nome,cidade,uf,latitude_dec,longitude_dec,elevacao');
        return { data: { features: [{ properties: { localidade_id: 'SBNT', latitude_dec: -5.9, longitude_dec: -35.2 } }] } };
    });
    const result = await loadAirports();
    assert.equal(result[0].icao, 'SBNT');
    assert.equal(result[0].position.latitude, -5.9);
});

test('stale fallback is opt-in, bounded, and never extends the original age', async t => {
    let now = 1000;
    t.mock.method(Date, 'now', () => now);
    t.mock.method(console, 'warn', () => {});
    const request = async () => { throw new Error('timeout'); };
    await getCachedResponse('test:recent-airports', async () => ['SBNT'], 10);
    now = 1020;
    assert.deepEqual(await getCachedResponse('test:recent-airports', request, 10, { staleIfErrorMs: 100 }), ['SBNT']);
    await assert.rejects(getCachedResponse('test:recent-airports', request, 10), /timeout/);
    now = 1101;
    await assert.rejects(getCachedResponse('test:recent-airports', request, 10, { staleIfErrorMs: 100 }), /timeout/);
    await assert.rejects(getCachedResponse('test:no-airports', request, 10, { staleIfErrorMs: 100 }), /timeout/);
});
