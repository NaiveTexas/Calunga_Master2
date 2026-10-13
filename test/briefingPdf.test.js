import test from "node:test";
import assert from "node:assert/strict";
import { createBriefingPdf } from "../js/services/briefingPdf.js";
import { setNotamExcluded } from "../js/core/notamExclusions.js";

export const leg = {
    flightLevel: "FL100",
    route: { origin: { icao: "SBNT", position: { latitude: -5.9, longitude: -35.2 } }, destination: { icao: "SBGL", position: { latitude: -22.8, longitude: -43.2 } }, alternate: { icao: "SBRJ" }, waypoints: [] },
    schedule: { date: "2026-09-15", etd: "15:00", eta: "19:00", etaDate: "2026-09-15", arrival: "2026-09-15T19:00:00Z", eet: 4 },
    fuel: { total: 2400, taxi: 30, flight: 1600, procedure: 100, enrouteProcedure: 0 },
    weight: { payload: 400, takeoff: 5500, landing: 4700 }
};
export const aircraft = { model: { name: "C-95BM", cruiseSpeed: 190 }, registration: { registration: "FAB 0000" } };
export const reports = { weather: [{ icao: "SBNT", metar: "SBNT 151500Z 12010KT 9999 SCT020 28/22 Q1013", taf: "TAF SBNT 151200Z 1512/1612 12010KT 9999 SCT020" }], sigmets: [], notams: [{ icao: "SBNT", reports: null }], fetchedAt: "2026-09-15T15:00:00Z" };
test("briefing PDF paginates long reports, identifies the leg and embeds the REDEMET link", () => {
    const pdf = createBriefingPdf(leg, aircraft, { fuelUnit: "LB" }, 1, { ...reports, weather: [{ ...reports.weather[0], taf: "TAF TESTE ".repeat(1500) }] });
    const output = pdf.output();
    assert.ok(pdf.getNumberOfPages() > 2);
    assert.match(output, /Perna 2/);
    assert.match(output, /\/URI/);
    assert.match(output, /redemet.aer.mil.br/);
    assert.match(output, /ogimet.com\/display_gramet.php/);
    assert.match(output, /icao=SBNT_SBGL&hini=0&tref=&hfin=0&fl=100&enviar=Enviar/);
    assert.match(output, /NOTAMS/);
});

test("PDF takes weight and fuel units from the aircraft, regardless of a stale preference", () => {
    const c98 = { ...aircraft, model: { ...aircraft.model, name: "C-98", weightUnit: "LB", fuel: { defaultUnit: "LB" } } };
    const sample = { ...leg, weight: { payload: 453.59237, takeoff: 4535.9237, landing: 4082.33133, availability: { remaining: 45.359237 } } };
    const output = createBriefingPdf(sample, c98, { fuelUnit: "KG" }, 0, reports).output();
    assert.match(output, /10\.000 LB/);
    assert.match(output, /9\.000 LB/);
    assert.match(output, /1\.000 LB \/ 100 LB/);
    assert.match(output, /2\.400 LB/);
    const a29 = { ...aircraft, model: { ...aircraft.model, name: "A-29", weightUnit: "KG", fuel: { defaultUnit: "KG" } } };
    assert.match(createBriefingPdf(leg, a29, { fuelUnit: "LB" }, 0, reports).output(), /2\.400 KG/);
});

test("PDF omits excluded NOTAMs, keeps others and permits undo", () => {
    const ignored = { n: "B0123/26", loc: "SBNT", b: "2609010000", c: "PERM", e: "EXCLUDED_NOTICE" };
    const retained = { ...ignored, n: "B0124/26", e: "RETAINED_NOTICE" };
    const data = { ...reports, notams: [{ icao: "SBNT", reports: [ignored, retained] }] };
    const settings = {};
    setNotamExcluded(settings, ignored, "SBNT", true);
    const output = createBriefingPdf(leg, aircraft, settings, 0, data).output();
    assert.doesNotMatch(output, /EXCLUDED_NOTICE/);
    assert.match(output, /RETAINED_NOTICE/);
    setNotamExcluded(settings, ignored, "SBNT", false);
    assert.match(createBriefingPdf(leg, aircraft, settings, 0, data).output(), /EXCLUDED_NOTICE/);
});
