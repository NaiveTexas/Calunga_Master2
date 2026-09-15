import { mission, missionLegs } from "../models/missions.js";
import { aircraftFuelUnit, convertMissionFuel } from "./fuelUnits.js";
import { getAircraftModel } from "../database/aircraftModels.js";
import { getAircraftRegistration } from "../database/aircraftRegistrations.js";

export const DRAFT_KEY = "calunga.mission.v1";
const pick = (object, keys) => Object.fromEntries(keys.map(key => [key, object[key]]));
export function serializeMission() {
    return JSON.stringify({
        format: "calunga-mission", version: 1,
        fuelInputUnit: aircraftFuelUnit(mission.aircraft.model),
        aircraft: { model: mission.aircraft.model.name, registration: mission.aircraft.registration.registration },
        crew: mission.crew, settings: mission.settings,
        activeIndex: mission.legs.findIndex(leg => leg.id === mission.activeLegId),
        legs: mission.legs.map(leg => ({
            flightLevel: leg.flightLevel, automatic: leg.automatic, refuel: leg.refuel,
            route: { ...pick(leg.route, ["origin", "destination", "alternate"]), waypoints: leg.route.waypoints },
            schedule: pick(leg.schedule, ["date", "etd"]),
            fuel: pick(leg.fuel, ["onboard", "taxi", "procedure", "reserve", "extra", "manual"]),
            payload: leg.payload
        }))
    }, null, 2);
}

const check = (condition, label) => { if (!condition) throw new Error(`Missão inválida: ${label}.`); };
const number = value => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1e8;
const level = value => typeof value === "string" && /^FL\d{3}$/.test(value) && +value.slice(2) >= 50 && +value.slice(2) <= 450 && +value.slice(2) % 10 === 0;
function point(value, optional = false) {
    if (optional && value == null) return;
    check(value && typeof (value.icao || value.ident) === "string", "identificação do ponto");
    check(number(value.position?.latitude) && Math.abs(value.position.latitude) <= 90 && number(value.position?.longitude) && Math.abs(value.position.longitude) <= 180, "coordenadas");
    check(value.outboundSpeed == null || (number(value.outboundSpeed) && value.outboundSpeed >= 1 && value.outboundSpeed <= 9999), "velocidade");
    check(value.outboundLevel == null || level(value.outboundLevel), "nível do ponto");
    check(value.procedure == null || typeof value.procedure === "boolean", "procedimento");
    check(value.reference == null || typeof value.reference.ident === "string", "referência do aeródromo");
}

export function parseMission(text) {
    check(typeof text === "string" && text.length <= 5_000_000, "tamanho do arquivo");
    const data = JSON.parse(text);
    check(data?.format === "calunga-mission" && data.version === 1, "formato ou versão não suportada");
    // Correct the former registration in saved drafts and imported missions.
    if (data.aircraft?.model === "C-95AM" && data.aircraft.registration === "FAB2291") {
        data.aircraft.registration = "FAB2299";
    }
    const model = getAircraftModel(data.aircraft?.model);
    check(data.fuelInputUnit == null || ["LB", "KG"].includes(data.fuelInputUnit), "unidade dos valores de combustível");
    const registration = getAircraftRegistration(data.aircraft?.registration);
    check(model && model.planningAvailable !== false && registration?.model?.name === model.name, "aeronave ou matrícula");
    check(["LB", "KG"].includes(data.settings?.fuelUnit), "unidade");
    check(Array.isArray(data.crew) && data.crew.length > 0 && data.crew.length <= 100, "tripulação");
    data.crew.forEach(member => check(["1P", "2P", "MC", "NV", "IN NV", "IC", "ML", "IL"].includes(member.role) && number(member.weight) && member.weight >= 0, "tripulante"));
    check(Array.isArray(data.legs) && data.legs.length > 0 && data.legs.length <= 100, "pernas");
    check(Number.isInteger(data.activeIndex) && data.activeIndex >= 0 && data.activeIndex < data.legs.length, "perna selecionada");
    for (const leg of data.legs) {
        check(level(leg.flightLevel) && number(leg.refuel) && leg.refuel >= 0, "nível ou reabastecimento");
        for (const key of ["origin", "departure", "fuel"]) check(typeof leg.automatic?.[key] === "boolean", "vínculo entre pernas");
        check(leg.route && Array.isArray(leg.route.waypoints) && leg.route.waypoints.length <= 1000, "rota");
        for (const key of ["origin", "destination", "alternate"]) point(leg.route[key], true);
        leg.route.waypoints.forEach(value => point(value));
        const date = leg.schedule?.date, etd = leg.schedule?.etd;
        check(typeof date === "string" && (date === "" || (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date)), "data");
        check(typeof etd === "string" && (etd === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(etd)), "decolagem");
        for (const key of ["onboard", "taxi", "procedure", "reserve", "extra"]) check(number(leg.fuel?.[key]), "combustível");
        for (const key of ["taxi", "procedure", "reserve"]) check(typeof leg.fuel.manual?.[key] === "boolean", "combustível manual");
        const payload = leg.payload;
        check(["TOTAL", "AVERAGE", "DETAILED"].includes(payload?.mode), "modo de carga");
        check(number(payload.data?.total?.weight) && payload.data.total.weight >= 0, "carga total");
        for (const key of ["passengers", "passengerWeight", "baggage", "baggageWeight"]) check(number(payload.data.average?.[key]) && payload.data.average[key] >= 0, "carga média");
        for (const [key, label] of [["passengers", "name"], ["cargo", "description"]]) {
            const rows = payload.data.detailed?.[key];
            check(Array.isArray(rows) && rows.length <= 10000, "carga detalhada");
            rows.forEach(row => check(typeof row[label] === "string" && number(row.weight) && row.weight >= 0, "item de carga"));
        }
    }
    // Only accepted input fields are applied; derived results are always recalculated.
    return data;
}

export function restoreMission(data) {
    const template = missionLegs.active();
    const legs = data.legs.map(leg => ({
        flightLevel: leg.flightLevel, automatic: { ...leg.automatic }, refuel: leg.refuel,
        route: { origin: leg.route.origin, destination: leg.route.destination, alternate: leg.route.alternate, waypoints: leg.route.waypoints, distance: 0 },
        schedule: { ...template.schedule, ...pick(leg.schedule, ["date", "etd"]) },
        fuel: { ...template.fuel, ...pick(leg.fuel, ["onboard", "taxi", "procedure", "reserve", "extra", "manual"]) },
        payload: structuredClone(leg.payload), weight: { ...template.weight }
    }));
    legs[0].automatic = { origin: false, departure: false, fuel: false };
    missionLegs.replace(legs, data.activeIndex);
    mission.aircraft.model = getAircraftModel(data.aircraft.model);
    mission.aircraft.registration = getAircraftRegistration(data.aircraft.registration);
    mission.crew = structuredClone(data.crew);
    const unit = aircraftFuelUnit(mission.aircraft.model);
    convertMissionFuel(mission, data.fuelInputUnit || "LB", unit);
    mission.settings.fuelUnit = unit;
}
