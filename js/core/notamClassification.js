// Q-code reference: https://www.faa.gov/air_traffic/publications/atpubs/notam_html/appendix_b.html
// Exact subject membership only: unknown codes must never inherit a guessed category.
const groups = [
    ["Pista", "MR MC MD MH MS MT MU MW"],
    ["Taxiway", "MX MY"], ["Pátio", "MK MN MP"],
    ["Aeródromo", "FA FH FP MA MB MG MM MO"],
    ["Obstáculos", "OB"],
    ["Iluminação", "OL LA LB LC LD LE LF LG LH LI LJ LK LL LM LP LR LS LT LU LV LW LX LY LZ"],
    ["Auxílios à navegação", "GA GW IC ID IG II IL IM IN IO IS IT IU IW IX IY NA NB NC ND NF NL NM NN NO NT NV"],
    ["Comunicações / ATS", "CA CB CC CD CE CG CL CM CP CR CS CT SA SB SC SE SF SL SO SP SS ST SU SV SY"],
    ["SID", "PD"], ["STAR", "PA"], ["IAC", "PI"],
    ["Outros procedimentos", "PB PC PE PF PH PK PL PM PN PO PR PT PU PX PZ"],
    ["Espaço aéreo", "AA AC AD AE AF AH AL AN AO AP AR AT AU AV AX AZ RA RD RO RP RR RT"],
    ["Área militar", "RM"], ["Paraquedismo / voo livre", "WP"],
    ["Drones / aeromodelismo", "WU WZ"],
    ["Atividades e avisos à navegação", "WA WB WC WD WE WF WG WH WJ WL WM WR WS WT WV WW WY"],
    ["Combustível e serviços", "FB FD FE FF FG FI FJ FL FS FU FZ OA OE OR"],
    ["Meteorologia", "FC FM FO FT FW"]
];
export const OTHER_NOTAM_CATEGORY = "Outros / Não classificados";
export const NOTAM_CATEGORIES = [...groups.map(([label]) => label), OTHER_NOTAM_CATEGORY];
const subjects = new Map(groups.flatMap(([label, codes]) => codes.split(" ").map(code => [code, label])));
const conditions = {
    AC: "Retirado para manutenção", AD: "Disponível de dia", AF: "Inspecionado em voo e confiável",
    AG: "Aguardando inspeção em voo", AH: "Horário de serviço alterado", AK: "Operação normal restabelecida",
    AL: "Operacional com limitações publicadas", AM: "Somente operações militares", AN: "Disponível à noite",
    AO: "Operacional", AP: "Disponível com autorização prévia", AR: "Disponível mediante solicitação",
    AS: "Inoperante", AU: "Indisponível", AW: "Retirado completamente", AX: "Suspensão anterior cancelada",
    CA: "Ativado", CC: "Concluído", CD: "Desativado", CE: "Erguido", CF: "Frequência alterada",
    CG: "Rebaixado", CH: "Modificado", CI: "Identificação alterada", CL: "Realinhado", CM: "Deslocado",
    CN: "Cancelado", CO: "Em operação", CP: "Potência reduzida", CR: "Substituído temporariamente",
    CS: "Instalado", CT: "Em teste — não utilizar", HH: "Perigo informado", HW: "Obras em andamento",
    HX: "Concentração de aves", HV: "Obras concluídas", LC: "Fechado", LD: "Inseguro",
    LI: "Fechado para IFR", LN: "Fechado à noite", LV: "Fechado para VFR", LW: "Atividade prevista",
    LS: "Sujeito a interrupção", LT: "Limitado — consultar texto", LX: "Operação requer cautela"
};
export function classifyNotam(report) {
    const code = String(report.cod || "").trim().toUpperCase();
    const valid = /^Q[A-Z]{4}$/.test(code);
    const subject = valid ? code.slice(1, 3) : "";
    const conditionCode = valid ? code.slice(3) : "";
    return {
        code: valid ? code : "",
        category: subjects.get(subject) || OTHER_NOTAM_CATEGORY,
        condition: conditions[conditionCode] || "Condição não classificada — consultar texto"
    };
}
