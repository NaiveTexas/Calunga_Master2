import test from "node:test";
import assert from "node:assert/strict";
import { calculateRouteTiming, formatRoute, createRoutePoint } from "../js/core/routePlanning.js";
import { calculateDistance } from "../js/utils/helpers.js";
import { updateFuelPlanning } from "../js/core/fuelEngine.js";

test("speed changes apply after the airport and procedure time is counted once", () => {
    const origin = { position: { latitude: 0, longitude: 0 } };
    const airport = { type: "AIRPORT", icao: "TEST", position: { latitude: 0, longitude: 1 }, outboundSpeed: 100, outboundLevel: "FL090", procedure: true };
    const destination = { position: { latitude: 0, longitude: 2 } };
    const leg = { flightLevel: "FL100", route: { origin, waypoints: [airport], destination } };
    const model = { cruiseSpeed: 200, fuelFlow: 600, procedureTime: 10 };
    const timing = calculateRouteTiming(leg, model);
    const expectedCruise = calculateDistance(origin, airport) / 200 + calculateDistance(airport, destination) / 100;
    assert.equal(timing.cruiseEet, expectedCruise);
    assert.equal(timing.eet, expectedCruise + 10 / 60);
    assert.equal(formatRoute(leg, model), "DCT TEST/N0100F090 DCT");
    const fuel = { onboard: 3000, taxi: 30, procedure: 100, alternate: 200, reserve: 450, extra: 50 };
    updateFuelPlanning({ aircraft: { model }, schedule: timing, fuel, weight: {} });
    assert.equal(fuel.flight, expectedCruise * 600);
    assert.equal(fuel.enrouteProcedure, 100);
    assert.equal(fuel.arrival, 3000 - 30 - fuel.flight - 100 - 100);
    airport.procedure = false;
    assert.equal(calculateRouteTiming(leg, model).eet, expectedCruise);
    airport.reference = { ident: "FLZ" };
    assert.equal(formatRoute(leg, model), "DCT FLZ/N0100F090 DCT");
});

test("adding an airport twice never shares procedure settings or changes its database record", () => {
    const airport = { type: "AIRPORT", icao: "XXXX", position: { latitude: 0, longitude: 0 } };
    const first = createRoutePoint(airport);
    const second = createRoutePoint(airport);
    first.procedure = true;
    first.outboundSpeed = 180;
    assert.equal(second.procedure, false);
    assert.equal(second.outboundSpeed, null);
    assert.equal(airport.procedure, undefined);
    assert.equal(first.reference, null);
});
