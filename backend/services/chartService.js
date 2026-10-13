import { deceaClient } from "../clients/deceaClient.js";
import { getCachedResponse } from "../cache/responseCache.js";
import { createChartTileCache } from "../cache/chartTileCache.js";
const cachedTile = createChartTileCache();

export async function loadEnrcWms(query) {
    const key = JSON.stringify(Object.keys(query).sort().map(key => [key, query[key]]));
    return cachedTile(key, () => deceaClient.get(
        "https://geoaisweb.decea.mil.br/geoserver/ICA/wms",
        { params: { ...query }, responseType: "arraybuffer" }
    ));
}

function loadEnrcIndex(type, typeName) {
    return getCachedResponse(`charts:enrc:index:${type}`, async () => (
        await deceaClient.get(
            "https://geoaisweb.decea.mil.br/geoserver/ICA/ows",
            {
                params: {
                    service: "WFS",
                    version: "1.0.0",
                    request: "GetFeature",
                    typeName,
                    outputFormat: "application/json",
                    srsName: "EPSG:4326"
                }
            }
        )
    ).data);
}

export function loadEnrcLowIndex() {
    return loadEnrcIndex("low", "ICA:MAP_ENRCL_OTHER");
}

export function loadEnrcHighIndex() {
    return loadEnrcIndex("high", "ICA:MAP_ENRCH_OTHER");
}
