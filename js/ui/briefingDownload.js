import { mission } from "../models/missions.js";
export function createBriefingDownload(legId) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "dashboard-pdf"; button.textContent = "Baixar PDF da perna";
    button.addEventListener("click", async event => {
        event.preventDefault(); event.stopPropagation();
        const index = mission.legs.findIndex(leg => leg.id === legId);
        if (index < 0 || button.disabled) return;
        const snapshot = JSON.parse(JSON.stringify({ leg: mission.legs[index], aircraft: mission.aircraft, settings: mission.settings }));
        button.disabled = true; button.textContent = "Gerando PDF…";
        try {
            const { collectBriefingReports, createBriefingPdf } = await import("../services/briefingPdf.js");
            const reports = await collectBriefingReports(snapshot.leg);
            const pdf = createBriefingPdf(snapshot.leg, snapshot.aircraft, snapshot.settings, index, reports);
            const url = URL.createObjectURL(pdf.output("blob"));
            const link = document.createElement("a");
            link.href = url; link.download = `Briefing-Perna-${index + 1}-${snapshot.leg.route.origin?.icao || "origem"}-${snapshot.leg.route.destination?.icao || "destino"}.pdf`;
            link.target = "_blank"; link.rel = "noopener";
            document.body.append(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
            button.textContent = "Baixar PDF da perna";
        } catch { button.textContent = "Falha ao gerar PDF. Tentar novamente"; }
        finally { button.disabled = false; }
    });
    return button;
}
