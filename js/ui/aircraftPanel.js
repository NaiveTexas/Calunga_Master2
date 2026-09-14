import { mission } from "../models/missions.js";
import { aircraftFuelUnit, convertMissionFuel } from "../core/fuelUnits.js";

import { getAircraftModel, getAircraftModelNames } from "../database/aircraftModels.js";
import { getAircraftRegistration, getAircraftRegistrationNameList } from "../database/aircraftRegistrations.js";
import { updateMissionField } from "../core/missionEngine.js";
import { updateFuelUnitSelector } from "./fuelPanel.js";
import { bindInput } from "./bindInput.js";
const FLIGHT_LEVELS = Array.from({ length: 41 }, (_, index) => (index + 5) * 10);

function initializeFlightLevelSelector() {

    const selector = document.getElementById("flightLevel");

    if (!selector) {
        return;
    }

    const initialValue =
        mission.aircraft.flightLevel ||
        selector.value ||
        "FL100";

    selector.replaceChildren(
        ...FLIGHT_LEVELS.map(level => {

            const option = document.createElement("option");
            const value = `FL${String(level).padStart(3, "0")}`;

            option.value = value;
            option.textContent = value;

            return option;

        })
    );

    selector.value = FLIGHT_LEVELS.includes(
        Number.parseInt(
            String(initialValue).replace(/\D/g, ""),
            10
        )
    )
        ? initialValue
        : "FL100";

    mission.aircraft.flightLevel = selector.value;

}

function loadAircraftRegistrations(model) {

    const select = document.getElementById("registration");

    select.innerHTML = "";

    getAircraftRegistrationNameList(model).forEach(registration => {

        const option = document.createElement("option");

        option.value = registration;
        option.textContent = registration;

        select.appendChild(option);

    });

}

function updateAircraftRegistrations(modelName) {
    const model = getAircraftModel(modelName);
    if (!model || model.planningAvailable === false) return;
    convertMissionFuel(mission, aircraftFuelUnit(mission.aircraft.model), aircraftFuelUnit(model));
    mission.aircraft.model = model;
    mission.settings.fuelUnit = aircraftFuelUnit(model);

    loadAircraftRegistrations(modelName);

    updateFuelUnitSelector();

    updateAircraft();
}

function loadAircraftModels() {
    const cards = document.getElementById("aircraftCards");
    cards.replaceChildren();
    getAircraftModelNames().forEach((name, index) => {
        const model = getAircraftModel(name);
        const label = document.createElement("label");
        label.className = "aircraft-choice";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "aircraft-model";
        input.value = name;
        input.disabled = model.planningAvailable === false;
        input.checked = index === 0;
        const selectModel = () => {
            if (input.disabled || !input.checked) return;
            if (mission.aircraft.model.name !== name) updateAircraftRegistrations(name);
            const gallery = document.getElementById("aircraftGallery");
            gallery.open = false;
            gallery.querySelector("summary")?.focus();
        };
        input.addEventListener("change", selectModel);
        // Clicking the already selected model also closes the picker.
        input.addEventListener("click", selectModel);

        const card = document.createElement("span");
        card.className = "aircraft-card";
        const image = document.createElement("img");
        image.src = model.image;
        image.alt = "";
        image.className = "aircraft-card-image";
        image.decoding = "async";

        const title = document.createElement("strong");
        title.textContent = model.name;
        const description = document.createElement("span");
        description.className = "aircraft-card-description";
        description.textContent = model.description;

        card.append(image, title, description);
        if (input.disabled) {
            const status = document.createElement("span");
            status.className = "aircraft-card-status";
            status.textContent = "Dados em breve";
            card.appendChild(status);
            label.title = "Dados da aeronave ainda não cadastrados";
        }
        label.append(input, card);
        cards.appendChild(label);
    });
}

function updateAircraft() {

    const registration = getAircraftRegistration(
        document.getElementById("registration").value
    );

    updateMissionField(
        {
            target: mission.aircraft,
            property: "registration"
        },
        registration
    );

    const model = mission.aircraft.model;
    document.getElementById("selectedAircraftImage").src = model.image;
    document.getElementById("selectedAircraftModel").textContent = `${model.name} — ${model.description}`;
    document.getElementById("selectedAircraftRegistration").textContent = registration?.registration || "Selecione uma matrícula";

}


export function initializeAircraftPanel(preserveMission = false) {
    bindInput("flightLevel", mission.aircraft, "flightLevel");
    document.getElementById("registration").addEventListener("change", updateAircraft);
    initializeFlightLevelSelector();
    loadAircraftModels();
    if (preserveMission) {
        loadAircraftRegistrations(mission.aircraft.model.name);
        document.getElementById("registration").value = mission.aircraft.registration.registration;
        document.querySelectorAll('input[name="aircraft-model"]').forEach(input => {
            input.checked = input.value === mission.aircraft.model.name;
        });
        updateFuelUnitSelector();
        updateAircraft();
    } else {
        updateAircraftRegistrations(getAircraftModelNames()[0]);
    }
}
