import { initializeNotamPanel, refreshNotamPanel } from "./notamPanel.js";

export function initializeNavigation() {

const toolPanel =
    document.getElementById(
        "toolPanel"
    );


const sidebarButtons =
    document.querySelectorAll(
        ".sidebar-button"
    );


const toolContents =
    document.querySelectorAll(
        ".tool-content"
    );

const weatherPanel =
    document.getElementById("weatherPanel");
const fullBriefingPanel = document.getElementById("fullBriefingPanel");

const appMain =
    document.querySelector(".app-main");
const notamPanel = document.getElementById("notamPage");
if (notamPanel && appMain) {
    notamPanel.classList.remove("tool-content");
    notamPanel.classList.add("weather-workspace");
    appMain.appendChild(notamPanel);
    initializeNotamPanel();
}
function closeNotams() {
    notamPanel?.classList.remove("active");
    document.querySelector('[data-tool="notam"]')?.classList.remove("active");
}
document.getElementById("closeNotams")?.addEventListener("click", closeNotams);

if (weatherPanel && appMain) {

    weatherPanel.classList.remove("tool-content");
    weatherPanel.classList.add("weather-workspace");
    appMain.appendChild(weatherPanel);

}

if (fullBriefingPanel && appMain) {
    fullBriefingPanel.classList.remove("tool-content");
    fullBriefingPanel.classList.add("weather-workspace");
    appMain.appendChild(fullBriefingPanel);
}

function closeWeatherWorkspace() {

    weatherPanel?.classList.remove("active");

    document
        .querySelector('[data-tool="weather"]')
        ?.classList.remove("active");

}

function closeFullBriefingWorkspace() {
    fullBriefingPanel?.classList.remove("active");
    document.querySelector('[data-tool="fullBriefing"]')?.classList.remove("active");
}

function openFullBriefingWorkspace() {
    closeWeatherWorkspace();
    toolPanel.classList.remove("open");
    sidebarButtons.forEach(button => button.classList.remove("active"));
    fullBriefingPanel?.classList.add("active");
    document.querySelector('[data-tool="fullBriefing"]')?.classList.add("active");
}

function openWeatherWorkspace() {

    const isAlreadyOpen =
        weatherPanel?.classList.contains("active");

    if (isAlreadyOpen) {
        closeWeatherWorkspace();
        return;
    }

    toolContents.forEach(content => {
        content.classList.remove("active");
    });

    sidebarButtons.forEach(button => {
        button.classList.remove("active");
    });

    toolPanel.classList.remove("open");
    weatherPanel?.classList.add("active");

    document
        .querySelector('[data-tool="weather"]')
        ?.classList.add("active");

}


function openTool(toolName) {
    if (toolName === "notam") {
        const wasOpen = notamPanel?.classList.contains("active");
        closeWeatherWorkspace();
        closeFullBriefingWorkspace();
        toolContents.forEach(content => content.classList.remove("active"));
        sidebarButtons.forEach(button => button.classList.remove("active"));
        toolPanel.classList.remove("open");
        if (!wasOpen) {
            notamPanel?.classList.add("active");
            document.querySelector('[data-tool="notam"]')?.classList.add("active");
            refreshNotamPanel(true);
        }
        return;
    }
    closeNotams();

    if (toolName === "weather") {
        closeFullBriefingWorkspace();
        openWeatherWorkspace();
        return;
    }

    if (toolName === "fullBriefing") {
        openFullBriefingWorkspace();
        return;
    }

    closeWeatherWorkspace();
    closeFullBriefingWorkspace();

    const target =
        document.getElementById(
            `${toolName}Panel`
        );


    if (!target) {
        return;
    }


    const isAlreadyOpen =
        target.classList.contains(
            "active"
        );


    toolContents.forEach(
        content => {

            content.classList.remove(
                "active"
            );

        }
    );


    sidebarButtons.forEach(
        button => {

            button.classList.remove(
                "active"
            );

        }
    );


    if (isAlreadyOpen) {

        toolPanel.classList.remove(
            "open"
        );

        return;

    }


    target.classList.add(
        "active"
    );


    const activeButton =
        document.querySelector(
            `[data-tool="${toolName}"]`
        );


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }


    toolPanel.classList.add(
        "open"
    );

}


sidebarButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                openTool(
                    button.dataset.tool
                );

            }
        );

    }
);

document
    .getElementById("closeWeather")
    ?.addEventListener("click", closeWeatherWorkspace);

document.getElementById("closeFullBriefing")?.addEventListener("click", closeFullBriefingWorkspace);

}
