import { mission } from "../models/missions.js";
import { formatTime, formatDate } from "../utils/helpers.js";
import { calculateWaypointPassages } from "../core/routePlanning.js";
export function refreshFullBriefing() {

    const content = document.getElementById("fullBriefingContent");

    if (!content) return;

    const origin = mission.route.origin?.icao || "----";
    const destination = mission.route.destination?.icao || "----";
    const aircraft = mission.aircraft.model?.name || mission.aircraft.model?.model || "Não definida";
    const registration = mission.aircraft.registration?.registration || mission.aircraft.registration?.name || "Não definida";

    content.innerHTML = `
        <h1>BRIEFING DE NAVEGAÇÃO</h1>
        <section><h2>Missão</h2><p><strong>Rota:</strong> ${origin} – ${destination}</p><p><strong>Aeronave:</strong> ${aircraft}</p><p><strong>Matrícula:</strong> ${registration}</p><p><strong>Combustível mínimo inicial:</strong> ${Math.round(mission.fuel.total)} ${mission.settings.fuelUnit}</p><p><strong>Nível de voo inicial:</strong> ${mission.aircraft.flightLevel || "Não definido"}</p></section>
        <section><h2>Partida — ${origin}</h2><p>Decolagem prevista para <strong>${mission.schedule.etd || "--:--"} UTC</strong>.</p><p><strong>Peso estimado de decolagem:</strong> ${Math.round(mission.weight.takeoff)} KG</p><p><strong>Pistas, frequências e comprimento mínimo:</strong> Não disponível.</p><h3>METAR/TAF ${origin}</h3><p>Disponível na aba Meteorologia → Resumo.</p></section>
        <section><h2>Em rota</h2><p><strong>Tempo de voo estimado:</strong> ${formatTime(mission.schedule.eet)}</p><div class="briefing-waypoints"></div></section>
        <section><h2>Chegada — ${destination}</h2><p>Pouso previsto para <strong>${mission.schedule.eta || "--:--"} UTC</strong>.</p><p><strong>Peso estimado de pouso:</strong> ${Math.round(mission.weight.landing)} KG</p><p><strong>Pistas, frequências e comprimento mínimo:</strong> Não disponível.</p><h3>METAR/TAF ${destination}</h3><p>Disponível na aba Meteorologia → Resumo.</p></section>`;

    const container = content.querySelector(".briefing-waypoints");
    const passages = calculateWaypointPassages(mission, mission.aircraft.model);
    if (!passages.length) {
        container.textContent = "Rota direta, sem pontos intermediários.";
        return;
    }
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    table.append(caption);
    caption.textContent = "Passagem estimada nos pontos · distância acumulada ao longo da rota";
    const header = document.createElement("tr");
    for (const label of ["Ponto", "Passagem UTC", "Desde a origem (NM)"]) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        header.append(cell);
    }
    const head = document.createElement("thead");
    head.append(header);
    table.append(head);
    const body = document.createElement("tbody");
    for (const { point, distance, time } of passages) {
        const row = document.createElement("tr");
        const name = point.reference?.ident || point.ident || point.icao || "----";
        for (const value of [
            point.type === "AIRPORT" && point.icao !== name ? `${name} (${point.icao})` : name,
            time ? `${formatDate(time.slice(0, 10))} · ${time.slice(11, 16)}` : "—",
            distance === null ? "—" : distance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
        ]) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        }
        body.append(row);
    }
    table.append(body);
    container.append(table);
}
