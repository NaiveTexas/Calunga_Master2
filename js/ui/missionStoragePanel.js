import { DRAFT_KEY, serializeMission, parseMission, restoreMission } from "../core/missionStorage.js";

let blocked = false;
let initialMessage = "";
export function recoverDraft() {
    try {
        const text = localStorage.getItem(DRAFT_KEY);
        if (!text) return false;
        restoreMission(parseMission(text));
        initialMessage = "Missão recuperada neste navegador.";
        return true;
    } catch (error) {
        blocked = true;
        initialMessage = "Não foi possível recuperar o rascunho. Ele foi preservado. Exporte seus dados ou inicie uma nova missão.";
        return false;
    }
}

export function initializeMissionStoragePanel() {
    const panel = document.createElement("div");
    panel.className = "mission-storage";
    const actions = document.createElement("div");
    const status = document.createElement("small");
    status.setAttribute("role", "status");
    const report = message => { if (status.textContent !== message) status.textContent = message; };
    let timer;
    const save = () => {
        clearTimeout(timer);
        if (blocked) return false;
        try {
            const text = serializeMission();
            parseMission(text);
            localStorage.setItem(DRAFT_KEY, text);
            report("Salvo neste navegador");
            return true;
        } catch (error) {
            report("Não foi possível salvar. Confira os campos e exporte uma cópia.");
            return false;
        }
    };
    const scheduleSave = () => {
        if (blocked) return;
        clearTimeout(timer);
        timer = setTimeout(save, 300);
    };
    function button(label, handler) {
        const element = document.createElement("button");
        element.type = "button";
        element.textContent = label;
        element.addEventListener("click", handler);
        actions.append(element);
    }
    button("Exportar missão", () => {
        try {
            const text = serializeMission();
            parseMission(text);
            const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = `calunga-missao-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            report("Arquivo da missão exportado.");
        } catch (error) { report(`Não foi possível exportar: ${error.message}`); }
    });
    const file = document.createElement("input");
    file.type = "file";
    file.accept = ".json,application/json";
    file.hidden = true;
    button("Importar missão", () => file.click());
    file.addEventListener("change", async () => {
        const selected = file.files?.[0];
        file.value = "";
        if (!selected) return;
        try {
            if (selected.size > 5_000_000) throw new Error("Arquivo maior que 5 MB.");
            const text = await selected.text();
            parseMission(text);
            if (!window.confirm("Substituir a missão atual pela missão deste arquivo? Exporte a atual antes se quiser guardá-la.")) return;
            clearTimeout(timer);
            localStorage.setItem(DRAFT_KEY, text);
            blocked = true;
            window.location.reload();
        } catch (error) { report(`Importação não realizada: ${error.message}`); }
    });
    button("Nova missão", () => {
        if (!window.confirm("Iniciar uma nova missão e apagar o rascunho deste navegador? Os arquivos exportados serão mantidos.")) return;
        try {
            clearTimeout(timer);
            localStorage.removeItem(DRAFT_KEY);
            blocked = true;
            window.location.reload();
        } catch (error) { report("Não foi possível apagar o rascunho neste navegador."); }
    });
    panel.append(actions, status, file);
    document.getElementById("briefingPanel").prepend(panel);
    window.addEventListener("mission-updated", scheduleSave);
    // Some descriptive fields update the model without running the calculation engine.
    document.addEventListener("input", scheduleSave);
    document.addEventListener("change", scheduleSave);
    document.addEventListener("click", scheduleSave);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });
    if (!blocked) save();
    if (initialMessage) report(initialMessage);
}
