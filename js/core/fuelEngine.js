import { mission } from "../models/missions.js";
import { fuelMassKg } from "./fuelUnits.js";
import { calculateDistance, calculateEET } from "../utils/helpers.js";
export function initializeFuelPlanning(context = mission) {
    const { fuel, aircraft, route } = context;
    const model = aircraft.model;
    if (!fuel.manual.taxi) fuel.taxi = model.taxiFuel;
    if (!fuel.manual.procedure) fuel.procedure = model.fuelFlow * model.procedureTime / 60;
    if (!fuel.manual.reserve) fuel.reserve = model.fuelFlow * model.reserveTime / 60;
    fuel.alternate = model.fuelFlow * calculateEET(calculateDistance(route.destination, route.alternate), model.cruiseSpeed);
}
export function restoreAutomaticFuelPlanning(context = mission) {
    context.fuel.manual.taxi = false;
    context.fuel.manual.procedure = false;
    context.fuel.manual.reserve = false;
    initializeFuelPlanning(context);
}
export function updateFuelPlanning(context = mission) {
    const { fuel, aircraft, schedule, weight } = context;
    fuel.flight = (schedule.cruiseEet ?? schedule.eet) * aircraft.model.fuelFlow;
    fuel.enrouteProcedure = (schedule.procedureEet || 0) * aircraft.model.fuelFlow;
    const required = fuel.taxi + fuel.flight + fuel.procedure + fuel.enrouteProcedure + fuel.alternate + fuel.reserve + fuel.extra;
    fuel.total = Math.ceil(required / 100) * 100;
    fuel.remaining = fuel.onboard - fuel.total;
    // Required reserves are not consumed before destination.
    fuel.arrival = fuel.onboard - fuel.taxi - fuel.flight - fuel.procedure - fuel.enrouteProcedure;
    weight.landingFuel = fuelMassKg(fuel.arrival, aircraft.model);
}
