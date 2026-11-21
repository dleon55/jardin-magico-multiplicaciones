// ARTE: paisajes, Lumi, plantas y la Aventura, en SVG (docs/ESTILO.md).
//
// Separado de index.html para que el archivo principal no crezca sin fin.
// Es un script clásico (no un módulo): lo que declara es global, como
// cuando vivía dentro de index.html, y se carga antes del script principal.
// Lo que aquí se usa del principal se usa solo dentro de funciones, cuando
// ya está cargado todo.

// --- PAISAJES (docs/ESTILO.md) ---
//
// El fondo de cada mundo del jardín y la arena de cada mundo de la
// Aventura son paisajes SVG por capas (cielo, lejos y cerca), en lugar
// de un degradado con emojis sueltos. Se arman con piezas pequeñas
// (árbol, pino, nube, cactus, coral…) y colores planos sin contorno:
// el fondo acompaña sin competir con la operación.
const P = {
    sol: (x, y, r = 46) => `<g class="astro"><circle cx="${x}" cy="${y}" r="${r * 1.45}" fill="#fff7cc" opacity=".55"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fde047"/></g>`,
    luna: (x, y, r = 38) => `<g class="astro"><circle cx="${x}" cy="${y}" r="${r * 1.5}" fill="#fff" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fef9c3"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.2}" r="${r * 0.18}" fill="#fde68a"/><circle cx="${x + r * 0.3}" cy="${y + r * 0.3}" r="${r * 0.12}" fill="#fde68a"/></g>`,
    nube: (x, y, s = 1) => `<g class="nube"><g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".85"><ellipse cx="0" cy="0" rx="60" ry="22"/><circle cx="-22" cy="-14" r="24"/><circle cx="16" cy="-22" r="30"/></g></g>`,
    estrella: (x, y, s = 1, c = "#fef08a") => `<path class="titila" transform="translate(${x} ${y}) scale(${s})" d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" fill="${c}"/>`,
    arbol: (x, y, s = 1, c = "#4ade80", o = "#16a34a") => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-8" y="-40" width="16" height="42" rx="5" fill="#a16207"/><circle cx="0" cy="-70" r="40" fill="${c}"/><circle cx="16" cy="-60" r="26" fill="${o}" opacity=".45"/><circle cx="-14" cy="-84" r="10" fill="#fff" opacity=".25"/></g>`,
    pino: (x, y, s = 1, c = "#15803d") => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-24" width="12" height="26" fill="#854d0e"/><path d="M0 -150 L34 -84 L18 -84 L44 -30 L-44 -30 L-18 -84 L-34 -84 Z" fill="${c}"/></g>`,
    hongo: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-7" y="-22" width="14" height="22" rx="5" fill="#fef3c7"/><path d="M-26 -20 Q0 -56 26 -20 Z" fill="#ef4444"/><circle cx="-9" cy="-32" r="4" fill="#fff"/><circle cx="8" cy="-28" r="3" fill="#fff"/></g>`,
    flor: (x, y, s = 1, c = "#f472b6") => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q-3 -20 0 -36" stroke="#16a34a" stroke-width="4" fill="none"/><g fill="${c}"><circle cx="0" cy="-48" r="8"/><circle cx="-10" cy="-40" r="8"/><circle cx="10" cy="-40" r="8"/><circle cx="-6" cy="-30" r="8"/><circle cx="6" cy="-30" r="8"/></g><circle cx="0" cy="-39" r="6" fill="#fde047"/></g>`,
    zanahorias: (x, y, n = 5) => `<g transform="translate(${x} ${y})">${Array.from({ length: n }, (_, i) => `<g transform="translate(${i * 34} 0)"><path d="M0 0 L-8 -22 M0 0 L0 -26 M0 0 L8 -22" stroke="#22c55e" stroke-width="5" stroke-linecap="round"/><ellipse cx="0" cy="4" rx="9" ry="6" fill="#fb923c"/></g>`).join("")}</g>`,
    maiz: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 L0 -90" stroke="#65a30d" stroke-width="6"/><path d="M0 -30 Q-30 -50 -36 -80 M0 -50 Q28 -64 34 -96" stroke="#84cc16" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="8" cy="-66" rx="8" ry="18" fill="#facc15"/></g>`,
    helecho: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#4d7c0f" stroke-width="7" stroke-linecap="round" fill="none"><path d="M0 0 Q-10 -50 -50 -70"/><path d="M0 0 Q0 -60 10 -90"/><path d="M0 0 Q14 -46 54 -62"/></g>`,
    volcan: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-130 0 L-40 -150 L40 -150 L130 0 Z" fill="#a8a29e"/><path d="M-40 -150 Q-20 -130 0 -150 Q20 -130 40 -150 L32 -136 Q0 -118 -32 -136 Z" fill="#f97316"/><g fill="#e7e5e4" opacity=".8"><circle cx="-10" cy="-180" r="16"/><circle cx="12" cy="-206" r="20"/><circle cx="-6" cy="-236" r="14"/></g></g>`,
    planeta: (x, y, r = 40, c = "#a78bfa") => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${c}"/><circle cx="${-r * 0.3}" cy="${-r * 0.3}" r="${r * 0.25}" fill="#fff" opacity=".25"/><ellipse rx="${r * 1.7}" ry="${r * 0.38}" fill="none" stroke="#fde68a" stroke-width="${r * 0.14}" transform="rotate(-16)"/></g>`,
    coral: (x, y, s = 1, c = "#fb7185") => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${c}" stroke-width="12" stroke-linecap="round" fill="none"><path d="M0 0 L0 -60 M0 -30 L-24 -56 M0 -40 L22 -76 M-24 -56 L-30 -76"/></g>`,
    alga: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="alga" d="M0 0 Q-16 -30 0 -60 Q16 -90 0 -120" stroke="#22c55e" stroke-width="10" fill="none" stroke-linecap="round"/></g>`,
    burbuja: (x, y, r = 8) => `<circle class="burbuja" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>`,
    concha: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-22 0 Q0 -40 22 0 Z" fill="#fda4af"/><path d="M0 0 L0 -24 M-10 0 L-6 -20 M10 0 L6 -20" stroke="#fb7185" stroke-width="3"/></g>`,
    cactus: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#16a34a"><rect x="-12" y="-110" width="24" height="112" rx="12"/><path d="M-12 -50 L-32 -50 Q-40 -50 -40 -60 L-40 -84" stroke="#16a34a" stroke-width="18" stroke-linecap="round" fill="none"/><path d="M12 -64 L30 -64 Q38 -64 38 -74 L38 -94" stroke="#16a34a" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="0" cy="-114" r="7" fill="#f472b6"/></g>`,
    granero: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 0 L-60 -70 L0 -120 L60 -70 L60 0 Z" fill="#dc2626"/><path d="M-68 -66 L0 -126 L68 -66" stroke="#fff" stroke-width="8" fill="none" stroke-linejoin="round"/><rect x="-22" y="-50" width="44" height="50" fill="#fef3c7"/><path d="M-22 -50 L22 0 M22 -50 L-22 0" stroke="#dc2626" stroke-width="5"/></g>`,
    cerca: (x, y, n = 6) => `<g transform="translate(${x} ${y})" fill="#fef3c7">${Array.from({ length: n }, (_, i) => `<path d="M${i * 30 - 6} 0 L${i * 30 - 6} -40 L${i * 30} -48 L${i * 30 + 6} -40 L${i * 30 + 6} 0 Z"/>`).join("")}<rect x="-6" y="-34" width="${n * 30 - 18}" height="7"/><rect x="-6" y="-16" width="${n * 30 - 18}" height="7"/></g>`,
    castillo: (x, y, s = 1, c = "#6d28d9") => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><rect x="-70" y="-90" width="140" height="90"/><rect x="-90" y="-140" width="40" height="140"/><rect x="50" y="-140" width="40" height="140"/><path d="M-96 -140 L-70 -180 L-44 -140 Z M44 -140 L70 -180 L96 -140 Z"/><rect x="-20" y="-150" width="40" height="70"/><path d="M-26 -150 L0 -196 L26 -150 Z"/><g fill="#fde047" opacity=".85"><rect x="-76" y="-120" width="12" height="16" rx="6"/><rect x="64" y="-120" width="12" height="16" rx="6"/><rect x="-6" y="-130" width="12" height="16" rx="6"/></g><path d="M-16 0 L-16 -34 Q0 -50 16 -34 L16 0 Z" fill="#1e1b4b"/></g>`,
    murcielago: (x, y, s = 1) => `<g class="nube"><path transform="translate(${x} ${y}) scale(${s})" d="M0 0 Q-10 -12 -26 -8 Q-20 -2 -22 6 Q-12 0 -6 6 Q0 2 6 6 Q12 0 22 6 Q20 -2 26 -8 Q10 -12 0 0 Z" fill="#1e1b4b"/></g>`,
    lapida: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-18 0 L-18 -34 Q0 -56 18 -34 L18 0 Z" fill="#94a3b8"/><path d="M-6 -30 L6 -30 M0 -38 L0 -18" stroke="#64748b" stroke-width="4"/></g>`,
    arbolSeco: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#292524" stroke-width="10" stroke-linecap="round" fill="none"><path d="M0 0 L0 -90 M0 -50 L-34 -84 M0 -66 L30 -104 M-34 -84 L-44 -110 M30 -104 L50 -112"/></g>`,
    cohete: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(30)"><path d="M0 -50 Q20 -26 16 10 L-16 10 Q-20 -26 0 -50 Z" fill="#f1f5f9"/><circle cx="0" cy="-14" r="7" fill="#38bdf8"/><path d="M-16 0 L-28 16 L-16 12 Z M16 0 L28 16 L16 12 Z" fill="#ef4444"/><path d="M-8 12 L0 34 L8 12 Z" fill="#fb923c"/></g>`,
    ola: (y, c, op = 1) => `<path d="M0 ${y} Q75 ${y - 20} 150 ${y} T300 ${y} T450 ${y} T600 ${y} T750 ${y} T900 ${y} T1050 ${y} T1200 ${y} L1200 800 L0 800 Z" fill="${c}" opacity="${op}"/>`,
    colina: (cx, cy, rx, ry, c) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}"/>`,
    duna: (x0, x1, y, alto, c) => `<path d="M${x0} 800 Q${(x0 + x1) / 2} ${y - alto} ${x1} 800 Z" fill="${c}"/>`,
};

// Fondo del jardín: 1200 × 800, recortado para cubrir la pantalla
// desde abajo. Lo de los lados queda a la vista junto a la tarjeta.
const LEJOS = (c = "var(--colina1)") => P.colina(240, 830, 520, 190, c) + P.colina(980, 850, 560, 210, c);
const CERCA = (c = "var(--colina2)") => P.colina(80, 880, 420, 170, c) + P.colina(1150, 900, 460, 190, c);
const PAISAJES_JARDIN = {
    neutro: () => P.sol(110, 110) + P.nube(330, 120, 1) + P.nube(980, 90, 1.2) + LEJOS() + CERCA() + P.arbol(150, 720, 1.1) + P.arbol(1080, 740, 0.9, "#86efac") + P.flor(260, 770, 1) + P.flor(940, 780, 1, "#facc15"),
    huerto: () => P.sol(110, 110) + P.nube(990, 100, 1.1) + LEJOS() + CERCA() + P.zanahorias(40, 760, 6) + P.zanahorias(940, 770, 6) + P.maiz(240, 760, 1.1) + P.maiz(1150, 760, 1),
    bosque: () => P.sol(1080, 100, 40) + P.nube(240, 110, 1) + LEJOS() + P.pino(60, 760, 1.2) + P.pino(170, 720, 0.9, "#166534") + CERCA() + P.pino(1100, 780, 1.3) + P.hongo(250, 780, 1.2) + P.hongo(990, 790, 1),
    dinos: () => P.sol(1090, 100, 40) + LEJOS() + P.volcan(170, 760, 1) + CERCA() + P.helecho(1050, 790, 1.3) + P.helecho(290, 790, 1) + P.arbol(1150, 780, 1, "#65a30d", "#3f6212"),
    espacio: () => P.estrella(120, 90, 1.6) + P.estrella(300, 220, 1) + P.estrella(1040, 260, 1.3) + P.estrella(880, 80, 1) + P.estrella(220, 420, 0.9) + P.estrella(1130, 470, 1.1) + P.planeta(1060, 140, 50) + P.luna(150, 150, 34) + LEJOS() + CERCA() + P.cohete(1100, 640, 1.2),
    mar: () => P.burbuja(160, 200, 10) + P.burbuja(190, 260, 6) + P.burbuja(1060, 300, 12) + P.burbuja(1030, 360, 7) + P.ola(170, "#fff", 0.25) + LEJOS("#a5f3fc") + P.alga(80, 790, 1.2) + P.alga(1140, 790, 1.4) + CERCA("#fde68a") + P.coral(220, 790, 1.2) + P.coral(1020, 795, 1, "#f97316") + P.concha(300, 790, 1.2) + P.concha(920, 795, 1),
    granja: () => P.sol(110, 110) + P.nube(980, 110, 1) + LEJOS() + P.granero(170, 760, 1.1) + CERCA() + P.cerca(930, 780, 8),
    desierto: () => P.sol(1080, 120, 54) + P.duna(-100, 600, 820, 300, "var(--colina1)") + P.duna(500, 1400, 820, 340, "var(--colina1)") + P.duna(-200, 500, 840, 200, "var(--colina2)") + P.duna(700, 1500, 840, 230, "var(--colina2)") + P.cactus(150, 770, 1) + P.cactus(1080, 790, 1.2),
    flores: () => P.sol(110, 110) + P.nube(1000, 100, 1) + LEJOS() + CERCA() + P.flor(60, 780, 1.3) + P.flor(130, 770, 1, "#facc15") + P.flor(210, 790, 1.2, "#a78bfa") + P.flor(980, 790, 1.2, "#fb7185") + P.flor(1060, 770, 1, "#38bdf8") + P.flor(1140, 790, 1.3),
};
function svgPaisajeJardin(clave) {
    const dibujo = (PAISAJES_JARDIN[clave] || PAISAJES_JARDIN.neutro)();
    return `<svg class="paisaje" data-paisaje="${PAISAJES_JARDIN[clave] ? clave : "neutro"}" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${dibujo}</svg>`;
}

// Arena de cada mundo de la Aventura: 600 × 300, el suelo en la mitad
// de abajo, donde caminan el héroe y los enemigos.
const PAISAJES_ARENA = [
    // El huerto: día, surcos y un girasol.
    () => `<rect width="600" height="300" fill="#bae6fd"/>${P.sol(520, 50, 26)}${P.nube(120, 50, 0.7)}${P.colina(150, 200, 260, 70, "#bbf7d0")}${P.colina(500, 205, 240, 66, "#86efac")}<rect y="165" width="600" height="135" fill="#4ade80"/><g stroke="#22c55e" stroke-width="6" opacity=".6"><path d="M0 200 L600 190 M0 235 L600 228 M0 270 L600 266"/></g>${P.maiz(40, 190, 0.6)}${P.maiz(570, 192, 0.55)}${P.flor(110, 190, 0.8, "#facc15")}${P.arbol(480, 170, 0.5)}`,
    // El bosque: pinos lejanos y hongos.
    () => `<rect width="600" height="300" fill="#a7f3d0"/>${P.nube(460, 40, 0.6)}${P.pino(40, 165, 0.8, "#166534")}${P.pino(100, 160, 0.6, "#15803d")}${P.pino(500, 165, 0.75, "#166534")}${P.pino(565, 160, 0.6, "#15803d")}${P.pino(300, 150, 0.45, "#14532d")}<rect y="150" width="600" height="150" fill="#166534"/><path d="M0 150 Q150 140 300 150 T600 150 L600 170 L0 170 Z" fill="#15803d"/>${P.hongo(70, 260, 0.9)}${P.hongo(540, 270, 0.7)}`,
    // El castillo: atardecer morado, luna y murciélagos.
    () => `<rect width="600" height="300" fill="#c4b5fd"/><rect y="70" width="600" height="100" fill="#ddd6fe" opacity=".5"/>${P.luna(520, 50, 24)}${P.castillo(300, 165, 0.75, "#5b21b6")}${P.murcielago(120, 50, 1)}${P.murcielago(180, 80, 0.7)}<rect y="165" width="600" height="135" fill="#4c1d95"/><path d="M0 165 Q150 155 300 165 T600 165 L600 180 L0 180 Z" fill="#6d28d9"/>`,
    // La noche: luna llena, árboles secos y lápidas simpáticas.
    () => `<rect width="600" height="300" fill="#1e293b"/>${P.estrella(80, 40, 0.8)}${P.estrella(200, 70, 0.6)}${P.estrella(420, 30, 0.7)}${P.luna(510, 60, 30)}${P.arbolSeco(60, 170, 0.9)}${P.arbolSeco(560, 170, 0.8)}<rect y="165" width="600" height="135" fill="#3f6212"/><path d="M0 165 Q150 155 300 165 T600 165 L600 180 L0 180 Z" fill="#4d7c0f"/>${P.lapida(130, 175, 0.9)}${P.lapida(470, 178, 0.8)}`,
    // El espacio: estrellas, un planeta y suelo de luna.
    () => `<rect width="600" height="300" fill="#1e1b4b"/>${[[50, 40], [140, 90], [260, 30], [380, 70], [470, 120], [560, 40], [90, 140], [320, 130]].map(([x, y], i) => P.estrella(x, y, 0.5 + (i % 3) * 0.2, "#e0e7ff")).join("")}${P.planeta(500, 70, 30, "#f472b6")}${P.cohete(110, 80, 0.6)}<path d="M0 190 Q150 170 300 185 T600 180 L600 300 L0 300 Z" fill="#64748b"/><g fill="#475569"><ellipse cx="120" cy="240" rx="30" ry="9"/><ellipse cx="420" cy="260" rx="40" ry="11"/><ellipse cx="520" cy="215" rx="20" ry="6"/></g>`,
    // El mar: rayos de luz, algas, coral y burbujas.
    () => `<rect width="600" height="300" fill="#0891b2"/><rect width="600" height="120" fill="#67e8f9" opacity=".6"/><g fill="#fff" opacity=".12"><path d="M80 0 L140 0 L60 300 L20 300 Z"/><path d="M300 0 L340 0 L300 300 L250 300 Z"/><path d="M480 0 L540 0 L560 300 L500 300 Z"/></g>${P.burbuja(90, 120, 6)}${P.burbuja(100, 90, 4)}${P.burbuja(520, 140, 7)}<path d="M0 230 Q150 215 300 228 T600 225 L600 300 L0 300 Z" fill="#fde68a"/>${P.alga(40, 240, 0.8)}${P.alga(570, 240, 0.9)}${P.coral(110, 250, 0.8)}${P.coral(500, 255, 0.7, "#f97316")}${P.concha(330, 270, 0.8)}`,
];
function svgPaisajeArena(m) {
    return `<svg class="paisaje-arena" data-paisaje="${m}" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${(PAISAJES_ARENA[m] || PAISAJES_ARENA[0])()}</svg>`;
}

// --- LUMI, LA MASCOTA ---
//
// Una semilla mágica que guía el jardín (docs/ESTILO.md). Cambia de cara
// según lo que pasa: contenta en reposo, celebrando al acertar,
// sorprendida al florecer, animando tras un fallo (nunca triste: el
// fallo no castiga), pensando con la ayuda abierta y durmiendo si nadie
// toca la bienvenida. Es decorativa: el texto ya dice lo mismo.
const EXPRESIONES_LUMI = ["contenta", "pensando", "animando", "celebrando", "sorprendida", "durmiendo"];
const SUENO_LUMI_MS = 20000;
let lumisCreados = 0;
// Lumi crece con las tablas (del 2 al 9) que se saben: `desde` cuántas.
const ETAPAS_LUMI = [{ nombre: "una semilla", desde: 0 }, { nombre: "un brote", desde: 2 }, { nombre: "una plantita", desde: 4 }, { nombre: "un arbolito", desde: 6 }, { nombre: "un árbol en flor", desde: 8 }];
let etapaLumi = 0;   // la de quien juega; todas las Lumi en pantalla la muestran

/** La etapa que toca con tantas tablas sabidas. */
function etapaLumiPorTablas(sabidas) {
    return ETAPAS_LUMI.reduce((etapa, e, i) => (sabidas >= e.desde ? i : etapa), 0);
}

/** Pone la etapa en todas las Lumi dibujadas (y en las que se dibujen después). */
function ponerEtapaLumi(etapa) {
    etapaLumi = etapa;
    document.querySelectorAll("svg.lumi").forEach((svg) => { svg.dataset.etapa = String(etapa); });
}
const vueltaLumi = new Map();   // svg -> temporizador para volver a «contenta»
let suenoLumi = null;

/** Dibuja a Lumi dentro de cada .lumi-caja, con la cara de su data-lumi. */
function ponerLumis() {
    const plantilla = document.getElementById("plantilla-lumi").content.firstElementChild;
    document.querySelectorAll(".lumi-caja").forEach((caja) => {
        const svg = plantilla.cloneNode(true);
        // El recorte de la luz necesita un id propio en cada copia.
        const id = `lumi-recorte-${++lumisCreados}`;
        svg.querySelector("[data-recorte]").id = id;
        svg.querySelector("[data-recortado]").setAttribute("clip-path", `url(#${id})`);
        svg.dataset.expresion = caja.dataset.lumi || "contenta";
        svg.dataset.etapa = String(etapaLumi);
        caja.replaceChildren(svg);
    });
}

/**
 * Cambia la cara de Lumi en la caja `id`. Con `volverMs`, vuelve sola a
 * «contenta» pasado ese tiempo. Si la cara cambia, da un saltito.
 */
function lumi(id, expresion, volverMs = 0) {
    const svg = document.querySelector(`#${id} > .lumi`);
    if (!svg || !EXPRESIONES_LUMI.includes(expresion)) return;
    clearTimeout(vueltaLumi.get(svg));
    vueltaLumi.delete(svg);
    if (svg.dataset.expresion !== expresion) {
        svg.dataset.expresion = expresion;
        svg.classList.remove("salta");
        void svg.getBoundingClientRect();   // reinicia la animación
        svg.classList.add("salta");
    }
    if (volverMs > 0) vueltaLumi.set(svg, setTimeout(() => lumi(id, "contenta"), volverMs));
}

/** En la bienvenida, Lumi se duerme si nadie toca nada un rato; despierta al tocar. */
function despertarLumi() {
    clearTimeout(suenoLumi);
    if (pantallaActual !== "screen-welcome") return;
    lumi("lumi-bienvenida", "contenta");
    suenoLumi = setTimeout(() => {
        if (pantallaActual === "screen-welcome") lumi("lumi-bienvenida", "durmiendo");
    }, SUENO_LUMI_MS);
}
// --- PLANTAS DEL JARDÍN (docs/ESTILO.md) ---
//
// Cada planta es un dibujo según su estado, y el estado se distingue
// por la FORMA, no solo por el color (accesibilidad):
//   por sembrar: montoncito de tierra con una semilla;
//   brote: dos hojitas;
//   casi: tallo con un capullo cerrado;
//   florecida: lo que crece en el mundo, con brillo;
//   marchita: tallo caído y hojas secas.
// Lo florecido es propio de cada mundo y su color cambia con la tabla,
// así cada bancal se distingue del otro.
const TRAZO_P = 'stroke="var(--contorno)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
const TONOS_TABLA = ["#f43f5e", "#f97316", "#facc15", "#84cc16", "#22c55e", "#14b8a6", "#38bdf8", "#818cf8", "#d946ef"];
const TIERRA = `<path d="M8 50 Q32 38 56 50 L56 54 Q32 60 8 54 Z" fill="#a16207" ${TRAZO_P}/><path d="M16 49 Q22 46 28 47" stroke="#ca8a04" stroke-width="2" fill="none" stroke-linecap="round"/>`;
const TALLO = (alto = 26, curva = 0) => `<path d="M32 48 Q${32 + curva} ${48 - alto / 2} 32 ${48 - alto}" stroke="#16a34a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
const HOJA = (x, y, lado, c = "#4ade80") => `<path d="M${x} ${y} Q${x + lado * 12} ${y - 12} ${x + lado * 16} ${y - 2} Q${x + lado * 8} ${y + 4} ${x} ${y} Z" fill="${c}" ${TRAZO_P} stroke-width="2"/>`;
const BRILLO_P = `<circle cx="32" cy="22" r="22" fill="#fef08a" opacity=".45"/>`;

// Lo florecido de cada mundo: (tono de la tabla) => dibujo sobre la tierra.
const FLORECIDA = {
    huerto: (c) => `${TALLO(18)}${HOJA(32, 40, -1)}${HOJA(32, 36, 1)}<circle cx="32" cy="20" r="11" fill="${c}" ${TRAZO_P}/><path d="M27 11 L32 14 L37 11 L35 16 L29 16 Z" fill="#22c55e" ${TRAZO_P} stroke-width="1.6"/><circle cx="28" cy="17" r="2.6" fill="#fff" opacity=".6"/>`,
    bosque: (c) => `<rect x="29" y="30" width="6" height="18" rx="2" fill="#a16207" ${TRAZO_P} stroke-width="2"/><circle cx="32" cy="22" r="15" fill="${c}" ${TRAZO_P}/><circle cx="26" cy="17" r="4" fill="#fff" opacity=".35"/>`,
    dinos: (c) => `<path d="M18 48 Q16 30 32 26 Q48 30 46 48 Z" fill="#fef3c7" ${TRAZO_P}/><path d="M18 36 L23 40 L28 35 L33 40 L38 35 L43 40 L46 37" fill="none" ${TRAZO_P} stroke-width="2"/><circle cx="32" cy="22" r="9" fill="${c}" ${TRAZO_P}/><circle cx="29" cy="20" r="1.8" fill="var(--contorno)"/><circle cx="35" cy="20" r="1.8" fill="var(--contorno)"/><path d="M29 25 Q32 27 35 25" fill="none" stroke="var(--contorno)" stroke-width="1.6" stroke-linecap="round"/>`,
    espacio: (c) => `${TALLO(14)}<path d="M32 6 L36 16 L47 17 L39 24 L41 35 L32 29 L23 35 L25 24 L17 17 L28 16 Z" fill="${c}" ${TRAZO_P}/><circle cx="29" cy="19" r="1.6" fill="var(--contorno)"/><circle cx="35" cy="19" r="1.6" fill="var(--contorno)"/>`,
    mar: (c) => `${TALLO(10, 4)}<path d="M18 24 Q30 10 42 24 Q30 36 18 24 Z" fill="${c}" ${TRAZO_P}/><path d="M42 24 L50 17 L50 31 Z" fill="${c}" ${TRAZO_P}/><circle cx="25" cy="22" r="2" fill="var(--contorno)"/><circle cx="12" cy="14" r="2.2" fill="none" stroke="#38bdf8" stroke-width="1.6"/>`,
    granja: (c) => `<ellipse cx="32" cy="36" rx="13" ry="11" fill="${c}" ${TRAZO_P}/><circle cx="32" cy="22" r="8" fill="${c}" ${TRAZO_P}/><path d="M38 22 L43 24 L38 26 Z" fill="#f97316" ${TRAZO_P} stroke-width="1.6"/><circle cx="34" cy="20" r="1.6" fill="var(--contorno)"/><path d="M29 14 Q31 10 33 14 Q35 11 36 15" fill="#ef4444" ${TRAZO_P} stroke-width="1.6"/>`,
    desierto: (c) => `<rect x="26" y="18" width="12" height="31" rx="6" fill="#22c55e" ${TRAZO_P}/><path d="M26 34 L20 34 Q17 34 17 31 L17 25" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/><path d="M38 30 L44 30 Q47 30 47 27 L47 22" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/><circle cx="32" cy="15" r="5" fill="${c}" ${TRAZO_P} stroke-width="2"/>`,
    flores: (c) => `${TALLO(22)}${HOJA(32, 40, -1)}${HOJA(32, 36, 1)}<g fill="${c}" ${TRAZO_P} stroke-width="2"><circle cx="32" cy="12" r="6"/><circle cx="41" cy="18" r="6"/><circle cx="38" cy="28" r="6"/><circle cx="26" cy="28" r="6"/><circle cx="23" cy="18" r="6"/></g><circle cx="32" cy="21" r="5" fill="#fde047" ${TRAZO_P} stroke-width="2"/>`,
};

const DIBUJO_ESTADO = {
    nuevo: () => `<ellipse cx="32" cy="45" rx="5" ry="3.5" fill="#fde68a" ${TRAZO_P} stroke-width="2"/>`,
    practica: () => `${TALLO(14)}${HOJA(32, 36, -1)}${HOJA(32, 36, 1)}`,
    casi: (c) => `${TALLO(26)}${HOJA(32, 42, -1)}${HOJA(32, 38, 1)}<path d="M32 12 Q24 18 27 26 Q32 30 37 26 Q40 18 32 12 Z" fill="${c}" ${TRAZO_P}/><path d="M27 26 Q32 22 37 26" fill="#22c55e" ${TRAZO_P} stroke-width="1.8"/>`,
    marchita: () => `<path d="M32 48 Q34 34 42 30 Q48 30 48 38" stroke="#a8a29e" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M48 38 Q54 40 50 46 Q44 44 48 38 Z" fill="#d6d3d1" ${TRAZO_P} stroke-width="2"/>${HOJA(32, 42, -1, "#d6d3d1")}`,
};

/** Una planta del jardín: estado, mundo y tabla (para su color). */
function svgPlanta(estado, clave = "flores", tabla = 1) {
    const tono = TONOS_TABLA[(tabla - 1) % TONOS_TABLA.length];
    const dibujo = estado === "florecida"
        ? BRILLO_P + (FLORECIDA[clave] || FLORECIDA.flores)(tono)
        : (DIBUJO_ESTADO[estado] || DIBUJO_ESTADO.nuevo)(tono);
    const mundoDibujo = FLORECIDA[clave] ? clave : "flores";
    return `<svg class="arte planta-arte" data-estado="${estado}" data-mundo="${mundoDibujo}" data-tabla="${tabla}" viewBox="0 0 64 60" aria-hidden="true" focusable="false">${TIERRA}${dibujo}</svg>`;
}

// --- ARTE DE LA AVENTURA (docs/ESTILO.md) ---
//
// Héroes y enemigos dibujados en SVG propio, en lugar de emojis que
// cambian con cada teléfono. Cada personaje se arma con piezas comunes
// (cuerpo, cabeza, ojos, varita) y sus rasgos propios: así los 8 héroes
// y los 6 enemigos se ven del mismo juego y pesan poco. El emoji sigue
// siendo el nombre del héroe guardado: no hay nada que migrar.
const TRAZO = 'stroke="var(--contorno)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const RASGOS_HEROE = {
    "🐱": { cuerpo: "#fbbf77", oscuro: "#d9822b", panza: "#fff3e0", orejas: "gato", interior: "#f9a8d4", bigotes: true },
    "🐶": { cuerpo: "#ecd2ad", oscuro: "#9a6b3c", panza: "#fffaf0", orejas: "perro", hocico: "#fffaf0" },
    "🐰": { cuerpo: "#f1f5f9", oscuro: "#cbd5e1", panza: "#ffffff", orejas: "conejo", interior: "#f9a8d4" },
    "🦊": { cuerpo: "#fb923c", oscuro: "#c2410c", panza: "#fff7ed", orejas: "zorro", interior: "#fff7ed", hocico: "#fff7ed" },
    "🐼": { cuerpo: "#ffffff", oscuro: "#3f3f46", panza: "#ffffff", orejas: "redondas", parches: true },
    "🐸": { cuerpo: "#86efac", oscuro: "#16a34a", panza: "#ecfccb", orejas: null, ojosArriba: true },
    "🐯": { cuerpo: "#fdba74", oscuro: "#c2410c", panza: "#fff7ed", orejas: "redondas", rayas: true, hocico: "#fff7ed" },
    "🐨": { cuerpo: "#cbd5e1", oscuro: "#64748b", panza: "#f1f5f9", orejas: "koala", interior: "#f1f5f9", narizGrande: true },
};

function orejasHeroe(r) {
    const o = r.oscuro, c = r.cuerpo, i = r.interior;
    switch (r.orejas) {
        case "gato": return `<path d="M30 34 L28 14 L45 25 Z" fill="${c}" ${TRAZO}/><path d="M70 34 L72 14 L55 25 Z" fill="${c}" ${TRAZO}/><path d="M32 29 L31 19 L40 25 Z" fill="${i}"/><path d="M68 29 L69 19 L60 25 Z" fill="${i}"/>`;
        case "zorro": return `<path d="M29 36 L24 10 L46 24 Z" fill="${c}" ${TRAZO}/><path d="M71 36 L76 10 L54 24 Z" fill="${c}" ${TRAZO}/><path d="M26 18 L24 10 L32 15 Z" fill="${o}"/><path d="M74 18 L76 10 L68 15 Z" fill="${o}"/><path d="M31 30 L29 19 L39 25 Z" fill="${i}"/><path d="M69 30 L71 19 L61 25 Z" fill="${i}"/>`;
        case "conejo": return `<ellipse cx="38" cy="14" rx="7" ry="17" fill="${c}" transform="rotate(-10 38 14)" ${TRAZO}/><ellipse cx="62" cy="14" rx="7" ry="17" fill="${c}" transform="rotate(10 62 14)" ${TRAZO}/><ellipse cx="38" cy="15" rx="3.2" ry="11" fill="${i}" transform="rotate(-10 38 15)"/><ellipse cx="62" cy="15" rx="3.2" ry="11" fill="${i}" transform="rotate(10 62 15)"/>`;
        case "perro": return `<ellipse cx="26" cy="46" rx="8" ry="15" fill="${o}" transform="rotate(18 26 46)" ${TRAZO}/><ellipse cx="74" cy="46" rx="8" ry="15" fill="${o}" transform="rotate(-18 74 46)" ${TRAZO}/>`;
        case "redondas": return `<circle cx="31" cy="25" r="8" fill="${r.parches ? o : c}" ${TRAZO}/><circle cx="69" cy="25" r="8" fill="${r.parches ? o : c}" ${TRAZO}/>`;
        case "koala": return `<circle cx="27" cy="30" r="12" fill="${c}" ${TRAZO}/><circle cx="73" cy="30" r="12" fill="${c}" ${TRAZO}/><circle cx="28" cy="31" r="6" fill="${i}"/><circle cx="72" cy="31" r="6" fill="${i}"/>`;
        default: return "";
    }
}

/** Un héroe de la Aventura: quieto, lanzando (varita arriba) o golpeado. */
function svgHeroe(emoji) {
    const r = RASGOS_HEROE[emoji] || RASGOS_HEROE["🐱"];
    const ojosY = r.ojosArriba ? 30 : 44;
    const ojos = r.ojosArriba
        ? `<circle cx="38" cy="28" r="9" fill="${r.cuerpo}" ${TRAZO}/><circle cx="62" cy="28" r="9" fill="${r.cuerpo}" ${TRAZO}/><circle cx="38" cy="28" r="5.5" fill="#fff"/><circle cx="62" cy="28" r="5.5" fill="#fff"/>`
        : "";
    return `<svg class="arte heroe-arte" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  <ellipse cx="50" cy="95" rx="22" ry="3.5" fill="var(--sombra-arte)"/>
  ${orejasHeroe(r)}
  <ellipse cx="40" cy="91" rx="7" ry="4.5" fill="${r.oscuro}" ${TRAZO}/><ellipse cx="60" cy="91" rx="7" ry="4.5" fill="${r.oscuro}" ${TRAZO}/>
  <ellipse cx="31" cy="76" rx="5" ry="7" fill="${r.cuerpo}" transform="rotate(25 31 76)" ${TRAZO}/>
  <ellipse cx="50" cy="78" rx="19" ry="15" fill="${r.cuerpo}" ${TRAZO}/>
  <ellipse cx="50" cy="81" rx="11" ry="8.5" fill="${r.panza}"/>
  ${ojos}
  <circle cx="50" cy="45" r="24" fill="${r.cuerpo}" ${TRAZO}/>
  ${r.ojosArriba ? `<path d="M29 40 Q50 34 71 40" fill="none" stroke="${r.cuerpo}" stroke-width="5"/>` : ""}
  <ellipse cx="39" cy="35" rx="6" ry="3.5" fill="var(--brillo)" transform="rotate(-30 39 35)"/>
  ${r.parches ? `<ellipse cx="40" cy="${ojosY}" rx="7" ry="8.5" fill="${r.oscuro}" transform="rotate(20 40 ${ojosY})"/><ellipse cx="60" cy="${ojosY}" rx="7" ry="8.5" fill="${r.oscuro}" transform="rotate(-20 60 ${ojosY})"/>` : ""}
  ${r.rayas ? `<g fill="none" stroke="${r.oscuro}" stroke-width="3" stroke-linecap="round"><path d="M50 22 L50 30"/><path d="M42 23 L44 30"/><path d="M58 23 L56 30"/><path d="M27 44 L33 45"/><path d="M73 44 L67 45"/></g>` : ""}
  ${r.hocico ? `<ellipse cx="50" cy="55" rx="11" ry="8" fill="${r.hocico}"/>` : ""}
  ${r.parches ? `<g data-e="quieto lanzando" fill="#fff"><circle cx="41" cy="${ojosY}" r="5.6"/><circle cx="59" cy="${ojosY}" r="5.6"/></g>` : ""}
  <g data-e="quieto lanzando" fill="var(--contorno)">
    <ellipse cx="${r.ojosArriba ? 38 : 41}" cy="${ojosY - (r.ojosArriba ? 2 : 0)}" rx="3.4" ry="4.4"/><ellipse cx="${r.ojosArriba ? 62 : 59}" cy="${ojosY - (r.ojosArriba ? 2 : 0)}" rx="3.4" ry="4.4"/>
    <circle cx="${r.ojosArriba ? 39.3 : 42.3}" cy="${ojosY - (r.ojosArriba ? 4 : 2)}" r="1.3" fill="#fff"/><circle cx="${r.ojosArriba ? 63.3 : 60.3}" cy="${ojosY - (r.ojosArriba ? 4 : 2)}" r="1.3" fill="#fff"/>
  </g>
  <g data-e="golpeado" fill="none" stroke="${r.parches ? "#fff" : "var(--contorno)"}" stroke-width="2.8" stroke-linecap="round">
    <path d="M${r.ojosArriba ? 34 : 37} ${ojosY - 4} L${r.ojosArriba ? 41 : 44} ${ojosY} L${r.ojosArriba ? 34 : 37} ${ojosY + 3}"/><path d="M${r.ojosArriba ? 66 : 63} ${ojosY - 4} L${r.ojosArriba ? 59 : 56} ${ojosY} L${r.ojosArriba ? 66 : 63} ${ojosY + 3}"/>
  </g>
  <ellipse cx="33" cy="54" rx="5" ry="3" fill="var(--mejilla)"/><ellipse cx="67" cy="54" rx="5" ry="3" fill="var(--mejilla)"/>
  ${r.narizGrande ? `<ellipse cx="50" cy="51" rx="5.5" ry="7" fill="#3f3f46"/>` : `<path d="M47 49.5 Q50 48.5 53 49.5 Q51.5 53 50 53 Q48.5 53 47 49.5 Z" fill="var(--contorno)" stroke="var(--contorno)" stroke-width="1.5" stroke-linejoin="round"/>`}
  <path data-e="quieto lanzando" d="M${r.ojosArriba ? 40 : 45} ${r.narizGrande ? 60 : 56} Q50 ${r.narizGrande ? 64 : 61} ${r.ojosArriba ? 60 : 55} ${r.narizGrande ? 60 : 56}" fill="none" stroke="var(--contorno)" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse data-e="golpeado" cx="50" cy="${r.narizGrande ? 62 : 58}" rx="3" ry="3.5" fill="#9f1239" stroke="var(--contorno)" stroke-width="2"/>
  ${r.bigotes ? `<g stroke="var(--contorno)" stroke-width="1.5" stroke-linecap="round"><path d="M36 52 L26 50"/><path d="M36 55 L26 56"/><path d="M64 52 L74 50"/><path d="M64 55 L74 56"/></g>` : ""}
  <g class="brazo-varita">
    <path d="M70 70 L86 50" stroke="var(--contorno)" stroke-width="6" stroke-linecap="round"/>
    <path d="M70 70 L86 50" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>
    <path d="M87 41 L89.5 46.5 L95 48.5 L89.5 50.5 L87 56 L84.5 50.5 L79 48.5 L84.5 46.5 Z" fill="var(--sol)" stroke="var(--contorno)" stroke-width="1.8" stroke-linejoin="round"/>
    <ellipse cx="69" cy="74" rx="5" ry="7" fill="${r.cuerpo}" transform="rotate(-35 69 74)" ${TRAZO}/>
  </g>
</svg>`;
}

/** Corona de jefe, encima del enemigo. */
const CORONA_JEFE = `<g transform="translate(30 -6) scale(0.4)"><path d="M5 40 L5 12 L25 28 L50 4 L75 28 L95 12 L95 40 Z" fill="var(--sol)" ${TRAZO} stroke-width="6"/><circle cx="50" cy="26" r="6" fill="#f43f5e" stroke="var(--contorno)" stroke-width="4"/></g>`;
const CEJAS_JEFE = (y) => `<g fill="none" stroke="var(--contorno)" stroke-width="3" stroke-linecap="round"><path d="M35 ${y - 2} L45 ${y + 2}"/><path d="M65 ${y - 2} L55 ${y + 2}"/></g>`;
const ojosSimples = (y, sep = 9, rx = 4, ry = 5) => `<g fill="var(--contorno)"><ellipse cx="${50 - sep}" cy="${y}" rx="${rx}" ry="${ry}"/><ellipse cx="${50 + sep}" cy="${y}" rx="${rx}" ry="${ry}"/><circle cx="${51.5 - sep}" cy="${y - 2}" r="1.4" fill="#fff"/><circle cx="${51.5 + sep}" cy="${y - 2}" r="1.4" fill="#fff"/></g>`;
const sonrisa = (y, ancho = 6) => `<path d="M${50 - ancho} ${y} Q50 ${y + 5} ${50 + ancho} ${y}" fill="none" stroke="var(--contorno)" stroke-width="2.5" stroke-linecap="round"/>`;

// Un enemigo por mundo de la Aventura: simpáticos, no de miedo.
const ARTE_ENEMIGO = [
    // Brócoli: ramilletes arriba, tallo con cara.
    (jefe) => `<ellipse cx="50" cy="95" rx="20" ry="3" fill="var(--sombra-arte)"/>
  <path d="M36 50 L36 84 Q36 92 44 92 L56 92 Q64 92 64 84 L64 50 Z" fill="#bbf7d0" ${TRAZO}/>
  <g fill="#22c55e" ${TRAZO}><circle cx="32" cy="40" r="13"/><circle cx="68" cy="40" r="13"/><circle cx="42" cy="28" r="14"/><circle cx="60" cy="27" r="14"/><circle cx="50" cy="42" r="13"/></g>
  <g fill="#16a34a"><circle cx="38" cy="25" r="3"/><circle cx="62" cy="23" r="3"/><circle cx="28" cy="40" r="2.5"/><circle cx="72" cy="38" r="2.5"/></g>
  ${ojosSimples(64, 7, 3.5, 4.5)}${sonrisa(75, 5)}${jefe ? CEJAS_JEFE(57) : ""}
  <ellipse cx="42" cy="70" rx="3.5" ry="2" fill="var(--mejilla)"/><ellipse cx="58" cy="70" rx="3.5" ry="2" fill="var(--mejilla)"/>`,
    // Monstruo: bolita morada de un ojo, cuernitos romos.
    (jefe) => `<ellipse cx="50" cy="95" rx="24" ry="3.5" fill="var(--sombra-arte)"/>
  <path d="M33 30 L28 14 L42 24 Z" fill="#fde68a" ${TRAZO}/><path d="M67 30 L72 14 L58 24 Z" fill="#fde68a" ${TRAZO}/>
  <ellipse cx="38" cy="90" rx="7" ry="4.5" fill="#7c3aed" ${TRAZO}/><ellipse cx="62" cy="90" rx="7" ry="4.5" fill="#7c3aed" ${TRAZO}/>
  <path d="M22 60 Q22 24 50 24 Q78 24 78 60 Q78 88 50 88 Q22 88 22 60 Z" fill="#a78bfa" ${TRAZO}/>
  <ellipse cx="38" cy="36" rx="7" ry="4" fill="var(--brillo)" transform="rotate(-30 38 36)"/>
  <circle cx="50" cy="50" r="12" fill="#fff" ${TRAZO}/><circle cx="51" cy="51" r="6" fill="var(--contorno)"/><circle cx="53" cy="48.5" r="2" fill="#fff"/>
  <path d="M38 70 Q50 80 62 70" fill="#7f1d1d" ${TRAZO} stroke-width="2.5"/><path d="M45 72 L47 77 L49 73" fill="#fff" stroke="var(--contorno)" stroke-width="1.5" stroke-linejoin="round"/>
  ${jefe ? `<g fill="none" stroke="var(--contorno)" stroke-width="3" stroke-linecap="round"><path d="M38 36 L48 40"/><path d="M62 36 L52 40"/></g>` : ""}`,
    // Fantasma: sábana con olas abajo, sonrojado.
    (jefe) => `<ellipse cx="50" cy="96" rx="18" ry="3" fill="var(--sombra-arte)"/>
  <path d="M24 86 L24 48 Q24 18 50 18 Q76 18 76 48 L76 86 Q70 80 63 87 Q56 80 50 87 Q44 80 37 87 Q30 80 24 86 Z" fill="#f8fafc" ${TRAZO}/>
  <path d="M18 56 Q14 64 24 66" fill="#f8fafc" ${TRAZO}/><path d="M82 56 Q86 64 76 66" fill="#f8fafc" ${TRAZO}/>
  <ellipse cx="38" cy="32" rx="7" ry="4" fill="#e0e7ff" transform="rotate(-30 38 32)"/>
  ${ojosSimples(47, 9, 4.5, 6)}
  <ellipse cx="50" cy="62" rx="4" ry="5" fill="var(--contorno)"/>
  <ellipse cx="35" cy="56" rx="5" ry="3" fill="var(--mejilla)"/><ellipse cx="65" cy="56" rx="5" ry="3" fill="var(--mejilla)"/>${jefe ? CEJAS_JEFE(38) : ""}`,
    // Zombi: verdecito, despeinado, con un parche y los brazos al frente.
    (jefe) => `<ellipse cx="50" cy="95" rx="20" ry="3" fill="var(--sombra-arte)"/>
  <path d="M34 66 L34 86 Q34 92 40 92 L60 92 Q66 92 66 86 L66 66 Z" fill="#60a5fa" ${TRAZO}/>
  <path d="M40 86 L44 80 L48 86 L52 80 L56 86 L60 80" fill="none" stroke="var(--contorno)" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="22" cy="66" rx="10" ry="5" fill="#a3e635" ${TRAZO}/><ellipse cx="78" cy="66" rx="10" ry="5" fill="#a3e635" ${TRAZO}/>
  <circle cx="50" cy="42" r="24" fill="#bef264" ${TRAZO}/>
  <path d="M28 34 Q32 18 44 20 Q46 12 54 18 Q64 14 70 26 Q74 30 72 36 Q64 26 54 28 Q44 24 34 34 Z" fill="#4b5563" ${TRAZO} stroke-width="2.5"/>
  <path d="M58 30 L68 30 M60 27 L60 33 M64 27 L64 33" stroke="var(--contorno)" stroke-width="1.8" stroke-linecap="round"/>
  <g fill="var(--contorno)"><circle cx="41" cy="44" r="5"/><circle cx="42.5" cy="42.5" r="1.5" fill="#fff"/></g>
  <circle cx="59" cy="44" r="6.5" fill="#fff" ${TRAZO} stroke-width="2.5"/><circle cx="59" cy="45" r="2.8" fill="var(--contorno)"/>
  <path d="M42 56 Q50 60 58 55" fill="none" stroke="var(--contorno)" stroke-width="2.5" stroke-linecap="round"/><path d="M48 58 L49 61 L51 58.5" fill="#fff" stroke="var(--contorno)" stroke-width="1.3"/>
  ${jefe ? CEJAS_JEFE(36) : ""}`,
    // Alien: cabezón, ojos grandes y antenas.
    (jefe) => `<ellipse cx="50" cy="95" rx="18" ry="3" fill="var(--sombra-arte)"/>
  <path d="M38 22 L32 8" stroke="var(--contorno)" stroke-width="3" stroke-linecap="round"/><path d="M62 22 L68 8" stroke="var(--contorno)" stroke-width="3" stroke-linecap="round"/>
  <circle cx="32" cy="8" r="4.5" fill="#f472b6" ${TRAZO} stroke-width="2.5"/><circle cx="68" cy="8" r="4.5" fill="#f472b6" ${TRAZO} stroke-width="2.5"/>
  <path d="M40 70 L40 86 Q40 92 46 92 L54 92 Q60 92 60 86 L60 70 Z" fill="#34d399" ${TRAZO}/>
  <path d="M20 42 Q20 18 50 18 Q80 18 80 42 Q80 72 50 74 Q20 72 20 42 Z" fill="#6ee7b7" ${TRAZO}/>
  <ellipse cx="36" cy="28" rx="7" ry="4" fill="var(--brillo)" transform="rotate(-30 36 28)"/>
  <ellipse cx="38" cy="45" rx="8" ry="11" fill="var(--contorno)" transform="rotate(-25 38 45)"/><ellipse cx="62" cy="45" rx="8" ry="11" fill="var(--contorno)" transform="rotate(25 62 45)"/>
  <circle cx="36" cy="41" r="2.5" fill="#fff"/><circle cx="60" cy="41" r="2.5" fill="#fff"/>
  ${sonrisa(62, 5)}${jefe ? CEJAS_JEFE(30) : ""}`,
    // Pulpito del mar: cabeza redonda, manchas y tentáculos enrollados.
    (jefe) => `<ellipse cx="50" cy="95" rx="24" ry="3" fill="var(--sombra-arte)"/>
  <g fill="#f472b6" ${TRAZO}>
    <path d="M28 66 Q16 80 24 90 Q30 92 30 86 Q26 80 36 72 Z"/><path d="M72 66 Q84 80 76 90 Q70 92 70 86 Q74 80 64 72 Z"/>
    <path d="M40 70 Q36 84 42 92 Q48 92 46 86 Q44 80 48 72 Z"/><path d="M60 70 Q64 84 58 92 Q52 92 54 86 Q56 80 52 72 Z"/>
  </g>
  <path d="M22 50 Q22 18 50 18 Q78 18 78 50 Q78 74 50 74 Q22 74 22 50 Z" fill="#f9a8d4" ${TRAZO}/>
  <ellipse cx="37" cy="30" rx="7" ry="4" fill="var(--brillo)" transform="rotate(-30 37 30)"/>
  <g fill="#ec4899"><circle cx="62" cy="28" r="3.5"/><circle cx="70" cy="38" r="2.5"/><circle cx="30" cy="40" r="2.5"/></g>
  ${ojosSimples(48, 10, 4, 5)}${sonrisa(60, 6)}
  <ellipse cx="34" cy="56" rx="5" ry="3" fill="var(--mejilla)"/><ellipse cx="66" cy="56" rx="5" ry="3" fill="var(--mejilla)"/>${jefe ? CEJAS_JEFE(39) : ""}`,
];

/** El enemigo del mundo `m`; el jefe lleva corona y cejas fruncidas. */
function svgEnemigo(m, jefe = false) {
    const dibujo = (ARTE_ENEMIGO[m] || ARTE_ENEMIGO[0])(jefe);
    return `<svg class="arte enemigo-arte" viewBox="0 -8 100 108" aria-hidden="true" focusable="false">${dibujo}${jefe ? CORONA_JEFE : ""}</svg>`;
}

// --- LUMI EN LOS TEMAS NUEVOS ---
//
// En las partidas de los temas nuevos, Lumi lleva en la mano un objeto del
// tema: el reloj, el calendario, una moneda… Va abajo a la derecha, en las
// mismas coordenadas que el dibujo de Lumi (100 × 100), con el contorno de
// la guía de estilo. Es decorativo, como Lumi.
const CONTORNO_ACCESORIO = 'stroke="var(--contorno)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
const ACCESORIOS_LUMI = {
    residuo: `<rect x="73" y="66" width="25" height="22" rx="4" fill="#e0f2fe" ${CONTORNO_ACCESORIO}/>
        <g fill="#0284c7"><circle cx="79" cy="73" r="2.6"/><circle cx="85.5" cy="73" r="2.6"/><circle cx="92" cy="73" r="2.6"/></g>
        <circle cx="79" cy="81.5" r="2.6" fill="#f59e0b"/>`,
    multiplos: `<rect x="73" y="66" width="25" height="22" rx="4" fill="#fef3c7" ${CONTORNO_ACCESORIO}/>
        <g fill="#b45309"><circle cx="79" cy="73" r="2.4"/><circle cx="85.5" cy="73" r="2.4"/><circle cx="92" cy="73" r="2.4"/>
        <circle cx="79" cy="81" r="2.4"/><circle cx="85.5" cy="81" r="2.4"/><circle cx="92" cy="81" r="2.4"/></g>`,
    area: `<rect x="74" y="66" width="22" height="22" rx="2" fill="#bbf7d0" ${CONTORNO_ACCESORIO}/>
        <path d="M81.3 66 V88 M88.7 66 V88 M74 73.3 H96 M74 80.7 H96" stroke="#15803d" stroke-width="1.4"/>`,
    dinero: `<circle cx="86" cy="77" r="11.5" fill="#fbbf24" ${CONTORNO_ACCESORIO}/>
        <circle cx="86" cy="77" r="8" fill="none" stroke="#b45309" stroke-width="1.4"/>
        <text x="86" y="77.5" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="800" fill="#92400e">$</text>`,
    porcentajes: `<circle cx="86" cy="77" r="11.5" fill="#f9a8d4" ${CONTORNO_ACCESORIO}/>
        <text x="86" y="77.5" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="800" fill="#831843">%</text>`,
    decimales: `<rect x="71" y="68" width="29" height="18" rx="4" fill="#e0e7ff" ${CONTORNO_ACCESORIO}/>
        <text x="85.5" y="77.5" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="800" fill="#3730a3">0.1</text>`,
    tiempo: `<circle cx="86" cy="77" r="11.5" fill="#fff" ${CONTORNO_ACCESORIO}/>
        <g stroke="#6366f1" stroke-width="1.4" stroke-linecap="round"><path d="M86 67.5 V69.5 M86 84.5 V86.5 M76.5 77 H78.5 M93.5 77 H95.5"/></g>
        <path d="M86 77 V70.5 M86 77 L91 79" stroke="#1e1b4b" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <circle cx="86" cy="77" r="1.6" fill="#1e1b4b"/>`,
    calendario: `<rect x="74" y="67" width="24" height="22" rx="3" fill="#fff" ${CONTORNO_ACCESORIO}/>
        <path d="M74 70 Q74 67 77 67 H95 Q98 67 98 70 V74 H74 Z" fill="#ef4444" stroke="var(--contorno)" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M80 64.5 V69.5 M92 64.5 V69.5" stroke="var(--contorno)" stroke-width="2.5" stroke-linecap="round"/>
        <g fill="#94a3b8"><rect x="77.5" y="77" width="3.5" height="3.5" rx="0.8"/><rect x="84.2" y="77" width="3.5" height="3.5" rx="0.8"/><rect x="91" y="77" width="3.5" height="3.5" rx="0.8"/>
        <rect x="77.5" y="83" width="3.5" height="3.5" rx="0.8"/><rect x="84.2" y="83" width="3.5" height="3.5" rx="0.8" fill="#ef4444"/></g>`,
};

/** Pone en la Lumi de la caja `id` el objeto del tema (o se lo quita, si el tema no tiene). */
function ponerAccesorioLumi(id, tema) {
    const svg = document.querySelector(`#${id} > .lumi`);
    if (!svg) return;
    svg.querySelector(".accesorio-lumi")?.remove();
    if (!ACCESORIOS_LUMI[tema]) return;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "accesorio-lumi");
    g.dataset.tema = tema;
    g.innerHTML = ACCESORIOS_LUMI[tema];
    svg.appendChild(g);
}
