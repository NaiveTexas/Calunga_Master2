import { app } from "./app.js";
import { config } from "./config/index.js";

app.listen(config.port, error => {
    if (error) {
        console.error(error.code === "EADDRINUSE"
            ? `A porta ${config.port} já está em uso por outro processo. Encerre o servidor anterior antes de iniciar novamente.`
            : `Não foi possível iniciar o servidor: ${error.message}`);
        process.exitCode = 1;
        return;
    }
    console.log(`Servidor rodando em http://localhost:${config.port}`);
});
