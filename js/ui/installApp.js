// No offline cache: navigation and operational data continue to use the server.
export function initializeInstallApp() {
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) return;
    let pending;
    const button = document.createElement("button");
    button.type = "button"; button.className = "install-app"; button.textContent = "Instalar Calunga"; button.hidden = true;
    document.body.append(button);
    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault(); pending = event; button.hidden = false;
    });
    button.addEventListener("click", async () => {
        if (!pending) return;
        const prompt = pending; pending = null; button.hidden = true;
        try { await prompt.prompt(); await prompt.userChoice; }
        catch { /* Installation remains available through the browser menu. */ }
    });
    window.addEventListener("appinstalled", () => { pending = null; button.remove(); });
}
