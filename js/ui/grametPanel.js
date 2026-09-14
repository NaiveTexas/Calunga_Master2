import {
    mission
} from "../models/missions.js";

import {
    loadGramet
} from "../services/gramet.js";

const MAX_ALTITUDE_METERS = 12_000;
const METERS_PER_FOOT = 0.3048;

let grametData = null;
let grametRequestId = 0;

function getRoutePoints() {

    return [
        mission.route.origin,
        ...mission.route.waypoints,
        mission.route.destination
    ]
        .filter(point => point?.position)
        .map(point => ({
            ident: point.ident,
            icao: point.icao,
            type: point.type,
            latitude: point.position.latitude,
            longitude: point.position.longitude
        }));

}

function getFlightLevel() {

    const value = Number.parseInt(
        String(mission.aircraft.flightLevel)
            .replace(/\D/g, ""),
        10
    );

    return Number.isFinite(value) && value > 0
        ? value
        : null;

}

function setGrametStatus(message, state = "") {

    const status = document.getElementById("grametStatus");

    if (!status) {
        return;
    }

    status.textContent = message;
    status.dataset.state = state;

}

function getPointName(point) {

    return point.ident ||
        point.icao ||
        "----";

}

function getDepartureTime() {

    const { date, etd } = mission.schedule;

    if (!date || !etd) {
        return null;
    }

    const departure = new Date(`${date}T${etd}:00Z`);

    return Number.isNaN(departure.getTime())
        ? null
        : departure;

}

function getProfileHeight(profile) {

    if (!profile) {
        return null;
    }

    if (Number.isFinite(profile.height)) {
        return profile.height;
    }

    const pressure = Number(profile.pressure);

    return Number.isFinite(pressure) && pressure > 0
        ? 44_330 * (1 - (pressure / 1013.25) ** .1903)
        : null;

}

function drawArrow(context, x, y, direction, speed) {

    if (!Number.isFinite(direction) || !Number.isFinite(speed)) {
        return;
    }

    const angle = (direction + 180) * Math.PI / 180;
    const length = 10;
    const endX = x + Math.sin(angle) * length;
    const endY = y - Math.cos(angle) * length;

    context.save();
    context.strokeStyle = "#dbeafe";
    context.fillStyle = "#dbeafe";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(endX, endY);
    context.stroke();
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(
        endX - Math.sin(angle - 0.55) * 5,
        endY + Math.cos(angle - 0.55) * 5
    );
    context.lineTo(
        endX - Math.sin(angle + 0.55) * 5,
        endY + Math.cos(angle + 0.55) * 5
    );
    context.closePath();
    context.fill();
    context.font = "9px sans-serif";
    context.fillText(`${Math.round(speed)}`, x + 7, y - 4);
    context.restore();

}

function getCloudOpacity(coverage) {

    if (coverage >= 85) {
        return .82;
    }

    if (coverage >= 50) {
        return .58;
    }

    if (coverage >= 25) {
        return .34;
    }

    return 0;

}

function drawCloudField(context, points, xAt, yAt) {

    for (let column = 0; column < points.length - 1; column++) {

        const leftLayers = points[column].cloudLayers || [];
        const rightLayers = points[column + 1].cloudLayers || [];
        const layers = Math.min(leftLayers.length, rightLayers.length);

        for (let index = 0; index < layers; index++) {

            const left = leftLayers[index];
            const right = rightLayers[index];
            const coverage = (left.coverage + right.coverage) / 2;
            const opacity = getCloudOpacity(coverage);

            if (!opacity) {
                continue;
            }

            context.beginPath();
            context.moveTo(xAt(column), yAt(left.baseMeters));
            context.lineTo(xAt(column), yAt(left.topMeters));
            context.lineTo(xAt(column + 1), yAt(right.topMeters));
            context.lineTo(xAt(column + 1), yAt(right.baseMeters));
            context.closePath();
            context.fillStyle = `rgba(248, 250, 252, ${opacity})`;
            context.fill();

        }

    }

}

function drawGramet() {

    const canvas = document.getElementById("grametCanvas");
    const wrapper = canvas?.parentElement;

    if (!canvas || !wrapper || !grametData?.points?.length) {
        return;
    }

    const width = Math.max(wrapper.clientWidth, 320);
    const height = 610;
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    context.clearRect(0, 0, width, height);

    const plot = {
        left: 48,
        top: 70,
        right: width - 42,
        bottom: height - 105
    };
    const plotWidth = plot.right - plot.left;
    const plotHeight = plot.bottom - plot.top;
    const points = grametData.points;
    const xAt = index => points.length === 1
        ? plot.left + plotWidth / 2
        : plot.left + (plotWidth * index / (points.length - 1));
    const yAt = altitude =>
        plot.bottom -
        (Math.max(0, Math.min(MAX_ALTITUDE_METERS, altitude)) /
        MAX_ALTITUDE_METERS) * plotHeight;
    const sampleWidth = points.length > 1
        ? plotWidth / (points.length - 1)
        : plotWidth;

    context.fillStyle = "#e2e8f0";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#fde047";
    context.fillRect(0, 0, width, 52);
    context.strokeStyle = "#a16207";
    context.strokeRect(0, 0, width, 52);
    context.textAlign = "center";
    context.fillStyle = "#1f2937";
    context.font = "bold 11px sans-serif";
    const routeTitle = points.map(getPointName).join(" → ");
    context.fillText(`GRAMET DA ROTA ${routeTitle}`, width / 2, 18);
    context.font = "10px sans-serif";
    context.fillText(
        `${grametData.model}  |  FL${String(getFlightLevel() || 0).padStart(3, "0")}`,
        width / 2,
        35
    );

    const sky = context.createLinearGradient(0, plot.top, 0, plot.bottom);
    sky.addColorStop(0, "#075b9e");
    sky.addColorStop(.58, "#1384c4");
    sky.addColorStop(1, "#cceeff");
    context.fillStyle = sky;
    context.fillRect(plot.left, plot.top, plotWidth, plotHeight);

    context.font = "11px sans-serif";
    context.textAlign = "right";

    for (let flightLevel = 0; flightLevel <= 400; flightLevel += 50) {

        const altitude = flightLevel * 100 * METERS_PER_FOOT;
        const y = yAt(altitude);

        context.strokeStyle = "rgba(254, 240, 138, .72)";
        context.lineWidth = 1;
        context.setLineDash([2, 4]);
        context.beginPath();
        context.moveTo(plot.left, y);
        context.lineTo(plot.right, y);
        context.stroke();

        context.setLineDash([]);
        context.fillStyle = "#1e3a5f";
        context.fillText(`FL${String(flightLevel).padStart(3, "0")}`, plot.left - 8, y + 4);
        context.textAlign = "left";
        context.fillText(String(flightLevel), plot.right + 7, y + 4);
        context.textAlign = "right";

    }

    points.forEach((point, index) => {

        const x = xAt(index);
        context.strokeStyle = "rgba(254, 240, 138, .45)";
        context.setLineDash([2, 4]);
        context.beginPath();
        context.moveTo(x, plot.top);
        context.lineTo(x, plot.bottom);
        context.stroke();
        context.setLineDash([]);

    });

    context.save();
    context.beginPath();
    context.rect(plot.left, plot.top, plotWidth, plotHeight);
    context.clip();

    drawCloudField(context, points, xAt, yAt);

    points.forEach((point, pointIndex) => {

        const x = xAt(pointIndex);
        const profile = [...point.profile]
            .sort((a, b) => getProfileHeight(a) - getProfileHeight(b));

        profile.forEach((level, index) => {

            const currentHeight = getProfileHeight(level);
            const nextHeight =
                getProfileHeight(profile[index + 1]) ??
                MAX_ALTITUDE_METERS;
            const top = yAt(nextHeight);
            const bottom = yAt(currentHeight);
            const temperature = Number(level.temperature);
            const humidity = Number(level.humidity) || 0;
            const cloudCover = Number(level.cloudCover) || 0;

            if (
                temperature >= -14 &&
                temperature <= 0 &&
                humidity >= 80 &&
                cloudCover >= 50
            ) {
                context.fillStyle = "rgba(249, 115, 22, .72)";
                context.fillRect(x - sampleWidth / 2, top, sampleWidth, 3);
                context.fillRect(x - sampleWidth / 2, bottom - 3, sampleWidth, 3);
            }

            if (index % 4 === 0) {
                drawArrow(
                    context,
                    x,
                    (top + bottom) / 2,
                    Number(level.windDirection),
                    Number(level.windSpeed)
                );
            }

        });

    });

    context.restore();

    context.beginPath();
    context.moveTo(xAt(0), plot.bottom);
    points.forEach((point, index) => {
        context.lineTo(
            xAt(index),
            yAt(Number(point.corridorElevation ?? point.elevation) || 0)
        );
    });
    context.lineTo(xAt(points.length - 1), plot.bottom);
    context.closePath();
    context.fillStyle = "#eef1bd";
    context.fill();

    context.beginPath();
    context.moveTo(xAt(0), plot.bottom);
    points.forEach((point, index) => {
        context.lineTo(
            xAt(index),
            yAt(Number(point.terrainElevation ?? point.elevation) || 0)
        );
    });
    context.lineTo(xAt(points.length - 1), plot.bottom);
    context.closePath();
    context.fillStyle = "#d6d58b";
    context.fill();

    context.beginPath();
    points.forEach((point, index) => {
        const terrainY = yAt(
            Number(point.terrainElevation ?? point.elevation) || 0
        );

        if (index === 0) context.moveTo(xAt(index), terrainY);
        else context.lineTo(xAt(index), terrainY);
    });
    context.strokeStyle = "#6b7a30";
    context.lineWidth = 2;
    context.stroke();

    const flightLevel = getFlightLevel();

    if (flightLevel) {

        const y = yAt(flightLevel * 100 * METERS_PER_FOOT);
        context.strokeStyle = "#fef08a";
        context.lineWidth = 2;
        context.setLineDash([7, 4]);
        context.beginPath();
        context.moveTo(plot.left, y);
        context.lineTo(plot.right, y);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = "#7c2d12";
        context.fillRect(plot.left + 4, y - 17, 48, 14);
        context.fillStyle = "#ffffff";
        context.textAlign = "left";
        context.font = "bold 10px sans-serif";
        context.fillText(`FL${flightLevel}`, plot.left + 8, y - 7);

    }

    context.textAlign = "center";
    points.forEach((point, index) => {
        const x = xAt(index);

        if (point.ident && (index === 0 || index === points.length - 1 || index % 3 === 0)) {
            context.fillStyle = "#1e293b";
            context.font = "bold 11px sans-serif";
            context.fillText(getPointName(point), x, plot.bottom + 24);
        }

        context.fillStyle = "#475569";
        context.font = "10px sans-serif";
        const hour = point.forecastTime?.slice(11, 16);

        if (index === 0 || index === points.length - 1 || index % 3 === 0) {
            context.fillText(hour ? `${hour}Z` : "", x, plot.bottom + 40);
        }
    });

    context.textAlign = "left";
    context.fillStyle = "#334155";
    context.font = "11px sans-serif";
    context.fillText("Nuvens", plot.left, height - 26);
    context.fillStyle = "#f8fafc";
    context.fillRect(plot.left + 48, height - 35, 14, 10);
    context.fillStyle = "#334155";
    context.fillText("Possível gelo", plot.left + 76, height - 26);
    context.fillStyle = "#f97316";
    context.fillRect(plot.left + 157, height - 35, 14, 10);

}

export function refreshGrametPanel() {

    const route = getRoutePoints();
    const routeElement = document.getElementById("grametRoute");
    const levelElement = document.getElementById("grametFlightLevel");
    const flightLevel = getFlightLevel();

    if (routeElement) {
        routeElement.textContent = route.length
            ? route.map(getPointName).join(" → ")
            : "---";
    }

    if (levelElement) {
        levelElement.textContent = flightLevel
            ? `FL${flightLevel}`
            : "Não definido";
    }

}

async function updateGramet() {

    const routePoints = getRoutePoints();
    const departure = getDepartureTime();

    if (routePoints.length < 2) {
        setGrametStatus("Defina origem e destino válidos.", "error");
        return;
    }

    if (!departure) {
        setGrametStatus("Defina data e hora UTC de partida.", "error");
        return;
    }

    const requestId = ++grametRequestId;
    setGrametStatus("Consultando modelo e montando o corte vertical…", "loading");

    try {

        grametData = await loadGramet({
            routePoints,
            departureTime: departure.toISOString(),
            eetHours: mission.schedule.eet
        });

        if (requestId !== grametRequestId) {
            return;
        }

        drawGramet();
        setGrametStatus(`Atualizado com ${grametData.model}.`, "success");

    } catch (error) {

        if (requestId !== grametRequestId) {
            return;
        }

        setGrametStatus(error.message, "error");

    }

}

export function initializeGrametPanel() {

    document.getElementById("updateGramet")?.addEventListener(
        "click",
        updateGramet
    );

    window.addEventListener("resize", () => {
        drawGramet();
    });

    refreshGrametPanel();

}
