const panels = [
    "routePanel",
    "missionPanel",
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


    currentPage = index;


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

    document
        .querySelectorAll(".briefing-tab")
        .forEach((step, index) => {

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
        currentPage === panels.length - 1;

}


//==========================================//
//          INITIALIZE                      //
//==========================================//

export function initializeBriefingNavigation() {

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