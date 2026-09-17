import test from "node:test";
import assert from "node:assert/strict";
import { calculatePayloadAvailability } from "../js/core/payloadAvailability.js";
test("remaining payload uses the limiting phase and preserves overloads", () => {
    const model = { maxTakeoffWeight: 5900, maxLandingWeight: 5700 };
    assert.deepEqual(calculatePayloadAvailability({ takeoff: 5500, landing: 5600 }, model), { takeoff: 400, landing: 100, remaining: 100, limitingPhase: "landing" });
    assert.equal(calculatePayloadAvailability({ takeoff: 5850, landing: 5400 }, model).remaining, 50);
    assert.equal(calculatePayloadAvailability({ takeoff: 6000, landing: 5800 }, model).remaining, -100);
    assert.equal(calculatePayloadAvailability({ takeoff: 5900, landing: 5700 }, model).remaining, 0);
    assert.equal(calculatePayloadAvailability({ takeoff: 5000, landing: 4900 }, { ...model, maxLandingWeight: null }).remaining, null);
});
