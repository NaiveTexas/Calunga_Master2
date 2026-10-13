import { CACHE_TTL_MS } from "../config/index.js";

const responseCache = new Map();
const pendingRequests = new Map();

export async function getCachedResponse(
    key,
    request,
    ttlMs = CACHE_TTL_MS,
    { staleIfErrorMs = 0 } = {}
) {

    const cached = responseCache.get(key);

    if (
        cached &&
        Date.now() - cached.createdAt < ttlMs
    ) {
        return cached.data;
    }

    const pending = pendingRequests.get(key);

    if (pending) {
        return pending;
    }

    const requestPromise = request()
        .then(data => {

            responseCache.set(key, {
                data,
                createdAt: Date.now()
            });

            return data;

        })
        .catch(error => {
            if (cached && staleIfErrorMs > 0 && Date.now() - cached.createdAt < staleIfErrorMs) {
                console.warn(`Usando cache recente de ${key} (${new Date(cached.createdAt).toISOString()}): ${error.message}`);
                return cached.data;
            }
            throw error;
        })
        .finally(() => {
            pendingRequests.delete(key);
        });

    pendingRequests.set(key, requestPromise);

    return requestPromise;

}
