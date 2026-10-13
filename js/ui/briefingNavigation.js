import { mission, missionLegs } from "../models/missions.js";
import { briefingProgress, briefingGuidance, weightReviewSignature } from "../core/briefingProgress.js";
const progress = () => briefingProgress(mission, missionLegs.active());
const panels = [
    "missionPanel",
    "routePanel",
    "fuelPanel",
    "weightPanel",
    "dashboardPanel"
];


let currentPage = 0;


//==========================================//
//          SHOW BRIEFING PAGE              //
//==========================================//

function showBriefingPage(index) {

    if (
        index < 0 ||
        index >= panels.length
    ) {
        return;
    }
    if (!progress().allowed[index]) return;


    currentPage = index;
    if (index === 4) {
        const leg = missionLegs.active();
        leg[index === 3 ? "weightReviewed" : "dashboardReviewed"] = weightReviewSignature(mission, leg);
        window.dispatchEvent(new window.Event("mission-updated"));
    }


    document
        .querySelectorAll(".briefing-page")
        .forEach(panel => {

            panel.classList.remove("active");

        });


    const panel =
        document.getElementById(
            panels[currentPage]
        );


    panel.classList.add("active");


    updateBriefingSteps();

}


//==========================================//
//          UPDATE STEPS                    //
//==========================================//

function updateBriefingSteps() {
    const state = progress();
    const guidance = briefingGuidance(state, currentPage);
    const hint = document.getElementById("briefingGuide");
    if (hint) { hint.textContent = guidance.message; hint.hidden = !guidance.message; }
    document.querySelector('[data-tool="briefing"]')?.classList.toggle("guide-pulse", !state.model);
    document.getElementById("aircraftGallery")?.classList.toggle("guide-pulse", !state.model);
    const registration = document.getElementById("registration");
    registration?.classList.toggle("guide-pulse", state.model && !state.allowed[1]);
    if (registration) registration.disabled = !state.model;

    document
        .querySelectorAll(".briefing-tab")
        .forEach((step, index) => {
            step.disabled = !state.allowed[index];
            step.classList.toggle("guide-pulse", index === guidance.target && state.allowed[index]);
            step.classList.toggle("step-unlocked", index === guidance.target && state.allowed[index]);
            step.setAttribute("aria-current", index === currentPage ? "page" : "false");
            step.title = step.querySelector(".briefing-tab-label")?.textContent.trim() || "";

            step.classList.toggle(
                "active",
                index === currentPage
            );

        });


    const previous =
        document.getElementById(
            "briefingPrevious"
        );


    const next =
        document.getElementById(
            "briefingNext"
        );


    previous.disabled =
        currentPage === 0;


    next.disabled =
        currentPage === panels.length - 1 || !state.allowed[currentPage + 1];
    next.title = next.disabled ? state.message : "Próxima etapa";

}


//==========================================//
//          INITIALIZE                      //
//==========================================//

export function initializeBriefingNavigation() {
    const originCard = document.querySelector("#routePanel .route-selector");
    const destinationCard = document.getElementById("destination").closest(".autocomplete");
    originCard.classList.add("guided-origin");
    destinationCard.classList.add("guided-destination");
    const suggestion = document.getElementById("suggestedRouteControl");
    originCard.after(...[suggestion, document.getElementById("waypointPanel"), destinationCard].filter(Boolean));
    const distance = document.getElementById("routeTotalDistance");
    if (distance) destinationCard.append(distance);
    const hint = document.createElement("div");
    hint.id = "briefingGuide"; hint.setAttribute("role", "status");
    document.body.append(hint);
    window.addEventListener("mission-updated", () => {
        const state = progress();
        if (!state.allowed[currentPage]) showBriefingPage(state.allowed.lastIndexOf(true));
        else updateBriefingSteps();
    });

    const previous =
        document.getElementById(
            "briefingPrevious"
        );


    const next =
        document.getElementById(
            "briefingNext"
        );


    previous.addEventListener(
        "click",
        () => {

            showBriefingPage(
                currentPage - 1
            );

        }
    );


    next.addEventListener(
        "click",
        () => {

            showBriefingPage(
                currentPage + 1
            );

        }
    );


    document
        .querySelectorAll(".briefing-tab")
        .forEach((step, index) => {

            step.addEventListener(
                "click",
                () => {

                    showBriefingPage(index);

                }
            );

        });


    showBriefingPage(0);

}
