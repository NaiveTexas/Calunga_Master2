import { EARTH_RADIUS_METERS } from "../config/index.js";

export function getDistanceNm(from, to) {

    const lat1 = Number(from.latitude) * Math.PI / 180;
    const lat2 = Number(to.latitude) * Math.PI / 180;
    const deltaLat = lat2 - lat1;
    const deltaLon = (Number(to.longitude) - Number(from.longitude)) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

    return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) / 1852;

}

export function getBearing(from, to) {

    const lat1 = Number(from.latitude) * Math.PI / 180;
    const lat2 = Number(to.latitude) * Math.PI / 180;
    const deltaLon = (Number(to.longitude) - Number(from.longitude)) * Math.PI / 180;
    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

}

export function destinationPoint(point, bearing, distanceNm) {

    const angularDistance = distanceNm * 1852 / EARTH_RADIUS_METERS;
    const heading = bearing * Math.PI / 180;
    const latitude = Number(point.latitude) * Math.PI / 180;
    const longitude = Number(point.longitude) * Math.PI / 180;
    const targetLatitude = Math.asin(
        Math.sin(latitude) * Math.cos(angularDistance) +
        Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(heading)
    );
    const targetLongitude = longitude + Math.atan2(
        Math.sin(heading) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(targetLatitude)
    );

    return {
        latitude: targetLatitude * 180 / Math.PI,
        longitude: ((targetLongitude * 180 / Math.PI + 540) % 360) - 180
    };

}

export function interpolateGreatCircle(from, to, fraction) {

    const latitude1 = Number(from.latitude) * Math.PI / 180;
    const longitude1 = Number(from.longitude) * Math.PI / 180;
    const latitude2 = Number(to.latitude) * Math.PI / 180;
    const longitude2 = Number(to.longitude) * Math.PI / 180;

    const start = [
        Math.cos(latitude1) * Math.cos(longitude1),
        Math.cos(latitude1) * Math.sin(longitude1),
        Math.sin(latitude1)
    ];
    const end = [
        Math.cos(latitude2) * Math.cos(longitude2),
        Math.cos(latitude2) * Math.sin(longitude2),
        Math.sin(latitude2)
    ];
    const dot = Math.max(
        -1,
        Math.min(1, start[0] * end[0] + start[1] * end[1] + start[2] * end[2])
    );
    const angle = Math.acos(dot);

    if (angle < 1e-10) {
        return {
            latitude: Number(from.latitude),
            longitude: Number(from.longitude)
        };
    }

    const startWeight = Math.sin((1 - fraction) * angle) / Math.sin(angle);
    const endWeight = Math.sin(fraction * angle) / Math.sin(angle);
    const x = startWeight * start[0] + endWeight * end[0];
    const y = startWeight * start[1] + endWeight * end[1];
    const z = startWeight * start[2] + endWeight * end[2];

    return {
        latitude: Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI,
        longitude: Math.atan2(y, x) * 180 / Math.PI
    };

}
