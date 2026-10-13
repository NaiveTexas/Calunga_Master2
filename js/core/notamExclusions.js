// Include issue validity and text so replacements/revisions are not silently excluded.
export function notamKey(report, airport = "") {
    return JSON.stringify([report.loc || airport, report.n || "", report.b || "", report.c || "", report.d || "", report.e || ""]);
}

export function isNotamExcluded(settings, report, airport = "") {
    return (settings.excludedNotams || []).includes(notamKey(report, airport));
}

export function setNotamExcluded(settings, report, airport, excluded) {
    const keys = new Set(settings.excludedNotams || []);
    const key = notamKey(report, airport);
    if (excluded) keys.add(key); else keys.delete(key);
    settings.excludedNotams = [...keys];
}
