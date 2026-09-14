import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseHTML } from "linkedom";

test("route accordion switches bound controls, preserves edits and removes a leg", async () => {
    const { window, document } = parseHTML(readFileSync(new URL("../index.html", import.meta.url), "utf8"));
    globalThis.window = window;
    globalThis.document = document;
    globalThis.CustomEvent = window.CustomEvent;
    window.getComputedStyle = () => ({ display: "block" });
    // LinkeDOM lacks the browser's select.value setter.
    Object.defineProperty(window.HTMLSelectElement.prototype, "value", {
        configurable: true,
        get() { return this.querySelector("option[selected]")?.value || this.querySelector("option")?.value || ""; },
        set(value) { for (const option of this.querySelectorAll("option")) option.toggleAttribute("selected", option.value === value); }
    });
    const { mission, missionLegs } = await import("../js/models/missions.js");
    const { initializeMissionController } = await import("../js/controllers/missionController.js");
    const { initializeRoutePanel } = await import("../js/ui/routePanel.js");
    const { initializeSchedulePanel } = await import("../js/ui/schedulePanel.js");
    const { initializeFuelPanel } = await import("../js/ui/fuelPanel.js");

    const { updateMission } = await import("../js/core/missionEngine.js");
    initializeMissionController();
    initializeSchedulePanel();

    initializeRoutePanel();
    initializeFuelPanel();
    const first = missionLegs.active();
    first.route.origin = { icao: "SBFZ", name: "Fortaleza", position: { latitude: -3.77, longitude: -38.53 } };
    first.route.destination = { icao: "SBRF", name: "Recife", position: { latitude: -8.12, longitude: -34.92 } };
    first.schedule.date = "2026-12-31";
    first.schedule.etd = "23:30";
    first.fuel.onboard = 4000;
    first.payload.data.total.weight = 150;
    updateMission();
    const click = selector => document.querySelector(selector).click();
    const change = (selector, value) => {
        const input = document.querySelector(selector);
        input.value = value;
        input.dispatchEvent(new window.Event("change"));
    };
    assert.equal(document.querySelectorAll(".leg-card").length, 1);
    assert.equal(document.getElementById("legEditor").hidden, false);
    click(".leg-toggle");
    assert.equal(document.getElementById("legEditor").hidden, true);
    click(".add-leg");
    const second = missionLegs.active();
    assert.notEqual(second.id, first.id);
    assert.equal(document.getElementById("departure").value, "SBRF");
    assert.equal(document.getElementById("date").value, "2027-01-01");
    assert.equal(document.getElementById("etd").value, second.schedule.etd);
    assert.equal(document.querySelectorAll("#departure").length, 1);
    assert.equal(document.querySelectorAll('[aria-expanded="true"]').length, 1);
    change("#etd", "12:45");
    change(`#weightPanel [data-leg-id="${mission.activeLegId}"] [data-field="payloadPanel"] input`, "275");
    click(`#fuelPanel [data-leg-id="${second.id}"] [data-field="fuelOnBoard"] .stepper-plus`);
    assert.equal(second.automatic.departure, false);
    assert.equal(second.automatic.fuel, false);
    assert.equal(second.payload.data.total.weight, 275);
    const secondFuel = second.fuel.onboard;
    click(`[data-leg-id="${first.id}"] .leg-toggle`);
    assert.equal(document.getElementById("departure").value, "SBFZ");
    assert.equal(document.querySelector(`#weightPanel [data-leg-id="${mission.activeLegId}"] [data-field="payloadPanel"] input`).value, "150");
    assert.equal(mission.fuel.onboard, 4000);
    change("#etd", "20:00");
    click(`[data-leg-id="${second.id}"] .leg-toggle`);
    assert.equal(document.getElementById("etd").value, "12:45");
    assert.equal(mission.fuel.onboard, secondFuel);
    assert.equal(document.querySelector(`#weightPanel [data-leg-id="${mission.activeLegId}"] [data-field="payloadPanel"] input`).value, "275");

    // Both overview panels retain all legs and bind edits to the card, not selection.
    const fuelCard = id => document.querySelector(`#fuelPanel [data-leg-id="${id}"]`);
    const dashboardCard = id => document.querySelector(`#dashboardPanel [data-leg-id="${id}"]`);
    assert.equal(document.querySelectorAll("#fuelPanel .planning-leg-card").length, 2);
    assert.equal(document.querySelectorAll("#dashboardPanel .planning-leg-card").length, 2);
    assert.match(document.querySelector(".leg-toggle").textContent, /NM/);
    fuelCard(first.id).open = false;
    fuelCard(second.id).open = true;
    dashboardCard(second.id).open = true;
    const firstTaxi = first.fuel.taxi;
    const secondTaxi = second.fuel.taxi;
    click(`#fuelPanel [data-leg-id="${first.id}"] [data-field="taxiFuel"] .stepper-plus`);
    assert.equal(first.fuel.taxi, firstTaxi + 10);
    assert.equal(second.fuel.taxi, secondTaxi);
    assert.equal(mission.activeLegId, second.id);
    assert.equal(fuelCard(first.id).open, false);
    assert.equal(fuelCard(second.id).open, true);
    assert.equal(dashboardCard(second.id).open, true);
    assert.equal(dashboardCard(first.id).querySelector('[data-field="dashboard-fuel-on-board"]').textContent, "4000 LB");
    click(`#fuelPanel [data-leg-id="${first.id}"] [data-field="restoreAutomaticFuel"]`);
    assert.equal(first.fuel.taxi, firstTaxi);
    assert.equal(first.fuel.manual.taxi, false);
    second.automatic.fuel = true;
    change(`#fuelPanel [data-leg-id="${second.id}"] [data-field="legRefuel"]`, "500");
    assert.equal(second.fuel.onboard, Math.floor(first.fuel.arrival / 100) * 100 + 500);
    assert.equal(dashboardCard(second.id).querySelector('[data-field="dashboard-fuel-on-board"]').textContent, `${Math.round(second.fuel.onboard)} LB`);
    const ids = [...document.querySelectorAll("[id]")].map(element => element.id);
    assert.equal(new Set(ids).size, ids.length);

    const { updateWeatherBriefing } = await import("../js/ui/weatherPanel.js");
    const savedFetch = globalThis.fetch;
    second.route.destination = { icao: "SBSV", position: { latitude: -12.91, longitude: -38.33 } };
    updateMission();
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ airports:
        ["SBFZ", "SBRF", "SBSV"].map(icao => ({ icao, metar: `${icao} METAR`, taf: `${icao} TAF` })) }) });
    try { await updateWeatherBriefing(); } finally { globalThis.fetch = savedFetch; }
    const weatherTitles = card => [...card.querySelectorAll('[data-field="weatherBriefing"] h3')].map(node => node.textContent.split(" — ")[0]);
    assert.deepEqual(weatherTitles(dashboardCard(first.id)), ["SBFZ", "SBRF"]);
    assert.deepEqual(weatherTitles(dashboardCard(second.id)), ["SBRF", "SBSV"]);
    const weatherCards = document.querySelectorAll("#weatherToolBriefing .planning-leg-card");
    assert.equal(weatherCards.length, 2);
    assert.match(weatherCards[0].textContent, /SBFZ METAR/);
    assert.doesNotMatch(weatherCards[0].textContent, /SBSV METAR/);
    assert.match(weatherCards[1].textContent, /SBSV METAR/);
    assert.equal(document.querySelectorAll("#weightPanel .planning-leg-card").length, 2);
    change(`#weightPanel [data-leg-id="${first.id}"] [data-field="payloadPanel"] input`, "320");
    assert.equal(first.weight.payload, 320);
    assert.equal(second.weight.payload, 275);
    assert.equal(mission.activeLegId, second.id);
    const payload = document.querySelector(`#weightPanel [data-leg-id="${first.id}"] [data-field="payloadPanel"]`);
    payload.querySelectorAll(".payload-mode")[2].click();
    const passengerWeight = payload.querySelector(".payload-passenger-list .crew-weight");
    passengerWeight.value = "105";
    passengerWeight.dispatchEvent(new window.Event("input"));
    assert.equal(payload.querySelector(".payload-passenger-list .crew-weight"), passengerWeight);
    assert.equal(first.payload.data.detailed.passengers[0].weight, 105);
    assert.match(payload.querySelector('[data-total="passengers"]').textContent, /105/);
    assert.equal(second.payload.mode, "TOTAL");
    window.confirm = () => false;
    click(`[data-leg-id="${second.id}"] .remove-leg`);
    assert.equal(mission.legs.length, 2);
    window.confirm = () => true;
    click(`[data-leg-id="${second.id}"] .remove-leg`);
    assert.equal(mission.legs.length, 1);
    assert.equal(document.querySelectorAll("#fuelPanel .planning-leg-card").length, 1);
    assert.equal(document.querySelectorAll("#dashboardPanel .planning-leg-card").length, 1);
    assert.equal(document.querySelectorAll("#weightPanel .planning-leg-card").length, 1);
    assert.equal(document.querySelectorAll("#weatherToolBriefing .planning-leg-card").length, 1);
    assert.equal(mission.activeLegId, first.id);
    assert.equal(document.getElementById("departure").value, "SBFZ");
    assert.equal(document.querySelector(".remove-leg").hidden, true);

    // Exercise sequential entry with Enter, then the two-Tab shortcut.
    const { loadNavigationFixes } = await import("../js/database/navigation.js");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, json: async () =>
        ["SAFUC", "UKARI", "DENDO", "ARURU"].map(ident => ({ ident, type: "FIX" })) });
    try { await loadNavigationFixes(); } finally { globalThis.fetch = originalFetch; }
    let focused;
    window.HTMLElement.prototype.focus = function () { focused = this; };
    const key = (target, value) => {
        const event = new window.Event("keydown", { bubbles: true, cancelable: true });
        Object.defineProperty(event, "key", { value });
        target.dispatchEvent(event);
    };
    click("#waypointPanel > button");
    for (const ident of ["SAFUC", "UKARI", "DENDO", "ARURU"]) {
        const input = document.querySelector(".waypoint-search input");
        assert.equal(focused, input);
        input.value = ident;
        input.dispatchEvent(new window.Event("input"));
        if (ident === "DENDO") {
            const before = mission.route.waypoints.length;
            key(input, "Tab");
            assert.equal(mission.route.waypoints.length, before);
            assert.equal(focused, document.querySelector(".waypoint-results button"));
            key(focused, "Tab");
        } else key(input, "Enter");
        assert.equal(document.querySelector(".waypoint-search input").value, "");
    }
    assert.deepEqual(mission.route.waypoints.map(point => point.ident), ["SAFUC", "UKARI", "DENDO", "ARURU"]);

    const { loadAirports, getAirport } = await import("../js/database/airports.js");
    const { loadNavigationVORs } = await import("../js/database/navigation.js");
    globalThis.fetch = async url => ({ ok: true, json: async () => String(url).endsWith("/vors")
        ? [{ ident: "FLZ", type: "VOR", position: { latitude: -3.77, longitude: -38.54 } }]
        : [{ icao: "SBFZ", type: "AIRPORT", name: "Fortaleza", position: { latitude: -3.77, longitude: -38.53 } }] });
    try { await loadAirports(); await loadNavigationVORs(); } finally { globalThis.fetch = originalFetch; }
    const search = document.querySelector(".waypoint-search input");
    search.value = "SBFZ";
    search.dispatchEvent(new window.Event("input"));
    key(search, "Enter");
    const airportRow = document.querySelector(".route-point-airport");
    const airportPoint = mission.route.waypoints.at(-1);
    assert.equal(airportPoint.reference.ident, "FLZ");
    change(".waypoint-speed input", "180");
    change(".waypoint-level", "FL090");
    const procedure = airportRow.querySelector('input[type="checkbox"]');
    procedure.checked = true;
    procedure.dispatchEvent(new window.Event("change"));
    assert.equal(airportPoint.procedure, true);
    assert.equal(mission.schedule.procedureEet, mission.aircraft.model.procedureTime / 60);
    assert.match(dashboardCard(first.id).querySelector('[data-field="dashboard-waypoints"]').textContent, /FLZ\/N0180F090/);
    assert.equal(getAirport("SBFZ").procedure, undefined);
    procedure.checked = false;
    procedure.dispatchEvent(new window.Event("change"));
    assert.equal(mission.schedule.procedureEet, 0);
});
