// Parameters from the REDEMET spreadsheet link; the download happens on REDEMET.
export function redemetPdfAirports(leg) {
    return [...new Set([
        leg.route.origin?.icao,
        leg.route.destination?.icao,
        leg.route.alternate?.icao,
        ...leg.route.waypoints.filter(point => point.type === "AIRPORT").map(point => point.icao)
    ].filter(Boolean))];
}

export function buildRedemetPdfUrl(leg) {
    const airports = redemetPdfAirports(leg);
    const { date, etd } = leg.schedule;
    if (!leg.route.origin?.icao || !leg.route.destination?.icao ||
        airports.some(icao => !/^[A-Z]{4}$/.test(icao)) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(etd) || !/^FL\d{3}$/.test(leg.flightLevel)) return null;
    const [year, month, day] = date.split("-");
    const url = new URL("https://www.redemet.aer.mil.br/old/gera_pdf.php");
    const params = url.searchParams;
    params.set("acao", "autoatendimento");
    params.set("localidades", airports.join(","));
    params.set("nivelvoo", leg.flightLevel.slice(2));
    params.set("datahora", `${day}/${month}/${year.slice(-2)} ${etd}`);
    for (const fir of ["SBAZ", "SBAO", "SBBS", "SBCW", "SBRE"]) params.append("fir[]", fir);
    params.set("fir_extra", "");
    for (const product of ["metar", "taf"]) params.append("msg_met[]", product);
    for (const product of ["sigwx", "vento", "img_sat"]) params.set(product, product);
    return url.href;
}
