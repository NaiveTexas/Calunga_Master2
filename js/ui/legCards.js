import { mission } from "../models/missions.js";

export function legDistance(leg) {
    return leg.route.origin?.position && leg.route.destination?.position
        ? `${leg.route.distance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} NM`
        : "— NM";
}

// Keep existing cards mounted so edits, focus and expanded state survive recalculation.
export function createLegCards(panelId, retained, bind = () => {}) {
    const panel = document.getElementById(panelId);
    const template = document.createElement("div");
    template.className = "planning-leg-body";
    for (const child of Array.from(panel.children)) {
        if (!child.matches(retained)) template.append(child);
    }
    const list = document.createElement("div");
    list.className = "planning-leg-list";
    panel.append(list);
    const cards = new Map();
    return render => {
        for (const [id, entry] of cards) {
            if (!mission.legs.some(leg => leg.id === id)) {
                entry.card.remove();
                cards.delete(id);
            }
        }
        mission.legs.forEach((leg, index) => {
            let entry = cards.get(leg.id);
            if (!entry) {
                const card = document.createElement("details");
                card.className = "planning-leg-card";
                card.dataset.legId = leg.id;
                card.open = index === 0;
                const summary = document.createElement("summary");
                const title = document.createElement("strong");
                const subtitle = document.createElement("span");
                summary.append(title, subtitle);
                const body = template.cloneNode(true);
                for (const element of body.querySelectorAll("[id]")) {
                    const oldId = element.id;
                    element.dataset.field = oldId;
                    element.id = `${panelId}-${leg.id}-${oldId}`;
                    for (const label of body.querySelectorAll(`[for="${oldId}"]`)) label.htmlFor = element.id;
                }
                const field = name => body.querySelector(`[data-field="${name}"]`);
                card.append(summary, body);
                list.append(card);
                entry = { card, title, subtitle, body, field };
                cards.set(leg.id, entry);
                bind(leg, entry);
            }
            entry.title.textContent = `Perna ${index + 1} · ${leg.route.origin?.icao || "----"} → ${leg.route.destination?.icao || "----"} · ${legDistance(leg)}`;
            render(leg, entry, index);
        });
    };
}
