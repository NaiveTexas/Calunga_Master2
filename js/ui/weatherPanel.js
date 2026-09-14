import { mission } from "../models/missions.js";
import { loadWeatherBriefing } from "../services/weather.js";
import { createLegCards } from "./legCards.js";
import { refreshRedemetPdfPanel } from "./redemetPdfPanel.js";

let weatherRequestId = 0;
let renderCards;

export function refreshWeatherLegCards() {
    refreshRedemetPdfPanel();
    if (!renderCards) {
        const container = document.getElementById("weatherToolBriefing");
        container.innerHTML = '<div id="legWeatherReports"></div>';
        renderCards = createLegCards("weatherToolBriefing", ".card-title");
    }
    renderCards((leg, { subtitle }) => {
        subtitle.textContent = [...rolesForRoute(leg.route).keys()].join(" · ") || "Aeródromos pendentes";
    });
}

export function initializeWeatherPanel() {
    window.addEventListener("mission-route-updated", updateWeatherBriefing);

    const tabs = document.querySelectorAll(".weather-tab");
    const pages = document.querySelectorAll(".weather-page");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const pageId = tab.dataset.weatherPage;

            tabs.forEach(item => {
                item.classList.toggle("active", item === tab);
            });

            pages.forEach(page => {
                page.classList.toggle("active", page.id === pageId);
            });

        });

    });

}

function renderWeatherMessage(panel, message, state = "") {
    panel.replaceChildren();
    panel.dataset.state = state;
    const text = document.createElement("p");
    text.className = "weather-briefing-message";
    text.textContent = message;
    panel.appendChild(text);
}

function renderWeatherBriefing(panel, reports, rolesByIcao) {
    panel.replaceChildren();
    panel.dataset.state = "";
    for (const report of reports) {
        const card = document.createElement("article");
        card.className = "weather-airport";
        const title = document.createElement("h3");
        title.textContent = report.icao + " \u2014 " + (rolesByIcao.get(report.icao) || []).join(" / ");
        card.append(title);
        for (const type of ["METAR", "TAF"]) {
            const label = document.createElement("strong");
            label.textContent = type;
            const message = document.createElement("pre");
            message.textContent = report[type.toLowerCase()] || type + " indispon\u00edvel.";
            card.append(label, message);
        }
        panel.append(card);
    }
}

function rolesForRoute(route) {
    const roles = new Map();
    const airports = [
        ["Origem", route.origin], ["Destino", route.destination],
        ...route.waypoints.filter(point => point?.type === "AIRPORT").map(point => ["Em rota", point]),
        ["Alternativa", route.alternate]
    ];
    for (const [role, airport] of airports) {
        if (!airport?.icao) continue;
        roles.set(airport.icao, [...(roles.get(airport.icao) || []), role]);
    }
    return roles;
}

export async function updateWeatherBriefing() {
    const requestId = ++weatherRequestId;
    refreshWeatherLegCards();
    const targets = mission.legs.flatMap(leg => [
        { panel: document.querySelector('#dashboardPanel [data-leg-id="' + leg.id + '"] [data-field="weatherBriefing"]'), roles: rolesForRoute(leg.route) },
        { panel: document.querySelector('#weatherToolBriefing [data-leg-id="' + leg.id + '"] [data-field="legWeatherReports"]'), roles: rolesForRoute(leg.route) }
    ]);
    const visibleTargets = targets.filter(target => target.panel);
    for (const { panel, roles } of visibleTargets) {
        renderWeatherMessage(panel, roles.size ? "Carregando METAR e TAF…" : "Selecione os aeródromos da rota para consultar METAR e TAF.");
    }
    const airports = [...new Set(visibleTargets.flatMap(target => [...target.roles.keys()]))];
    if (!airports.length) return;
    try {
        const reports = await loadWeatherBriefing(airports);
        if (requestId !== weatherRequestId) return;
        for (const { panel, roles } of visibleTargets) {
            if (roles.size && panel.isConnected) {
                renderWeatherBriefing(panel, [...roles.keys()].map(icao => reports.find(report => report.icao === icao) || { icao }), roles);
            }
        }
    } catch (error) {
        if (requestId !== weatherRequestId) return;
        for (const { panel, roles } of visibleTargets) {
            if (roles.size && panel.isConnected) renderWeatherMessage(panel, error.message, "error");
        }
    }
}
