import test from "node:test";
import assert from "node:assert/strict";
import { testAccess, createApiLimit } from "../middleware/testAccess.js";
test("production access fails closed, accepts correct credentials and rate limits requests", () => {
    const old = { mode: process.env.NODE_ENV, pass: process.env.TEST_ACCESS_PASSWORD, user: process.env.TEST_ACCESS_USER };
    const res = { code: 200, set() { return this; }, status(code) { this.code = code; return this; }, send() {}, json() {} };
    try {
        process.env.NODE_ENV = "production";
        delete process.env.TEST_ACCESS_PASSWORD;
        testAccess({ headers: {} }, res, () => assert.fail());
        assert.equal(res.code, 503);
        process.env.TEST_ACCESS_PASSWORD = "test-only";
        process.env.TEST_ACCESS_USER = "tester";
        testAccess({ headers: {} }, res, () => assert.fail());
        assert.equal(res.code, 401);
        let calls = 0;
        testAccess({ headers: { authorization: "Basic " + Buffer.from("tester:test-only").toString("base64") } }, res, () => calls++);
        assert.equal(calls, 1);
        const limit = createApiLimit(2);
        for (let i = 0; i < 3; i++) limit({}, res, () => calls++);
        assert.equal(calls, 3);
        assert.equal(res.code, 429);
    } finally {
        for (const [key, value] of [["NODE_ENV", old.mode], ["TEST_ACCESS_PASSWORD", old.pass], ["TEST_ACCESS_USER", old.user]]) {
            if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
    }
});
