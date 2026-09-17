import { mission, missionLegs } from "../models/missions.js";
import { formatDate } from "../utils/helpers.js";
import { bindInput } from "./bindInput.js";
import { updateMission } from "../core/missionEngine.js";
function highlightPastDeparture() {
    const date = document.getElementById("date");
    const etd = document.getElementById("etd");
    if (!date || !etd) return;
    const departure = Date.parse(`${date.value}T${etd.value}:00Z`);
    // The inputs have minute precision: the current minute is still "now".
    const past = Boolean(date.value && etd.value) && Number.isFinite(departure) && departure < Math.floor(Date.now() / 60000) * 60000;
    for (const input of [date, etd]) {
        input.classList.toggle("departure-in-past", past);
        if (past) input.title = "ETD anterior à data e hora atuais (UTC). É permitido continuar.";
        else input.removeAttribute("title");
    }
}
function initializeCurrentUtcSchedule() {

    const departure = new Date();

    departure.setUTCMinutes(0, 0, 0);
    departure.setUTCHours(
        departure.getUTCHours() + 1
    );

    const date = departure.toISOString().slice(0, 10);
    const etd = departure.toISOString().slice(11, 16);

    mission.schedule.date = date;
    mission.schedule.etd = etd;

    document.getElementById("date").value = date;
    document.getElementById("etd").value = etd;

}

export function updateMissionPanel() {

    document.getElementById("date").value = mission.schedule.date;
    document.getElementById("etd").value = mission.schedule.etd;
    highlightPastDeparture();

    document.getElementById("eta").value =
        mission.schedule.eta;

    let arrivalDate = document.getElementById("etaDate");
    if (!arrivalDate) {
        arrivalDate = document.createElement("small");
        arrivalDate.id = "etaDate";
        document.getElementById("eta").after(arrivalDate);
    }
    arrivalDate.textContent = mission.schedule.etaDate ? `Pouso em ${formatDate(mission.schedule.etaDate)} UTC` : "Pouso pendente de rota e horário";

}


export function initializeSchedulePanel(preserveMission = false) {
    for (const id of ["date", "etd"]) {
        document.getElementById(id).addEventListener("input", highlightPastDeparture);
        document.getElementById(id).addEventListener("change", () => {
            missionLegs.active().automatic.departure = false;
        });
    }
    bindInput("date", mission.schedule, "date");
    bindInput("etd", mission.schedule, "etd");
    if (!preserveMission) initializeCurrentUtcSchedule();
    highlightPastDeparture();
    const clockCheck = setInterval(highlightPastDeparture, 15000);
    clockCheck.unref?.();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) highlightPastDeparture(); });
    document.getElementById("etdNow").addEventListener("click", () => {
        missionLegs.active().automatic.departure = false;
        const now = new Date().toISOString();
        mission.schedule.date = now.slice(0, 10);
        mission.schedule.etd = now.slice(11, 16);
        document.getElementById("date").value = mission.schedule.date;
        document.getElementById("etd").value = mission.schedule.etd;
        updateMission();
    });
}
