import { mission, missionLegs } from "../models/missions.js";
import { updateMission } from "../core/missionEngine.js";
import { createRoutePoint } from "../core/routePlanning.js";

// The loader determines candidate eligibility separately from route geometry.
export function createSuggestedRouteControl(loadSuggestion) {
    const container = document.createElement("div");
    container.className = "suggested-route-control";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggested-route-button";
    button.textContent = "Criar rota sugerida";
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.hidden = true;
    container.append(button, status);
    let pending = false;
    const routeSignature = leg => JSON.stringify([leg.route.origin, leg.route.destination, leg.route.waypoints]);
    function refresh() {
        button.disabled = pending || !mission.route.origin?.position || !mission.route.destination?.position;
    }
    button.addEventListener("click", async () => {
        if (button.disabled || pending) return;
        const leg = missionLegs.active(), signature = routeSignature(leg);
        pending = true;
        refresh();
        button.textContent = "Calculando rota…";
        status.hidden = true;
        try {
            const result = await loadSuggestion(structuredClone(leg.route.origin), structuredClone(leg.route.destination));
            if (mission.activeLegId !== leg.id || !mission.legs.includes(leg) || routeSignature(leg) !== signature) {
                status.textContent = "A perna foi alterada durante o cálculo. Clique novamente para gerar a sugestão.";
                return;
            }
            leg.route.waypoints = result.points.map(createRoutePoint);
            leg.routeConfirmed = "";
            updateMission({ routeChanged: true });
            document.getElementById("waypointPanel")?.dispatchEvent(new CustomEvent("suggested-route-applied"));
            status.textContent = result.points.length
                ? `${result.points.length} ponto(s) inserido(s) · Acréscimo de ${(result.total - result.direct).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} NM. Revise a rota antes de concluir.`
                : "Nenhum ponto elegível encontrado. Rota direta aplicada.";
        } catch (error) {
            status.textContent = error.message || "Não foi possível sugerir a rota. Tente novamente.";
        } finally {
            status.hidden = false;
            pending = false;
            button.textContent = "Criar rota sugerida";
            refresh();
        }
    });
    window.addEventListener("mission-updated", refresh);
    refresh();
    return container;
}
