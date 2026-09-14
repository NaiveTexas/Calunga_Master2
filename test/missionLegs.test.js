import test from "node:test";
import assert from "node:assert/strict";
import { initializeMissionLegs } from "../js/models/missionLegs.js";
import { updateArrival, departureAfterArrival } from "../js/core/legSchedule.js";

test("ETA rounds to five minutes and next departure follows rounded arrival", () => {
    for (const [minutes, eta, etd] of [[151, "00:20", "01:20"], [153, "00:25", "01:25"]]) {
        const schedule = { date: "2026-09-11", etd: "21:50", eet: minutes / 60 };
        updateArrival(schedule);
        assert.equal(schedule.eta, eta);
        assert.equal(schedule.etaDate, "2026-09-12");
        assert.equal(schedule.eet, minutes / 60);
        assert.deepEqual(departureAfterArrival(schedule), { date: "2026-09-12", etd });
    }
    const schedule = { date: "2026-12-31", etd: "23:00", eet: 59 / 60 };
    updateArrival(schedule);
    assert.equal(schedule.arrival, "2027-01-01T00:00:00.000Z");
    assert.deepEqual(departureAfterArrival(schedule), { date: "2027-01-01", etd: "01:00" });
});

test("UTC arrival and one-hour stopover cross year boundary", () => {
    const schedule = { date: "2026-12-31", etd: "23:30", eet: 1.25 };
    updateArrival(schedule);
    assert.equal(schedule.arrival, "2027-01-01T00:45:00.000Z");
    assert.deepEqual(departureAfterArrival(schedule), { date: "2027-01-01", etd: "01:45" });
    updateArrival(schedule, false);
    assert.equal(schedule.arrival, "");
    assert.deepEqual(departureAfterArrival(schedule), { date: "", etd: "" });
});

test("existing bindings follow selection and keep leg data isolated", () => {
    const mission = {
        aircraft: { flightLevel: "FL230" },
        route: { origin: null, destination: null, waypoints: [] },
        schedule: { date: "", etd: "" },
        fuel: { onboard: 0, manual: { taxi: false } },
        payload: { data: { passengers: [{ weight: 80 }] } },
        weight: { takeoff: 0 }
    };
    const store = initializeMissionLegs(mission);
    const routeBinding = mission.route;
    const fuelBinding = mission.fuel;
    mission.route.destination = { icao: "SBRF" };
    mission.fuel.onboard = 2000;
    const second = store.add();
    assert.equal(routeBinding.origin.icao, "SBRF");
    fuelBinding.onboard = 1000;
    mission.aircraft.flightLevel = "FL180";
    mission.payload.data.passengers[0].weight = 95;
    mission.route.waypoints.push({ ident: "FIX" });
    store.select(1);
    assert.equal(fuelBinding.onboard, 2000);
    assert.equal(mission.aircraft.flightLevel, "FL230");
    assert.equal(mission.payload.data.passengers[0].weight, 80);
    assert.deepEqual(routeBinding.waypoints, []);
    store.select(second.id);
    assert.equal(fuelBinding.onboard, 1000);
    assert.equal(store.remove(second.id), true);
    assert.equal(mission.activeLegId, 1);
    assert.equal(store.remove(1), false);
    assert.equal(store.select(999), false);
});
