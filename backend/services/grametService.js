import { grametClient } from "../clients/openMeteoClient.js";
import { getCachedResponse } from "../cache/responseCache.js";
import { GRAMET_CACHE_TTL_MS, GRAMET_MODEL } from "../config/index.js";
import { destinationPoint } from "../core/geo.js";
import { buildGrametSamples, getGrametHourlyVariables, getClosestForecastIndex, buildGrametProfile, buildCloudLayers } from "../core/grametProfile.js";

export async function loadGramet(validRoutePoints, departureTime, eetHours) {
    const { samples, totalDistance } =
        buildGrametSamples(validRoutePoints);
    const cacheKey = JSON.stringify({
        points: samples.map(point => [
            Number(point.latitude).toFixed(3),
            Number(point.longitude).toFixed(3)
        ]),
        departureHour: departureTime.toISOString().slice(0, 13),
        eetHours: Number.isFinite(eetHours) ? eetHours.toFixed(1) : "0"
});
const data = await getCachedResponse(
    `gramet:gfs:${cacheKey}`,
    async () => {
        const response = await grametClient.get("/gfs", {
            params: {
                latitude: samples
                    .map(point => Number(point.latitude))
                    .join(","),
                longitude: samples
                    .map(point => Number(point.longitude))
                    .join(","),
                hourly: getGrametHourlyVariables().join(","),
                wind_speed_unit: "kn",
                timezone: "UTC",
                forecast_days: 15
            }
        });
        const forecasts = Array.isArray(response.data)
            ? response.data
            : [response.data];
        if (forecasts.length !== samples.length) {
            throw new Error("O GFS não retornou todos os pontos da rota.");
        }
        const terrainCoordinates = samples.flatMap(point => [
            point,
            destinationPoint(point, point.bearing + 90, 5),
            destinationPoint(point, point.bearing - 90, 5)
        ]);
        const terrainResponse = await grametClient.get("/elevation", {
            params: {
                latitude: terrainCoordinates
                    .map(point => Number(point.latitude))
                    .join(","),
                longitude: terrainCoordinates
                    .map(point => Number(point.longitude))
                    .join(",")
            }
        });
        const elevations = terrainResponse.data?.elevation || [];
        return samples.map((point, index) => {
            const forecast = forecasts[index];
            const routeFraction =
                totalDistance <= 0
                    ? 0
                    : point.distanceFromStart / totalDistance;
            const pointTime = new Date(
                departureTime.getTime() +
                (Number.isFinite(eetHours) ? eetHours : 0) *
                routeFraction * 3_600_000
            );
            const forecastIndex = getClosestForecastIndex(
                forecast.hourly?.time || [],
                pointTime
            );
            const profile = buildGrametProfile(
                forecast,
                forecastIndex
            );
            return {
                ident: point.ident || point.icao || null,
                type: point.type || "POINT",
                latitude: Number(point.latitude),
                longitude: Number(point.longitude),
                distanceNm: point.distanceFromStart,
                elevation: forecast.elevation ?? 0,
                terrainElevation:
                    elevations[index * 3] ??
                    forecast.elevation ??
                    0,
                corridorElevation: Math.max(
                    ...elevations.slice(index * 3, index * 3 + 3),
                    forecast.elevation ?? 0
                ),
                forecastTime: forecast.hourly?.time?.[forecastIndex] || null,
                profile,
                cloudLayers: buildCloudLayers(profile)
            };
        });
    },
    GRAMET_CACHE_TTL_MS
);
return {
    model: GRAMET_MODEL,
    generatedAt: new Date().toISOString(),
    points: data
};
}
