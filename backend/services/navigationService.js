import { deceaClient } from "../clients/deceaClient.js";
import { getCachedResponse } from "../cache/responseCache.js";

export async function loadFixes() {
    const data = await getCachedResponse(
        "navigation:fixes",
        async () => (
            await deceaClient.get(
                "https://geoaisweb.decea.mil.br/geoserver/ows",
                {
                    params: {
                        service: "WFS",
                        version: "1.0.0",
                        request: "GetFeature",
                        typeName: "ICA:waypoint",
                        outputFormat: "application/json"
                    }
                }
            )
        ).data
    );
    const features =
        data.features || [];
    const fixes =
        features.map(feature => {
            const properties =
                feature.properties;
            return {
                type: "FIX",
                ident:
                    properties.ident,
                position: {
                    latitude:
                        properties.latitude,
                    longitude:
                        properties.longitude
                },
                codeType:
                    properties.codetype,
                effective:
                    properties.effective,
                amendment:
                    properties.emenda
            };
        });
    return fixes;
}

export async function loadAirports() {
    const data = await getCachedResponse(
        "navigation:airports",
        async () => (
            await deceaClient.get(
                "https://geoaisweb.decea.mil.br/geoserver/ows",
                {
                    params: {
                        service: "WFS",
                        version: "1.0.0",
                        request: "GetFeature",
                        typeName: "ICA:airport",
                        outputFormat: "application/json",
                        srsName: "EPSG:4326"
                    }
                }
            )
        ).data
    );
    const features =
        data.features || [];
    const airports =
        features
            .map(feature => {
                const properties =
                    feature.properties || {};
                const icao =
                    properties.localidade_id;
                const latitude =
                    Number(properties.latitude_dec);
                const longitude =
                    Number(properties.longitude_dec);
                const elevation =
                    Number(properties.elevacao);
                if (
                    !icao ||
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {
                    return null;
                }
                return {
                    type: "AIRPORT",
                    icao,
                    name:
                        properties.nome || "",
                    city:
                        properties.cidade || "",
                    state:
                        properties.uf || "",
                    position: {
                        latitude,
                        longitude,
                        elevation:
                            Number.isFinite(elevation)
                                ? elevation
                                : 0
                    }
                };
            })
            .filter(Boolean);
    return airports;
}

export async function loadVors() {
    const data = await getCachedResponse(
        "navigation:vors",
        async () => (
            await deceaClient.get(
                "https://geoaisweb.decea.mil.br/geoserver/ows",
                {
                    params: {
                        service: "WFS",
                        version: "1.0.0",
                        request: "GetFeature",
                        typeName: "ICA:vor",
                        outputFormat: "application/json",
                        srsName: "EPSG:4326"
                    }
                }
            )
        ).data
    );
    const features =
        data.features || [];
    const vors =
        features
            .map(feature => {
                const properties =
                    feature.properties || {};
                const ident =
                    properties.ident;
                const latitude =
                    Number(
                        properties.latitude
                    );
                const longitude =
                    Number(
                        properties.longitude
                    );
                if (
                    !ident ||
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {
                    return null;
                }
                return {
                    type: "VOR",
                    ident,
                    name:
                        properties.txtname || "",
                    frequency:
                        properties.frequency ?? null,
                    vorType:
                        properties.vortype || null,
                    purpose:
                        properties.purpose || null,
                    elevation:
                        properties.elevation ?? null,
                    position: {
                        latitude,
                        longitude
                    }
                };
            })
            .filter(Boolean);
    return vors;
}
