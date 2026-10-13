import TileLayer from "ol/layer/Tile.js";
import TileWMS from "ol/source/TileWMS.js";
import TileGrid from "ol/tilegrid/TileGrid.js";
import { get as getProjection } from "ol/proj.js";
import { getWidth } from "ol/extent.js";

const projection =
    getProjection("EPSG:3857");

const projectionExtent =
    projection.getExtent();

const startResolution =
    getWidth(projectionExtent) / 256;

const resolutions =
    new Array(22);

for (
    let i = 0;
    i < resolutions.length;
    i++
) {

    resolutions[i] =
        startResolution /
        Math.pow(2, i);

}

const tileGrid =
    new TileGrid({

        extent:
            projectionExtent,

        resolutions,

        tileSize:
            256

    });
//==========================================//
//              ENRC LAYER                  //
//==========================================//

export function createENRCLayer(
    initialCharts = []
) {

    const layer = new TileLayer({

        // Prioritize visible detail; retina tiles are 512px, not 1024px.
        preload: 0,
        cacheSize: 256,

        properties: {

            name: "ENRC"

        },

source: new TileWMS({

    transition: 0,
    zDirection: -1,

    url:
        "/api/charts/enrc/wms",

    params: {

        LAYERS:
            initialCharts.join(","),

        TILED:
            true,

        FORMAT:
            "image/png",

        TRANSPARENT:
            true

    },

    serverType:
        "geoserver",

    hidpi:
        true,

    tileGrid

})

    });
    const source = layer.getSource();
    const tileUrl = source.getTileUrlFunction();
    source.setTileUrlFunction((...args) => source.getParams().LAYERS ? tileUrl.apply(source, args) : undefined);
    return layer;

}


//==========================================//
//          SET ENRC CHARTS                 //
//==========================================//

export function setENRCCharts(
    layer,
    charts
) {

    if (!layer) {

        return;

    }


    const source =
        layer.getSource();

    layer.set("enrcCharts", charts);
    const staticCharts = layer.get("staticCharts") || [layer.get("staticChart")];


    const layers =
        charts.filter(chart => !staticCharts.includes(chart)).join(",");


    const currentLayers =
        source.getParams().LAYERS;


    if (
        currentLayers === layers
    ) {

        return;

    }


    source.updateParams({

        LAYERS:
            layers

    });

}
