import { Router } from "express";

export const router = Router();

router.get("/", (req, res) => {

    res.send("Calunga Backend funcionando!");

});

router.get("/api/test", (req, res) => {

    res.json({
        status: "ok",
        message: "API do Calunga funcionando!"
    });

});
