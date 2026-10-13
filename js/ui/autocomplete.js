import {
    clearList,
    filterOptions,
    hideList,
    showList
} from "../utils/helpers.js";

import {
    updateMissionField
} from "../core/missionEngine.js";

function createItem(option, config, input, list){

    const item = document.createElement("div");

    item.textContent = option.label;

    item.classList.add("autocomplete-item");

    item.addEventListener("click", () => {
        selectItem(config, input, list, option.value);
    });

    return item;
}

function highlightSelection(state){

        state.items.forEach(item => {

            item.element.classList.remove("selected");
        });

        if(state.selectedIndex >= 0){

            state.items[state.selectedIndex]
                .element
                .classList.add("selected");
        }
    }

function selectItem(
    config,
    input,
    list,
    airport
) {

    input.value =
        airport.icao;

    updateMissionField(
        config,
        airport
    );

    hideList(list);
    updateAirportCaption(config, input);

}

function updateAirportCaption(config, input) {
    const caption = document.getElementById(`${config.id}-name`);
    if (!caption) return;
    const airport = config.target[config.property];
    const matches = airport?.icao === input.value.trim().toUpperCase();
    caption.textContent = matches ? airport.name || "Nome indisponível" : "";
    caption.hidden = !matches;
}
    
function initializeInput(config, input, list, state){

    const renderOptions = () => {

        updateAirportCaption(config, input);
        clearList(list);
        state.items = [];
        state.selectedIndex = -1;

        const search = input.value.trim().toUpperCase();
        const matches = filterOptions(search, config.data);
        const filtered = config.transformOptions ? config.transformOptions(matches) : matches;

        if(filtered.length === 0){
            hideList(list);

            return;
        }

        showList(list);

        state.items = [];
        state.selectedIndex = -1;

        filtered.forEach(option => {
            const element = createItem(option, config, input, list);

            state.items.push({element, option});

            list.appendChild(element);
        });
    };
    input.addEventListener("input", renderOptions);
    if (config.showOnFocus) input.addEventListener("focus", renderOptions);
}

function initializeKeyboard(config, input, list, state){

    input.addEventListener("keydown", (event) => {

        switch (event.key) {
            case "Tab": {
                if (!event.shiftKey && list.style.display !== "none" && state.items.length > 0) {
                    event.preventDefault();
                    const selected = state.items[Math.max(0, state.selectedIndex)];
                    selectItem(config, input, list, selected.option.value);
                    state.items = [];
                    state.selectedIndex = -1;
                } else {
                    hideList(list);
                    state.items = [];
                    state.selectedIndex = -1;
                }
                return;
            }
            case "ArrowDown":
                event.preventDefault();

                if (state.selectedIndex < state.items.length - 1) {
                    state.selectedIndex++;
                }
                break;

            case "ArrowUp":
                event.preventDefault();

                if (state.selectedIndex > 0) {
                    state.selectedIndex--;
                }
                break;
            
            case "Enter":
                event.preventDefault();

                if(state.selectedIndex === -1){
                    return;
                }
                const selected = state.items[state.selectedIndex];

                selectItem(config, input, list,  selected.option.value);
                state.items = [];
                state.selectedIndex = -1;
                break;
            
            case "Escape":
                hideList(list);

                state.items = [];
                state.selectedIndex = -1;
                return;
        }
        highlightSelection(state)
    });
}

function initializeClickOutside(list, state){
    document.addEventListener("click", (event) => {

        if (event.target.closest(".route-selector")) {
            return;
        }
        hideList(list);

        state.selectedIndex = -1;
    });
}

export function autocomplete(config){
    const input = document.getElementById(config.id);
    const list = document.getElementById(`${config.id}-list`);
    const caption = document.createElement("span");
    caption.id = `${config.id}-name`;
    caption.className = "airport-selected-name";
    caption.hidden = true;
    caption.setAttribute("aria-live", "polite");
    input.setAttribute("aria-describedby", caption.id);
    input.insertAdjacentElement("afterend", caption);
    updateAirportCaption(config, input);

    const state = {
    items: [],
    selectedIndex: -1
    };

    input.addEventListener("autocomplete-reset", () => {
        state.items = [];
        state.selectedIndex = -1;
        clearList(list);
    });

    initializeInput(config, input, list, state);

    initializeKeyboard(config, input, list, state);

    initializeClickOutside(list, state);

}
