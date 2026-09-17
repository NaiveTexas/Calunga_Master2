// All weights and margins are in KG, including aircraft with fuel entered in LB.
export function calculatePayloadAvailability(weight, model) {
    const margin = (limit, actual) => Number.isFinite(limit) && limit > 0 && Number.isFinite(actual) ? limit - actual : null;
    const takeoff = margin(model.maxTakeoffWeight, weight.takeoff);
    const landing = margin(model.maxLandingWeight, weight.landing);
    return {
        takeoff, landing,
        remaining: takeoff === null || landing === null ? null : Math.min(takeoff, landing),
        limitingPhase: takeoff === null || landing === null ? null : takeoff === landing ? "both" : takeoff < landing ? "takeoff" : "landing"
    };
}
export function formatPayloadAvailability(weight) {
    const payload = Number.isFinite(weight.payload) ? Math.round(weight.payload).toLocaleString("pt-BR") + " KG" : "Não informado";
    const remaining = weight.availability?.remaining;
    return `${payload} / ${Number.isFinite(remaining) ? Math.floor(remaining).toLocaleString("pt-BR") + " KG" : "Não informado"}`;
}
