import { Router } from "express";
import { loadFixes, loadAirports, loadVors } from "../services/navigationService.js";
export const router = Router();
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
