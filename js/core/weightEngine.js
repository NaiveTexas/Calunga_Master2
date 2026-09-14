//==========================================//
//             BASIC WEIGHT                 //
//==========================================//

import {
    mission
} from "../models/missions.js";


import {
    updatePayloadWeight
} from "./payloadEngine.js";

function updateBasicWeight(context = mission) {

    context.weight.basic = context.aircraft.registration.basicWeight;

}

//==========================================//
//             CREW WEIGHT                  //
//==========================================//

function updateCrewWeight(context = mission) {

    context.weight.crew = context.crew.reduce((total, crewMember) => total + crewMember.weight, 0);

}

//==========================================//
//             FUEL WEIGHT                  //
//==========================================//

import { fuelMassKg } from "./fuelUnits.js";
function updateFuelWeight(context = mission) {

    context.weight.fuel = fuelMassKg(context.fuel.onboard, context.aircraft.model);

}
//==========================================//
//          TAKEOFF WEIGHT                  //
//==========================================//

function updateTakeoffWeight(context = mission) {

    context.weight.takeoff =

        context.weight.basic +

        context.weight.crew +

        context.weight.payload +

        context.weight.fuel;

}

//==========================================//
//          LANDING WEIGHT                  //
//==========================================//

function updateLandingWeight(context = mission) {

    context.weight.landing = 
    
        context.weight.basic +

        context.weight.crew +

        context.weight.payload +

        context.weight.landingFuel;

}

//==========================================//
//         WEIGHT PLANNING                  //
//==========================================//

export function updateWeightPlanning(context = mission) {

    updateBasicWeight(context);

    updateCrewWeight(context);

    updatePayloadWeight(context);

    updateFuelWeight(context);

    updateTakeoffWeight(context);

    updateLandingWeight(context);

}
