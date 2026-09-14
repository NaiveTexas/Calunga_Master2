import { mission } from "../models/missions.js";
import { aircraftFuelUnit } from "../core/fuelUnits.js";
import { restoreAutomaticFuelPlanning } from "../core/fuelEngine.js";
import { updateMission } from "../core/missionEngine.js";
import { createLegCards } from "./legCards.js";

let renderCards;
const fuelText = value => Math.round(value).toLocaleString("pt-BR") + " " + aircraftFuelUnit(mission.aircraft.model);

export function updateFuelPlanningPanel() {
    updateFuelUnitSelector();
    if (!renderCards) return;
    renderCards((leg, { field, subtitle, body }, index) => {
        const unit = aircraftFuelUnit(mission.aircraft.model);
        body.querySelectorAll(".stepper-unit").forEach(label => { label.textContent = unit; });
        field("legFuelConnection").querySelector('label[for]').textContent = `Abastecimento na escala (${unit})`;
        subtitle.textContent = "Combustível Mínimo: " + fuelText(leg.fuel.total) + " · A bordo: " + fuelText(leg.fuel.onboard);
        for (const [id, property] of [["flightFuel", "flight"], ["alternateFuel", "alternate"], ["totalFuel", "total"], ["legLandingFuel", "arrival"]]) {
            field(id).textContent = fuelText(leg.fuel[property]);
        }
        for (const [id, property] of [["taxiFuel", "taxi"], ["procedureFuel", "procedure"], ["reserveFuel", "reserve"], ["extraFuel", "extra"], ["fuelOnBoard", "onboard"]]) {
            field(id).querySelector(".stepper-value").textContent = Math.round(leg.fuel[property]);
        }
        field("legFuelConnection").hidden = index === 0;
        field("linkPreviousFuel").checked = leg.automatic.fuel;
        field("legRefuel").value = leg.refuel;
        field("legRefuel").disabled = !leg.automatic.fuel;
        field("enrouteProcedureFuel").textContent = fuelText(leg.fuel.enrouteProcedure);
        field("enrouteProcedureFuel").parentElement.hidden = !leg.schedule.procedureEet;
    });
}

export function updateFuelUnitSelector() {
    const unit = aircraftFuelUnit(mission.aircraft.model);
    mission.settings.fuelUnit = unit;
    const selector = document.querySelector(".fuel-unit-selector");
    if (selector) selector.textContent = `Combustível em ${unit} · unidade da aeronave`;
}

function bindFuelCard(leg, { field }) {
    field("restoreAutomaticFuel").addEventListener("click", () => {
        restoreAutomaticFuelPlanning({ ...leg, aircraft: mission.aircraft });
        updateMission();
    });
    const controls = [
        ["taxiFuel", "taxi", 10, 1000],
        ["procedureFuel", "procedure", 10, 500],
        ["reserveFuel", "reserve", 10, 1000],
        ["extraFuel", "extra", 10, 1000],
        ["fuelOnBoard", "onboard", 100, 5000]
    ];
    for (const [id, property, step, max] of controls) {
        for (const [selector, sign] of [[".stepper-minus", -1], [".stepper-plus", 1]]) {
            const button = field(id).querySelector(selector);
            button.type = "button";
            button.setAttribute("aria-label", (sign > 0 ? "Aumentar " : "Diminuir ") + field(id).parentElement.querySelector(".field-label").textContent.trim());
            button.addEventListener("click", () => {
                const value = leg.fuel[property] + sign * step;
                const limit = property === "onboard" ? (mission.aircraft.model.maxFuel || max) : max;
                if (value < 0 || value > limit) return;
                leg.fuel[property] = value;
                if (property in leg.fuel.manual) leg.fuel.manual[property] = true;
                if (property === "onboard") leg.automatic.fuel = false;
                updateMission();
            });
        }
    }
    field("linkPreviousFuel").addEventListener("change", event => {
        leg.automatic.fuel = event.target.checked;
        updateMission();
    });
    field("legRefuel").addEventListener("change", event => {
        const value = Number(event.target.value);
        if (Number.isFinite(value) && value >= 0) leg.refuel = value;
        else event.target.value = leg.refuel;
        updateMission();
    });
}

export function initializeFuelPanel() {
    if (renderCards) return;
    const procedureRow = document.createElement("div");
    procedureRow.className = "field enroute-procedure-fuel";
    procedureRow.innerHTML = '<span class="field-label">Procedimentos em rota</span><span id="enrouteProcedureFuel"></span>';
    document.getElementById("totalFuel").parentElement.before(procedureRow);
    const connection = document.createElement("div");
    connection.id = "legFuelConnection";
    connection.className = "leg-fuel-connection";
    connection.innerHTML = '<label><input id="linkPreviousFuel" type="checkbox"> Usar saldo da perna anterior</label><label for="legRefuel">Abastecimento na escala (LB)</label><input id="legRefuel" class="field-control" type="number" min="0" step="100" value="0">';
    document.getElementById("fuelPanel").append(connection);
    renderCards = createLegCards("fuelPanel", "h2, .fuel-unit-selector", bindFuelCard);
    updateFuelUnitSelector();
    updateFuelPlanningPanel();
}
