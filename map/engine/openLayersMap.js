import "ol/ol.css";
import Map from "ol/Map.js";
import View from "ol/View.js";

import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";

import {
    fromLonLat,
    transformExtent
} from "ol/proj.js";

import {
    containsExtent
} from "ol/extent.js";

import {
    loadENRCIndex,
    findENRCCharts
} from "../enrc/enrcIndex.js";

import {
    createENRCLayer,
    setENRCCharts
} from "../enrc/enrcLayer.js";

import {
    createRouteLayer,
    synchronizeRouteLayer
} from "../mission/routeLayer.js";


let map = null;

let routeLayer = null;

let enrcLowLayer = null;

let enrcHighLayer = null;

let loadedENRCLowExtent = null;

let loadedENRCHighExtent = null;

let activeENRCType = "LOW";


//==========================================//
//              ENRC CONFIG                 //
//==========================================//

const ENRC_BUFFER =
    0.5;

const ENRC_MIN_ZOOM =
    5;

function updateENRCVisibility() {

    const isVisible =
        map.getView().getZoom() >= ENRC_MIN_ZOOM;

    enrcLowLayer.setVisible(
        isVisible &&
        activeENRCType === "LOW"
    );

    enrcHighLayer.setVisible(
        isVisible &&
        activeENRCType === "HIGH"
    );

    document
        .getElementById("enrcZoomNotice")
        .hidden = isVisible;

    document
        .querySelectorAll(".enrc-control")
        .forEach(button => {

            button.disabled = !isVisible;

        });

    return isVisible;

}


//==========================================//
//          UPDATE VISIBLE ENRC             //
//==========================================//

function updateVisibleENRC(
    type
) {

    const view =
        map.getView();


    const visibleExtent =
        view.calculateExtent(
            map.getSize()
        );


    const loadedExtent =
        type === "LOW"
            ? loadedENRCLowExtent
            : loadedENRCHighExtent;


    if (
        loadedExtent &&
        containsExtent(
            loadedExtent,
            visibleExtent
        )
    ) {

        return;

    }


    const bufferedExtent = [

        visibleExtent[0],

        visibleExtent[1],

        visibleExtent[2],

        visibleExtent[3]

    ];


    const width =
        visibleExtent[2] -
        visibleExtent[0];


    const height =
        visibleExtent[3] -
        visibleExtent[1];


    bufferedExtent[0] -=
        width * ENRC_BUFFER;

    bufferedExtent[2] +=
        width * ENRC_BUFFER;

    bufferedExtent[1] -=
        height * ENRC_BUFFER;

    bufferedExtent[3] +=
        height * ENRC_BUFFER;


    const geographicExtent =
        transformExtent(

            bufferedExtent,

            view.getProjection(),

            "EPSG:4326"

        );


    const charts =
        findENRCCharts(

            type,

            geographicExtent

        );


    const layer =
        type === "LOW"
            ? enrcLowLayer
            : enrcHighLayer;


    setENRCCharts(
        layer,
        charts
    );


    if (type === "LOW") {

        loadedENRCLowExtent =
            bufferedExtent;

    } else {

        loadedENRCHighExtent =
            bufferedExtent;

    }

}


//==========================================//
//          SET ACTIVE ENRC                 //
//==========================================//

function setActiveENRC(
    type
) {

    if (
        !enrcLowLayer ||
        !enrcHighLayer
    ) {

        return;

    }

    activeENRCType =
        type;


    const isVisible =
        updateENRCVisibility();

    if (isVisible) {
        updateVisibleENRC(
            type
        );
    }

    document
        .querySelectorAll(".enrc-control")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.enrcType === type
            );

        });

}

function initializeENRCControls() {

    document
        .querySelectorAll(".enrc-control")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => setActiveENRC(
                    button.dataset.enrcType
                )
            );

        });

}


//==========================================//
//        INITIALIZE OPENLAYERS MAP         //
//==========================================//

async function initializeOpenLayersMap() {

    const target =
        document.getElementById(
            "mapPanel"
        );


    if (!target) {

        return;

    }


    await loadENRCIndex(
        "LOW"
    );


    await loadENRCIndex(
        "HIGH"
    );


    map = new Map({

        target,

        layers: [

            new TileLayer({

                source:
                    new OSM()

            })

        ],

        view: new View({

            center:
                fromLonLat([

                    -35.25,

                    -5.91

                ]),

            zoom: 5

        })

    });


    //======================================//
    //              ENRC LOW                //
    //======================================//

    enrcLowLayer =
        createENRCLayer();


    map.addLayer(
        enrcLowLayer
    );


    //======================================//
    //             ENRC HIGH                //
    //======================================//

    enrcHighLayer =
        createENRCLayer();


    enrcHighLayer.setVisible(
        false
    );


    map.addLayer(
        enrcHighLayer
    );


    //======================================//
    //          INITIAL ENRC                //
    //======================================//

    initializeENRCControls();
    setActiveENRC("LOW");

    map.getView().on(
        "change:resolution",
        updateENRCVisibility
    );


    map.on(
        "moveend",
        () => {

            if (updateENRCVisibility()) {
                updateVisibleENRC(
                    activeENRCType
                );
            }

        }
    );


    //======================================//
    //            MISSION ROUTE             //
    //======================================//

    routeLayer =
        createRouteLayer();


    map.addLayer(
        routeLayer
    );


    synchronizeRouteLayer(routeLayer);

}


initializeOpenLayersMap();
