import { mission, missionLegs } from "../models/missions.js";
import { calculateRouteTiming } from "./routePlanning.js";
import { initializeFuelPlanning, updateFuelPlanning } from "./fuelEngine.js";
import { updateWeightPlanning } from "./weightEngine.js";
import { updateArrival, departureAfterArrival } from "./legSchedule.js";

let refreshMissionUI = () => {};
export function setMissionRefreshHandler(handler) { refreshMissionUI = handler; }
export function updateMissionField(config, value) {
    config.target[config.property] = value;
    if (config.target === mission.route && config.property === "origin") missionLegs.active().automatic.origin = false;
    updateMission({ routeChanged: ["origin", "destination", "alternate"].includes(config.property) });
}
export function recalculateMission() {
    mission.legs.forEach((leg, index) => {
        const previous = mission.legs[index - 1];
        if (previous) {
            if (leg.automatic.origin) leg.route.origin = previous.route.destination;
            if (leg.automatic.departure) Object.assign(leg.schedule, departureAfterArrival(previous.schedule));
            if (leg.automatic.fuel) leg.fuel.onboard = Math.floor(previous.fuel.arrival / 100) * 100 + leg.refuel;
        }
        const timing = calculateRouteTiming(leg, mission.aircraft.model);
        leg.route.distance = timing.distance;
        Object.assign(leg.schedule, { eet: timing.eet, cruiseEet: timing.cruiseEet, procedureEet: timing.procedureEet });
        updateArrival(leg.schedule, Boolean(leg.route.origin?.position && leg.route.destination?.position));
        const context = { ...leg, aircraft: mission.aircraft, crew: mission.crew };
        initializeFuelPlanning(context);
        updateFuelPlanning(context);
        updateWeightPlanning(context);
    });
}
export function updateMission({ routeChanged = false } = {}) {
    recalculateMission();
    refreshMissionUI();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("mission-updated"));
    if (routeChanged && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mission-route-updated", { detail: mission.route }));
    }
}
function notifySelection() {
    updateMission({ routeChanged: true });
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("mission-leg-selected"));
}
export function addMissionLeg() {
    recalculateMission();
    const leg = missionLegs.add();
    notifySelection();
    return leg;
}
export function selectMissionLeg(id) {
    if (missionLegs.select(id)) notifySelection();
}
export function removeMissionLeg(id) {
    if (missionLegs.remove(id)) notifySelection();
}
