import GeoJSON from "ol/format/GeoJSON.js";

import {
    ENRC_CONFIG
} from "./enrcConfig.js";


const INDEX_URL =
    "/api/charts/enrc/index";


const features = {

    LOW: [],

    HIGH: []

};


//==========================================//
//            LOAD ENRC INDEX               //
//==========================================//

export async function loadENRCIndex(
    type
) {

    const config =
        ENRC_CONFIG[type];


    if (!config) {

        throw new Error(
            `Tipo ENRC inválido: ${type}`
        );

    }


    const response =
        await fetch(
            `${INDEX_URL}/${type.toLowerCase()}`
        );


    if (!response.ok) {

        throw new Error(
            `Erro ao carregar índice ENRC ${type}: ${response.status}`
        );

    }


    const data =
        await response.json();


    const format =
        new GeoJSON();


    features[type] =
        format.readFeatures(
            data
        );

}


//==========================================//
//       FIND ENRC CHARTS IN EXTENT         //
//==========================================//

export function findENRCCharts(
    type,
    extent
) {

    return features[type]

        .filter(
            feature =>
                feature
                    .getGeometry()
                    .intersectsExtent(
                        extent
                    )
        )

        .map(
            feature =>
                feature.get("ident")
        );

}