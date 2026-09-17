export function routeConfirmation(leg) { return JSON.stringify([leg.route, leg.schedule.date, leg.schedule.etd, leg.flightLevel]); }
export function weightReviewSignature(mission, leg) {
    return JSON.stringify([mission.aircraft.model, mission.aircraft.registration, mission.crew,
        leg.route, null, leg.flightLevel, leg.fuel, leg.payload, leg.weight]);
}
export function weightReviewMatches(mission, leg, saved = leg.weightReviewed) {
    if (typeof saved !== "string") return false;
    try {
        const snapshot = JSON.parse(saved);
        if (!Array.isArray(snapshot) || snapshot.length !== 9) return false;
        snapshot[4] = null; // Also accept saved reviews made before time was excluded.
        return JSON.stringify(snapshot) === weightReviewSignature(mission, leg);
    } catch { return false; }
}
export function payloadReady(leg) { return leg.payload?.entered !== false && Number.isFinite(leg.weight?.payload) && leg.weight.payload >= 0; }
export function briefingGuidance(state, currentPage) {
    const pending = !state.allowed[1] ? 0 : !state.allowed[2] ? 1 : !state.allowed[3] ? 2 : !state.allowed[4] ? 3 : null;
    if (pending !== null) {
        const prompts = ["Avance para a aeronave", "Avance para a rota", "Avance para o combustível", "Avance para o peso"];
        return { target: pending === currentPage ? null : pending, message: pending === currentPage ? state.message : prompts[pending] };
    }
    if (state.dashboardReviewed && state.weightReviewed) return { target: null, message: "" };
    if (currentPage === 3) return { target: 4, message: "Avance para o dashboard" };
    if (state.weightReviewed) return { target: currentPage === 4 ? null : 4, message: currentPage === 4 ? "" : "Avance para o dashboard" };
    if (currentPage === 4) return { target: null, message: "" };
    return { target: 3, message: "Avance para o peso" };
}
export function briefingProgress(mission, leg) {
    const model = mission.settings.modelChosen !== false && mission.aircraft.model?.planningAvailable !== false;
    const aircraft = model && mission.settings.registrationChosen !== false && mission.aircraft.registration?.model?.name === mission.aircraft.model?.name;
    const point = p => p?.position && Number.isFinite(p.position.latitude) && Number.isFinite(p.position.longitude);
    const date = leg.schedule.date;
    const route = aircraft && point(leg.route.origin) && point(leg.route.destination) && /^FL\d{3}$/.test(leg.flightLevel || "") && /^\d{4}-\d{2}-\d{2}$/.test(date || "") && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date && /^([01]\d|2[0-3]):[0-5]\d$/.test(leg.schedule.etd || "");
    const ready = route && point(leg.route.alternate);
    const confirmed = ready && (leg.routeConfirmed == null || leg.routeConfirmed === routeConfirmation(leg));
    const fuel = confirmed && Number.isFinite(leg.fuel.onboard) && Number.isFinite(leg.fuel.total) && leg.fuel.onboard >= leg.fuel.total;
    const weightsDone = (mission.legs || [leg]).every(item => payloadReady(item) && weightReviewMatches(mission, item));
    return { allowed: [true, Boolean(aircraft), Boolean(confirmed), Boolean(fuel), Boolean(fuel && weightsDone)], model, routeReady: Boolean(ready), weightReviewed: weightReviewMatches(mission, leg), dashboardReviewed: weightReviewMatches(mission, leg, leg.dashboardReviewed),
        message: !model ? "ESCOLHA SUA AERONAVE" : !aircraft ? "Selecione a matrícula" : !ready ? "Preencha data, ETD, nível, origem, destino e alternativa" : !confirmed ? "Clique em Concluído ou minimize a perna" : !fuel ? "Combustível a bordo abaixo do mínimo" : !weightsDone ? "Informe o payload e conclua ou minimize cada perna em Peso" : "" };
}
