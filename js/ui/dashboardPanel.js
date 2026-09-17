import { mission } from "../models/missions.js";
import { aircraftFuelUnit } from "../core/fuelUnits.js";
import { formatTime, formatDate } from "../utils/helpers.js";
import { createLegCards, legDistance } from "./legCards.js";
import { formatRoute } from "../core/routePlanning.js";
import { createBriefingDownload } from "./briefingDownload.js";

let renderCards;
export function updateDashboard() {
    if (!renderCards) renderCards = createLegCards("dashboardPanel", ".card-title", (leg, { body }) => body.prepend(createBriefingDownload(leg.id)));
    renderCards((leg, { field, subtitle }) => {
        const { route, schedule, fuel, weight } = leg;
        const departure = (formatDate(schedule.date) || "----") + " · " + (schedule.etd || "--:--") + " UTC";
        const arrival = (formatDate(schedule.etaDate) || "----") + " · " + (schedule.eta || "--:--") + " UTC";
        subtitle.textContent = departure + " → " + arrival;
        const values = {
            "dashboard-departure": route.origin?.icao || "----",
            "dashboard-destination": route.destination?.icao || "----",
            "dashboard-waypoints": formatRoute(leg, mission.aircraft.model),
            "dashboard-etd": (formatDate(schedule.date) || "----") + "\n" + (schedule.etd || "--:--"),
            "dashboard-eta": (formatDate(schedule.etaDate) || "----") + "\n" + (schedule.eta || "--:--"),
            "dashboard-distance": legDistance(leg),
            "dashboard-eet": formatTime(schedule.eet),
            "dashboard-flightlevel": leg.flightLevel || "--",
            "dashboard-aircraft": mission.aircraft.registration ? mission.aircraft.registration.registration + " (" + mission.aircraft.model.name + ")" : "----",
            "dashboard-min-fuel": Math.round(fuel.total) + " " + aircraftFuelUnit(mission.aircraft.model),
            "dashboard-fuel-on-board": Math.round(fuel.onboard) + " " + aircraftFuelUnit(mission.aircraft.model),
            "dashboard-pbo": Math.round(weight.basic + weight.crew) + " KG",
            "dashboard-payload": Math.round(weight.payload) + " KG",
            "dashboard-dep-weight": Math.round(weight.takeoff) + " KG",
            "dashboard-fuel-weight": Math.round(weight.fuel) + " KG",
            "dashboard-landing-weight": Math.round(weight.landing) + " KG",
            "dashboard-availability": Number.isFinite(weight.availability?.remaining) ? Math.floor(weight.availability.remaining) + " KG" : "Não informado"
        };
        for (const [name, value] of Object.entries(values)) field(name).textContent = value;
    });
}
