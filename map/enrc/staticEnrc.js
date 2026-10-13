import TileLayer from "ol/layer/Tile.js";
import XYZ from "ol/source/XYZ.js";
import { transformExtent } from "ol/proj.js";

import { createPmtilesEnrc } from './pmtilesEnrc.js';

export function staticEnrcVisibility(manifest, zoom, type, failed = false) {
    const visible = Boolean(manifest && !failed && type === (manifest.type || 'LOW') && zoom >= manifest.minZoom);
    return { visible, replaceWms: visible && zoom <= manifest.maxZoom };
}

export async function loadStaticEnrc(url = '/enrc-static/manifest.json') {
    try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) return null;
        const data = await response.json();
        return (data.charts || [data]).filter(manifest => /^ENRC_[LH]\d+$/.test(manifest.chart) && Array.isArray(manifest.extent) && manifest.extent.length === 4).map(manifest => {
        if (manifest.format === 'pmtiles') return createPmtilesEnrc(manifest);
        const layer = new TileLayer({
            visible: false,
            extent: transformExtent(manifest.extent, 'EPSG:4326', 'EPSG:3857'),
            preload: 0,
            cacheSize: 64,
            source: new XYZ({ url: manifest.url, minZoom: manifest.minZoom, maxZoom: manifest.maxZoom,
                tilePixelRatio: manifest.tilePixelRatio, transition: 0, wrapX: false })
        });
        return { manifest, layer, failed: false };
        });
    } catch { return null; }
}
