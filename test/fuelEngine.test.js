import test from "node:test";
import assert from "node:assert/strict";
import { updateFuelPlanning } from "../js/core/fuelEngine.js";

test("minimum fuel rounds up to hundreds without rounding consumption or landing fuel", () => {
    for (const [extra, expected] of [[45, 1900], [70, 1900], [70.1, 2000]]) {
        const context = {
            aircraft: { model: { fuelFlow: 600 } },
            schedule: { cruiseEet: 2, procedureEet: 0 },
            fuel: { onboard: 3000, taxi: 30, procedure: 100, alternate: 200, reserve: 300, extra },
            weight: {}
        };
        updateFuelPlanning(context);
        assert.equal(context.fuel.total, expected);
        assert.equal(context.fuel.flight, 1200);
        assert.equal(context.fuel.arrival, 1670);
    }
});
