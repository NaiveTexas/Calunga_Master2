import test from "node:test";
import assert from "node:assert/strict";
import { createBriefingPdf } from "../js/services/briefingPdf.js";

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
