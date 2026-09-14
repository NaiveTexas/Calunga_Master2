import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
export const PORT = Number(process.env.PORT || 3000);

export const DECEA_TIMEOUT_MS = 15_000;
export const CACHE_TTL_MS = 30 * 60 * 1000;
export const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
export const GRAMET_CACHE_TTL_MS = 15 * 60 * 1000;
export const GRAMET_PRESSURE_LEVELS = [1000, 975, 950, 925, 900, 875, 850, 825, 800, 775, 750, 725, 700, 675, 650, 625, 600, 575, 550, 525, 500, 475, 450, 425, 400, 375, 350, 325, 300, 275, 250, 225, 200];
export const GRAMET_MODEL = "NOAA GFS 0.25° via Open-Meteo";
export const GRAMET_SAMPLE_SPACING_NM = 30;
export const GRAMET_MAX_SAMPLES = 20;
export const EARTH_RADIUS_METERS = 6_371_000;


export const config = {
    get aiswebApiKey() { return process.env.AISWEB_API_KEY; },
    get aiswebApiPass() { return process.env.AISWEB_API_PASS; },
    port: PORT,
    get redemetApiKey() { return process.env.REDEMET_API_KEY; }
};
