const R = 3440.065;
const rad = value => value * Math.PI / 180;
const deg = value => value * 180 / Math.PI;
const coords = point => [point.position.longitude, point.position.latitude];
const valid = point => Number.isFinite(point?.position?.longitude) && Number.isFinite(point?.position?.latitude);
// Naming filter requested for automatic suggestions; this is not an IAF classifier.
// Keep these points available for manual route entry.
export function isSuggestedRouteFix(point) {
    const ident = String(point?.ident || "").trim().toUpperCase();
    return Boolean(ident) && !/^(?=.*[A-Z])(?=.*\d)[A-Z0-9]+$/.test(ident);
}
function angle(a, b) {
    const h = Math.sin(rad(b[1] - a[1]) / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
    return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
const distance = (a, b) => R * angle(a, b);
function bearing(a, b) {
    const x = rad(a[1]), y = rad(b[1]), delta = rad(b[0] - a[0]);
    return Math.atan2(Math.sin(delta) * Math.cos(y), Math.cos(x) * Math.sin(y) - Math.sin(x) * Math.cos(y) * Math.cos(delta));
}
function along(point, a, b) {
    const d = angle(a, point);
    return R * Math.atan2(Math.sin(d) * Math.cos(bearing(a, point) - bearing(a, b)), Math.cos(d));
}
function segmentDistance(point, a, b) {
    const progress = along(point, a, b);
    if (progress < 0) return distance(point, a);
    if (progress > distance(a, b)) return distance(point, b);
    return R * Math.abs(Math.asin(Math.max(-1, Math.min(1, Math.sin(angle(a, point)) * Math.sin(bearing(a, point) - bearing(a, b))))));
}
function polygons(geometry) {
    if (geometry?.type === "Polygon") return [geometry.coordinates];
    if (geometry?.type === "MultiPolygon") return geometry.coordinates;
    return [];
}
function insideRing(point, ring) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [ax, ay] = ring[i], [bx, by] = ring[j];
        if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
    }
    return inside;
}
function inside(point, geometry) {
    return polygons(geometry).some(rings => insideRing(point, rings[0]) && !rings.slice(1).some(ring => insideRing(point, ring)));
}
function boundaryDistance(point, geometry) {
    let minimum = Infinity;
    for (const rings of polygons(geometry)) for (const ring of rings) {
        for (let i = 1; i < ring.length; i++) minimum = Math.min(minimum, segmentDistance(point, ring[i - 1], ring[i]));
    }
    return minimum;
}
function interpolate(a, b, fraction) {
    const arc = angle(a, b);
    const vector = ([lon, lat]) => [Math.cos(rad(lat)) * Math.cos(rad(lon)), Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat))];
    const va = vector(a), vb = vector(b);
    const v = va.map((value, i) => (Math.sin((1 - fraction) * arc) * value + Math.sin(fraction * arc) * vb[i]) / Math.sin(arc));
    return [deg(Math.atan2(v[1], v[0])), deg(Math.atan2(v[2], Math.hypot(v[0], v[1])))];
}

function requiresEntry(a, b, geometry, ignoredAreas = []) {
    const length = distance(a, b);
    if (length < .01) return false;
    const steps = Math.ceil(length * 4);
    let previous = inside(a, geometry);
    for (let i = 1; i <= steps; i++) {
        const current = inside(interpolate(a, b, i / steps), geometry);
        if (current && !previous) {
            let low = (i - 1) / steps, high = i / steps;
            for (let j = 0; j < 12; j++) {
                const mid = (low + high) / 2;
                if (inside(interpolate(a, b, mid), geometry)) high = mid; else low = mid;
            }
            const crossing = interpolate(a, b, high);
            if (!ignoredAreas.some(area => inside(crossing, area.geometry))) return true;
        }
        previous = current;
    }
    return false;
}

// Caller supplies eligible fixes; geometric proximity cannot establish IAC eligibility.
export function suggestRoute(origin, destination, fixes, terminals) {
    if (!valid(origin) || !valid(destination)) throw new Error("Selecione origem e destino válidos.");
    const a = coords(origin), b = coords(destination), direct = distance(a, b);
    if (direct < .01) return { points: [], direct, total: direct, selections: [] };
    const steps = Math.ceil(direct * 2); // Half-NM samples, then refine each entry.
    const path = Array.from({ length: steps + 1 }, (_, i) => interpolate(a, b, i / steps));
    const tmas = terminals.filter(terminal => terminal.properties?.typ === "TMA");
    const entries = [];
    for (const terminal of terminals) {
        let previous = inside(path[0], terminal.geometry);
        for (let i = 1; i <= steps; i++) {
            const current = inside(path[i], terminal.geometry);
            if (current && !previous) {
                let low = (i - 1) / steps, high = i / steps;
                for (let j = 0; j < 12; j++) {
                    const mid = (low + high) / 2;
                    if (inside(interpolate(a, b, mid), terminal.geometry)) high = mid; else low = mid;
                }
                const crossing = interpolate(a, b, high);
                if (terminal.properties?.typ !== "SECTOR" || !tmas.some(tma => inside(crossing, tma.geometry))) {
                    entries.push({ terminal, progress: high * direct, crossing });
                }
            }
            previous = current;
        }
    }
    const destinationTerminals = terminals.filter(terminal => terminal.properties?.typ === "TMA" && inside(b, terminal.geometry));
    // Stop at the final entry into a destination TMA, not at a FIR sector entry.
    const arrivalEntries = destinationTerminals.map(terminal => entries.filter(entry => entry.terminal === terminal).at(-1)).filter(Boolean);
    const alreadyInside = destinationTerminals.some(terminal => inside(a, terminal.geometry) && !entries.some(entry => entry.terminal === terminal));
    const arrivalProgress = alreadyInside ? 0 : Math.min(Infinity, ...arrivalEntries.map(entry => entry.progress));
    entries.sort((x, y) => x.progress - y.progress || Number(destinationTerminals.includes(y.terminal)) - Number(destinationTerminals.includes(x.terminal)));
    const points = [], selections = [], selectedSpaces = [], used = new Set();
    let previous = a, total = direct;
    for (const entry of entries) {
        if (alreadyInside || entry.progress > arrivalProgress + 1e-6) break;
        // One selected fix can mark coincident TMA/sector boundaries.
        if (points.some(fix => distance(coords(fix), entry.crossing) < 20 && boundaryDistance(coords(fix), entry.terminal.geometry) < .25)) continue;
        const candidates = [];
        for (const fix of fixes) {
            if (!valid(fix) || !isSuggestedRouteFix(fix) || used.has(fix.ident)) continue;
            const point = coords(fix), progress = along(point, a, b);
            if (progress <= along(previous, a, b) || progress >= direct) continue;
            // Limit to the arrival side of the terminal: near this entry, not another boundary.
            if (distance(point, entry.crossing) > 20) continue;
            const extra = distance(previous, point) + distance(point, b) - distance(previous, b);
            if (extra > 15 + 1e-9) continue;
            const boundary = boundaryDistance(point, entry.terminal.geometry);
            if (boundary >= 20) continue;
            candidates.push({ fix, extra, boundary });
        }
        // Treat sub-quarter-NM boundary differences as chart precision, then minimize detour.
        candidates.sort((x, y) => Math.floor(x.boundary / .25) - Math.floor(y.boundary / .25) || x.extra - y.extra || x.fix.ident.localeCompare(y.fix.ident));
        if (!candidates.length) continue;
        const selected = candidates[0];
        points.push(structuredClone(selected.fix));
        selectedSpaces.push(entry.terminal);
        used.add(selected.fix.ident);
        selections.push({ ident: selected.fix.ident, terminal: entry.terminal.properties?.nam, extra: selected.extra, boundary: selected.boundary });
        total += selected.extra;
        previous = coords(selected.fix);
    }
    // Later choices can avoid a sector that the initial direct line crossed.
    // Remove a point if bypassing it does not require entry into its target space.
    let changed;
    do {
        changed = false;
        for (let i = points.length - 1; i >= 0; i--) {
            const before = i ? coords(points[i - 1]) : a;
            const after = i + 1 < points.length ? coords(points[i + 1]) : b;
            const ignoredAreas = selectedSpaces[i].properties?.typ === "SECTOR" ? tmas : [];
            if (!requiresEntry(before, after, selectedSpaces[i].geometry, ignoredAreas)) {
                points.splice(i, 1);
                selections.splice(i, 1);
                selectedSpaces.splice(i, 1);
                changed = true;
            }
        }
        total = direct;
        previous = a;
        for (let i = 0; i < points.length; i++) {
            const point = coords(points[i]);
            const extra = distance(previous, point) + distance(point, b) - distance(previous, b);
            if (extra > 15 + 1e-9) {
                points.splice(i, 1); selections.splice(i, 1); selectedSpaces.splice(i, 1); i--;
                changed = true;
                continue;
            }
            selections[i].extra = extra;
            total += extra;
            previous = point;
        }
    } while (changed);
    return { points, direct, total, selections };
}
