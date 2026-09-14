import test from "node:test";
import assert from "node:assert/strict";
import { parseNotams } from "../services/notamService.js";

test("NOTAM parser preserves original text, time groups and replacement records", () => {
    const xml = '<aisweb><notam total="2"><item><loc>SBNT</loc><n>B0001/26</n><tp>N</tp><b>2609010000</b><c>PERM</c><d>DAILY 1000-1200</d><e><![CDATA[RWY <TEST> CLSD]]></e></item><item><loc>SBNT</loc><n>B0002/26</n><tp>R</tp><e>TEXT</e></item></notam></aisweb>';
    const reports = parseNotams(xml, "SBNT");
    assert.equal(reports.length, 2);
    assert.equal(reports[0].e, "RWY <TEST> CLSD");
    assert.equal(reports[0].b, "2609010000");
    assert.equal(reports[1].tp, "R");
    assert.deepEqual(parseNotams('<aisweb><notam total="0"/></aisweb>', "SBNT"), []);
    assert.throws(() => parseNotams('<aisweb><error>Invalid credentials</error></aisweb>', "SBNT"));
    assert.throws(() => parseNotams(xml, "SBRF"));
    assert.throws(() => parseNotams('<html>unavailable</html>', "SBNT"));
});
