import { Router } from "express";
import { loadFixes, loadAirports, loadVors, loadTerminals, loadFirSectors } from "../services/navigationService.js";
export const router = Router();
router.get("/api/navigation/fir-sectors", async (req, res) => {
    try { res.json(await loadFirSectors()); }
    catch { res.status(502).json({ message: "Não foi possível consultar as divisas dos setores de FIR." }); }
});
router.get("/api/navigation/terminals", async (req, res) => {
    try { res.json(await loadTerminals()); }
    catch { res.status(502).json({ message: "Não foi possível consultar os limites das TMA." }); }
});
router.get("/api/navigation/fixes", async (req, res) => {
    try {
        res.json(await loadFixes());
    } catch (error) {
        console.error(
            "Erro ao consultar FIXs:",
            error.message
        );
        res.status(500).json({
            status: "error",
            message:
                "Erro ao consultar FIXs"
        });
    }
});
router.get("/api/navigation/airports", async (req, res) => {
    try {
        res.json(await loadAirports());
    } catch (error) {
        console.error(
            "Erro ao consultar aeródromos:",
            error.message
        );
        res.status(500).json({
            status: "error",
            message: "Erro ao consultar aeródromos"
        });
    }
});
router.get("/api/navigation/vors", async (req, res) => {
    try {
        res.json(await loadVors());
    } catch (error) {
        console.error(
            "Erro ao consultar VORs:",
            error.message
        );
        res.status(500).json({
            status: "error",
            message:
                "Erro ao consultar VORs"
        });
    }
});
