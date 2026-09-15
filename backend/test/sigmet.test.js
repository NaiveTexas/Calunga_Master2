import test from "node:test";
import assert from "node:assert/strict";
import { deceaClient } from "../clients/deceaClient.js";
import { loadSigmets } from "../services/sigmetService.js";

test("SIGMET rejects invalid responses, collects all pages and caches the result", async t => {
    const get = t.mock.method(deceaClient, "get", async () => ({ data: { status: false } }));
    await assert.rejects(loadSigmets(), /Invalid SIGMET response/);
    const pages = [];
    get.mock.mockImplementation(async (url, options) => {
        assert.equal(url, "https://api-redemet.decea.mil.br/mensagens/sigmet");
        pages.push(options.params.page);
        return { data: { status: true, data: { last_page: 2, data: [{
            id_fir: "SBRE", no_mens: options.params.page,
            validade_inicial: "2026-09-14 12:00:00", validade_final: "2026-09-14 16:00:00",
            mens: "SIGMET TS", lat_lon: [[0, 0], [0, 1], [1, 1]],
            fenomeno_comp: "Trovoada"
        }] } } };
    });
    const result = await loadSigmets();
    assert.deepEqual(pages, [1, 2]);
    assert.equal(result.reports.length, 2);
    assert.equal(result.reports[0].phenomenon, "Trovoada");
    assert.equal(result.reports[0].coordinates.length, 3);
    assert.equal(await loadSigmets(), result);
    assert.deepEqual(pages, [1, 2]);
});
