import { mission } from "../models/missions.js";
import { routeCorridor, sigmetRelevance, sigmetTime } from "../core/sigmetRelevance.js";
let payload;
let pending = false;
export function getSigmetReports() { return payload?.reports || []; }
function add(parent, tag, text) {
    const node = document.createElement(tag); node.textContent = text; parent.append(node); return node;
}
function date(value) {
    const time = sigmetTime(value);
    return Number.isFinite(time) ? new Date(time).toLocaleString("pt-BR", { timeZone: "UTC" }).replaceAll("/", "-") + " UTC" : "Não informado";
}
export function renderSigmets() {
    const container = document.getElementById("sigmetReports");
    if (!container || !payload) return;
    container.replaceChildren();
    mission.legs.forEach((leg, index) => {
        const card = add(container, "details", ""); card.className = "planning-leg-card"; card.open = true;
        add(card, "summary", `Perna ${index + 1} · ${leg.route.origin?.icao || "----"} → ${leg.route.destination?.icao || "----"}`);
        const body = add(card, "div", ""); body.className = "planning-leg-body";
        const corridor = routeCorridor(leg);
        const classified = payload.reports.map(report => ({ report, status: sigmetRelevance(report, leg, corridor) }));
        if (!corridor || !leg.schedule?.arrival) add(body, "p", "Complete a rota e os horários desta perna para avaliar a pertinência.");
        for (const [status, title] of [["relevant", "Pertinentes à rota · faixa de 20 NM"], ["review", "Conferir pertinência"]]) {
            const items = classified.filter(item => item.status === status);
            if (!items.length) continue;
            add(body, "h3", `${title} (${items.length})`);
            for (const { report } of items) {
                const article = add(body, "article", ""); article.className = "sigmet-report";
                add(article, "h4", report.title || `${report.fir || ""} SIGMET ${report.number || ""}`);
                add(article, "strong", report.phenomenon || "Fenômeno não identificado");
                add(article, "p", `${date(report.start)} → ${date(report.end)}`);
                add(article, "pre", report.text || "Mensagem indisponível");
                if (status === "review") add(article, "p", "Dados insuficientes ou aviso de cancelamento: conferir a mensagem original.");
            }
        }
        if (!classified.some(item => item.status !== "outside")) add(body, "p", "Nenhum SIGMET pertinente entre os avisos retornados. Isso não indica ausência de fenômenos ou de avisos que ainda serão emitidos.");
    });
}
export async function refreshSigmets(force = false) {
    if (pending) return;
    if (payload && !force) { renderSigmets(); return; }
    pending = true;
    const status = document.getElementById("sigmetStatus");
    const button = document.getElementById("refreshSigmets");
    button.disabled = true; status.textContent = "Consultando SIGMETs…";
    try {
        const response = await fetch("/api/weather/sigmet");
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.reports)) throw new Error();
        payload = data; renderSigmets();
        window.dispatchEvent(new Event("sigmets-updated"));
        status.textContent = `REDEMET · Consulta: ${date(data.fetchedAt)}`;
    } catch {
        payload = null;
        window.dispatchEvent(new Event("sigmets-updated"));
        document.getElementById("sigmetReports").replaceChildren();
        status.textContent = "Não foi possível consultar SIGMETs. Tente atualizar novamente.";
    } finally { pending = false; button.disabled = false; }
}
export function initializeSigmetPanel() {
    document.getElementById("refreshSigmets").addEventListener("click", () => refreshSigmets(true));
    window.addEventListener("mission-updated", renderSigmets);
}
