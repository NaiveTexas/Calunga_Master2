import { calculateDistance, calculateEET } from "../utils/helpers.js";
import { getAirportReference } from "../database/airportReferences.js";

export function createRoutePoint(point) {
    const waypoint = structuredClone(point);
    if (waypoint.type === "AIRPORT") {
        waypoint.reference = getAirportReference(waypoint.icao);
        waypoint.outboundSpeed = null;
        waypoint.outboundLevel = null;
        waypoint.procedure = false;
    }
    return waypoint;
}

export function waypointSettings(leg, index, model) {
    let speed = model.cruiseSpeed;
    let level = leg.flightLevel;
    for (const waypoint of leg.route.waypoints.slice(0, index + 1)) {
        if (waypoint.type !== "AIRPORT") continue;
        speed = waypoint.outboundSpeed || speed;
        level = waypoint.outboundLevel || level;
    }
    return { speed, level };
}

export function formatRoute(leg, model) {
    const tokens = ["DCT"];
    leg.route.waypoints.forEach((point, index) => {
        let ident = point.reference?.ident || point.ident || point.icao || "----";
        if (point.type === "AIRPORT" && (point.procedure || point.outboundSpeed || point.outboundLevel)) {
            const { speed, level } = waypointSettings(leg, index, model);
            ident += `/N${String(Math.round(speed)).padStart(4, "0")}F${String(level || "").replace(/\D/g, "").padStart(3, "0")}`;
        }
        tokens.push(ident, "DCT");
    });
    return tokens.join(" ");
}

export function calculateRouteTiming(leg, model) {
    let previous = leg.route.origin;
    let speed = model.cruiseSpeed;
    let distance = 0;
    let cruiseEet = 0;
    let procedureEet = 0;
    for (const point of [...leg.route.waypoints, leg.route.destination]) {
        if (!point) continue;
        const segment = calculateDistance(previous, point);
        distance += segment;
        cruiseEet += calculateEET(segment, speed);
        if (point.type === "AIRPORT") {
            if (point.procedure) procedureEet += model.procedureTime / 60;
            speed = point.outboundSpeed || speed;
        }
        previous = point;
    }
    return { distance, cruiseEet, procedureEet, eet: cruiseEet + procedureEet };
}

export function calculateWaypointPassages(leg, model) {
    let previous = leg.route.origin;
    let speed = model.cruiseSpeed;
    let distance = 0;
    let elapsed = 0;
    let valid = Boolean(previous?.position);
    const departure = Date.parse(`${leg.schedule.date}T${leg.schedule.etd}:00Z`);
    return leg.route.waypoints.map(point => {
        valid = valid && Boolean(point?.position) && Number.isFinite(speed) && speed > 0;
        if (valid) {
            const segment = calculateDistance(previous, point);
            distance += segment;
            elapsed += calculateEET(segment, speed);
        }
        const passage = {
            point,
            distance: valid ? distance : null,
            time: valid && Number.isFinite(departure)
                ? new Date(Math.round((departure + elapsed * 3600000) / 60000) * 60000).toISOString()
                : null
        };
        // Passage is arrival over this point; its procedure delays the following points.
        if (point?.type === "AIRPORT") {
            if (point.procedure) elapsed += model.procedureTime / 60;
            speed = point.outboundSpeed || speed;
        }
        previous = point;
        return passage;
    });
}
