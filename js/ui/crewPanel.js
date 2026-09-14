import {
    mission
} from "../models/missions.js";

import {
    updateMission
} from "../core/missionEngine.js";

const crewRoles = [

    "1P",

    "2P",

    "MC",

    "NV",

    "IN NV",

    "IC",

    "ML",

    "IL"

];

function createCrewRow(crewMember, index) {
    const row = document.createElement("div");

    const requiredRoles = ["1P", "2P", "MC"];

    row.className = "crew-row";

    row.appendChild(createRoleSelect(crewMember));
    row.appendChild(createWeightInput(crewMember));

    if (!requiredRoles.includes(crewMember.role)) {
        row.appendChild(createRemoveButton(index));
    }

    return row;
}

export function refreshCrewPanel() {

    const panel = document.getElementById("crewPanel");

    panel.innerHTML = "";

    mission.crew.forEach((crewMember, index) => {

        panel.appendChild(

            createCrewRow(
                crewMember,
                index
            )

        );

    });

}

function addCrewMember() {

    mission.crew.push({

        role: "MC",

        weight: 80

    });

    updateMission();

}

function createRoleSelect(crewMember) {

    const select = document.createElement("select");

    crewRoles.forEach(role => {

        const option = document.createElement("option");

        option.value = role;

        option.textContent = role;

        option.selected = role === crewMember.role;

        select.appendChild(option);

    });

    select.addEventListener("change", () => {

        crewMember.role = select.value;

        updateMission();

    });

    return select;

}

function createWeightInput(crewMember) {

    const input = document.createElement("input");

    input.type = "number";

    input.className = "crew-weight";

    input.min = 0;

    input.step = 1;

    input.value = crewMember.weight;

    input.addEventListener("change", () => {

        crewMember.weight = Number(input.value);

        updateMission();

    });

    return input;

}

function createRemoveButton(index) {

    const button = document.createElement("button");

    button.className = "crew-remove";

    button.textContent = "✕";

    button.addEventListener("click", () => {

        mission.crew.splice(index, 1);

        updateMission();

    });

    return button;

}

export function initializeCrewPanel() {

    document
        .getElementById("addCrew")
        .addEventListener("click", addCrewMember);

    refreshCrewPanel();

}
