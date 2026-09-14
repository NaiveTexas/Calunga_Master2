import { updateMission } from "../core/missionEngine.js";
export function bindInput(id, object, property, event = "change") {
    const element = document.getElementById(id);

    element.addEventListener(event, () => {
        object[property] = element.value;

        updateMission();
    });
}
