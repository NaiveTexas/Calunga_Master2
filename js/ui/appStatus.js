export function showAppStatus(message, type = "loading") {

    const status = document.getElementById("appStatus");

    status.textContent = message;
    status.dataset.state = type;
    status.hidden = false;

}

export function hideAppStatus() {

    document.getElementById("appStatus").hidden = true;

}
