// All planning timestamps are UTC, including overnight flights and stopovers.
export function departureTimestamp(schedule) {
    if (!schedule.date || !schedule.etd) return null;
    const value = new Date(`${schedule.date}T${schedule.etd}:00Z`);
    return Number.isNaN(value.getTime()) ? null : value;
}

export function updateArrival(schedule, routeComplete = true) {
    const departure = departureTimestamp(schedule);
    const valid = departure && routeComplete && Number.isFinite(schedule.eet) && schedule.eet > 0;
    const arrival = valid
        ? new Date(Math.round((departure.getTime() + schedule.eet * 3_600_000) / 300_000) * 300_000)
        : null;
    schedule.arrival = arrival?.toISOString() || "";
    schedule.etaDate = schedule.arrival.slice(0, 10);
    schedule.eta = schedule.arrival.slice(11, 16);
}

export function departureAfterArrival(previousSchedule) {
    if (!previousSchedule.arrival) return { date: "", etd: "" };
    const departure = new Date(new Date(previousSchedule.arrival).getTime() + 3_600_000);
    if (Number.isNaN(departure.getTime())) return { date: "", etd: "" };
    const iso = departure.toISOString();
    return { date: iso.slice(0, 10), etd: iso.slice(11, 16) };
}
