import { initializeMissionLegs } from "./missionLegs.js";
import {
    getAirport
} from "../database/airports.js";

import {
    getAircraftModel
} from "../database/aircraftModels.js";

import {
    getAircraftRegistration
} from "../database/aircraftRegistrations.js";

export const mission = {
    route: {
        origin: getAirport("----"),
        waypoints: [],
        destination: getAirport("----"),
        alternate: getAirport("----"),
        distance: 0
    },

    schedule: {
        date: "2026-07-31",
        etd: "00:00",
        eta: "",
        eet: 0,
        cruiseEet: 0,
        procedureEet: 0,
        arrival: "",
        etaDate: ""
    },

    aircraft: {
        model: getAircraftModel("C-95BM"),

        registration: getAircraftRegistration("FAB2317"),

        flightLevel: "FL100"
    },

    crew: [

        {
            role: "1P",
            weight: 80
        },

        {
            role: "2P",
            weight: 80
        },

        {
            role: "MC",
            weight: 80
        }

    ],

    fuel: {

        onboard: 0,

        taxi: 30,

        flight: 0,

        procedure: 0,
        enrouteProcedure: 0,

        alternate: 0,

        reserve: 0,

        extra: 0,

        arrival: 0,

        total: 0,

        remaining: 0,

        manual: {
            taxi: false,
            procedure: false,
            reserve: false
        }

    },

    payload: {
        entered: false,

    mode: "TOTAL",

    data: {

    total: {
        weight: 0,
    },

    average: {

        passengers: 0,
        passengerWeight: 90,

        baggage: 0,
        baggageWeight: 20

    },

    detailed: {

        passengers: [
            {
                name: "",
                weight: 90
            }
        ],

        cargo: [
            {
                description: "",
                weight: 20
            }
        ]

    }

}

},

    weight: {

        basic: 0,

        crew: 0,

        payload: 0,

        fuel: 0,

        landingFuel: 0,

        takeoff: 0,

        landing: 0

    },

    settings: {
    fuelUnit: "LB"
    }

};

export const missionLegs = initializeMissionLegs(mission);
