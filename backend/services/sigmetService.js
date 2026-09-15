import { deceaClient } from "../clients/deceaClient.js";
import { config } from "../config/index.js";
import { getCachedResponse } from "../cache/responseCache.js";

export async function loadSigmets() {
    return getCachedResponse("sigmet:brasil", async () => {
        const reports = [];
        for (let page = 1; page <= 100; page++) {
            const { data } = await deceaClient.get("https://api-redemet.decea.mil.br/mensagens/sigmet", {
                params: { pais: "Brasil", page_tam: 150, page }, headers: { "X-Api-Key": config.redemetApiKey }
            });
            if (data.status !== true || !Array.isArray(data.data?.data)) throw new Error("Invalid SIGMET response");
            reports.push(...data.data.data.map(item => ({
                fir: item.id_fir, number: item.no_mens, title: item.title,
                start: item.validade_inicial, end: item.validade_final,
                text: item.mens, phenomenon: item.fenomeno_comp || item.fenomeno,
                coordinates: item.lat_lon
            })));
            const last = Number(data.data.last_page || 1);
            if (page >= last) return { reports, fetchedAt: new Date().toISOString() };
        }
        throw new Error("Incomplete SIGMET response");
    }, 60000);
}
