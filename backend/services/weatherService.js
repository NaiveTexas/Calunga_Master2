import { deceaClient } from "../clients/deceaClient.js";
import { getCachedResponse } from "../cache/responseCache.js";
import { config, WEATHER_CACHE_TTL_MS } from "../config/index.js";

function getLatestMessageByAirport(data, airports) {
    const entries =
        data?.data?.data || [];
    return airports.reduce((messages, icao) => {
        const entry = entries.find(
            item => item.id_localidade === icao
        );
        messages[icao] = entry?.mens || null;
        return messages;
    }, {});
}

export async function loadWeatherBriefing(uniqueAirports) {
    const locations = uniqueAirports.join(",");
    const cacheKey = `weather:${locations}`;
    const [metarData, tafData] = await getCachedResponse(
        cacheKey,
        async () => Promise.all([
            deceaClient.get(
                `https://api-redemet.decea.mil.br/mensagens/metar/${locations}`,
                {
                    params: {
                        page_tam: 100
                    },
                    headers: {
                        "X-Api-Key": config.redemetApiKey
                    }
                }
            ).then(response => response.data),
            deceaClient.get(
                `https://api-redemet.decea.mil.br/mensagens/taf/${locations}`,
                {
                    params: {
                        page_tam: 100,
                        fim_linha: "texto"
                    },
                    headers: {
                        "X-Api-Key": config.redemetApiKey
                    }
                }
            ).then(response => response.data)
        ]),
        WEATHER_CACHE_TTL_MS
    );
    return {
        airports: uniqueAirports.map(icao => ({
            icao,
            metar: getLatestMessageByAirport(
                metarData,
                [icao]
            )[icao],
            taf: getLatestMessageByAirport(
                tafData,
                [icao]
            )[icao]
        }))
};
}
