import { timingSafeEqual, createHash } from "node:crypto";
const digest = value => createHash("sha256").update(value).digest();
export function testAccess(req, res, next) {
    const password = process.env.TEST_ACCESS_PASSWORD;
    if (!password) {
        if (process.env.NODE_ENV === "production") return res.status(503).send("Acesso de testes não configurado.");
        return next();
    }
    const auth = req.headers.authorization || "";
    const value = auth.startsWith("Basic ") ? Buffer.from(auth.slice(6), "base64").toString("utf8") : "";
    const expected = `${process.env.TEST_ACCESS_USER || "testador"}:${password}`;
    if (!timingSafeEqual(digest(value), digest(expected))) {
        res.set("WWW-Authenticate", 'Basic realm="Calunga testes", charset="UTF-8"');
        return res.status(401).send("Informe o acesso de testes.");
    }
    res.set("Cache-Control", "private, no-store");
    next();
}

// Global budget per process: not affected by forged proxy/IP headers.
export function createApiLimit(limit = 600) {
    let start = Date.now(), count = 0;
    return (req, res, next) => {
        if (Date.now() - start >= 60000) { start = Date.now(); count = 0; }
        if (++count > limit) {
            res.set("Retry-After", String(Math.max(1, Math.ceil((start + 60000 - Date.now()) / 1000))));
            return res.status(429).json({ message: "Limite temporário de consultas. Aguarde um minuto." });
        }
        next();
    };
}
