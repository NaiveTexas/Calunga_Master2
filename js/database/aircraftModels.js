export const aircraftModels = [
    {
        name: "C-95AM",
        image: "assets/aircrafts/C95.png",
        description: "Bandeirante",

        cruiseSpeed: 190,

        fuel: {
            type: "JET_A",
            defaultUnit: "LB"
        },

        fuelFlow: 600,
        maxFuel: 3800,
        taxiFuel: 30,
        procedureTime: 10,
        reserveTime: 45,

        maxRampaWeight: 5930,
        noFuelWeight: 5450,
        maxTakeoffWeight: 5900,
        maxLandingWeight: 5700
    },

    {
        name: "C-95BM",
        image: "assets/aircrafts/C95.png",
        description: "Bandeirante",

        cruiseSpeed: 190,

        fuel: {
            type: "JET_A",
            defaultUnit: "LB"
        },

        fuelFlow: 600,
        maxFuel: 3800,
        taxiFuel: 30,
        procedureTime: 10,
        reserveTime: 45,
        
        maxRampaWeight: 5630,
        noFuelWeight: 5300,
        maxTakeoffWeight: 5600,
        maxLandingWeight: 5300
    },

    {
        name: "C-98",
        image: "assets/aircrafts/C-98.png",
        description: "Grand Caravan",

        cruiseSpeed: 160,

        fuel: {
            type: "JET_A",
            defaultUnit: "LB"
        },
        
        fuelFlow: 350,
        maxFuel: 5000,
        taxiFuel: 30,
        procedureTime: 10,
        reserveTime: 45,

        maxTakeoffWeight: 0,
        maxLandingWeight: 0
    },

    {
        name: "T-27",
        image: "assets/aircrafts/T-27M.png",
        description: "Tucano",

        cruiseSpeed: 190,

        fuel: {
            type: "JET_A",
            defaultUnit: "LB"
        },
        
        fuelFlow: 250,
        maxFuel: 1140,
        taxiFuel: 30,
        procedureTime: 10,
        reserveTime: 45,

        maxTakeoffWeight: 3175,
        noFuelWeight: 2050,
        maxLandingWeight: 2800
    },
    {
        name: "A-29",
        image: "assets/aircrafts/A-29.png",
        description: "Super Tucano",
        // Preencha com os dados aprovados e cadastre as matrículas antes de habilitar.
        planningAvailable: true,
        cruiseSpeed: 210,       // kt
        fuel: { type: "JET_A", defaultUnit: "KG" },
        fuelFlow: 180,          // kg/h
        maxFuel: 980,           // kg
        taxiFuel: 40,          // kg
        procedureTime: 13.3,     // minutos
        reserveTime: 45,       // minutos
        noFuelWeight: null,      // kg
        maxTakeoffWeight: 5400,  // kg
        maxLandingWeight: 4000   // kg
    },
    {
        name: "H125",
        image: "assets/aircrafts/H125.png",
        description: "Helicóptero",
        planningAvailable: false
    }
];

export function getAircraftModel(name) {
    return aircraftModels.find(
        model => model.name === name
    );
}

export function getAircraftModelNames() {
    return aircraftModels.map(
        model => model.name
    );
}
