import test from "node:test";
import assert from "node:assert/strict";
import { mission, missionLegs } from "../js/models/missions.js";
import { serializeMission, parseMission, restoreMission, DRAFT_KEY } from "../js/core/missionStorage.js";
import { recalculateMission } from "../js/core/missionEngine.js";
import { parseHTML } from "linkedom";
import { readFileSync } from "node:fs";
import { setNotamExcluded, isNotamExcluded } from "../js/core/notamExclusions.js";

test("NOTAM exclusions survive saved missions and old missions clear them", () => {
    const report = { loc: "SBNT", n: "B0123/26", b: "2609010000", e: "TEST" };
    setNotamExcluded(mission.settings, report, "SBNT", true);
    const data = parseMission(serializeMission());
    restoreMission(data);
    assert.equal(isNotamExcluded(mission.settings, report), true);
    assert.equal(isNotamExcluded(mission.settings, { ...report, e: "REVISED" }), false);
    assert.equal(isNotamExcluded(mission.settings, { ...report, loc: "SBGL" }), false);
    delete data.settings.excludedNotams;
    restoreMission(data);
    assert.equal(isNotamExcluded(mission.settings, report), false);
});

test("mission round trip preserves all leg inputs and recalculates results", () => {
    const airport = (icao, longitude) => ({ type: "AIRPORT", icao, name: icao, position: { latitude: -5, longitude } });
    const first = missionLegs.active();
    first.route.origin = airport("SBNT", -35);
    first.route.destination = airport("SBRF", -34);
    first.route.waypoints = [{ ...airport("SBFZ", -38), reference: { ident: "FLZ" }, outboundSpeed: 180, outboundLevel: "FL090", procedure: true }];
    first.schedule.date = "2026-12-31";
    first.schedule.etd = "23:50";
    first.flightLevel = "FL130";
    first.fuel.onboard = 3500;
    first.fuel.manual.taxi = true;
    first.fuel.taxi = 55;
    first.payload.data.detailed.passengers[0].name = "João";
    const second = missionLegs.add();
    second.route.destination = airport("SBSV", -39);
    second.refuel = 700;
    second.payload.data.total.weight = 220;
    recalculateMission();
    const saved = serializeMission();
    assert.equal(JSON.parse(saved).legs[0].fuel.arrival, undefined);
    assert.equal(JSON.parse(saved).legs[0].schedule.eta, undefined);
    const arrival = first.fuel.arrival;
    const boundRoute = mission.route;
    first.fuel.onboard = 1;
    restoreMission(parseMission(saved));
    recalculateMission();
    assert.equal(mission.legs.length, 2);
    assert.equal(mission.legs[0].fuel.arrival, arrival);
    assert.equal(mission.legs[0].flightLevel, "FL130");
    assert.equal(mission.legs[0].payload.data.detailed.passengers[0].name, "João");
    assert.equal(mission.legs[1].fuel.onboard, Math.floor(arrival / 100) * 100 + 700);
    assert.equal(mission.legs[1].payload.data.total.weight, 220);
    assert.equal(boundRoute.destination.icao, "SBSV");
    assert.equal(serializeMission(), saved);
});

test("old C-95AM registration migrates to FAB2299 without changing leg inputs", () => {
    const original = serializeMission();
    const legacy = JSON.parse(original);
    legacy.aircraft = { model: "C-95AM", registration: "FAB2291" };
    const migrated = parseMission(JSON.stringify(legacy));
    assert.equal(migrated.aircraft.registration, "FAB2299");
    assert.deepEqual(migrated.legs, legacy.legs);
    try {
        restoreMission(migrated);
        recalculateMission();
        assert.equal(mission.aircraft.registration.registration, "FAB2299");
        assert.equal(JSON.parse(serializeMission()).aircraft.registration, "FAB2299");
    } finally { restoreMission(parseMission(original)); recalculateMission(); }
});

test("invalid imports are rejected without modifying the current mission", () => {
    const before = serializeMission();
    for (const mutate of [
        data => data.version = 99,
        data => data.aircraft.registration = "UNKNOWN",
        data => data.legs[0].route.origin.position.latitude = 91,
        data => data.legs[0].schedule.date = "2026-02-30",
        data => data.legs[0].fuel.manual = null,
        data => data.legs[0].payload.data.detailed.passengers = null,
        data => data.activeIndex = 100,
        data => data.legs = []
    ]) {
        const data = JSON.parse(before);
        mutate(data);
        assert.throws(() => parseMission(JSON.stringify(data)));
        assert.equal(serializeMission(), before);
    }
});

test("autosave, recovery and storage failures preserve the existing draft", async () => {
    const { document, window } = parseHTML(readFileSync(new URL("../index.html", import.meta.url), "utf8"));
    globalThis.window = window;
    globalThis.document = document;
    globalThis.CustomEvent = window.CustomEvent;
    Object.defineProperty(window.HTMLSelectElement.prototype, "value", {
        configurable: true,
        get() { return this.querySelector("option[selected]")?.value || this.querySelector("option")?.value || ""; },
        set(value) { for (const option of this.querySelectorAll("option")) option.toggleAttribute("selected", option.value === value); }
    });
    const original = serializeMission();
    const { initializeSchedulePanel } = await import("../js/ui/schedulePanel.js");
    const { initializeAircraftPanel } = await import("../js/ui/aircraftPanel.js");
    initializeSchedulePanel(true);
    initializeAircraftPanel(true);
    assert.equal(serializeMission(), original);
    assert.equal(document.getElementById("flightLevel").value, "FL130");
    assert.equal(document.getElementById("registration").value, "FAB2317");
    const { initializeRoutePanel } = await import("../js/ui/routePanel.js");
    initializeRoutePanel();
    assert.equal(document.getElementById("departure").value, "SBRF");
    assert.equal(document.getElementById("destination").value, "SBSV");
    assert.equal(document.getElementById("departure-name").textContent, "SBRF");
    assert.equal(document.getElementById("destination-name").hidden, false);
    assert.equal(serializeMission(), original);
    const items = new Map();
    globalThis.localStorage = {
        getItem: key => items.get(key) ?? null,
        setItem: (key, value) => items.set(key, value),
        removeItem: key => items.delete(key)
    };
    const { recoverDraft, initializeMissionStoragePanel } = await import("../js/ui/missionStoragePanel.js");
    assert.equal(recoverDraft(), false);
    initializeMissionStoragePanel();
    assert.ok(items.has(DRAFT_KEY));
    mission.legs[0].payload.data.detailed.passengers[0].name = "Maria";
    window.dispatchEvent(new window.Event("pagehide"));
    assert.equal(JSON.parse(items.get(DRAFT_KEY)).legs[0].payload.data.detailed.passengers[0].name, "Maria");
    assert.equal(recoverDraft(), true);
    const previous = items.get(DRAFT_KEY);
    localStorage.setItem = () => { throw new Error("quota"); };
    window.dispatchEvent(new window.Event("pagehide"));
    assert.match(document.querySelector('.mission-storage [role="status"]').textContent, /Não foi possível salvar/);
    assert.equal(items.get(DRAFT_KEY), previous);
    items.set(DRAFT_KEY, "corrupted");
    assert.equal(recoverDraft(), false);
    window.dispatchEvent(new window.Event("pagehide"));
    assert.equal(items.get(DRAFT_KEY), "corrupted");
});
