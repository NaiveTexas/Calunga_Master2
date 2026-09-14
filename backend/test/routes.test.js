import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import axios from "axios";

// Exercise the real HTTP routes without calling external providers.
let providerFailure = false;
const calls = [];
axios.defaults.adapter = async request => {
    calls.push(request);
    if (providerFailure) throw new Error("Provider unavailable");
    let data;
    const type = request.params?.typeName;
    if (type === "ICA:waypoint") {
        data = { features: [{ properties: { ident: "FIXA", latitude: -5, longitude: -35 } }] };
    } else if (type === "ICA:airport") {
        data = { features: [
            { properties: { localidade_id: "SBNT", nome: "Natal", latitude_dec: "-5.9", longitude_dec: "-35.2", elevacao: "50" } },
            { properties: {} }
        ] };
    } else if (type === "ICA:vor") {
        data = { features: [
            { properties: { ident: "NTL", latitude: "-5.9", longitude: "-35.2", frequency: 115.3 } },
            { properties: {} }
        ] };
    } else if (type?.startsWith("ICA:MAP_ENRC")) {
        data = { type: "FeatureCollection", features: [], source: type };
    } else if (request.url.includes("/mensagens/")) {
        data = { data: { data: [{ id_localidade: "SBNT", mens: request.url.includes("/metar/") ? "METAR SBNT" : "TAF SBNT" }] } };
    } else if (request.url === "/gfs") {
        data = request.params.latitude.split(",").map(() => ({
            elevation: 30,
            hourly: {
                time: [new Date(Date.now() + 3_600_000).toISOString().slice(0, 16)],
                geopotential_height_1000hPa: [100],
                temperature_1000hPa: [20],
                cloud_cover_1000hPa: [90]
            }
        }));
    } else if (request.url === "/elevation") {
        data = { elevation: request.params.latitude.split(",").map((_, index) => index % 3 === 0 ? 40 : 60) };
    } else if (request.url.endsWith("/wms")) {
        data = Buffer.from([137, 80, 78, 71]);
    } else {
        throw new Error(`Unexpected provider request: ${request.url}`);
    }
    return { data, status: 200, statusText: "OK", headers: { "content-type": "image/png" }, config: request };
};

const { app } = await import("../app.js");
const savedKey = process.env.REDEMET_API_KEY;
let server;
let baseUrl;
before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    process.env.REDEMET_API_KEY = "test-key";
});
after(async () => {
    if (savedKey === undefined) delete process.env.REDEMET_API_KEY;
    else process.env.REDEMET_API_KEY = savedKey;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

async function request(endpoint, body) {
    const response = await fetch(baseUrl + endpoint, body === undefined ? {} : {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
}

test("health endpoints preserve their responses and CORS", async () => {
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Calunga/);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.deepEqual(await request("/api/test"), {
        status: 200, data: { status: "ok", message: "API do Calunga funcionando!" }
    });
});

test("weather rejects invalid input and missing credentials without provider requests", async () => {
    const count = calls.length;
    assert.equal((await request("/api/weather/briefing?airports=123")).status, 400);
    delete process.env.REDEMET_API_KEY;
    assert.equal((await request("/api/weather/briefing?airports=SBNT")).status, 503);
    process.env.REDEMET_API_KEY = "test-key";
    assert.equal((await request("/api/weather/gramet", {})).status, 400);
    const routePoints = [{ latitude: -5, longitude: -35 }, { latitude: -6, longitude: -36 }];
    for (const departureTime of ["invalid", "2000-01-01", "2100-01-01"]) {
        assert.equal((await request("/api/weather/gramet", { routePoints, departureTime })).status, 400);
    }
    assert.equal(calls.length, count);
});

test("provider failures retain HTTP error codes", async () => {
    providerFailure = true;
    try {
        for (const endpoint of ["navigation/fixes", "navigation/airports", "navigation/vors", "charts/enrc/index/low", "charts/enrc/index/high", "charts/enrc/wms"]) {
            assert.equal((await request(`/api/${endpoint}`)).status, 500);
        }
        assert.equal((await request("/api/weather/briefing?airports=SBNT")).status, 502);
        assert.equal((await request("/api/weather/gramet", {
            routePoints: [{ latitude: -5, longitude: -35 }, { latitude: -6, longitude: -36 }],
            departureTime: new Date(Date.now() + 3_600_000).toISOString(), eetHours: 1
        })).status, 502);
    } finally {
        providerFailure = false;
    }
});

test("navigation normalizes provider data and reuses cached responses", async () => {
    const count = calls.length;
    const fixes = await request("/api/navigation/fixes");
    assert.equal(fixes.status, 200);
    assert.deepEqual(fixes.data, [{ type: "FIX", ident: "FIXA", position: { latitude: -5, longitude: -35 } }]);
    assert.deepEqual(await request("/api/navigation/fixes"), fixes);
    assert.equal(calls.length, count + 1);
    const airports = await request("/api/navigation/airports");
    assert.equal(airports.status, 200);
    assert.equal(airports.data.length, 1);
    assert.equal(airports.data[0].icao, "SBNT");
    assert.deepEqual(airports.data[0].position, { latitude: -5.9, longitude: -35.2, elevation: 50 });
    const vors = await request("/api/navigation/vors");
    assert.equal(vors.status, 200);
    assert.equal(vors.data.length, 1);
    assert.equal(vors.data[0].frequency, 115.3);
});

test("weather deduplicates ICAOs and preserves unavailable reports", async () => {
    const result = await request("/api/weather/briefing?airports=sbnt,SBNT,SBRF,123");
    assert.deepEqual(result, { status: 200, data: { airports: [
        { icao: "SBNT", metar: "METAR SBNT", taf: "TAF SBNT" },
        { icao: "SBRF", metar: null, taf: null }
    ] } });
});

test("GRAMET combines forecast, cloud profile and terrain corridor", async () => {
    const result = await request("/api/weather/gramet", {
        routePoints: [{ ident: "A", latitude: -5, longitude: -35 }, { ident: "B", latitude: -6, longitude: -36 }],
        departureTime: new Date(Date.now() + 3_600_000).toISOString(), eetHours: 1
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.model, "NOAA GFS 0.25° via Open-Meteo");
    assert.ok(result.data.points.length >= 2);
    const first = result.data.points[0];
    assert.equal(first.ident, "A");
    assert.equal(first.distanceNm, 0);
    assert.equal(first.terrainElevation, 40);
    assert.equal(first.corridorElevation, 60);
    assert.equal(first.profile[0].temperature, 20);
    assert.equal(first.cloudLayers[0].classification, "OVC");
    assert.equal(result.data.points.at(-1).ident, "B");
});

test("ENRC serves both GeoJSON indices and binary WMS responses", async () => {
    for (const [type, source] of [["low", "ICA:MAP_ENRCL_OTHER"], ["high", "ICA:MAP_ENRCH_OTHER"]]) {
        assert.deepEqual(await request(`/api/charts/enrc/index/${type}`), {
            status: 200, data: { type: "FeatureCollection", features: [], source }
        });
    }
    const response = await fetch(baseUrl + "/api/charts/enrc/wms?service=WMS&layers=test");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from([137, 80, 78, 71]));
    assert.equal(calls.at(-1).params.layers, "test");
});
