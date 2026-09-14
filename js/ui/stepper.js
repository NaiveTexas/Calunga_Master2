const steppers = {};

//==========================================//
//               STEPPER                    //
//==========================================//

export function createStepper(config) {

    const container = document.getElementById(config.id);

    if (!container) {
        console.error(`Stepper '${config.id}' não encontrado.`);
        return;
    }

    const elements = {
        minus: container.querySelector(".stepper-minus"),
        plus: container.querySelector(".stepper-plus"),
        value: container.querySelector(".stepper-value")
    };

    const state = {
        get value() {
            return config.object[config.property];
        },

        set value(newValue) {
            config.object[config.property] = newValue;
        }
    };

    function refresh() {

        elements.value.textContent = Math.round(state.value);

    }

    function change(step) {

        const newValue = state.value + step;

        if (newValue < config.min || newValue > config.max) {
            return;
        }

        state.value = newValue;

        refresh();

        config.onChange?.();

    }

    bindEvents(elements, config, change);

    refresh();

    steppers[config.id] = {
        refresh,
        config
    };

}

//==========================================//
//                EVENTS                    //
//==========================================//

function bindEvents(elements, config, change) {

    elements.plus.addEventListener("click", () => {

        change(config.step);

    });

    elements.minus.addEventListener("click", () => {

        change(-config.step);

    });

}

//==========================================//
//               REFRESH                    //
//==========================================//

export function refreshStepper(id) {

    steppers[id]?.refresh();

}

export function refreshAllSteppers() {

    Object.values(steppers).forEach(stepper => {

        stepper.refresh();

    });

}
