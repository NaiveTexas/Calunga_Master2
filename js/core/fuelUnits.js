import { LB_TO_KG } from "../utils/helpers.js";

// Fuel inputs and model parameters share the aircraft's native mass unit.
export const aircraftFuelUnit = model => model?.fuel?.defaultUnit === "KG" ? "KG" : "LB";
export const fuelMassKg = (value, model) => aircraftFuelUnit(model) === "KG" ? value : value * LB_TO_KG;

export function convertMissionFuel(mission, from, to) {
    if (from === to) return;
    const factor = from === "LB" && to === "KG" ? LB_TO_KG : 1 / LB_TO_KG;
    for (const leg of mission.legs) {
        for (const [key, value] of Object.entries(leg.fuel)) {
            if (typeof value === "number") leg.fuel[key] = value * factor;
        }
        leg.refuel *= factor;
    }
}
