const GRAMET_URL =
    "/api/weather/gramet";

export async function loadGramet(payload) {

    const response = await fetch(GRAMET_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Não foi possível gerar o GRAMET."
        );
    }

    return data;

}
