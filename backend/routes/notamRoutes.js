import { Router } from "express";
import { config } from "../config/index.js";
import { loadAirportNotams } from "../services/notamService.js";
export const router = Router();
router.get("/api/notams", async (req, res) => {
    const icao = String(req.query.icao || "").trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(icao)) return res.status(400).json({ message: "Informe um ICAO válido." });
    if (!config.aiswebApiKey || !config.aiswebApiPass) return res.status(503).json({ message: "Credenciais do AISWEB não configuradas no backend." });
    try { res.json(await loadAirportNotams(icao)); }
    catch { res.status(502).json({ message: "Não foi possível consultar os NOTAMs no AISWEB. Tente novamente." }); }
});
