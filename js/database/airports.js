//==========================================//
//           AIRPORT DATABASE               //
//==========================================//

let airports = [];


//==========================================//
//           LOAD AIRPORTS                  //
//==========================================//

export async function loadAirports() {

    const response =
        await fetch(
            "/api/navigation/airports"
        );


    if (!response.ok) {

        throw new Error(
            "Erro ao carregar aeródromos"
        );

    }


    airports =
        await response.json();

}


//==========================================//
//           AIRPORT FUNCTION               //
//==========================================//

export function getAirport(icao) {

    if (!icao) {
        return undefined;
    }


    return airports.find(
        airport =>
            airport.icao ===
            icao.toUpperCase()
    );

}


//==========================================//
//           AIRPORT LIST                   //
//==========================================//

export function getAirportList() {

    return airports.map(
        airport => ({

            label:
                `${airport.icao} - ${airport.name}`,

            value:
                airport

        })
    );

}


//==========================================//
//           PUBLIC API                     //
//==========================================//

export function searchAirports(query) {

    const normalizedQuery =
        query
            .trim()
            .toUpperCase();

    if (!normalizedQuery) {
        return [];
    }

    return airports.filter(
        airport =>
            airport.icao
                ?.toUpperCase()
                .includes(normalizedQuery) ||

            airport.name
                ?.toUpperCase()
                .includes(normalizedQuery) ||

            airport.city
                ?.toUpperCase()
                .includes(normalizedQuery)
    );

}
