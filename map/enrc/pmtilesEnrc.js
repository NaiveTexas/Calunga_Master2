import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';
import TileState from 'ol/TileState.js';
import { transformExtent } from 'ol/proj.js';
import { PMTiles } from 'pmtiles';

export async function loadArchiveTile(tile, archive) {
    try {
        const [z, x, y] = tile.getTileCoord();
        const response = await archive.getZxy(z, x, y);
        if (!response?.data) throw new Error('Bloco ausente no PMTiles');
        const url = URL.createObjectURL(new Blob([response.data], { type: 'image/png' }));
        const image = tile.getImage();
        const cleanup = () => {
            URL.revokeObjectURL(url);
            image.removeEventListener('load', cleanup);
            image.removeEventListener('error', cleanup);
        };
        image.addEventListener('load', cleanup);
        image.addEventListener('error', cleanup);
        image.src = url;
    } catch {
        tile.setState(TileState.ERROR);
    }
}

export function createPmtilesEnrc(manifest) {
    const archive = new PMTiles(manifest.url);
    const source = new XYZ({
        minZoom: manifest.minZoom, maxZoom: manifest.maxZoom,
        tilePixelRatio: manifest.tilePixelRatio, transition: 0, wrapX: false,
        tileUrlFunction: coord => coord ? `${manifest.url}#${coord.join('/')}` : undefined,
        tileLoadFunction: tile => { void loadArchiveTile(tile, archive); }
    });
    const layer = new TileLayer({ visible: false, preload: 0, cacheSize: 64,
        extent: transformExtent(manifest.extent, 'EPSG:4326', 'EPSG:3857'), source });
    return { manifest, layer, failed: false };
}
