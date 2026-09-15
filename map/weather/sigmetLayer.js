import Feature from "ol/Feature.js";
import Polygon from "ol/geom/Polygon.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Fill, Stroke, Style, Text } from "ol/style.js";
import { mission } from "../../js/models/missions.js";
import { routeCorridor, sigmetRelevance } from "../../js/core/sigmetRelevance.js";
import { getSigmetReports, refreshSigmets } from "../../js/ui/sigmetPanel.js";

function sigmetColors(report) {
    const description = `${report.phenomenon || ""} ${report.text || ""}`.toUpperCase();
    if (/\bICE\b|\bICING\b|\bGELO\b/.test(description)) {
        return { stroke: "#2563eb", fill: "rgba(37, 99, 235, 0.18)", text: "#1e40af" };
    }
    if (/\bTURB\b|TURBUL/.test(description)) {
        return { stroke: "#eab308", fill: "rgba(234, 179, 8, 0.18)", text: "#854d0e" };
    }
    if (/\bTS\b|\bTSGR\b|\bRA\b|\bSHRA\b|RAIN|CHUVA|TROVO|THUNDER/.test(description)) {
        return { stroke: "#dc2626", fill: "rgba(220, 38, 38, 0.18)", text: "#991b1b" };
    }
    return { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.18)", text: "#713f12" };
}

export function sigmetFeatures(reports, legs, mode = "relevant") {
    const corridors = legs.map(routeCorridor);
    return reports.flatMap(report => {
        if (mode !== "all" && !legs.some((leg, i) => sigmetRelevance(report, leg, corridors[i]) === "relevant")) return [];
        if (!Array.isArray(report.coordinates) || report.coordinates.length < 3 || !report.coordinates.every(c => Array.isArray(c) && c.length >= 2 && c.slice(0, 2).every(n => n !== null && n !== "" && Number.isFinite(Number(n))) && Math.abs(Number(c[0])) <= 90 && Math.abs(Number(c[1])) <= 180)) return [];
        const ring = report.coordinates.map(([lat, lon]) => [Number(lon), Number(lat)]);
        if (new Set(ring.map(c => c.join())).size < 3) return [];
        if (ring[0].join() !== ring.at(-1).join()) ring.push([...ring[0]]);
        return [new Feature({
            geometry: new Polygon([ring]).transform("EPSG:4326", "EPSG:3857"),
            colors: sigmetColors(report),
            label: `${report.fir || ""} SIGMET ${report.number || ""}\n${report.phenomenon || ""}`
        })];
    });
}

export function initializeSigmetLayer(map) {
    const source = new VectorSource();
    const layer = new VectorLayer({ source, visible: false, style: feature => new Style({
        fill: new Fill({ color: feature.get("colors").fill }),
        stroke: new Stroke({ color: feature.get("colors").stroke, width: 2 }),
        text: new Text({ text: feature.get("label"), font: "bold 12px sans-serif",
            fill: new Fill({ color: feature.get("colors").text }), stroke: new Stroke({ color: "#fff", width: 3 }), overflow: false })
    }) });
    // Above the charts, below the route and its point labels.
    map.getLayers().insertAt(map.getLayers().getLength() - 1, layer);
    const button = document.getElementById("toggleSigmets");
    const status = document.getElementById("sigmetMapStatus");
    let mode = "hidden";
    function render() {
        if (mode === "hidden") return;
        const features = sigmetFeatures(getSigmetReports(), mission.legs, mode);
        layer.setVisible(false);
        source.clear();
        source.addFeatures(features);
        layer.setVisible(true);
        status.textContent = `${features.length} área(s) · ${mode === "all" ? "Todos" : "Pertinentes à rota"}. Avisos sem geometria: confira a página SIGMET.`;
    }
    button.addEventListener("click", async () => {
        mode = mode === "hidden" ? "relevant" : mode === "relevant" ? "all" : "hidden";
        const visible = mode !== "hidden";
        button.textContent = mode === "hidden" ? "SIGMET" : mode === "all" ? "SIGMET · Todos" : "SIGMET · Rota";
        button.title = mode === "hidden" ? "Exibir pertinentes à rota" : mode === "relevant" ? "Exibir todos os SIGMETs" : "Ocultar SIGMETs";
        // Never expose polygons retained from the previous filter while loading.
        layer.setVisible(false);
        source.clear();
        button.setAttribute("aria-pressed", String(visible));
        status.hidden = !visible;
        if (visible) {
            status.textContent = "Consultando SIGMETs…";
            await refreshSigmets(true);
            render();
        }
    });
    window.addEventListener("sigmets-updated", render);
    window.addEventListener("mission-updated", render);
}
