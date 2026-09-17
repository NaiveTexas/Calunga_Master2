import { mission } from "../models/missions.js";
import { notamLegValidity, formatNotamDate } from "../core/notamValidity.js";
import { classifyNotam, NOTAM_CATEGORIES } from "../core/notamClassification.js";

export function notamAirports(legs) {
    const airports = new Map();
    legs.forEach((leg, index) => {
        const involved = [[leg.route.origin, "Origem"], [leg.route.destination, "Destino"], [leg.route.alternate, "Alternativa"],
            ...leg.route.waypoints.filter(point => point.type === "AIRPORT" && point.procedure).map(point => [point, "Procedimento"])];
        for (const [airport, role] of involved) {
            if (!airport?.icao) continue;
            const roles = airports.get(airport.icao) || new Set();
            roles.add(`Perna ${index + 1} · ${role}`);
            airports.set(airport.icao, roles);
        }
    });
    return airports;
}
let signature = "";
let requestId = 0;
let initialized = false;
// null selects all; an empty Set explicitly selects none.
let selectedCategories = null;
let selectedAirports = null;
let airportBar;
function toggleSelection(selection, value) {
    if (value === "Todos") return selection === null ? new Set() : null;
    const next = new Set(selection || []);
    if (next.has(value)) next.delete(value); else next.add(value);
    return next;
}
let filterBar;
let validityBar;
let selectedValidity = "Válidos";
function updateCategoryFilter() {
    if (!filterBar) return;
    const articles = [...document.querySelectorAll("#notamAirports .notam-report")];
    for (const article of articles) {
        const relevant = mission.legs.flatMap((leg, index) => notamAirports([leg]).has(article.notamReport.loc)
            ? [{ index, status: notamLegValidity(article.notamReport, leg) }] : []);
        const statuses = relevant.map(item => item.status);
        article.dataset.validity = ["Válidos", "Conferir validade", "Futuros", "Fora do período", "Encerrados"].find(status => statuses.includes(status)) || "Conferir validade";
        const coincident = relevant.filter(item => item.status === "Válidos").map(item => item.index + 1);
        const legList = new Intl.ListFormat("pt-BR", { type: "conjunction" }).format(coincident.map(String));
        const uncertain = relevant.filter(item => item.status === "Conferir validade").map(item => item.index + 1);
        article.querySelector(".notam-leg-validity").textContent = [
            coincident.length ? `Coincidente com ${coincident.length === 1 ? "a perna" : "as pernas"} ${legList}` : "Sem coincidência confirmada com as pernas envolvidas",
            uncertain.length ? `Conferir validade nas pernas ${new Intl.ListFormat("pt-BR").format(uncertain.map(String))}` : ""
        ].filter(Boolean).join(" · ");
        article.validityStatuses = statuses;
    }
    validityBar.replaceChildren();
    for (const validity of ["Válidos", "Futuros", "Fora do período", "Conferir validade", "Encerrados", "Todos"]) {
        const count = articles.filter(article => validity === "Todos" || article.validityStatuses.includes(validity)).length;
        if (!count && ["Conferir validade", "Encerrados", "Fora do período"].includes(validity) && validity !== selectedValidity) continue;
        const button = append(validityBar, "button", `${validity} (${count})`);
        button.type = "button";
        button.dataset.validity = validity;
        button.setAttribute("aria-pressed", String(selectedValidity === validity));
        button.addEventListener("click", () => { selectedValidity = validity; updateCategoryFilter(); });
    }
    const matching = articles.filter(article => selectedValidity === "Todos" || article.validityStatuses.includes(selectedValidity));
    const airports = [...notamAirports(mission.legs).keys()];
    airportBar.replaceChildren();
    for (const icao of ["Todos", ...airports]) {
        const count = matching.filter(article => icao === "Todos" || article.notamReport.loc === icao).length;
        const button = append(airportBar, "button", `${icao} (${count})`);
        button.type = "button";
        button.setAttribute("aria-pressed", String(icao === "Todos" ? selectedAirports === null : Boolean(selectedAirports?.has(icao))));
        button.addEventListener("click", () => { selectedAirports = toggleSelection(selectedAirports, icao); updateCategoryFilter(); });
    }
    const airportMatching = matching.filter(article => selectedAirports === null || selectedAirports.has(article.notamReport.loc));
    const counts = new Map();
    for (const article of airportMatching) counts.set(article.dataset.category, (counts.get(article.dataset.category) || 0) + 1);
    filterBar.replaceChildren();
    for (const category of ["Todos", ...NOTAM_CATEGORIES.filter(category => articles.some(article => article.dataset.category === category) || selectedCategories?.has(category))]) {
        const count = category === "Todos" ? airportMatching.length : counts.get(category) || 0;
        const button = append(filterBar, "button", `${category} (${count})`);
        button.type = "button";
        button.setAttribute("aria-pressed", String(category === "Todos" ? selectedCategories === null : Boolean(selectedCategories?.has(category))));
        button.addEventListener("click", () => { selectedCategories = toggleSelection(selectedCategories, category); updateCategoryFilter(); });
    }
    for (const article of articles) article.hidden = !airportMatching.includes(article) || (selectedCategories !== null && !selectedCategories.has(article.dataset.category));
    for (const body of document.querySelectorAll("#notamAirports .planning-leg-body")) {
        body.querySelector(".notam-filter-empty")?.remove();
        const reports = [...body.querySelectorAll(".notam-report")];
        const card = body.closest(".planning-leg-card");
        // Loading and failed requests remain visible; they are not empty results.
        card.hidden = (selectedAirports !== null && !selectedAirports.has(card.dataset.icao)) || selectedCategories?.size === 0 || (body.dataset.loaded === "true" && (reports.length
            ? reports.every(report => report.hidden)
            : selectedCategories !== null));
    }
}
function append(parent, tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    parent.append(element);
    return element;
}
export function initializeNotamPanel() {
    initialized = true;
    validityBar = document.createElement("div");
    validityBar.className = "notam-validity-filter";
    validityBar.setAttribute("role", "group");
    validityBar.setAttribute("aria-label", "Filtrar por validade");
    document.getElementById("notamAirports").before(validityBar);
    const note = document.createElement("p");
    note.className = "weather-briefing-message";
    note.textContent = "Validade entre ETD e ETA das pernas que envolvem o aeródromo, considerando B, C e D em UTC. Formatos não interpretados ficam em Conferir validade. Um NOTAM pode aparecer em mais de um filtro quando as pernas têm resultados diferentes.";
    const explanation = document.createElement("details");
    explanation.className = "notam-filter-help";
    append(explanation, "summary", "Como a validade é calculada");
    explanation.append(note);
    validityBar.before(explanation);
    airportBar = document.createElement("div");
    airportBar.className = "notam-category-filter notam-airport-filter";
    airportBar.setAttribute("role", "group");
    airportBar.setAttribute("aria-label", "Filtrar NOTAMs por aeródromos");
    document.getElementById("notamAirports").before(airportBar);
    filterBar = document.createElement("div");
    filterBar.className = "notam-category-filter";
    filterBar.setAttribute("role", "group");
    filterBar.setAttribute("aria-label", "Filtrar NOTAMs por categoria");
    document.getElementById("notamAirports").before(filterBar);
    updateCategoryFilter();
    document.getElementById("refreshNotams").addEventListener("click", () => refreshNotamPanel(true));
    window.addEventListener("mission-updated", () => refreshNotamPanel());
    document.addEventListener("visibilitychange", () => { if (!document.hidden) updateCategoryFilter(); });
    const timer = setInterval(() => {
        if (document.getElementById("notamPage").classList.contains("active")) updateCategoryFilter();
    }, 60_000);
    timer.unref?.();
}
export async function refreshNotamPanel(force = false) {
    if (!initialized || !document.getElementById("notamPage").classList.contains("active")) return;
    const airports = notamAirports(mission.legs);
    const next = JSON.stringify([...airports].map(([icao, roles]) => [icao, [...roles]]));
    if (!force && signature === next) { updateCategoryFilter(); return; }
    signature = next;
    const current = ++requestId;
    const container = document.getElementById("notamAirports");
    container.replaceChildren();
    updateCategoryFilter();
    if (!airports.size) { append(container, "p", "Selecione os aeródromos nas pernas para consultar NOTAMs."); return; }
    const targets = [...airports].map(([icao, roles]) => {
        const card = append(container, "details", "", "planning-leg-card");
        card.dataset.icao = icao;
        card.open = true;
        const summary = append(card, "summary", "");
        append(summary, "strong", icao);
        const airport = mission.legs.flatMap(leg => [leg.route.origin, leg.route.destination, leg.route.alternate, ...leg.route.waypoints]).find(point => point?.icao === icao);
        if (airport?.name) append(summary, "span", airport.name, "notam-airport-name");
        append(summary, "span", [...roles].join(" / "));
        const body = append(card, "div", "Carregando NOTAMs…", "planning-leg-body");
        return { icao, body };
    });
    // Bound concurrency and keep successful airports visible if another request fails.
    updateCategoryFilter();
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(3, targets.length) }, async () => {
        while (cursor < targets.length && current === requestId) {
            const { icao, body } = targets[cursor++];
            try {
                const response = await fetch(`/api/notams?${new URLSearchParams({ icao })}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Consulta indisponível.");
                if (current !== requestId) return;
                body.replaceChildren();
                body.dataset.loaded = "true";
                append(body, "p", `${data.reports.length} NOTAM(s) · Consulta: ${new Date(data.fetchedAt).toLocaleString("pt-BR", { timeZone: "UTC" })} UTC`, "weather-briefing-message");
                if (!data.reports.length) append(body, "p", "Nenhum NOTAM para este aeródromo");
                for (const report of data.reports) {
                    const article = append(body, "article", "", "notam-report");
                    article.notamReport = report;
                    const classification = classifyNotam(report);
                    article.dataset.category = classification.category;
                    append(article, "p", `${classification.category} · ${classification.condition}`, "notam-condition");
                    const type = String(report.tp || "").replace(/^NOTAM/, "");
                    append(article, "h3", `${report.n || "NOTAM"}${type ? ` · NOTAM${type}` : ""}`);
                    append(article, "pre", report.e || "Texto não informado");
                    append(article, "p", "", "notam-leg-validity");
                    const dates = append(article, "div", "", "notam-dates");
                    append(dates, "p", `Início: ${formatNotamDate(report.b)}`);
                    append(dates, "p", `Término: ${formatNotamDate(report.c)}`);
                    append(dates, "p", `Atividade: ${report.d || "Contínua durante a validade"}`);
                    if (report.ref) append(article, "p", `Referência: ${report.ref}`, "notam-reference");
                }
                updateCategoryFilter();
            } catch {
                if (current === requestId) body.textContent = "Não foi possível consultar este aeródromo. Use Atualizar NOTAMs para tentar novamente.";
                updateCategoryFilter();
            }
        }
    }));
}
