const WEATHER_BRIEFING_URL =
    "/api/weather/briefing";

export async function loadWeatherBriefing(airports) {

    const query = new URLSearchParams({
        airports: airports.join(",")
    });

    const response = await fetch(
        `${WEATHER_BRIEFING_URL}?${query}`
    );

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(
            payload.message ||
            "Não foi possível carregar METAR e TAF."
        );
    }

    return payload.airports;

}
