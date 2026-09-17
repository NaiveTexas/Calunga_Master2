import { createLegCards } from "./legCards.js";
import { createPayloadEditor } from "./payloadPanel.js";
import { mission } from "../models/missions.js";
import { payloadReady, weightReviewSignature, weightReviewMatches } from "../core/briefingProgress.js";
import { updateMission } from "../core/missionEngine.js";

let renderCards;

export function updateWeightPanel() {
    if (!renderCards) {
        renderCards = createLegCards("weightPanel", ".crew", (leg, entry) => {
            entry.refreshPayload = createPayloadEditor(entry.field("payloadPanel"), leg);
            const availability = document.createElement("div"); availability.className = "field";
            const label = document.createElement("span"); label.className = "field-label"; label.textContent = "Disponibilidade";
            entry.availability = document.createElement("span"); entry.availability.className = "field-value";
            availability.append(label, entry.availability); entry.field("fuelWeight").closest(".field").after(availability);
            for (const [id, title] of [["basicWeight", "Peso Básico"], ["crewWeight", "Tripulação"], ["payloadWeight", "Payload"], ["fuelWeight", "Combustível"], ["takeoffWeight", "Peso de Decolagem"], ["landingWeight", "Peso de Pouso"]]) entry.field(id).closest(".field").querySelector(".field-label").textContent = title;
            entry.done = document.createElement("button"); entry.done.type = "button"; entry.done.className = "weight-done"; entry.done.textContent = "Concluído"; entry.body.append(entry.done);
            function finish() {
                if (!payloadReady(leg)) return;
                leg.weightReviewed = weightReviewSignature(mission, leg);
                entry.card.open = false;
                updateMission();
            }
            entry.done.addEventListener("click", finish);
            let wasOpen = entry.card.open;
            entry.card.addEventListener("toggle", () => { const closed = wasOpen && !entry.card.open; wasOpen = entry.card.open; if (closed) finish(); });
        });
    }
    renderCards((leg, { card, field, subtitle, refreshPayload, availability, done }) => {
        const pending = !payloadReady(leg) || !weightReviewMatches(mission, leg);
        card.classList.toggle("leg-pending", pending);
        subtitle.textContent = `Decolagem: ${Math.round(leg.weight.takeoff)} KG · Pouso: ${Math.round(leg.weight.landing)} KG`;
        if (pending) subtitle.textContent += " · Pendente de conclusão";
        for (const [name, property] of [["basicWeight", "basic"], ["crewWeight", "crew"], ["payloadWeight", "payload"], ["fuelWeight", "fuel"], ["takeoffWeight", "takeoff"], ["landingWeight", "landing"]]) {
            field(name).textContent = `${Math.round(leg.weight[property])} KG`;
        }
        field("payloadWeight").textContent = leg.payload.entered === false ? "Pendente" : `${Math.round(leg.weight.payload)} KG`;
        const remaining = leg.weight.availability?.remaining;
        availability.textContent = Number.isFinite(remaining) ? `${Math.floor(remaining)} KG` : "Não informado";
        for (const [id, phase, actual, maximum] of [["takeoffWeight", "takeoff", leg.weight.takeoff, mission.aircraft.model.maxTakeoffWeight], ["landingWeight", "landing", leg.weight.landing, mission.aircraft.model.maxLandingWeight]]) {
            const value = field(id), label = value.closest(".field").querySelector(".field-label");
            value.textContent = `${Math.round(actual)} KG`;
            const excess = Number.isFinite(maximum) && maximum > 0 && actual > maximum;
            value.classList.toggle("weight-exceeded", excess);
            value.title = excess ? `Peso acima do limite de ${maximum.toLocaleString("pt-BR")} kg (excesso: ${Math.ceil(actual - maximum)} kg)` : "";
            value.tabIndex = value.title ? 0 : -1;
            label.querySelector(".weight-alert")?.remove();
            if (excess) { const icon = document.createElement("span"); icon.className = "weight-alert"; icon.textContent = " ⛔"; icon.setAttribute("aria-label", "Peso acima do limite"); label.append(icon); }
        }
        done.disabled = !payloadReady(leg);
        refreshPayload();
    });
}
