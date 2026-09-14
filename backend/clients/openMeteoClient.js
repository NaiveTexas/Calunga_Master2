import axios from "axios";
import { DECEA_TIMEOUT_MS } from "../config/index.js";

export const grametClient = axios.create({
    baseURL: "https://api.open-meteo.com/v1",
    timeout: DECEA_TIMEOUT_MS
});
