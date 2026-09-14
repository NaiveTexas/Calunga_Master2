//==========================================//
//          AVERAGE PAYLOAD                 //
//==========================================//

import {
    mission
} from "../models/missions.js";

function updateAveragePayloadWeight(context = mission) {

    const payload = context.payload.data.average;

    context.weight.payload =

        payload.passengers *

        payload.passengerWeight +

        payload.baggage *

        payload.baggageWeight;

}

//==========================================//
//         DETAILED PAYLOAD                 //
//==========================================//

function updateDetailedPayloadWeight(context = mission) {

    const passengersWeight =

        context.payload.data.detailed.passengers.reduce(

            (total, passenger) => total + passenger.weight,

            0

        );

    const cargoWeight =

        context.payload.data.detailed.cargo.reduce(

            (total, cargo) => total + cargo.weight,

            0

        );

    context.weight.payload =

        passengersWeight +

        cargoWeight;

}

//==========================================//
//           PAYLOAD ENGINE                 //
//==========================================//

export function updatePayloadWeight(context = mission) {

    switch (context.payload.mode) {

        case "TOTAL":

            context.weight.payload =

                context.payload.data.total.weight;

            break;

        case "AVERAGE":

            updateAveragePayloadWeight(context);

            break;

        case "DETAILED":

            updateDetailedPayloadWeight(context);

            break;

    }

}

function calculateDetailedPayload(context = mission) {

    let total = 0;

    context.payload.data.detailed.passengers.forEach(passenger => {

        total += passenger.weight;

    });

    context.payload.data.detailed.cargo.forEach(cargo => {

        total += cargo.weight;

    });

    return total;

}

function refreshPayloadTotals(context = mission) {

    const passengerTotal = document.getElementById("passengerTotal");

    if (passengerTotal) {

        passengerTotal.textContent =
            `${context.payload.data.detailed.passengers.reduce(
                (sum, p) => sum + p.weight,
                0
            )} kg`;

    }

    const cargoTotal = document.getElementById("cargoTotal");

    if (cargoTotal) {

        cargoTotal.textContent =
            `${context.payload.data.detailed.cargo.reduce(
                (sum, c) => sum + c.weight,
                0
            )} kg`;

    }

}
