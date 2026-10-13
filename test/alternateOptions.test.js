import test from "node:test";
import assert from "node:assert/strict";
import { orderAlternateOptions } from "../js/core/alternateOptions.js";

test("alternates use current destination distance without modifying the airport list", () => {
    const option = (icao, longitude) => ({ label: icao, value: { icao, position: { latitude: 0, longitude } } });
    const options = [option("FAR", 10), option("NEAR", 1), option("DEST", 0), { label: "UNKNOWN", value: { icao: "UNKNOWN" } }];
    const result = orderAlternateOptions(options, options[2].value);
    assert.deepEqual(result.map(item => item.value.icao), ["NEAR", "FAR", "UNKNOWN"]);
    assert.match(result[0].label, /NM do destino/);
    assert.equal(options[0].label, "FAR");
    assert.equal(orderAlternateOptions(options, null).length, options.length);
    assert.equal(orderAlternateOptions(options, option("OTHER", 9).value)[0].value.icao, "FAR");
});

test("agreement airports precede nearer non-agreement airports and both groups use distance", () => {
    const option = (icao, longitude) => ({ label: icao, value: { icao, position: { latitude: 0, longitude } } });
    const options = [option("TEST", .1), option("SBYS", 4), option("NONE", 2), option("SBRF", 1)];
    const sorted = orderAlternateOptions(options, option("DEST", 0).value);
    assert.deepEqual(sorted.map(item => item.value.icao), ["SBRF", "SBYS", "TEST", "NONE"]);
    assert.equal(orderAlternateOptions([options[0]], option("DEST", 0).value)[0].value.icao, "TEST");
});
