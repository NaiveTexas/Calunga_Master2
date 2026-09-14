import {
    getAircraftModel
} from "./aircraftModels.js";

const aircraftRegistrations = [
    {
    registration: "FAB2291",

    model: getAircraftModel("C-95AM"),

    basicWeight: 3600
    },
    {
    registration: "FAB2296",

    model: getAircraftModel("C-95AM"),

    basicWeight: 3566
    },
    {
    registration: "FAB2317",

    model: getAircraftModel("C-95BM"),

    basicWeight: 3592
    },
    {
    registration: "FAB2323",

    model: getAircraftModel("C-95BM"),

    basicWeight: 3615
    },
    {
    registration: "FAB2347",

    model: getAircraftModel("C-95BM"),

    basicWeight: 3713
    },
    {
    registration: "FAB2312",

    model: getAircraftModel("C-95BM"),

    basicWeight: 3663
    },
    {
    registration: "FAB2702",

    model: getAircraftModel("C-98"),

    basicWeight: 3663
    },
    {
    registration: "FAB2708",

    model: getAircraftModel("C-98"),

    basicWeight: 3663
    },
    {
    registration: "FAB2722",

    model: getAircraftModel("C-98"),

    basicWeight: 3663
    },
    {
    registration: "FAB1333",

    model: getAircraftModel("T-27"),

    basicWeight: 2050
    },
    {
    registration: "FAB1444",

    model: getAircraftModel("T-27"),

    basicWeight: 2050
    },
        {
    registration: "FAB5555",

    model: getAircraftModel("A-29"),

    basicWeight: 2050
    }
];

export function getAircraftRegistration(registration) {

    const aircraft = aircraftRegistrations.find(
        aircraft => aircraft.registration === registration
    );

    if (!aircraft) {
        console.error(`Matrícula não encontrada: ${registration}`);
    }

    return aircraft;

}

export function getAircraftRegistrationList(model) {

    return aircraftRegistrations.filter(
        aircraft => aircraft.model.name === model
    );

}

export function getAircraftRegistrationNameList(model) {

    return getAircraftRegistrationList(model).map(
        aircraft => aircraft.registration
    );

}
