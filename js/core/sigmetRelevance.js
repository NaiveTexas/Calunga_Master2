import buffer from "@turf/buffer";
import booleanIntersects from "@turf/boolean-intersects";
import { lineString, polygon, point } from "@turf/helpers";

const coordinate = value => Array.isArray(value) && value.length >= 2 && value.slice(0, 2).every(n => n !== "" && n !== null && Number.isFinite(Number(n))) && Math.abs(Number(value[0])) <= 90 && Math.abs(Number(value[1])) <= 180;
export function sigmetTime(value) {
    if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/.test(value || "")) return NaN;
    return Date.parse(value.replace(" ", "T").replace(/Z?$/, "Z"));
}
export function routeCorridor(leg) {
    const points = [leg.route.origin, ...leg.route.waypoints, leg.route.destination];
    if (points.some(p => !coordinate([p?.position?.latitude, p?.position?.longitude]))) return null;
    const coords = points.map(p => [p.position.longitude, p.position.latitude]);
    try {
        return buffer(coords.every(c => c[0] === coords[0][0] && c[1] === coords[0][1]) ? point(coords[0]) : lineString(coords), 20, { units: "nauticalmiles", steps: 64 });
    } catch { return null; }
}
export function sigmetRelevance(report, leg, corridor = routeCorridor(leg)) {
    const schedule = leg.schedule || {};
    const departure = sigmetTime(`${schedule.date}T${schedule.etd}:00Z`);
    const arrival = sigmetTime(schedule.arrival || `${schedule.etaDate}T${schedule.eta}:00Z`);
    const start = sigmetTime(report.start), end = sigmetTime(report.end);
    if (![departure, arrival, start, end].every(Number.isFinite) || arrival <= departure || end <= start) return "review";
    if (end <= departure || start > arrival) return "outside";
    // Cancellation messages require reconciliation before automatic spatial exclusion.
    if (/\bCNL\b/.test(report.text || "")) return "review";
    if (!corridor || !Array.isArray(report.coordinates) || report.coordinates.length < 3 || !report.coordinates.every(coordinate)) return "review";
    try {
        const ring = report.coordinates.map(([lat, lon]) => [Number(lon), Number(lat)]);
        if (new Set(ring.map(c => c.join(","))).size < 3) return "review";
        if (ring[0].join() !== ring.at(-1).join()) ring.push([...ring[0]]);
        return booleanIntersects(corridor, polygon([ring])) ? "relevant" : "outside";
    } catch { return "review"; }
}
