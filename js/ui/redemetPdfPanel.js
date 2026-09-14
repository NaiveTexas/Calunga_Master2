import { createLegCards } from "./legCards.js";
import { buildRedemetPdfUrl, redemetPdfAirports } from "../services/redemetPdf.js";
import { formatDate } from "../utils/helpers.js";

let renderCards;
export function refreshRedemetPdfPanel() {
    if (!document.getElementById("redemetPdfCards")) return;
    renderCards ||= createLegCards("redemetPdfCards", ".card-title");
    renderCards((leg, { subtitle, field }) => {
        const url = buildRedemetPdfUrl(leg);
        subtitle.textContent = `${formatDate(leg.schedule.date) || "Data pendente"} · ${leg.schedule.etd || "--:--"} UTC · ${leg.flightLevel}`;
        field("redemetPdfAirports").textContent = `Aeródromos: ${redemetPdfAirports(leg).join(" · ") || "pendentes"}`;
        field("redemetPdfStatus").textContent = url
            ? "Os dados acima serão enviados à REDEMET. O download é feito na nova aba."
            : "Preencha origem, destino, data, decolagem e nível da perna para abrir a REDEMET.";
        const link = field("redemetPdfLink");
        if (url) link.href = url;
        else link.removeAttribute("href");
        link.setAttribute("aria-disabled", String(!url));
        link.tabIndex = url ? 0 : -1;
    });
}
