import test from "node:test";
import assert from "node:assert/strict";
import { suggestRoute, isSuggestedRouteFix } from "../js/core/suggestedRoute.js";
const point = (ident, longitude, latitude = 0) => ({ type: "FIX", ident, position: { longitude, latitude } });
const terminal = { properties: { nam: "Test" }, geometry: { type: "Polygon", coordinates: [[[2, -2], [4, -2], [4, 2], [2, 2], [2, -2]]] } };

test("automatic suggestions omit numbered procedure-style points but retain named fixes", () => {
    for (const ident of ["NTL363", "YS011", "UL003", " ys011 "]) assert.equal(isSuggestedRouteFix({ ident }), false);
    for (const ident of ["PAGUE", "UBTAT", "OGVOT"]) assert.equal(isSuggestedRouteFix({ ident }), true);
    const result = suggestRoute(point("A", 0), point("B", 5), [point("YS011", 2), point("PAGUE", 2, .01)], [terminal]);
    assert.deepEqual(result.points.map(p => p.ident), ["PAGUE"]);
});

test("a later terminal entry removes a detour into a sector no longer crossed", () => {
    const sector = { properties: { typ: "SECTOR" }, geometry: { type: "Polygon", coordinates: [[[2, -.005], [2.15, -.005], [2.15, .2], [2, .2], [2, -.005]]] } };
    const arrival = { properties: { typ: "TMA" }, geometry: { type: "Polygon", coordinates: [[[2.4, -2], [6, -2], [6, 2], [2.4, 2], [2.4, -2]]] } };
    const result = suggestRoute(point("A", 0), point("B", 5), [point("UNNEEDED", 2), point("ARRIVAL", 2.4, -.25)], [sector, arrival]);
    assert.deepEqual(result.points.map(p => p.ident), ["ARRIVAL"]);
    assert.ok(result.selections[0].extra <= 15);
});

test("after destination TMA entry, internal FIR sectors add no further fixes", () => {
    const arrival = { properties: { typ: "TMA", nam: "Arrival" }, geometry: { type: "Polygon", coordinates: [[[2, -2], [6, -2], [6, 2], [2, 2], [2, -2]]] } };
    const sector = { properties: { typ: "SECTOR" }, geometry: { type: "Polygon", coordinates: [[[3, -2], [6, -2], [6, 2], [3, 2], [3, -2]]] } };
    const fixes = [point("ENTRY", 2), point("INTERNAL", 3)];
    assert.deepEqual(suggestRoute(point("A", 0), point("B", 5), fixes, [arrival, sector]).points.map(p => p.ident), ["ENTRY"]);
    assert.deepEqual(suggestRoute(point("A", 0), point("B", 5), [fixes[1]], [arrival, sector]).points, []);
    assert.deepEqual(suggestRoute(point("A", 2.5), point("B", 5), fixes, [arrival, sector]).points, []);
});

test("suggestion prefers the entry boundary, excludes detours and does not mutate inputs", () => {
    const points = [point("INSIDE", 2.2), point("BOUNDARY", 2, .01), point("DETOUR", 2, 1)];
    const result = suggestRoute(point("ORIGIN", 0), point("DEST", 5), points, [terminal]);
    assert.deepEqual(result.points.map(p => p.ident), ["BOUNDARY"]);
    assert.ok(result.selections.every(s => s.extra <= 15 && s.boundary < 20));
    result.points[0].ident = "CHANGED";
    assert.equal(points[1].ident, "BOUNDARY");
});

test("no eligible fix keeps direct route and duplicate terminals do not duplicate fixes", () => {
    const a = point("A", 0), b = point("B", 5);
    assert.deepEqual(suggestRoute(a, b, [], [terminal]).points, []);
    const result = suggestRoute(a, b, [point("FIX", 2)], [terminal, terminal]);
    assert.equal(result.points.length, 1);
    assert.deepEqual(suggestRoute(a, a, [], [terminal]).points, []);
    assert.throws(() => suggestRoute(null, b, [], [terminal]), /origem e destino/);
});

test("FIR sector entries add fixes alongside TMA entries in flight order", () => {
    const sector = { properties: { nam: "FIR sector" }, geometry: { type: "Polygon", coordinates: [[[3, -2], [6, -2], [6, 2], [3, 2], [3, -2]]] } };
    const result = suggestRoute(point("A", 0), point("B", 5), [point("TMAFIX", 2), point("SECTORFIX", 3)], [sector, terminal]);
    assert.deepEqual(result.points.map(p => p.ident), ["TMAFIX", "SECTORFIX"]);
    assert.equal(result.selections[1].terminal, "FIR sector");
});

test("intermediate TMA suppresses internal sector boundaries but keeps later external ones", () => {
    const tma = { ...terminal, properties: { typ: "TMA", nam: "Intermediate" } };
    const sector = (start, name) => ({ properties: { typ: "SECTOR", nam: name }, geometry: { type: "Polygon", coordinates: [[[start, -2], [7, -2], [7, 2], [start, 2], [start, -2]]] } });
    const fixes = [point("ENTRY", 2), point("INTERNAL", 3), point("OUTSIDE", 5)];
    const result = suggestRoute(point("A", 0), point("B", 6), fixes, [tma, sector(3, "Inner"), sector(5, "Outer")]);
    assert.deepEqual(result.points.map(p => p.ident), ["ENTRY", "OUTSIDE"]);
});
