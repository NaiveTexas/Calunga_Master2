export function clearList(list) {
    list.innerHTML = "";
    hideList(list);
}

export function showList(list) {
    list.style.display = "block";
}

export function hideList(list) {
    list.style.display = "none";
}

export function filterOptions(search, options) {
    return options.filter(option =>
        option.label.startsWith(search)
    );
}

export function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

export function calculateDistance(origin, destination) {
    if (!origin?.position || !destination?.position) {
        return 0;
    }

    const earthRadius = 3440.065;
    const lat1 = toRadians(origin.position.latitude);
    const lon1 = toRadians(origin.position.longitude);
    const lat2 = toRadians(destination.position.latitude);
    const lon2 = toRadians(destination.position.longitude);

    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) ** 2;

    return earthRadius * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
}

export function calculateEET(distance, speed) {

    if (!distance || !speed) {
        return 0;
    }

    return distance / speed;

}

export function formatTime(hours) {

    const totalMinutes = Math.round(hours * 60);

    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;

    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

}

export const LB_TO_KG = 0.45359237;

export function lbToKg(lb) {

    return lb * LB_TO_KG;

}

export function kgToLb(kg) {

    return kg / LB_TO_KG;

}

export function formatDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date || "")
        ? date.split("-").reverse().join("-")
        : "";
}
