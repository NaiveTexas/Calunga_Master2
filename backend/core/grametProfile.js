import { GRAMET_PRESSURE_LEVELS, GRAMET_SAMPLE_SPACING_NM, GRAMET_MAX_SAMPLES } from "../config/index.js";
import { getDistanceNm, getBearing, interpolateGreatCircle } from "./geo.js";
export function getGrametHourlyVariables() {

    return GRAMET_PRESSURE_LEVELS.flatMap(level => [
        `temperature_${level}hPa`,
        `relative_humidity_${level}hPa`,
        `cloud_cover_${level}hPa`,
        `wind_speed_${level}hPa`,
        `wind_direction_${level}hPa`,
        `geopotential_height_${level}hPa`
    ]);

}

export function getClosestForecastIndex(times, targetTime) {

    const target = targetTime.getTime();
    let closestIndex = 0;
    let smallestDifference = Number.POSITIVE_INFINITY;

    times.forEach((time, index) => {

        const difference = Math.abs(
            new Date(`${time}Z`).getTime() - target
        );

        if (difference < smallestDifference) {
            smallestDifference = difference;
            closestIndex = index;
        }

    });

    return closestIndex;

}

export function buildGrametSamples(points) {

    const legs = points.slice(0, -1).map((point, index) => ({
        from: point,
        to: points[index + 1],
        distance: getDistanceNm(point, points[index + 1])
    }));
    const totalDistance = legs.reduce((total, leg) => total + leg.distance, 0);
    const spacing = Math.max(
        GRAMET_SAMPLE_SPACING_NM,
        totalDistance / (GRAMET_MAX_SAMPLES - 1)
    );
    const samples = [];
    let distanceFromStart = 0;

    legs.forEach((leg, legIndex) => {

        const steps = Math.max(1, Math.ceil(leg.distance / spacing));
        const bearing = getBearing(leg.from, leg.to);

        for (let step = legIndex === 0 ? 0 : 1; step <= steps; step++) {
            const fraction = step / steps;
            const position = interpolateGreatCircle(
                leg.from,
                leg.to,
                fraction
            );

            samples.push({
                ident: step === 0 ? leg.from.ident || leg.from.icao : step === steps ? leg.to.ident || leg.to.icao : null,
                type: step === 0 ? leg.from.type : step === steps ? leg.to.type : "SAMPLE",
                latitude: position.latitude,
                longitude: position.longitude,
                bearing,
                distanceFromStart: distanceFromStart + leg.distance * fraction
            });
        }

        distanceFromStart += leg.distance;

    });

    return { samples, totalDistance };

}

export function buildGrametProfile(data, forecastIndex) {

    const hourly = data.hourly || {};

    return GRAMET_PRESSURE_LEVELS.map(pressure => ({
        pressure,
        height: hourly[`geopotential_height_${pressure}hPa`]?.[forecastIndex] ?? null,
        temperature: hourly[`temperature_${pressure}hPa`]?.[forecastIndex] ?? null,
        humidity: hourly[`relative_humidity_${pressure}hPa`]?.[forecastIndex] ?? null,
        cloudCover: hourly[`cloud_cover_${pressure}hPa`]?.[forecastIndex] ?? null,
        windSpeed: hourly[`wind_speed_${pressure}hPa`]?.[forecastIndex] ?? null,
        windDirection: hourly[`wind_direction_${pressure}hPa`]?.[forecastIndex] ?? null
    }));

}

export function buildCloudLayers(profile) {

    const layers = [];
    let layer = null;

    profile.forEach((level, index) => {

        const coverage = Number(level.cloudCover) || 0;
        const height = Number(level.height);

        if (coverage < 25 || !Number.isFinite(height)) {
            if (layer) layers.push(layer);
            layer = null;
            return;
        }

        if (!layer) {
            layer = { baseMeters: height, topMeters: height, coverage: 0, samples: 0 };
        }

        layer.topMeters = height;
        layer.coverage += coverage;
        layer.samples += 1;

        if (index === profile.length - 1) layers.push(layer);

    });

    return layers.map(layer => {
        const coverage = Math.round(layer.coverage / layer.samples);

        return {
            baseMeters: layer.baseMeters,
            topMeters: layer.topMeters,
            coverage,
            classification: coverage >= 85 ? "OVC" : coverage >= 50 ? "BKN" : "SCT",
            type: "LAYER"
        };
    });

}
