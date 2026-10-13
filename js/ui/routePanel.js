import { autocomplete } from "./autocomplete.js";
import { createSuggestedRouteControl } from "./suggestedRouteButton.js";
import { loadSuggestedRoute } from "../services/suggestedRoute.js";
import { orderAlternateOptions } from "../core/alternateOptions.js";
import { getAirportList } from "../database/airports.js";
import Sortable from "sortablejs";
import { legDistance } from "./legCards.js";
import { calculateDistance, formatDate } from "../utils/helpers.js";
import { missionLegs } from "../models/missions.js";
import { addMissionLeg, selectMissionLeg, removeMissionLeg } from "../core/missionEngine.js";
import { createRoutePoint, waypointSettings } from "../core/routePlanning.js";

import {
    mission
} from "../models/missions.js";

import {
    updateMission
} from "../core/missionEngine.js";

import {
    searchNavigationPoints
} from "../database/navigation.js";

import {
    searchAirports
} from "../database/airports.js";

let waypointSortable = null;

export function initializeRoutePanel() {
    const waypointPanel = document.getElementById("waypointPanel");
    const suggestion = createSuggestedRouteControl(loadSuggestedRoute);
    suggestion.id = "suggestedRouteControl";
    waypointPanel.before(suggestion);
    waypointPanel.addEventListener("suggested-route-applied", renderWaypointPanel);
    for (const [id, property] of [["departure", "origin"], ["destination", "destination"], ["alternate", "alternate"]]) {
        autocomplete({ id, data: getAirportList(), target: mission.route, property,
            ...(property === "alternate" ? { showOnFocus: true, transformOptions: options => orderAlternateOptions(options, mission.route.destination) } : {}) });
    }

    refreshRouteInputs();

    initializeRouteDistances();
    initializeLegCards();

}

//==========================================//
//          WAYPOINT PANEL                  //
//==========================================//

function renderWaypointPanel() {

    const panel =
        document.getElementById(
            "waypointPanel"
        );

    if (!panel) {
        return;
    }

    panel.innerHTML = "";


    /*
     * Waypoints existentes
     */

    mission.route.waypoints.forEach(
        (waypoint, index) => {

            renderWaypoint(
                panel,
                waypoint,
                index
            );

        }
    );


    /*
     * Botão adicionar
     */

    const addButton =
        document.createElement(
            "button"
        );

    addButton.type = "button";

    addButton.textContent =
        "+ ADICIONAR PONTO";

    addButton.addEventListener(
        "click",
        openWaypointSearch
    );

    panel.appendChild(
        addButton
    );


    if (waypointSortable) {
        waypointSortable.destroy();
    }


    waypointSortable =
        new Sortable(panel, {

            animation: 150,

            draggable: ".route-point",
            handle: ".route-point > strong",

            onEnd: event => {

                const oldIndex =
                    event.oldIndex;

                const newIndex =
                    event.newIndex;


                if (
                    oldIndex === newIndex ||
                    oldIndex == null ||
                    newIndex == null
                ) {
                    return;
                }


                const moved =
                    mission.route.waypoints
                        .splice(
                            oldIndex,
                            1
                        )[0];


                mission.route.waypoints
                    .splice(
                        newIndex,
                        0,
                        moved
                    );


                updateMission({ routeChanged: true });
                renderWaypointPanel();

            }

        });

}


//==========================================//
//          WAYPOINT                       //
//==========================================//

function renderWaypoint(
    container,
    waypoint,
    index
) {

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "route-point";

    const ident =
        document.createElement(
            "strong"
        );

    ident.textContent =
        waypoint.ident ||
        waypoint.icao ||
        "----";

    element.appendChild(
        ident
    );


    const type =
        document.createElement(
            "span"
        );

    type.textContent =
        waypoint.type === "AIRPORT"
            ? "AED"
            : waypoint.type || "PONTO";

    element.appendChild(
        type
    );

    if (waypoint.type === "AIRPORT") {
        element.classList.add("route-point-airport");
        type.hidden = true;
        ident.title = waypoint.reference
            ? `${waypoint.name || waypoint.icao} · Referência: ${waypoint.reference.ident}`
            : `${waypoint.name || waypoint.icao} · Sem referência cadastrada; a rota usa o ICAO`;
        const leg = missionLegs.active();
        const speedLabel = document.createElement("label");
        speedLabel.className = "waypoint-speed";
        const speed = document.createElement("input");
        speed.type = "number";
        speed.min = "1";
        speed.max = "9999";
        speed.step = "1";
        speed.value = waypointSettings(leg, index, mission.aircraft.model).speed;
        speed.setAttribute("aria-label", `Velocidade após ${waypoint.icao} em nós`);
        speed.title = "Velocidade para o trecho seguinte (kt)";
        speed.addEventListener("change", () => {
            const value = speed.value.trim() === "" ? null : Number(speed.value);
            if (value === null || (Number.isInteger(value) && value > 0 && value <= 9999)) waypoint.outboundSpeed = value;
            updateMission();
        });
        speedLabel.append(speed, document.createTextNode("kt"));
        const level = document.createElement("select");
        level.className = "waypoint-level";
        level.setAttribute("aria-label", `Nível após ${waypoint.icao}`);
        level.title = "Nível para o trecho seguinte";
        const inherited = document.createElement("option");
        inherited.value = "";
        level.append(inherited);
        for (let fl = 50; fl <= 450; fl += 10) {
            const option = document.createElement("option");
            option.value = option.textContent = `FL${String(fl).padStart(3, "0")}`;
            level.append(option);
        }
        level.addEventListener("change", () => {
            waypoint.outboundLevel = level.value || null;
            updateMission();
        });
        const procedureLabel = document.createElement("label");
        procedureLabel.className = "waypoint-procedure";
        const procedure = document.createElement("input");
        procedure.type = "checkbox";
        procedure.checked = Boolean(waypoint.procedure);
        procedure.setAttribute("aria-label", `Realizar procedimento em ${waypoint.icao}`);
        procedure.addEventListener("change", () => {
            waypoint.procedure = procedure.checked;
            updateMission();
        });
        procedureLabel.append(procedure, document.createTextNode("Proc."));
        element.append(speedLabel, level, procedureLabel);
        element.refreshControls = () => {
            const at = leg.route.waypoints.indexOf(waypoint);
            const defaults = waypointSettings(leg, at - 1, mission.aircraft.model);
            speed.value = waypoint.outboundSpeed || defaults.speed;
            inherited.textContent = defaults.level;
            level.value = waypoint.outboundLevel || "";
            procedureLabel.title = `Procedimento: +${mission.aircraft.model.procedureTime} min, com consumo padrão da aeronave`;
        };
        element.refreshControls();
    }


    const removeButton =
        document.createElement(
            "button"
        );

    removeButton.type =
        "button";

    removeButton.textContent =
        "×";


    removeButton.addEventListener(
        "click",
        () => {

            mission.route.waypoints
                .splice(
                    mission.route.waypoints.indexOf(waypoint),
                    1
                );

            updateMission({ routeChanged: true });

            renderWaypointPanel();

        }
    );


    element.appendChild(
        removeButton
    );


    container.appendChild(
        element
    );

}


//==========================================//
//          SEARCH                          //
//==========================================//

function openWaypointSearch() {

    const panel =
        document.getElementById(
            "waypointPanel"
        );

    if (!panel) {
        return;
    }


    /*
     * O botão de adicionar é o último
     * elemento do painel.
     */
    const addButton =
        panel.lastElementChild;


    if (!addButton) {
        return;
    }


    /*
     * Cria o campo de pesquisa.
     */
    const search =
        document.createElement(
            "div"
        );

    search.className =
        "waypoint-search";


    const input =
        document.createElement(
            "input"
        );

    input.type =
        "text";

    input.placeholder =
        "Pesquisar ponto";

    input.autocomplete =
        "off";


    const results =
        document.createElement(
            "div"
        );

    results.className =
        "waypoint-results";

    search.addEventListener("keydown", event => {
        if (event.isComposing || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
        const options = Array.from(results.querySelectorAll("button"));
        const selected = options.indexOf(event.target);
        if (event.key === "Escape") {
            event.preventDefault();
            renderWaypointPanel();
            panel.lastElementChild?.focus();
        } else if (options.length && event.key === "Enter") {
            event.preventDefault();
            if (!event.repeat) options[Math.max(0, selected)].click();
        } else if (options.length && event.key === "Tab") {
            event.preventDefault();
            if (event.repeat) return;
            if (selected < 0) options[0].focus();
            else options[selected].click();
        } else if (options.length && ["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            const next = selected < 0 ? 0 : Math.max(0, Math.min(options.length - 1, selected + (event.key === "ArrowDown" ? 1 : -1)));
            options[next].focus();
        }
    });


    /*
     * Pesquisa enquanto digita.
     */
    input.addEventListener(
        "input",
        () => {

            renderWaypointResults(
                input.value,
                results
            );

        }
    );


    /*
     * Monta o campo.
     */
    search.appendChild(
        input
    );

    search.appendChild(
        results
    );


    /*
     * Substitui o botão pelo campo.
     */
    panel.replaceChild(
        search,
        addButton
    );


    input.focus();

}


//==========================================//
//          SEARCH RESULTS                  //
//==========================================//

function renderWaypointResults(query, results) {

    results.innerHTML = "";

    if (!query.trim()) {
        return;
    }

    const points =
        searchRoutePoints(query);

    points
        .slice(0, 10)
        .forEach(point => {

            const button =
                document.createElement("button");

            button.type = "button";


            const ident =
                point.ident ||
                point.icao;


            const pointType =
                point.type === "AIRPORT"
                    ? "AED"
                    : point.type || "PONTO";

            button.textContent =
                `${ident} — ${pointType}`;


            button.addEventListener(
                "click",
                () => {

                    mission.route.waypoints.push(
                        createRoutePoint(point)
                    );

                    updateMission({ routeChanged: true });

                    renderWaypointPanel();

                    openWaypointSearch();

                }
            );


            results.appendChild(
                button
            );

        });

}

function searchRoutePoints(query) {

    return [

        ...searchNavigationPoints(query),

        ...searchAirports(query)

    ];

}

export function updateRouteHeader() {

    refreshRouteLegs();
    refreshRouteDistances();
    document.querySelectorAll("#waypointPanel .route-point-airport").forEach(row => row.refreshControls?.());

    document.getElementById("route-departure").textContent =
        mission.route.origin
            ? mission.route.origin.icao 
            : "----";

    document.getElementById("route-destination").textContent =
        mission.route.destination
            ? mission.route.destination.icao
            : "----";

    document.getElementById("route-etd").textContent =
        mission.schedule.etd
            ? `${mission.schedule.etd}Z`
            : "--:--Z";

    document.getElementById("route-eta").textContent =
        mission.schedule.eta
            ? `${mission.schedule.eta}Z`
            : "--:--Z";

}

function initializeRouteDistances() {
    for (const id of ["routeTotalDistance", "routeAlternateDistance"]) {
        const label = document.createElement("p");
        label.id = id;
        label.className = "route-distance";
        label.setAttribute("aria-live", "polite");
        if (id === "routeTotalDistance") {
            document.querySelector("#routePanel .route-selector").append(label);
        } else {
            document.getElementById("alternate-name").after(label);
        }
    }
    refreshRouteDistances();
}

function refreshRouteDistances() {
    const total = document.getElementById("routeTotalDistance");
    const alternate = document.getElementById("routeAlternateDistance");
    if (!total || !alternate) return;
    const route = mission.route;
    const format = value => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    total.textContent = route.origin?.position && route.destination?.position
        ? `Distância total da perna: ${format(route.distance)} NM`
        : "Distância total da perna: — NM";
    alternate.textContent = route.destination?.position && route.alternate?.position
        ? `Destino → alternativa: ${format(calculateDistance(route.destination, route.alternate))} NM`
        : "Destino → alternativa: — NM";
}

let legEditor;
let legList;
let addLegButton;
let expanded = true;
let cardsSignature = "";
import { briefingProgress, routeConfirmation } from "../core/briefingProgress.js";
function finishRoute() {
    const leg = missionLegs.active();
    if (briefingProgress(mission, leg).routeReady) leg.routeConfirmed = routeConfirmation(leg);
    expanded = false;
    updateMission();
    refreshRouteLegs();
}

function initializeLegCards() {
    const panel = document.getElementById("routePanel");
    legEditor = document.createElement("div");
    legEditor.id = "legEditor";
    legEditor.className = "leg-editor";
    Array.from(panel.children).filter(child => child.tagName !== "H2").forEach(child => legEditor.append(child));
    const done = document.createElement("button");
    done.id = "routeDone"; done.type = "button"; done.className = "route-done"; done.textContent = "Concluído";
    done.addEventListener("click", finishRoute);
    legEditor.querySelector("#eta").closest(".field").after(done);
    legList = document.createElement("div");
    legList.className = "leg-list";
    addLegButton = document.createElement("button");
    addLegButton.type = "button";
    addLegButton.className = "add-leg";
    addLegButton.addEventListener("click", () => { expanded = true; addMissionLeg(); });
    panel.append(legList, addLegButton);
    for (const container of [panel]) {
        const label = document.createElement("p");
        label.className = "active-leg-context";
        label.setAttribute("aria-live", "polite");
        container.prepend(label);
    }
    window.addEventListener("mission-leg-selected", () => {
        expanded = true;
        refreshRouteInputs();

        refreshRouteLegs();
        legList.querySelector(`[data-leg-id="${mission.activeLegId}"] .leg-toggle`)?.focus();
    });
    refreshRouteLegs();
}

function refreshRouteInputs() {
    for (const [id, property] of [["departure", "origin"], ["destination", "destination"], ["alternate", "alternate"]]) {
        const airport = mission.route[property];
        document.getElementById(id).value = airport?.icao || "";
        const caption = document.getElementById(`${id}-name`);
        caption.textContent = airport?.name || "";
        caption.hidden = !airport?.name;
        document.getElementById(`${id}-list`).style.display = "none";
        document.getElementById(id).dispatchEvent(new CustomEvent("autocomplete-reset"));
    }
    document.getElementById("flightLevel").value = mission.aircraft.flightLevel;
    renderWaypointPanel();
}

export function refreshRouteLegs() {
    if (!legList) return;
    legEditor.querySelector("#routeDone").disabled = !briefingProgress(mission, missionLegs.active()).routeReady;
    const signature = mission.legs.map(leg => leg.id).join(",");
    if (signature !== cardsSignature) {
        legEditor.remove();
        legList.replaceChildren();
        mission.legs.forEach(leg => {
            const card = document.createElement("section");
            card.className = "leg-card";
            card.dataset.legId = leg.id;
            const header = document.createElement("div");
            header.className = "leg-card-header";
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "leg-toggle";
            toggle.setAttribute("aria-controls", "legEditor");
            toggle.addEventListener("click", () => {
                if (mission.activeLegId === leg.id) {
                    if (expanded) { finishRoute(); return; }
                    expanded = !expanded;
                    refreshRouteLegs();
                } else {
                    expanded = true;
                    selectMissionLeg(leg.id);
                }
            });
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-leg";
            remove.textContent = "Remover";
            remove.addEventListener("click", () => {
                const number = mission.legs.indexOf(leg) + 1;
                if (window.confirm(`Remover a Perna ${number} e seus dados?`)) removeMissionLeg(leg.id);
            });
            header.append(toggle, remove);
            card.append(header);
            legList.append(card);
        });
        cardsSignature = signature;
    }
    mission.legs.forEach((leg, index) => {
        const card = legList.children[index];
        const selected = leg.id === mission.activeLegId;
        const open = selected && expanded;
        const route = `${leg.route.origin?.icao || "----"} → ${leg.route.destination?.icao || "----"}`;
        const schedule = `${formatDate(leg.schedule.date) || "Data pendente"} · ${leg.schedule.etd || "--:--"} → ${leg.schedule.eta || "--:--"} UTC`;
        card.querySelector(".leg-toggle").textContent = `${open ? "▾" : "▸"} Perna ${index + 1} · ${route} · ${legDistance(leg)}\n${schedule}`;
        card.querySelector(".leg-toggle").setAttribute("aria-expanded", String(open));
        card.querySelector(".remove-leg").hidden = mission.legs.length === 1;
        card.classList.toggle("selected", selected);
        const pending = !briefingProgress(mission, leg).allowed[2];
        card.classList.toggle("leg-pending", pending);
        if (pending) card.querySelector(".leg-toggle").textContent += " · Pendente de conclusão";
        if (selected && legEditor.parentElement !== card) card.append(legEditor);
    });
    legEditor.hidden = !expanded;
    addLegButton.textContent = `+ Adicionar Perna ${mission.legs.length + 1}`;
    const index = mission.legs.findIndex(leg => leg.id === mission.activeLegId);
    const active = missionLegs.active();
    document.querySelectorAll(".active-leg-context").forEach(label => {
        label.textContent = `Perna ${index + 1} · ${active.route.origin?.icao || "----"} → ${active.route.destination?.icao || "----"}`;
    });
}
