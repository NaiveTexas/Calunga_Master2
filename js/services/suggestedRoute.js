import { suggestRoute } from "../core/suggestedRoute.js";

export async function loadSuggestedRoute(origin, destination) {
    const request = async url => {
        const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
        if (response.status === 404 && !url.endsWith("/fixes")) {
            throw new Error("A consulta de TMA ou setores de FIR não está disponível neste servidor. Reinicie o backend atualizado (node server.js) ou atualize a publicação.");
        }
        if (!response.ok) {
            const source = url.endsWith("/terminals") ? "os limites das TMA" : url.endsWith("/fir-sectors") ? "os setores de FIR" : "os fixos";
            throw new Error(`Não foi possível consultar ${source} (HTTP ${response.status}). Tente novamente.`);
        }
        return response.json();
    };
    const [fixes, terminals, sectors] = await Promise.all([
        request("/api/navigation/fixes"), request("/api/navigation/terminals"), request("/api/navigation/fir-sectors")
    ]);
    if (!Array.isArray(fixes) || !fixes.length || !Array.isArray(terminals.features) || !terminals.features.length || !Array.isArray(sectors.features) || !sectors.features.length) {
        throw new Error("A base de fixos, terminais ou setores de FIR está indisponível. Os pontos existentes foram mantidos.");
    }
    return suggestRoute(origin, destination, fixes, [...terminals.features, ...sectors.features]);
}
