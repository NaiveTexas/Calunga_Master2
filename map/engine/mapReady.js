// Subscribe before the first render: cached images may finish immediately.
export function waitForMapReady(map, sources, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        const cleanup = () => {
            clearTimeout(timer);
            map.un("rendercomplete", complete);
            sources.forEach(source => source.un("tileloaderror", failed));
        };
        const complete = () => { cleanup(); resolve(); };
        const failed = () => {
            cleanup();
            reject(new Error("Não foi possível carregar uma imagem do mapa. Tente novamente."));
        };
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error("O carregamento do mapa demorou demais. Verifique a conexão e tente novamente."));
        }, timeoutMs);
        map.on("rendercomplete", complete);
        sources.forEach(source => source.on("tileloaderror", failed));
        map.render();
    });
}
