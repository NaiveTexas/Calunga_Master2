import "ol/ol.css";
import Map from "ol/Map.js";
import View from "ol/View.js";
import { loadStaticEnrc, staticEnrcVisibility } from "../enrc/staticEnrc.js";
import { defaults as defaultInteractions } from "ol/interaction/defaults.js";
import { defaults as defaultControls } from "ol/control/defaults.js";

import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";
import { initializeSigmetLayer } from "../weather/sigmetLayer.js";

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
let pdfCharts = [];
let pdfChartsEnabled = true;


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

    const zoom = map.getView().getZoom();
    const replacements = { LOW: [], HIGH: [] };
    for (const entry of pdfCharts) {
        const state = staticEnrcVisibility(entry.manifest, zoom, activeENRCType, entry.failed || !pdfChartsEnabled);
        entry.layer.setVisible(state.visible);
        if (state.replaceWms) replacements[entry.manifest.type || 'LOW'].push(entry.manifest.chart);
    }
    for (const [type, layer] of [['LOW', enrcLowLayer], ['HIGH', enrcHighLayer]]) {
        layer.set('staticCharts', replacements[type]);
        setENRCCharts(layer, layer.get('enrcCharts') || []);
    }

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

export async function initializeOpenLayersMap() {

    const target =
        document.getElementById(
            "mapPanel"
        );


    if (!target) {

        return;

    }


    map = new Map({

        target,
        interactions: defaultInteractions({ zoomDuration: 0 }),
        controls: defaultControls({ zoomOptions: { duration: 0 } }),
        // Request genuinely larger WMS images, including on standard-density PCs.
        pixelRatio: 2,

        loadTilesWhileAnimating: true,
        loadTilesWhileInteracting: true,

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

            constrainResolution: true,
            zoom: 5

        })

    });


    //======================================//
    //              ENRC LOW                //
    //======================================//

    enrcLowLayer =
        createENRCLayer();
    enrcLowLayer.setVisible(false);


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

    routeLayer = createRouteLayer();
    map.addLayer(routeLayer);
    synchronizeRouteLayer(routeLayer);
    initializeSigmetLayer(map);
    initializeENRCControls();
    setActiveENRC("LOW");
    const pdfButton = document.getElementById('enrcPdfCharts');
    loadStaticEnrc('/enrc-static/pdf-charts.json').then(result => {
        if (!result?.length || !pdfButton) return;
        pdfCharts = result;
        for (const entry of pdfCharts) {
            map.getLayers().insertAt(1, entry.layer);
            entry.layer.getSource().on('tileloaderror', () => {
                entry.failed = true;
                pdfButton.title = `${entry.manifest.chart}: pacote indisponível, usando o serviço WMS.`;
                updateENRCVisibility();
            });
        }
        pdfButton.hidden = false;
        pdfButton.setAttribute('aria-pressed', String(pdfChartsEnabled));
        pdfButton.title = pdfCharts.map(entry => `${entry.manifest.chart}: ${entry.manifest.edition}`).join(' | ');
        pdfButton.addEventListener('click', () => {
            pdfChartsEnabled = !pdfChartsEnabled;
            pdfButton.setAttribute('aria-pressed', String(pdfChartsEnabled));
            updateENRCVisibility();
        });
        updateENRCVisibility();
    });

    map.getView().on(
        "change:resolution",
        () => {
            // A zoomed-in view needs fewer charts than the previous overview.
            loadedENRCLowExtent = null;
            loadedENRCHighExtent = null;
            if (updateENRCVisibility()) updateVisibleENRC(activeENRCType);
        }
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


    // Local charts and their controls work while remote indexes are loading.
    const indexes = await Promise.allSettled([loadENRCIndex('LOW'), loadENRCIndex('HIGH')]);
    for (const result of indexes) {
        if (result.status === 'rejected') console.warn('ENRC index unavailable:', result.reason);
    }
    loadedENRCLowExtent = null;
    loadedENRCHighExtent = null;
    setActiveENRC(activeENRCType);

    //======================================//
    //            MISSION ROUTE             //
    //======================================//

}
