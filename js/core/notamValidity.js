export function timestamp(value, now = Date.now()) {
    if (!/^\d{10}$/.test(value)) return NaN;
    const parts = value.match(/\d{2}/g).map(Number);
    const currentYear = new Date(now).getUTCFullYear();
    let year = Math.floor(currentYear / 100) * 100 + parts[0];
    if (year - currentYear > 50) year -= 100;
    if (currentYear - year > 50) year += 100;
    const date = new Date(Date.UTC(year, parts[1] - 1, parts[2], parts[3], parts[4]));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== parts[1] - 1 || date.getUTCDate() !== parts[2] || date.getUTCHours() !== parts[3] || date.getUTCMinutes() !== parts[4]) return NaN;
    return date.getTime();
}

export function formatNotamDate(value) {
    const raw = String(value || "").trim().toUpperCase();
    if (raw === "PERM") return "Permanente";
    const time = timestamp(raw.replace(/\s*EST$/, ""));
    if (!Number.isFinite(time)) return raw || "Não informado";
    const iso = new Date(time).toISOString();
    return `${iso.slice(0, 10).split("-").reverse().join("-")} às ${iso.slice(11, 16)} UTC${raw.endsWith("EST") ? " (término estimado)" : ""}`;
}

const DAY = 86400000;
const weekdays = "SUN MON TUE WED THU FRI SAT".split(" ");
const months = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");
function minute(text) {
    if (text === "2400") return 1440;
    return /^(?:[01]\d|2[0-3])[0-5]\d$/.test(text) ? +text.slice(0, 2) * 60 + +text.slice(2) : NaN;
}
function daySelector(selector, start, end) {
    if (!selector || /^(DLY|DAILY|H24)$/.test(selector)) return () => true;
    const days = new Set();
    if (/^(SUN|MON|TUE|WED|THU|FRI|SAT)(?:\s|-|SUN|MON|TUE|WED|THU|FRI|SAT)*$/.test(selector)) {
        for (const token of selector.split(/\s+/)) {
            const [a, b = a] = token.split("-").map(day => weekdays.indexOf(day));
            if (a < 0 || b < 0) return null;
            for (let d = a;; d = (d + 1) % 7) { days.add(d); if (d === b) break; }
        }
        return date => days.has(date.getUTCDay());
    }
    const match = selector.match(/^(?:(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) )?(\d{2}(?:-\d{2})?(?: \d{2}(?:-\d{2})?)*)$/);
    if (!match) return null;
    const first = new Date(start), last = new Date(end);
    if (!match[1] && (first.getUTCFullYear() !== last.getUTCFullYear() || first.getUTCMonth() !== last.getUTCMonth())) return null;
    const month = match[1] ? months.indexOf(match[1]) : first.getUTCMonth();
    // Month/day without a year is ambiguous over intervals longer than a year.
    if (!Number.isFinite(end) || end - start > 366 * DAY) return null;
    for (const token of match[2].split(" ")) {
        const [a, b = a] = token.split("-").map(Number);
        if (a < 1 || b > 31 || b < a) return null;
        for (let d = a; d <= b; d++) days.add(d);
    }
    return date => date.getUTCMonth() === month && days.has(date.getUTCDate());
}

// Unsupported schedules (solar times, exceptions, free text) stay uncertain.
export function scheduleOverlaps(raw, from, to, validityStart, validityEnd) {
    const text = String(raw || "").trim().toUpperCase().replace(/\bTIL\b/g, "-").replace(/\s*-\s*/g, "-").replace(/\bAND\b/g, " ");
    if (!text || text === "H24") return true;
    if (to - from > 367 * DAY) return null;
    let hit = false;
    for (const chunk of text.split(/[,;\n]+/)) {
        const clause = chunk.trim().replace(/\s+/g, " ");
        const match = clause.match(/^(.*?)\s*(\d{4}-\d{4}(?: \d{4}-\d{4})*|H24)$/);
        if (!match) return null;
        const selects = daySelector(match[1].trim(), validityStart, validityEnd);
        if (!selects) return null;
        for (const range of (match[2] === "H24" ? "0000-2400" : match[2]).split(" ")) {
            const [a, b] = range.split("-").map(minute);
            if (!Number.isFinite(a) || !Number.isFinite(b) || a === 1440 || a === b) return null;
            for (let day = Math.floor(from / DAY) * DAY - DAY; day <= to; day += DAY) {
                if (!selects(new Date(day))) continue;
                const begin = Math.max(day + a * 60000, validityStart);
                const finish = Math.min(day + b * 60000 + (b < a ? DAY : 0), validityEnd);
                if (begin < finish && begin <= to && finish > from) hit = true;
            }
        }
    }
    return hit;
}

export function notamLegValidity(report, leg) {
    if (report.tp === "C") return "Encerrados";
    const schedule = leg.schedule || {};
    const from = Date.parse(`${schedule.date}T${schedule.etd}:00Z`);
    const to = Date.parse(schedule.arrival || `${schedule.etaDate}T${schedule.eta}:00Z`);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return "Conferir validade";
    const start = timestamp(String(report.b || "").trim(), from);
    const rawEnd = String(report.c || "").trim().toUpperCase();
    const end = rawEnd === "PERM" ? Infinity : timestamp(rawEnd.replace(/\s*EST$/, ""), from);
    if (!Number.isFinite(start) || Number.isNaN(end) || end <= start) return "Conferir validade";
    if (start > to) return "Futuros";
    if (rawEnd.endsWith("EST") && to >= end) return "Conferir validade";
    if (end <= from) return "Encerrados";
    const overlap = scheduleOverlaps(report.d, Math.max(from, start), Math.min(to, end), start, end);
    return overlap === null ? "Conferir validade" : overlap ? "Válidos" : "Fora do período";
}

// Overall validity B/C only. D remains visible for checking activity periods.
export function notamValidity(report, now = Date.now()) {
    if (report.tp === "C") return "Encerrados";
    const start = timestamp(String(report.b || "").trim(), now);
    const rawEnd = String(report.c || "").trim().toUpperCase();
    const estimated = /EST$/.test(rawEnd);
    const end = rawEnd === "PERM" ? Infinity : timestamp(rawEnd.replace(/\s*EST$/, ""), now);
    if (!Number.isFinite(start) || Number.isNaN(end) || end <= start) return "Conferir validade";
    if (now < start) return "Futuros";
    if (now < end) return "Válidos";
    return estimated ? "Conferir validade" : "Encerrados";
}
