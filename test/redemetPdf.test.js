import test from "node:test";
import assert from "node:assert/strict";
import { buildRedemetPdfUrl } from "../js/services/redemetPdf.js";

test("REDEMET link encodes UTC departure and products from the spreadsheet", () => {
    const leg = {
        route: { origin: { icao: "SBNT" }, destination: { icao: "SBRF" }, alternate: { icao: "SBFZ" },
            waypoints: [{ type: "AIRPORT", icao: "SBFZ" }, { type: "FIX", ident: "SAFUC" }] },
        schedule: { date: "2026-12-31", etd: "23:50" }, flightLevel: "FL090"
    };
    const url = new URL(buildRedemetPdfUrl(leg));
    assert.equal(url.origin, "https://www.redemet.aer.mil.br");
    assert.equal(url.searchParams.get("localidades"), "SBNT,SBRF,SBFZ");
    assert.equal(url.searchParams.get("nivelvoo"), "090");
    assert.equal(url.searchParams.get("datahora"), "31/12/26 23:50");
    assert.deepEqual(url.searchParams.getAll("fir[]"), ["SBAZ", "SBAO", "SBBS", "SBCW", "SBRE"]);
    assert.deepEqual(url.searchParams.getAll("msg_met[]"), ["metar", "taf"]);
    assert.equal(url.searchParams.get("img_sat"), "img_sat");
    leg.schedule.date = "2026-02-30";
    assert.equal(buildRedemetPdfUrl(leg), null);
    leg.schedule.date = "2027-01-01";
    leg.schedule.etd = "01:00";
    assert.equal(new URL(buildRedemetPdfUrl(leg)).searchParams.get("datahora"), "01/01/27 01:00");
    leg.route.origin = null;
    assert.equal(buildRedemetPdfUrl(leg), null);
});
