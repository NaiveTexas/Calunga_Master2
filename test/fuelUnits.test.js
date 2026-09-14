import test from "node:test";
import assert from "node:assert/strict";
import { aircraftFuelUnit, convertMissionFuel, fuelMassKg } from "../js/core/fuelUnits.js";
import { initializeFuelPlanning, updateFuelPlanning } from "../js/core/fuelEngine.js";
import { updateWeightPlanning } from "../js/core/weightEngine.js";
import { mission } from "../js/models/missions.js";

test("native KG parameters calculate fuel and aircraft mass without a second conversion", () => {
    // Synthetic values for unit testing, not A-29 performance data.
    const model = { fuel: { defaultUnit: "KG" }, fuelFlow: 200, taxiFuel: 10, procedureTime: 6, reserveTime: 30, cruiseSpeed: 200 };
    const leg = structuredClone(mission.legs[0]);
    const context = { ...leg, aircraft: { model, registration: { basicWeight: 2000 } }, crew: [] };
    context.fuel.onboard = 600;
    context.schedule.cruiseEet = 1;
    initializeFuelPlanning(context);
    updateFuelPlanning(context);
    updateWeightPlanning(context);
    assert.equal(context.fuel.flight, 200);
    assert.equal(context.fuel.total, 400);
    assert.equal(context.fuel.arrival, 370);
    assert.equal(context.weight.fuel, 600);
    assert.equal(context.weight.landingFuel, 370);
    assert.equal(context.weight.takeoff, 2600);
    assert.equal(context.weight.landing, 2370);
});

test("switching units converts all leg inputs and refuels while preserving manual flags", () => {
    const data = { legs: [1, 2].map(() => ({ fuel: { onboard: 1000, extra: 100, manual: { taxi: true } }, refuel: 200 })) };
    convertMissionFuel(data, "LB", "KG");
    for (const leg of data.legs) {
        assert.equal(leg.fuel.onboard, 453.59237);
        assert.equal(leg.refuel, 90.718474);
        assert.equal(leg.fuel.manual.taxi, true);
    }
    convertMissionFuel(data, "KG", "LB");
    assert.ok(Math.abs(data.legs[1].fuel.onboard - 1000) < 1e-9);
    assert.equal(aircraftFuelUnit({}), "LB");
    assert.equal(fuelMassKg(1000, {}), 453.59237);
});
