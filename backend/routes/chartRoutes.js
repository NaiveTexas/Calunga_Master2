import { Router } from "express";
import { loadEnrcWms, loadEnrcLowIndex, loadEnrcHighIndex } from "../services/chartService.js";
export const router = Router();
router.get("/api/charts/enrc/wms", async (req, res) => {
    try {
        const response = await loadEnrcWms(req.query);
        res.setHeader(
            "Content-Type",
            response.headers["content-type"] ||
            "image/png"
        );
        res.send(
            response.data
        );
    } catch (error) {
        console.error(
            "Erro ao consultar WMS ENRC:",
            error.message
        );
        res.status(500).json({
            status: "error",
            message:
                "Erro ao consultar WMS ENRC"
        });
    }
});
router.get("/api/charts/enrc/index/low", async (req, res) => {
    try {
        res.json(await loadEnrcLowIndex());
    } catch (error) {
        console.error(
            "Erro ao consultar índice ENRC LOW:",
            error.message
        );
        res.status(500).json({
            status: "error",
            message:
                "Erro ao consultar índice ENRC LOW"
        });
    }
});
router.get(
    "/api/charts/enrc/index/high",
    async (req, res) => {
        try {
            res.json(await loadEnrcHighIndex());
        } catch (error) {
            console.error(
                "Erro ao consultar índice ENRC HIGH:",
                error.message
            );
            res.status(500).json({
                status: "error",
                message:
                    "Erro ao consultar índice ENRC HIGH"
            });
        }
    }
);
