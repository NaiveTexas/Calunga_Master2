import { jsPDF } from "jspdf";
import { formatDate, formatTime } from "../utils/helpers.js";
import { formatRoute } from "../core/routePlanning.js";
import { buildRedemetPdfUrl, redemetPdfAirports } from "./redemetPdf.js";
import { buildOgimetGrametUrl } from "./ogimetGramet.js";
import { notamAirports } from "../ui/notamPanel.js";
import { notamLegValidity, formatNotamDate } from "../core/notamValidity.js";
import { classifyNotam } from "../core/notamClassification.js";
import { sigmetRelevance, routeCorridor } from "../core/sigmetRelevance.js";

async function request(url, field) {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data[field])) throw new Error();
        return data[field];
    } catch { return null; }
}
export async function collectBriefingReports(leg) {
    const icaos = [...notamAirports([leg]).keys()].filter(id => /^[A-Z]{4}$/.test(id));
    const [weather, sigmets] = await Promise.all([
        request(`/api/weather/briefing?${new URLSearchParams({ airports: redemetPdfAirports(leg).join(",") })}`, "airports"),
        request("/api/weather/sigmet", "reports")
    ]);
    const notams = [];
    for (const icao of icaos) notams.push({ icao, reports: await request(`/api/notams?${new URLSearchParams({ icao })}`, "reports") });
    return { weather, sigmets, notams, fetchedAt: new Date().toISOString() };
}

export function createBriefingPdf(leg, aircraft, settings, index, reports) {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const left = 18, width = 180, bottom = 257;
    let y = 24;
    let currentSection = "";
    const clean = value => String(value ?? "Não informado").replace(/[–—→]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF\n]/g, " ");
    function newPage() {
        doc.addPage();
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(75, 91, 110);
        doc.text(clean(`Perna ${index + 1}  /  ${currentSection} - continuação`), left, 17);
        doc.setDrawColor(215, 222, 230); doc.line(left, 21, left + width, 21);
        y = 30;
    }
    function line(text, size = 10, bold = false, mono = false) {
        if (bold && y + 15 > bottom) newPage();
        doc.setFont(mono ? "courier" : "helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
        doc.setTextColor(...(bold ? [27, 48, 69] : [48, 57, 68]));
        for (const row of doc.splitTextToSize(clean(text), width)) {
            if (y > bottom) { newPage(); doc.setFont(mono ? "courier" : "helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(48, 57, 68); }
            doc.text(row, left, y); y += size * .45 + 1;
        }
    }
    function section(title) {
        currentSection = title;
        if (y + 36 > bottom) newPage();
        y += 5;
        doc.setFillColor(235, 240, 245); doc.roundedRect(left, y - 5, width, 11, 1, 1, "F");
        doc.setFillColor(36, 96, 124); doc.rect(left, y - 5, 1.2, 11, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(27, 48, 69);
        doc.text(title, left + 5, y + 2); y += 15;
    }
    function divider() { y += 2; doc.setDrawColor(225, 230, 235); doc.line(left, y, left + width, y); y += 7; }
    const number = (value, unit) => Number.isFinite(value) ? `${Math.round(value).toLocaleString("pt-BR")} ${unit}` : "Não informado";
    line("BRIEFING DE NAVEGAÇÃO", 10, true);
    y += 5;
    line(`${leg.route.origin?.icao || "----"}  -  ${leg.route.destination?.icao || "----"}`, 24, true);
    line(`Perna ${index + 1}  |  ${formatDate(leg.schedule.date)}  |  ${aircraft.model?.name || aircraft.model?.model || "Não informada"}  ${aircraft.registration?.registration || aircraft.registration?.name || ""}`, 10);
    section("PLANEJAMENTO DA PERNA");
    const consumption = leg.fuel.taxi + leg.fuel.flight + leg.fuel.procedure + (leg.fuel.enrouteProcedure || 0);
    line("ROTA", 9, true); line(formatRoute(leg, aircraft.model), 11); y += 5;
    const fields = [
        [["NÍVEL", leg.flightLevel || "--"], ["EET", formatTime(leg.schedule.eet)]],
        [["ETD - UTC", `${formatDate(leg.schedule.date)}  ${leg.schedule.etd || "--:--"}`], ["ETA - UTC", `${formatDate(leg.schedule.etaDate)}  ${leg.schedule.eta || "--:--"}`]],
        [["COMB MÍNIMO", number(leg.fuel.total, settings.fuelUnit)], ["COMB A CONSUMIR", number(consumption, settings.fuelUnit)]],
        [["PESO DE DEP", number(leg.weight.takeoff, "KG")], ["PESO DE POUSO", number(leg.weight.landing, "KG")]],
        [["PAYLOAD", number(leg.weight.payload, "KG")], ["ALTERNATIVA", leg.route.alternate?.icao || "--"]]
    ];
    for (const pair of fields) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(12);
        const values = pair.map(([, value]) => doc.splitTextToSize(clean(value), 85));
        const height = 12 + Math.max(...values.map(rows => rows.length)) * 5;
        if (y + height > bottom) newPage();
        pair.forEach(([label], column) => {
            const x = left + column * 94;
            doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(90, 105, 121); doc.text(label, x, y);
            doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(27, 48, 69);
            doc.text(values[column], x, y + 6);
        });
        y += height;
    }
    y += 6;
    section("BRIEFING METEOROLÓGICO");
    line("METAR/TAF:", 10, true);
    if (!reports.weather) line("Consulta indisponível. Conferir na REDEMET.");
    else if (!reports.weather.length) line("Nenhuma mensagem retornada.");
    else for (const item of reports.weather) { line(item.icao, 12, true); line("METAR", 8, true); line(item.metar || "METAR indisponível.", 10, false, true); y += 3; line("TAF", 8, true); line(item.taf || "TAF indisponível.", 10, false, true); divider(); }
    section("SIGMET");
    if (!reports.sigmets) line("Consulta indisponível. Conferir na REDEMET.");
    else {
        const corridor = routeCorridor(leg);
        const relevant = reports.sigmets.map(report => ({ report, status: sigmetRelevance(report, leg, corridor) })).filter(item => item.status !== "outside");
        if (!relevant.length) line("Não há aviso de SIGMET interferindo com a rota");
        for (const { report, status } of relevant) { line(`${report.fir || ""} SIGMET ${report.number || ""}${status === "review" ? " - Conferir pertinência" : ""}`, 11, true); line(report.text, 10, false, true); divider(); }
    }
    y += 3;
    const url = buildRedemetPdfUrl(leg);
    if (url) { if (y > bottom) newPage(); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(25, 70, 150); doc.textWithLink("Abrir briefing completo na REDEMET", left, y, { url }); doc.setTextColor(0); y += 6; }
    else line("Link Briefing REDEMET: complete os dados de rota e horário.");
    const grametUrl = buildOgimetGrametUrl(leg);
    if (grametUrl) {
        if (y > bottom) newPage();
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(25, 70, 150);
        doc.textWithLink("Abrir GRAMET no OGIMET", left, y, { url: grametUrl });
        doc.setTextColor(0); y += 6;
    } else line("Link GRAMET OGIMET: complete origem, destino e nível de voo.");
    y += 6;
    section("NOTAMS");
    for (const airport of reports.notams) {
        line(airport.icao, 10, true);
        if (!airport.reports) { line("Consulta indisponível. Conferir no AISWEB."); continue; }
        const selected = airport.reports.map(report => ({ report, status: notamLegValidity(report, leg) })).filter(item => ["Válidos", "Conferir validade"].includes(item.status));
        if (!selected.length) line("Nenhum NOTAM coincidente entre os retornados.");
        for (const { report, status } of selected) {
            const classification = classifyNotam(report);
            line(`${classification.category} ${classification.condition}`.toLocaleUpperCase("pt-BR"), 10, true);
            line(report.n || "NOTAM", 9);
            if (status === "Conferir validade") line("Conferir validade", 9);
            line(`Início: ${formatNotamDate(report.b)}  |  Fim: ${formatNotamDate(report.c)}`, 9);
            if (report.d) line(`Atividade: ${report.d}`, 9);
            line(report.e, 11); if (report.ref) line(`Referência: ${report.ref}`, 9); divider();
        }
    }
    for (let page = 1; page <= doc.getNumberOfPages(); page++) {
        doc.setPage(page); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        doc.setDrawColor(215, 222, 230); doc.line(left, 264, left + width, 264); doc.setTextColor(90, 105, 121);
        const stamp = reports.fetchedAt ? `${formatDate(reports.fetchedAt.slice(0, 10))} ${reports.fetchedAt.slice(11, 16)} UTC` : "Não informada";
        doc.text(clean(`Perna ${index + 1} | Consulta: ${stamp}`), left, 270);
        doc.text(`${page} / ${doc.getNumberOfPages()}`, left + width, 270, { align: "right" });
    }
    return doc;
}
