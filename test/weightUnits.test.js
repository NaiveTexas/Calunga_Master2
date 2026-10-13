import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { aircraftModels, getAircraftModel } from "../js/database/aircraftModels.js";
import { getAircraftRegistration } from "../js/database/aircraftRegistrations.js";
import { aircraftFuelUnit } from "../js/core/fuelUnits.js";
import { displayWeight, inputWeightKg, formatWeight, aircraftWeightUnit } from "../js/core/weightUnits.js";
import { mission } from "../js/models/missions.js";
import { createPayloadEditor } from "../js/ui/payloadPanel.js";
import { serializeMission, parseMission, restoreMission } from "../js/core/missionStorage.js";
import { recalculateMission } from "../js/core/missionEngine.js";

test("models independently select weight and fuel units", () => {
    for (const model of aircraftModels) {
        assert.equal(aircraftWeightUnit(model), model.name === "C-98" ? "LB" : "KG");
        assert.equal(aircraftFuelUnit(model), model.name === "A-29" ? "KG" : "LB");
    }
    const model = getAircraftModel("C-98");
    assert.equal(inputWeightKg(1000, model), 453.59237);
    assert.equal(formatWeight(453.59237, model), "1.000 LB");
    assert.equal(displayWeight(inputWeightKg(220, model), model), 220);
});

test("payload input uses LB in every mode, preserves counts and refreshes on model change", () => {
    const { window, document } = parseHTML('<div id="payload"></div>');
    globalThis.window = window; globalThis.document = document; globalThis.CustomEvent = window.CustomEvent;
    mission.aircraft.model = getAircraftModel("C-98");
    const leg = mission.legs[0];
    leg.payload.mode = "TOTAL";
    const panel = document.getElementById("payload");
    const refresh = createPayloadEditor(panel, leg);
    refresh();
    const change = (input, value, event = "change") => { input.value = String(value); input.dispatchEvent(new window.Event(event, { bubbles: true })); };
    change(panel.querySelector('input'), 1000);
    assert.equal(leg.payload.data.total.weight, 453.59237);
    leg.payload.mode = "AVERAGE"; refresh();
    change(panel.querySelectorAll('input')[0], 3);
    change(panel.querySelectorAll('input')[1], 200);
    assert.equal(leg.payload.data.average.passengers, 3);
    assert.equal(leg.payload.data.average.passengerWeight, 90.718474);
    leg.payload.mode = "DETAILED"; refresh();
    change(panel.querySelector('.payload-passenger-list input[type="number"]'), 200, "input");
    change(panel.querySelector('.payload-cargo-list input[type="number"]'), 100, "input");
    assert.equal(leg.payload.data.detailed.passengers[0].weight, 90.718474);
    assert.equal(leg.payload.data.detailed.cargo[0].weight, 45.359237);
    mission.aircraft.model = getAircraftModel("C-95AM"); refresh();
    assert.equal(panel.querySelector('.payload-unit').textContent, "KG");
    assert.equal(leg.payload.data.total.weight, 453.59237);
    delete globalThis.window; delete globalThis.document; delete globalThis.CustomEvent;
});

test("C-98 saved missions keep canonical weights and fuel without repeated conversion", () => {
    mission.aircraft.model = getAircraftModel("C-98");
    mission.aircraft.registration = getAircraftRegistration("FAB2702");
    mission.crew[0].weight = 90.718474;
    mission.legs[0].payload.mode = "TOTAL";
    mission.legs[0].payload.data.total.weight = 453.59237;
    mission.legs[0].fuel.onboard = 1000;
    recalculateMission();
    const before = mission.legs[0].weight.takeoff;
    for (let i = 0; i < 3; i++) {
        restoreMission(parseMission(serializeMission()));
        recalculateMission();
        assert.equal(mission.legs[0].weight.takeoff, before);
        assert.equal(mission.crew[0].weight, 90.718474);
        assert.equal(formatWeight(mission.legs[0].weight.fuel, mission.aircraft.model), "1.000 LB");
    }
});
