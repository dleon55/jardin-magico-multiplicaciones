// EL MUNDO VIVO (Hito 4): el inicio ya no es una lista de botones, es un
// mundo que se recorre. Cada lugar reúne unos temas, de lo más fácil a lo
// más avanzado, y despierta cuando se saben las tablas que necesita. Lo
// aprendido se ve: el camino florece y Lumi está junto al último lugar
// despierto.
//
// La lista de siempre sigue en Ajustes («Menú en lista»): es la vista para
// lectores de pantalla y para las personas adultas, y ahí nada duerme.
//
// Es un script clásico que solo declara (ver pruebas/archivos.spec.mjs).

// `corto`: el nombre de una palabra, para el tono Brote.
// `pide`: las tablas que hay que saberse. `rastro`: si ya hay respuestas
// guardadas de esos temas, el lugar no se vuelve a dormir aunque una tabla
// se marchite (quien ya jugaba a los porcentajes los conserva).
const LUGARES = [
    { id: "huerto", nombre: "Huerto de las tablas", corto: "Las tablas", pide: [], rastro: [], cx: 115, cy: 190, borde: "#34d399", tinta: "#065f46",
        sub: "Descubre cada tabla, practícala y mézclalas.",
        juegos: [["desafio", "Desafío del Arcoíris", "Todas las tablas, mezcladas", "mix"]] },
    { id: "bosque", nombre: "Bosque de dividir", corto: "Dividir", pide: [2, 5], rastro: ["residuo:"], cx: 255, cy: 410, borde: "#38bdf8", tinta: "#075985",
        sub: "Repartir en partes iguales, lo que sobra y problemas cortos.",
        juegos: [["dividir", "Dividir", "Repartir en partes iguales", "div"], ["residuo", "Dividir con lo que sobra", "17 entre 5: 3, y sobran 2", "residuo"], ["problemas", "Problemas cortos", "¿Se multiplica o se divide?", "problemas"]] },
    { id: "rio", nombre: "Río de los números", corto: "Números", pide: [2, 5, 3, 4], rastro: ["multiplos:", "logica:"], cx: 120, cy: 635, borde: "#f59e0b", tinta: "#92400e",
        sub: "Múltiplos, divisores y retos para pensar con las tablas.",
        juegos: [["multiplos", "Múltiplos y divisores", "¿Está en la tabla del 6?", "multiplos"], ["logica", "Retos de lógica", "Pensar con las tablas", "logica"]] },
    { id: "partes", nombre: "Jardín de las partes", corto: "Partes", pide: [2, 5, 3, 4, 9, 6], rastro: ["fraccion:", "decimales:", "porcentaje:"], cx: 250, cy: 860, borde: "#fb7185", tinta: "#9f1239",
        sub: "Fracciones, decimales y porcentajes: el entero en partes.",
        juegos: [["fracciones", "Fracciones", "De un número, iguales, comparar y sumar", "fracciones"], ["decimales", "Fracciones decimales", "Décimos, centésimos y el punto", "decimales"], ["porcentajes", "Porcentajes", "La mitad, la cuarta parte y los descuentos", "porcentajes"]] },
    { id: "mercado", nombre: "Mercado y reloj", corto: "Medir", pide: [2, 5, 3, 4, 9, 6, 7], rastro: ["dinero:", "tiempo:", "calendario:", "area:"], cx: 125, cy: 1080, borde: "#a78bfa", tinta: "#5b21b6",
        sub: "Medir: el dinero, el tiempo, el calendario y el área.",
        juegos: [["dinero", "Decimales y dinero", "Pesos, centavos y el cambio", "dinero"], ["tiempo", "Medidas de tiempo", "El reloj y cuánto dura", "tiempo"], ["calendario", "El calendario", "Días, semanas y meses", "calendario"], ["area", "Perímetro y área", "La orilla y los cuadritos de adentro", "area"]] },
];
const MUNDO_ANCHO = 370;
const MUNDO_ALTO = 1240;
// Dónde brotan las flores del camino, en orden: se ven tantas como lo florecido.
const FLORES_MUNDO = [[190, 150], [230, 215], [285, 265], [300, 330], [180, 300], [170, 420], [110, 470], [75, 540], [200, 520], [210, 600], [270, 650], [310, 720], [170, 720], [165, 800], [330, 820], [120, 900], [80, 960], [220, 960], [230, 1040], [280, 1100], [60, 1150], [200, 1160], [320, 560], [50, 330]];
// Dónde se plantan los banderines de la Expedición de hoy (uno por día
// completado): a un lado del sendero, lejos de los lugares y de las flores.
const BANDERINES_MUNDO = [[325, 150], [335, 235], [28, 395], [60, 445], [345, 725], [345, 775], [40, 820], [50, 895], [330, 1040], [335, 1160]];
const RACHA_ARCOIRIS = 3;   // días seguidos con la meta para que salga el arcoíris
const COLORES_FLOR_MUNDO = ["#fb7185", "#facc15", "#a78bfa", "#fb923c", "#38bdf8"];
const TRAZO_MUNDO = 'stroke="var(--contorno)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

// Los dibujos de los temas que Lumi no lleva en la mano (los demás están en
// ACCESORIOS_LUMI), en el mismo espacio y con el mismo contorno.
const ICONOS_TEMA = {
    descubrir: `<circle cx="82" cy="74" r="9" fill="#e0f2fe" ${CONTORNO_ACCESORIO}/><path d="M89 81l8 8" ${CONTORNO_ACCESORIO}/>
        <g fill="#0369a1"><circle cx="79" cy="72" r="1.6"/><circle cx="84" cy="72" r="1.6"/><circle cx="79" cy="77" r="1.6"/><circle cx="84" cy="77" r="1.6"/></g>`,
    desafio: `<path d="M71 88a15 15 0 0 1 30 0" fill="none" stroke="var(--contorno)" stroke-width="9" stroke-linecap="round"/><path d="M71 88a15 15 0 0 1 30 0" fill="none" stroke="#f472b6" stroke-width="5"/>
        <path d="M75.5 88a10.5 10.5 0 0 1 21 0" fill="none" stroke="#facc15" stroke-width="4"/><path d="M80 88a6 6 0 0 1 12 0" fill="none" stroke="#38bdf8" stroke-width="3.5"/>`,
    dividir: `<rect x="72" y="65" width="27" height="25" rx="5" fill="#e0f2fe" ${CONTORNO_ACCESORIO}/><circle cx="85.5" cy="71.5" r="2.3" fill="#0369a1"/><circle cx="85.5" cy="83.5" r="2.3" fill="#0369a1"/>
        <path d="M78 77.5h15" stroke="#0369a1" stroke-width="2.8" stroke-linecap="round"/>`,
    problemas: `<path d="M71 70q7-3 14 0v19q-7-3-14 0z" fill="#fef3c7" ${CONTORNO_ACCESORIO}/><path d="M85 70q7-3 14 0v19q-7-3-14 0z" fill="#fde68a" ${CONTORNO_ACCESORIO}/>
        <path d="M74 75h8M74 79h8M88 75h8M88 79h8" stroke="#a16207" stroke-width="1.5" stroke-linecap="round"/>`,
    logica: `<path d="M73 69h9a4 4 0 1 1 6 0h9v9a4 4 0 1 0 0 6v6H73z" fill="#ddd6fe" ${CONTORNO_ACCESORIO}/>
        <text x="83" y="82" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="800" fill="#5b21b6">?</text>`,
    fracciones: `<circle cx="86" cy="77" r="11.5" fill="#fef3c7" ${CONTORNO_ACCESORIO}/><path d="M86 77V65.5A11.5 11.5 0 0 1 97.5 77z" fill="#fb923c" ${CONTORNO_ACCESORIO}/>`,
};

/** El dibujo de un tema, para las tarjetas de un lugar. */
function iconoTema(tema) {
    return `<svg class="icono-tema" viewBox="68 61 34 32" aria-hidden="true" focusable="false">${ACCESORIOS_LUMI[tema] || ICONOS_TEMA[tema] || ""}</svg>`;
}

/** Las tablas que le faltan a un lugar para despertar (vacío si ya despertó). */
function faltanParaLugar(lugar) {
    if (lugar.rastro.some((prefijo) => Object.keys(otros).some((k) => k.startsWith(prefijo) && otros[k].length > 0))) return [];
    return lugar.pide.filter((n) => !tablaSabida(n));
}

/** El dibujo de cada lugar, con pocas formas y el contorno del juego. */
function escenaLugar(lugar) {
    const { cx: x, cy: y } = lugar;
    const T = TRAZO_MUNDO;
    if (lugar.id === "huerto") {
        return `<ellipse cx="${x}" cy="${y}" rx="92" ry="58" fill="#e0a868" ${T}/>` + [-26, -2, 22].map((dy) =>
            `<rect x="${x - 62}" y="${y + dy - 7}" width="124" height="14" rx="7" fill="#9a5b2b"/>` + [-44, -15, 15, 44].map((dx) =>
                `<path d="M${x + dx} ${y + dy - 6}v-9" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>` +
                `<circle cx="${x + dx - 4}" cy="${y + dy - 17}" r="4.5" fill="#4ade80" stroke="var(--contorno)" stroke-width="1.8"/><circle cx="${x + dx + 4}" cy="${y + dy - 17}" r="4.5" fill="#4ade80" stroke="var(--contorno)" stroke-width="1.8"/>`).join("")).join("");
    }
    if (lugar.id === "bosque") {
        return [[-52, 8, 26], [0, -10, 34], [50, 10, 27]].map(([dx, dy, r]) =>
            `<rect x="${x + dx - 5}" y="${y + dy + r - 8}" width="10" height="26" rx="3" fill="#92400e" ${T}/><circle cx="${x + dx}" cy="${y + dy}" r="${r}" fill="#22c55e" ${T}/>` +
            `<circle cx="${x + dx - r / 3}" cy="${y + dy - r / 3}" r="${r / 4}" fill="var(--brillo)"/>`).join("");
    }
    if (lugar.id === "rio") {
        // Piedras para cruzar, con múltiplos de 6.
        return [[-58, -4, 6], [0, 4, 12], [58, -6, 18]].map(([dx, dy, n]) =>
            `<ellipse cx="${x + dx}" cy="${y + dy}" rx="24" ry="17" fill="#f1f5f9" ${T}/>` +
            `<text x="${x + dx}" y="${y + dy + 1}" text-anchor="middle" dominant-baseline="central" font-size="17" font-weight="800" fill="#92400e">${n}</text>`).join("");
    }
    if (lugar.id === "partes") {
        const R = 50;
        const punto = (g) => [x + R * Math.sin((g * Math.PI) / 180), y - R * Math.cos((g * Math.PI) / 180)].map((v) => v.toFixed(1));
        const gajo = (g0, g1, color) => `<path d="M${x} ${y}L${punto(g0)}A${R} ${R} 0 0 1 ${punto(g1)}Z" fill="${color}" ${T}/>`;
        return `<circle cx="${x}" cy="${y}" r="${R}" fill="#fff1f2" ${T}/>` + gajo(0, 90, "#fb7185") + gajo(90, 180, "#fdba74") + gajo(180, 270, "#fde68a") +
            `<circle cx="${x}" cy="${y}" r="9" fill="#facc15" ${T}/>`;
    }
    return `<rect x="${x - 58}" y="${y - 8}" width="116" height="50" rx="6" fill="#fef3c7" ${T}/>` +
        [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${x - 66 + i * 22} ${y - 34}h22v22a11 11 0 0 1-22 0z" fill="${i % 2 ? "#fff" : "#a78bfa"}" ${T}/>`).join("") +
        `<circle cx="${x}" cy="${y - 52}" r="20" fill="#fff" ${T}/><path d="M${x} ${y - 52}v-11M${x} ${y - 52}l8 4" stroke="var(--contorno)" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="${x - 30}" cy="${y + 18}" r="10" fill="#facc15" ${T}/><rect x="${x + 12}" y="${y + 6}" width="30" height="24" rx="4" fill="#fff" ${T}/><path d="M${x + 12} ${y + 14}h30" stroke="#ef4444" stroke-width="5"/>`;
}

/** Una flor del camino. */
function florDelMundo([x, y], i) {
    const color = COLORES_FLOR_MUNDO[i % COLORES_FLOR_MUNDO.length];
    const petalos = [0, 72, 144, 216, 288].map((g) =>
        `<circle cx="${(x + 6 * Math.sin((g * Math.PI) / 180)).toFixed(1)}" cy="${(y - 6 * Math.cos((g * Math.PI) / 180)).toFixed(1)}" r="4.6" fill="${color}" stroke="var(--contorno)" stroke-width="1.5"/>`).join("");
    return `<g class="flor-mundo"><path d="M${x} ${y}v12" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>${petalos}<circle cx="${x}" cy="${y}" r="3.4" fill="#fff7d1" stroke="var(--contorno)" stroke-width="1.5"/></g>`;
}

/**
 * El mundo entero, en SVG: el suelo, el río, el sendero, las flores de lo
 * aprendido, los lugares y la niebla sobre los que duermen. Decorativo: los
 * botones de cada lugar van encima, en HTML.
 */
function svgMundo(dormidos, flores, banderines = 0, racha = 0, solConRayos = false) {
    const rio = "M-20 610 C70 560 150 700 250 640 S340 600 400 650";
    let s = `<svg class="mundo-arte" viewBox="0 0 ${MUNDO_ANCHO} ${MUNDO_ALTO}" aria-hidden="true" focusable="false">`;
    // Con tres días seguidos cumpliendo la meta, sale el arcoíris (detrás del pasto).
    if (racha >= RACHA_ARCOIRIS) {
        s += `<g class="arcoiris-mundo" fill="none" stroke-width="7" stroke-linecap="round">` +
            [["#fb7185", 62], ["#facc15", 54], ["#38bdf8", 46]].map(([color, r]) => `<path d="M${105 - r} 100a${r} ${r} 0 0 1 ${2 * r} 0" stroke="${color}"/>`).join("") + `</g>`;
    }
    s += `<path d="M0 90 Q90 50 185 80 T370 70 V${MUNDO_ALTO} H0Z" fill="var(--mundo-pasto)"/>`;
    s += [[60, 280, 70], [300, 520, 80], [70, 800, 75], [310, 1000, 70], [200, 1200, 90]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.55}" fill="var(--mundo-pasto-2)"/>`).join("");
    // Con el repaso de la semana hecho, el sol brilla con rayos.
    if (solConRayos) {
        s += `<g class="rayos-sol" stroke="var(--sol)" stroke-width="5" stroke-linecap="round">` + [0, 45, 90, 135, 180, 225, 270, 315].map((g) => {
            const [c, n] = [Math.cos((g * Math.PI) / 180), Math.sin((g * Math.PI) / 180)];
            return `<path d="M${(318 + 29 * c).toFixed(1)} ${(46 + 29 * n).toFixed(1)}L${(318 + 38 * c).toFixed(1)} ${(46 + 38 * n).toFixed(1)}"/>`;
        }).join("") + `</g>`;
    }
    s += `<circle class="mundo-sol" cx="318" cy="46" r="22" fill="var(--sol)" stroke="var(--contorno)" stroke-width="3"/>`;
    s += `<path d="${rio}" fill="none" stroke="var(--contorno)" stroke-width="62" stroke-linecap="round"/><path d="${rio}" fill="none" stroke="var(--mundo-agua)" stroke-width="56" stroke-linecap="round"/>`;
    s += `<path d="M-20 600 C70 550 150 690 250 630 S340 590 400 640" fill="none" stroke="var(--brillo)" stroke-width="6" stroke-dasharray="18 26" stroke-linecap="round"/>`;
    s += `<path d="M115 190 C300 230 330 340 255 410 S50 520 120 635 S340 740 250 860 S50 970 125 1080" fill="none" stroke="var(--mundo-sendero)" stroke-width="16" stroke-linecap="round" stroke-dasharray="2 24"/>`;
    s += FLORES_MUNDO.slice(0, flores).map(florDelMundo).join("");
    s += BANDERINES_MUNDO.slice(0, banderines).map(banderinDelMundo).join("");
    for (const lugar of LUGARES) {
        const duerme = dormidos.has(lugar.id);
        s += `<g class="escena-lugar${duerme ? " escena-dormida" : ""}" data-lugar="${lugar.id}">${escenaLugar(lugar)}</g>`;
        if (duerme) {
            s += `<g class="niebla-lugar" data-lugar="${lugar.id}">` + [[-60, -20, 62, 34], [10, -38, 74, 38], [62, -4, 58, 32], [-10, 22, 86, 34]].map(([dx, dy, rx, ry]) =>
                `<ellipse cx="${lugar.cx + dx}" cy="${lugar.cy + dy}" rx="${rx}" ry="${ry}" fill="var(--mundo-niebla)" opacity=".8"/>`).join("") +
                `<text x="${lugar.cx + 46}" y="${lugar.cy - 52}" font-size="20" font-weight="800" fill="var(--mundo-zzz)">z z z</text></g>`;
        }
    }
    return `${s}</svg>`;
}

/** Un banderín plantado: un día con la Expedición completa. */
function banderinDelMundo([x, y], i) {
    return `<g class="banderin-mundo"><ellipse cx="${x}" cy="${y}" rx="11" ry="4" fill="var(--mundo-pasto-2)" ${TRAZO_MUNDO}/>` +
        `<path d="M${x} ${y}V${y - 38}" fill="none" ${TRAZO_MUNDO}/>` +
        `<path d="M${x} ${y - 38}l22 8l-22 8z" fill="${COLORES_FLOR_MUNDO[i % COLORES_FLOR_MUNDO.length]}" ${TRAZO_MUNDO}/></g>`;
}

/** Una Lumi suelta (fuera de las .lumi-caja que pinta ponerLumis). */
function lumiSuelta(expresion) {
    const svg = document.getElementById("plantilla-lumi").content.firstElementChild.cloneNode(true);
    const id = `lumi-recorte-${++lumisCreados}`;
    svg.querySelector("[data-recorte]").id = id;
    svg.querySelector("[data-recortado]").setAttribute("clip-path", `url(#${id})`);
    svg.dataset.expresion = expresion;
    svg.dataset.etapa = String(etapaLumi);
    return svg;
}
