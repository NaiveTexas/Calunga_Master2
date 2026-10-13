import { calculateDistance } from "../utils/helpers.js";
import { fuelAgreementAirports } from "../database/fuelAgreements.js";

const hasPosition = airport => Number.isFinite(airport?.position?.latitude) && Number.isFinite(airport?.position?.longitude);

export function orderAlternateOptions(options, destination) {
    return options.filter(option => option.value.icao !== destination?.icao)
        .map(option => ({ option, preferred: fuelAgreementAirports.has(option.value.icao), distance: hasPosition(destination) && hasPosition(option.value) ? calculateDistance(destination, option.value) : Infinity }))
        .sort((a, b) => Number(b.preferred) - Number(a.preferred) || a.distance - b.distance || a.option.label.localeCompare(b.option.label))
        .map(({ option, distance }) => ({ ...option, label: Number.isFinite(distance)
            ? `${option.label} · ${distance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} NM do destino`
            : option.label }));
}
