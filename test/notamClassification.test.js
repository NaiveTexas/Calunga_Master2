import test from "node:test";
import assert from "node:assert/strict";
import { classifyNotam, OTHER_NOTAM_CATEGORY } from "../js/core/notamClassification.js";
test("Q-code classifies subject independently from condition and does not infer from text", () => {
    for (const [cod, category, condition] of [
        ["QMRLC", "Pista", "Fechado"], ["QLEAS", "Iluminação", "Inoperante"],
        ["QPIAU", "IAC", "Indisponível"], ["QMNLC", "Pátio", "Fechado"],
        ["QXXCA", OTHER_NOTAM_CATEGORY, "Ativado"]
    ]) {
        const result = classifyNotam({ cod });
        assert.equal(result.category, category);
        assert.equal(result.condition, condition);
    }
    for (const cod of ["QXXXX", "QZZLC", "invalid", ""]) assert.equal(classifyNotam({ cod, e: "RWY CLSD" }).category, OTHER_NOTAM_CATEGORY);
    assert.equal(classifyNotam({ cod: "QMRXX" }).category, "Pista");
    assert.match(classifyNotam({ cod: "QMRXX" }).condition, /não classificada/);
});
