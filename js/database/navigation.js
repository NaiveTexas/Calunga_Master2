//==========================================//
//        NAVIGATION DATABASE               //
//==========================================//

let navigationFixes = [];
let navigationVORs = [];


//==========================================//
//             FIX FUNCTIONS                //
//==========================================//

export async function loadNavigationFixes() {

    const response =
        await fetch(
            "/api/navigation/fixes"
        );

    if (!response.ok) {

        throw new Error(
            "Não foi possível carregar os FIXs."
        );

    }

    navigationFixes =
        await response.json();

}

export async function loadNavigationVORs() {

    const response =
        await fetch(
            "/api/navigation/vors"
        );

    if (!response.ok) {

        throw new Error(
            "Não foi possível carregar os VORs."
        );

    }

    navigationVORs =
        await response.json();

}

//==========================================//
//             SEARCH FUNCTIONS             //
//==========================================//
function sortNavigationPoints(points) {

    return [...points].sort((a, b) => {

        const aIdent =
            a.ident.toUpperCase();

        const bIdent =
            b.ident.toUpperCase();


        // Primeiro: menor quantidade de caracteres
        if (aIdent.length !== bIdent.length) {

            return aIdent.length - bIdent.length;

        }


        // Depois: ordem alfabética
        return aIdent.localeCompare(
            bIdent,
            undefined,
            {
                sensitivity: "base"
            }
        );

    });

}


export function getFix(ident) {

    return navigationFixes.find(
        fix =>
            fix.ident === ident
    );

}


export function searchFixes(query) {

    const normalizedQuery =
        query
            .trim()
            .toUpperCase();

    if (!normalizedQuery) {
        return [];
    }

    return sortNavigationPoints(
        navigationFixes.filter(
            fix =>
                fix.ident
                    ?.toUpperCase()
                    .includes(normalizedQuery)
        )
    );

}

export function searchVORs(query) {

    const normalizedQuery =
        query
            .trim()
            .toUpperCase();

    if (!normalizedQuery) {
        return [];
    }

    return sortNavigationPoints(
        navigationVORs.filter(
            vor =>
                vor.ident
                    ?.toUpperCase()
                    .includes(normalizedQuery)
        )
    );

}

export function searchNavigationPoints(query) {

    return sortNavigationPoints([
        ...searchFixes(query),
        ...searchVORs(query)
    ]);

}

