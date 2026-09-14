import { Router } from "express";
import { config } from "../config/index.js";
import { loadWeatherBriefing } from "../services/weatherService.js";
import { loadGramet } from "../services/grametService.js";
export const router = Router();
router.get("/api/weather/briefing", async (req, res) => {
    const airports = String(req.query.airports || "")
        .split(",")
        .map(icao => icao.trim().toUpperCase())
        .filter(icao => /^[A-Z]{4}$/.test(icao));
    const uniqueAirports = [...new Set(airports)];
    if (uniqueAirports.length === 0) {
        return res.status(400).json({
            status: "error",
            message: "Informe ao menos um ICAO válido."
        });
    }
    if (!config.redemetApiKey) {
        return res.status(503).json({
            status: "error",
            message: "REDEMET_API_KEY não configurada no backend."
        });
    }
    try {
        res.json(await loadWeatherBriefing(uniqueAirports));
    } catch (error) {
        console.error(
            "Erro ao consultar METAR/TAF:",
            error.message
        );
        res.status(502).json({
            status: "error",
            message: "Não foi possível consultar a REDEMET."
        });
    }
});
router.post("/api/weather/gramet", async (req, res) => {
    const routePoints = Array.isArray(req.body?.routePoints)
        ? req.body.routePoints
        : [];
    const departureTime = new Date(req.body?.departureTime);
    const eetHours = Number(req.body?.eetHours);
    const validRoutePoints = routePoints
        .filter(point =>
            Number.isFinite(Number(point?.latitude)) &&
            Number.isFinite(Number(point?.longitude))
        )
        .slice(0, 12);
    if (validRoutePoints.length < 2) {
        return res.status(400).json({
            status: "error",
            message: "Informe origem e destino válidos para gerar o GRAMET."
        });
    }
    if (Number.isNaN(departureTime.getTime())) {
        return res.status(400).json({
            status: "error",
            message: "Defina data e hora UTC de partida para gerar o GRAMET."
        });
    }
    const now = new Date();
    const forecastLimit = new Date(now);
    forecastLimit.setUTCDate(forecastLimit.getUTCDate() + 15);
    if (departureTime < now || departureTime > forecastLimit) {
        return res.status(400).json({
            status: "error",
            message: "O GRAMET está disponível para partidas entre agora e os próximos 15 dias."
        });
    }
    try {
        res.json(await loadGramet(validRoutePoints, departureTime, eetHours));
    } catch (error) {
        const providerMessage =
            error.response?.data?.reason ||
            error.response?.data?.error ||
            error.message;
        console.error("Erro ao gerar GRAMET:", providerMessage);
        res.status(error.response?.status === 400 ? 400 : 502).json({
            status: "error",
            message:
                `Não foi possível consultar o modelo GFS: ${providerMessage}`
        });
    }
});
