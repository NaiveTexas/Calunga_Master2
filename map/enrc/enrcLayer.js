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
    getWidth(projectionExtent) / 512;

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
            512

    });
//==========================================//
//              ENRC LAYER                  //
//==========================================//

export function createENRCLayer(
    initialCharts = []
) {

    return new TileLayer({

        properties: {

            name: "ENRC"

        },

source: new TileWMS({

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
            true,

        FORMAT_OPTIONS:
            "dpi:192"

    },

    serverType:
        "geoserver",

    hidpi:
        true,

    tileGrid

})

    });

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


    const layers =
        charts.join(",");


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
