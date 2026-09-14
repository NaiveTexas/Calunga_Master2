import { setMissionRefreshHandler } from "../core/missionEngine.js";
import { updateDashboard } from "../ui/dashboardPanel.js";
import { updateRouteHeader } from "../ui/routePanel.js";
import { updateFuelPlanningPanel } from "../ui/fuelPanel.js";
import { updateWeightPanel } from "../ui/weightPanel.js";
import { updateMissionPanel } from "../ui/schedulePanel.js";
import { refreshCrewPanel } from "../ui/crewPanel.js";
import { refreshGrametPanel } from "../ui/grametPanel.js";
import { refreshFullBriefing } from "../ui/fullBriefingPanel.js";
import { refreshWeatherLegCards } from "../ui/weatherPanel.js";

export function refreshUI() {

    updateDashboard();

    updateRouteHeader();

    updateFuelPlanningPanel();

    updateWeightPanel();
    refreshWeatherLegCards();

    updateMissionPanel();

    refreshCrewPanel();

    refreshGrametPanel();

    refreshFullBriefing();

}


export function initializeMissionController() {
    setMissionRefreshHandler(refreshUI);
}
