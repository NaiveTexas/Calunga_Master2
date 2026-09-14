const LEG_FIELDS = ["route", "schedule", "fuel", "payload", "weight"];

export function initializeMissionLegs(mission) {
    let sequence = 1;
    const first = {
        id: sequence,
        flightLevel: mission.aircraft.flightLevel,
        automatic: { origin: false, departure: false, fuel: false },
        refuel: 0,
        ...Object.fromEntries(LEG_FIELDS.map(key => [key, mission[key]]))
    };
    const defaults = structuredClone(first);
    mission.legs = [first];
    mission.activeLegId = first.id;
    const active = () => mission.legs.find(leg => leg.id === mission.activeLegId);

    // Stable field objects keep existing input/stepper bindings on the selected leg.
    for (const key of LEG_FIELDS) {
        const fields = {};
        for (const property of Object.keys(first[key])) {
            Object.defineProperty(fields, property, {
                enumerable: true,
                get: () => active()[key][property],
                set: value => { active()[key][property] = value; }
            });
        }
        mission[key] = fields;
    }
    Object.defineProperty(mission.aircraft, "flightLevel", {
        enumerable: true,
        configurable: true,
        get: () => active().flightLevel,
        set: value => { active().flightLevel = value; }
    });

    return {
        active,
        replace(legs, activeIndex = 0) {
            mission.legs = legs.map(data => ({ ...structuredClone(defaults), ...data, id: ++sequence }));
            mission.activeLegId = mission.legs[activeIndex].id;
        },
        add() {
            const previous = mission.legs.at(-1);
            const leg = structuredClone(defaults);
            leg.id = ++sequence;
            leg.flightLevel = previous.flightLevel;
            leg.payload = structuredClone(previous.payload);
            leg.route.origin = previous.route.destination;
            leg.schedule.date = "";
            leg.schedule.etd = "";
            leg.automatic = { origin: true, departure: true, fuel: true };
            mission.legs.push(leg);
            mission.activeLegId = leg.id;
            return leg;
        },
        select(id) {
            if (!mission.legs.some(leg => leg.id === id)) return false;
            mission.activeLegId = id;
            return true;
        },
        remove(id) {
            const index = mission.legs.findIndex(leg => leg.id === id);
            if (index < 0 || mission.legs.length === 1) return false;
            mission.legs.splice(index, 1);
            if (mission.activeLegId === id) {
                mission.activeLegId = mission.legs[Math.max(0, index - 1)].id;
            }
            // The new first leg has no predecessor; retain its current inputs.
            mission.legs[0].automatic = { origin: false, departure: false, fuel: false };
            return true;
        }
    };
}
