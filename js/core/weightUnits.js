import { LB_TO_KG } from "../utils/helpers.js";

// Stored mission weights, registration weights and model limits remain in KG.
// Convert only at input/output boundaries so existing missions keep their mass.
export const aircraftWeightUnit = model => model?.weightUnit === "LB" ? "LB" : "KG";
export const displayWeight = (kg, model) => aircraftWeightUnit(model) === "LB" ? kg / LB_TO_KG : kg;
export const inputWeightKg = (value, model) => aircraftWeightUnit(model) === "LB" ? Number(value) * LB_TO_KG : Number(value);
export const weightInputValue = (kg, model) => Number(displayWeight(kg, model).toFixed(2));
export function formatWeight(kg, model, rounding = Math.round) {
    return Number.isFinite(kg) ? `${rounding(displayWeight(kg, model)).toLocaleString("pt-BR")} ${aircraftWeightUnit(model)}` : "Não informado";
}
