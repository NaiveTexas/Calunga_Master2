import axios from "axios";
import { DECEA_TIMEOUT_MS } from "../config/index.js";

export const deceaClient = axios.create({
    timeout: DECEA_TIMEOUT_MS
});
