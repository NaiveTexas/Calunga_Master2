import { searchNavigationPoints } from "./navigation.js";

// Explicit associations only; do not infer a procedure reference by proximity.
// SBFZ RDONAV: https://aisweb.decea.mil.br/?i=aerodromos&codigo=SBFZ
const references = { SBFZ: { ident: "FLZ", type: "VOR" } };

export function getAirportReference(icao) {
    const reference = references[icao];
    if (!reference) return null;
    const matches = searchNavigationPoints(reference.ident).filter(point =>
        point.ident === reference.ident && point.type === reference.type
    );
    return matches.length === 1 ? structuredClone(matches[0]) : null;
}
