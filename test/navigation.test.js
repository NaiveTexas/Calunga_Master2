import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseHTML } from "linkedom";
import { initializeNavigation } from "../js/ui/navigation.js";

test("fourth sidebar button opens independent NOTAM workspace and closes other sections", () => {
    const { window, document } = parseHTML(readFileSync(new URL("../index.html", import.meta.url), "utf8"));
    globalThis.window = window;
    globalThis.document = document;
    initializeNavigation();
    const buttons = [...document.querySelectorAll(".sidebar-button")];
    assert.equal(buttons[3].dataset.tool, "notam");
    const panel = document.getElementById("notamPage");
    assert.equal(panel.parentElement, document.querySelector(".app-main"));
    assert.equal(document.querySelector('[data-weather-page="notamPage"]'), null);
    buttons[3].click();
    assert.equal(panel.classList.contains("active"), true);
    buttons[1].click();
    assert.equal(panel.classList.contains("active"), false);
    buttons[3].click();
    assert.equal(document.getElementById("weatherPanel").classList.contains("active"), false);
    document.getElementById("closeNotams").click();
    assert.equal(panel.classList.contains("active"), false);
    buttons[3].click();
    buttons[3].click();
    assert.equal(panel.classList.contains("active"), false);
});
