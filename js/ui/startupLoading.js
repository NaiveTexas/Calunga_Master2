export function startupMessage(message) {
    document.getElementById("startupMessage").textContent = message;
}

export function finishStartup() {
    document.querySelector(".app").inert = false;
    document.getElementById("startupLoading").remove();
}

export function failStartup() {
    startupMessage("Não foi possível preparar o aplicativo e as cartas. Verifique a conexão e tente novamente.");
    document.getElementById("startupLoading").classList.add("startup-error");
    const retry = document.getElementById("startupRetry");
    retry.hidden = false;
    retry.onclick = () => window.location.reload();
    retry.focus();
}
