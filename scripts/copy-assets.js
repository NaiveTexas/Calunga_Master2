import { cpSync } from "node:fs";
cpSync(new URL("../assets/aircrafts/", import.meta.url), new URL("../dist/assets/aircrafts/", import.meta.url), { recursive: true });
