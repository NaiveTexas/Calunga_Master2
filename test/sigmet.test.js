import test from "node:test";
import assert from "node:assert/strict";
import { sigmetRelevance } from "../js/core/sigmetRelevance.js";
import { sigmetFeatures } from "../map/weather/sigmetLayer.js";
const leg = { route: { origin: { position: { latitude: 0, longitude: 0 } }, destination: { position: { latitude: 0, longitude: 2 } }, waypoints: [] }, schedule: { date: "2026-09-14", etd: "12:00", arrival: "2026-09-14T14:00:00Z" } };
const report = { start: "2026-09-14 13:00:00", end: "2026-09-14 15:00:00", text: "SIGMET TS" };
test("map projects and closes relevant polygons once across multiple legs", () => {
    const warning = { ...report, coordinates: [[0, 1], [.01, 1], [.01, 1.01]], fir: "SBRE", number: "3" };
    const features = sigmetFeatures([warning, { ...warning, start: "2026-09-15 13:00:00", end: "2026-09-15 15:00:00" }, report], [leg, leg]);
    assert.equal(features.length, 1);
    const ring = features[0].getGeometry().getCoordinates()[0];
    assert.equal(ring.length, 4);
    assert.deepEqual(ring[0], ring.at(-1));
    assert.ok(Math.abs(ring[0][0] - 111319.49) < 1);
    assert.match(features[0].get("label"), /SBRE SIGMET 3/);
});
test("SIGMET includes intermediate points and evaluates each leg's own time", () => {
    const warning = { ...report, coordinates: [[1.95, .95], [2.05, .95], [2.05, 1.05], [1.95, 1.05]] };
    const via = { ...leg, route: { ...leg.route, waypoints: [{ position: { latitude: 2, longitude: 1 } }] } };
    assert.equal(sigmetRelevance(warning, leg), "outside");
    assert.equal(sigmetRelevance(warning, via), "relevant");
    assert.equal(sigmetRelevance(warning, { ...via, schedule: { ...leg.schedule, etd: "16:00", arrival: "2026-09-14T18:00:00Z" } }), "outside");
});
test("SIGMET checks 20 NM corridor, endpoint area and temporal overlap", () => {
    const box = (lat, lon) => [[lat, lon], [lat + .01, lon], [lat + .01, lon + .01], [lat, lon + .01]];
    assert.equal(sigmetRelevance({ ...report, coordinates: box(.32, 1) }, leg), "relevant");
    assert.equal(sigmetRelevance({ ...report, coordinates: box(.35, 1) }, leg), "outside");
    assert.equal(sigmetRelevance({ ...report, coordinates: box(0, -.3) }, leg), "relevant");
    assert.equal(sigmetRelevance({ ...report, coordinates: box(-.005, 1) }, leg), "relevant");
    assert.equal(sigmetRelevance({ ...report, start: "2026-09-14 15:00:00", end: "2026-09-14 16:00:00", coordinates: box(0, 1) }, leg), "outside");
    assert.equal(sigmetRelevance(report, leg), "review");
    assert.equal(sigmetRelevance({ ...report, text: "CNL SIGMET", coordinates: box(0, 1) }, leg), "review");
    assert.equal(sigmetRelevance({ ...report, coordinates: box(0, 1) }, { ...leg, schedule: {} }), "review");
});
