import { loadNavigationFixes, loadNavigationVORs } from "./database/navigation.js";
import { loadAirports } from "./database/airports.js";
import { updateFuelPlanning } from "./core/fuelEngine.js";
import { initializeMissionController } from "./controllers/missionController.js";
import { updateMission } from "./core/missionEngine.js";
import { initializeAircraftPanel } from "./ui/aircraftPanel.js";
import { initializeSchedulePanel } from "./ui/schedulePanel.js";
import { initializeFuelPanel } from "./ui/fuelPanel.js";
import { initializeCrewPanel } from "./ui/crewPanel.js";
import { initializeRoutePanel } from "./ui/routePanel.js";
import { initializeBriefingNavigation } from "./ui/briefingNavigation.js";
import { initializeNavigation } from "./ui/navigation.js";
import { initializeWeatherPanel, updateWeatherBriefing } from "./ui/weatherPanel.js";
import { initializeGrametPanel } from "./ui/grametPanel.js";
import { initializeIcons } from "./ui/icons.js";
import { showAppStatus, hideAppStatus } from "./ui/appStatus.js";
import "../map/engine/openLayersMap.js";
import { recoverDraft, initializeMissionStoragePanel } from "./ui/missionStoragePanel.js";

async function initializeApp() {
    showAppStatus("Carregando dados de navegação…");
    initializeMissionController();
    try {
        await Promise.all([loadNavigationFixes(), loadAirports(), loadNavigationVORs()]);
        const recovered = recoverDraft();
        initializeSchedulePanel(recovered);
        initializeAircraftPanel(recovered);
        updateFuelPlanning();
        initializeCrewPanel();

        initializeRoutePanel();
        initializeBriefingNavigation();
        initializeNavigation();
        initializeWeatherPanel();
        initializeGrametPanel();
        initializeIcons();
        initializeFuelPanel();
        updateMission({ routeChanged: true });
        initializeMissionStoragePanel();
        updateWeatherBriefing();
        hideAppStatus();
    } catch (error) {
        console.error("Erro ao inicializar o Calunga:", error);
        showAppStatus(
            "Não foi possível carregar os dados de navegação. Verifique se o backend está ativo e tente novamente.",
            "error"
        );
    }
}

initializeApp();
