export function buildOgimetGrametUrl(leg) {
    const origin = leg.route.origin?.icao;
    const destination = leg.route.destination?.icao;
    if (!/^[A-Z]{4}$/.test(origin || "") || !/^[A-Z]{4}$/.test(destination || "") || !/^FL\d{3}$/.test(leg.flightLevel || "")) return null;
    const url = new URL("https://www.ogimet.com/display_gramet.php");
    url.search = new URLSearchParams({ icao: `${origin}_${destination}`, hini: "0", tref: "", hfin: "0", fl: leg.flightLevel.slice(2), enviar: "Enviar" }).toString();
    return url.href;
}
