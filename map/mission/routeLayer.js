import Feature from "ol/Feature.js";
import { mission } from "../../js/models/missions.js";

import Point from "ol/geom/Point.js";
import LineString from "ol/geom/LineString.js";

import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import Style from "ol/style/Style.js";
import Stroke from "ol/style/Stroke.js";
import CircleStyle from "ol/style/Circle.js";
import Fill from "ol/style/Fill.js";
import Text from "ol/style/Text.js";
import RegularShape from "ol/style/RegularShape.js";

import {
    fromLonLat
} from "ol/proj.js";

import {
    getDistance
} from "ol/sphere.js";

import {
    bearing
} from "@turf/bearing";


//==========================================//
//              CONSTANTS                   //
//==========================================//

const METERS_PER_NAUTICAL_MILE =
    1852;


//==========================================//
//             POINT STYLE                 //
//==========================================//

function createPointStyle(feature) {

    const pointType =
        String(feature.get("pointType") || "POINT")
            .toUpperCase();

    const markerStroke =
        new Stroke({
            color: "#07131d",
            width: 2
        });

    let image;

    if (pointType === "VOR") {

        image = new RegularShape({
            points: 6,
            radius: 8,
            fill: new Fill({ color: "#f8fafc" }),
            stroke: new Stroke({ color: "#8b5cf6", width: 2 })
        });

    } else if (pointType === "NDB") {

        image = new RegularShape({
            points: 3,
            radius: 9,
            rotation: Math.PI,
            fill: new Fill({ color: "#f8fafc" }),
            stroke: new Stroke({ color: "#f59e0b", width: 2 })
        });

    } else if (pointType === "AIRPORT") {

        image = new CircleStyle({
            radius: 10,
            fill: new Fill({ color: "#0f766e" }),
            stroke: markerStroke
        });

    } else if (pointType === "FIX") {

        image = new CircleStyle({
            radius: 6,
            fill: new Fill({ color: "#38bdf8" }),
            stroke: markerStroke
        });

    } else {

        image = new RegularShape({
            points: 4,
            radius: 8,
            angle: Math.PI / 4,
            fill: new Fill({ color: "#f8fafc" }),
            stroke: markerStroke
        });

    }

    const styles = [new Style({ image })];

    if (pointType === "AIRPORT") {

        styles.push(
            new Style({
                text: new Text({
                    text: "✈",
                    font: "bold 15px sans-serif",
                    fill: new Fill({ color: "#ffffff" }),
                    textAlign: "center",
                    textBaseline: "middle"
                })
            })
        );

    }

    styles.push(
        new Style({
            text: new Text({
                text: feature.get("label"),
                font: "bold 12px sans-serif",
                offsetY: -20,
                fill: new Fill({ color: "#ffffff" }),
                stroke: new Stroke({ color: "#07131d", width: 3 }),
                textAlign: "center"
            })
        })
    );

    return styles;

}


//==========================================//
//              LEG STYLE                  //
//==========================================//

function createLegStyle(feature, resolution) {
    const geometry = feature.getGeometry();
    const text = feature.get("bearing") + "\u00b0 \u00b7 " +
        String(feature.get("distance")).replace(".", ",") + " NM";
    const strokeStyle = new Style({
        stroke: new Stroke({ color: "#f97316", width: 3 })
    });

    // Leave room for the label and endpoint symbols before showing it.
    const requiredPixels = text.length * 7 + 48;
    if (geometry.getLength() / resolution < requiredPixels) {
        return strokeStyle;
    }

    const [start, end] = geometry.getCoordinates();
    let rotation = -Math.atan2(end[1] - start[1], end[0] - start[0]);
    if (rotation > Math.PI / 2) rotation -= Math.PI;
    if (rotation < -Math.PI / 2) rotation += Math.PI;

    const labelStyle = new Style({
        geometry: new Point(geometry.getCoordinateAt(0.5)),
        zIndex: 1,
        text: new Text({
            text,
            font: "600 12px sans-serif",
            fill: new Fill({ color: "#ffffff" }),
            backgroundFill: new Fill({ color: "rgba(7, 19, 29, 0.94)" }),
            backgroundStroke: new Stroke({ color: "#64748b", width: 1 }),
            padding: [5, 8, 5, 8],
            placement: "point",
            rotation,
            rotateWithView: true,
            textAlign: "center",
            textBaseline: "middle"
        })
    });
    return [strokeStyle, labelStyle];
}

//==========================================//
//            ROUTE STYLE                  //
//==========================================//

function routeStyle(
    feature,
    resolution
) {

    if (feature.get("missionLegActive") === false) {
        return new Style({
            stroke: new Stroke({ color: "#64748b", width: 2, lineDash: [7, 5] }),
            image: new CircleStyle({ radius: 4, fill: new Fill({ color: "#64748b" }) }),
            zIndex: -1
        });
    }

    const type =
        feature.get("type");


    if (
        type === "route-point"
    ) {

        return createPointStyle(feature);

    }


    if (
        type === "route-leg"
    ) {

        return createLegStyle(
            feature,
            resolution
        );

    }


    return null;

}

//==========================================//
//          CREATE ROUTE LAYER              //
//==========================================//

export function createRouteLayer() {

    const source =
        new VectorSource();


    return new VectorLayer({

        source,

        properties: {

            name:
                "Mission Route"

        },

        style:
            routeStyle

    });

}


//==========================================//
//          UPDATE ROUTE LAYER              //
//==========================================//

function appendRoute(
    layer,
    route,
    selected
) {

    const source =
        layer.getSource();




    const points = [];


    //======================================//
    //              ORIGIN                  //
    //======================================//

    if (
        route.origin
    ) {

        points.push(
            route.origin
        );

    }


    //======================================//
    //             WAYPOINTS                //
    //======================================//

    if (
        route.waypoints
    ) {

        route.waypoints.forEach(
            waypoint => {

                if (waypoint) {

                    points.push(
                        waypoint
                    );

                }

            }
        );

    }


    //======================================//
    //            DESTINATION               //
    //======================================//

    if (
        route.destination
    ) {

        points.push(
            route.destination
        );

    }


    const validPoints =
        points.filter(
            point =>
                point.position
        );


    if (
        validPoints.length === 0
    ) {

        return;

    }


    //======================================//
    //       CREATE POINT COORDINATES       //
    //======================================//

    //======================================//
    //              POINTS                  //
    //======================================//

    validPoints.forEach(
        point => {

            const pointType =
                String(point.type || "POINT")
                    .toUpperCase();

            const ident =
                point.ident ||
                point.icao ||
                "----";

            const label =
                pointType === "AIRPORT"
                    ? ident
                    : `${pointType} ${ident}`;

            source.addFeature(

                new Feature({

                    missionLegActive: selected,

                    type:
                        "route-point",

                    pointType,

                    ident,

                    label:
                        label,

                    geometry:
                        new Point(
                            fromLonLat([
                                point.position.longitude,
                                point.position.latitude
                            ])
                        )

                })

            );

        }
    );


    //======================================//
    //               LEGS                   //
    //======================================//

    for (
        let i = 0;
        i < validPoints.length - 1;
        i++
    ) {

        const from =
            validPoints[i];


        const to =
            validPoints[i + 1];


        const fromCoordinate = [

            from.position.longitude,

            from.position.latitude

        ];


        const toCoordinate = [

            to.position.longitude,

            to.position.latitude

        ];
        


        //==================================//
        //            DISTANCE              //
        //==================================//

        const distance =
            getDistance(

                fromCoordinate,

                toCoordinate

            ) /
            METERS_PER_NAUTICAL_MILE;


        //==================================//
        //             BEARING              //
        //==================================//

        const bearingDegrees =
            bearing(
                fromCoordinate,
                toCoordinate
            );

        const normalizedBearing =
            (
                bearingDegrees + 360
            ) % 360;


        //==================================//
        //               LEG                //
        //==================================//

        const legCoordinates = [

            fromLonLat(
                fromCoordinate
            ),

            fromLonLat(
                toCoordinate
            )

        ];

        source.addFeature(

            new Feature({

                missionLegActive: selected,

                type:
                    "route-leg",

                distance:
                    distance.toFixed(1),

                bearing:
                    (Math.round(normalizedBearing) % 360)
                    .toString()
                    .padStart(3, "0"),

                geometry:
                    new LineString(
                        legCoordinates
                    )

            })

        );

    }
}

export function synchronizeRouteLayer(layer, events = window) {
    const refresh = () => updateRouteLayer(layer);
    events.addEventListener("mission-route-updated", refresh);
    // The mission may have been recovered before the asynchronous map startup.
    refresh();
    return () => events.removeEventListener("mission-route-updated", refresh);
}

export function updateRouteLayer(layer) {
    layer.getSource().clear();
    const ordered = [...mission.legs].sort((a, b) => Number(a.id === mission.activeLegId) - Number(b.id === mission.activeLegId));
    for (const leg of ordered) appendRoute(layer, leg.route, leg.id === mission.activeLegId);
}
