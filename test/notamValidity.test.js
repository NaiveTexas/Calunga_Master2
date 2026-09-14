import test from "node:test";
import assert from "node:assert/strict";
import { notamValidity, notamLegValidity, formatNotamDate } from "../js/core/notamValidity.js";
test("overall validity handles UTC boundaries, PERM, estimated ends and malformed dates", () => {
    const now = Date.parse("2026-09-12T12:00:00Z");
    const classify = (b, c, tp = "N") => notamValidity({ b, c, tp }, now);
    assert.equal(classify("2609121200", "2609121300"), "Válidos");
    assert.equal(classify("2609121201", "PERM"), "Futuros");
    assert.equal(classify("2609111200", "2609121200"), "Encerrados");
    assert.equal(classify("2609111200", "2609121200 EST"), "Conferir validade");
    assert.equal(classify("2609111200", "PERM"), "Válidos");
    assert.equal(classify("2602301200", "PERM"), "Conferir validade");
    assert.equal(classify("", "PERM"), "Conferir validade");
    assert.equal(classify("2609111200", "PERM", "C"), "Encerrados");
});

test("leg window must overlap B/C and a supported D period in UTC", () => {
    const report = { b: "2609010000", c: "2609302359" };
    const leg = (date, etd, arrival) => ({ schedule: { date, etd, arrival } });
    const saturday = leg("2026-09-12", "13:00", "2026-09-12T15:00:00Z");
    const result = d => notamLegValidity({ ...report, d }, saturday);
    assert.equal(result("DAILY 1400-1600"), "Válidos");
    assert.equal(result("DLY 1000-1200"), "Fora do período");
    assert.equal(result("MON-FRI 1200-1600"), "Fora do período");
    assert.equal(result("SAT SUN 1200-1600"), "Válidos");
    assert.equal(result("SEP 12-14 1400-1600"), "Válidos");
    assert.equal(result("13 14 1400-1600"), "Fora do período");
    assert.equal(result("12 14 1400-1600"), "Válidos");
    assert.equal(result("DAILY 0800-1000 1400-1600"), "Válidos");
    assert.equal(result("SEP 11 1400-1600, SEP 12 1200-1400"), "Válidos");
    for (const d of ["SR-SS", "DAILY 1200-1600 EXC SAT", "DAILY 1260-1600", "UNKNOWN", "DAILY 1200-1600, SR-SS"]) assert.equal(result(d), "Conferir validade");
    assert.equal(notamLegValidity({ ...report, d: "FRI 2200-0200" }, leg("2026-09-12", "01:00", "2026-09-12T03:00:00Z")), "Válidos");
    assert.equal(notamLegValidity({ ...report, d: "FRI 2200-0200" }, leg("2026-09-12", "02:00", "2026-09-12T03:00:00Z")), "Fora do período");
    assert.equal(notamLegValidity({ ...report, b: "2609130000" }, saturday), "Futuros");
    assert.equal(notamLegValidity({ ...report, c: "2609121200EST" }, saturday), "Conferir validade");
    assert.equal(notamLegValidity(report, {}), "Conferir validade");
    assert.equal(formatNotamDate("2609121200EST"), "12-09-2026 às 12:00 UTC (término estimado)");
    assert.equal(formatNotamDate("PERM"), "Permanente");
});
