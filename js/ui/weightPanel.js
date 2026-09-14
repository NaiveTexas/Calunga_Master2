import { createLegCards } from "./legCards.js";
import { createPayloadEditor } from "./payloadPanel.js";

let renderCards;

export function updateWeightPanel() {
    if (!renderCards) {
        renderCards = createLegCards("weightPanel", ".crew", (leg, entry) => {
            entry.refreshPayload = createPayloadEditor(entry.field("payloadPanel"), leg);
        });
    }
    renderCards((leg, { field, subtitle, refreshPayload }) => {
        subtitle.textContent = `Decolagem: ${Math.round(leg.weight.takeoff)} KG · Pouso: ${Math.round(leg.weight.landing)} KG`;
        for (const [name, property] of [["basicWeight", "basic"], ["crewWeight", "crew"], ["payloadWeight", "payload"], ["fuelWeight", "fuel"], ["takeoffWeight", "takeoff"], ["landingWeight", "landing"]]) {
            field(name).textContent = `${Math.round(leg.weight[property])} KG`;
        }
        refreshPayload();
    });
}
