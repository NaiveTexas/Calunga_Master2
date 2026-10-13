// Bounded in-memory cache: do not retain whole axios responses or error pages.
export function createChartTileCache(maxBytes = 64 * 1024 * 1024, ttlMs = 30 * 60 * 1000) {
    const entries = new Map(), pending = new Map();
    let bytes = 0;
    return async (key, request) => {
        const cached = entries.get(key);
        if (cached) {
            entries.delete(key);
            if (Date.now() - cached.createdAt < ttlMs) {
                entries.set(key, cached);
                return cached.value;
            }
            bytes -= cached.size;
        }
        if (pending.has(key)) return pending.get(key);
        const promise = Promise.resolve().then(request).then(response => {
            const type = response.headers?.["content-type"] || "";
            const size = response.data?.byteLength;
            const value = { data: response.data, headers: { "content-type": type } };
            if (type.startsWith("image/") && size > 0 && size <= maxBytes) {
                while (bytes + size > maxBytes && entries.size) {
                    const oldest = entries.keys().next().value;
                    bytes -= entries.get(oldest).size;
                    entries.delete(oldest);
                }
                entries.set(key, { value, size, createdAt: Date.now() }); bytes += size;
            }
            return value;
        }).finally(() => pending.delete(key));
        pending.set(key, promise);
        return promise;
    };
}
