import { XMLParser, XMLValidator } from "fast-xml-parser";
import { deceaClient } from "../clients/deceaClient.js";
import { config } from "../config/index.js";
import { getCachedResponse } from "../cache/responseCache.js";

export function parseNotams(xml, icao) {
    if (typeof xml !== "string" || XMLValidator.validate(xml) !== true) throw new Error("Invalid AISWEB XML");
    const data = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(xml);
    const block = data.aisweb?.notam;
    if (!block || typeof block !== "object") throw new Error("Missing NOTAM response");
    const reports = [];
    function visit(value) {
        if (!value || typeof value !== "object") return;
        if (value.loc && (value.n || value.cod)) {
            if (value.loc !== icao) throw new Error("Unexpected locality");
            reports.push(Object.fromEntries(["id", "n", "cod", "tp", "loc", "b", "c", "d", "e", "f", "g", "ref", "aero"].map(key => [key, String(value[key] ?? "")])));
            return;
        }
        for (const child of Object.values(value)) if (typeof child === "object") visit(child);
    }
    visit(block);
    if (!reports.length && String(block["@_total"]) !== "0") throw new Error("Unrecognized NOTAM response");
    return reports;
}

export async function loadAirportNotams(icao) {
    return getCachedResponse(`notam:${icao}`, async () => {
        const response = await deceaClient.get("https://api.decea.mil.br/aisweb/", {
            params: { apiKey: config.aiswebApiKey, apiPass: config.aiswebApiPass, area: "notam", icaocode: icao, dist: "N" },
            responseType: "text", maxRedirects: 0
        });
        return { icao, reports: parseNotams(response.data, icao), fetchedAt: new Date().toISOString() };
    }, 60_000);
}
