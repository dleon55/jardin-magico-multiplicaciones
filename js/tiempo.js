// MEDIDAS DE TIEMPO (issue #105): el reloj, cuánto dura y horas a minutos.
//
// Lo difícil del tiempo es que no cuenta de 10 en 10: una hora tiene 60
// minutos, no 100. Y se une con las tablas: cada número del reloj son 5
// minutos (la tabla del 5), y 60 = 12 × 5. Cuatro clases, para elegir:
//   leer      El reloj de manecillas marca las 2:15.
//   sumar     Son las 3:50. ¿Qué hora será en 20 minutos?        → 4:10
//   duracion  Sale a las 3:40 y llega a las 4:15. ¿Cuánto tardó?  → 35 minutos
//   convertir ¿Cuántos minutos son 2 horas y 15 minutos?          → 135
// Las falsas son los errores típicos, cada uno explicado: leer el número y
// no los minutos, cambiar las manecillas, contar la hora como de 100
// minutos (3:70, 75 minutos, 130 minutos), no pasar a la hora siguiente.
//
// Las horas van del 1 al 12, sin a. m. ni p. m. Una hora como opción vale
// h × 100 + minutos, tal como se escribe: así «3:70» (la trampa) y «4:10»
// (la buena) son opciones distintas. Es un script clásico que solo declara
// (ver pruebas/archivos.spec.mjs).

/** 2, 5 → «2:05». */
const escribirHora = (h, m) => `${h}:${String(m).padStart(2, "0")}`;
/** Del 1 al 12, dando la vuelta: 13 → 1, 0 → 12. */
const horaDelReloj = (h) => ((h - 1 + 12) % 12) + 1;
/** «las 3 y cuarto», «la 1 en punto», «las 4 y 50»: como se dice. */
function horaEnVoz(h, m) {
    const las = h === 1 ? "la 1" : `las ${h}`;
    if (m === 0) return `${las} en punto`;
    if (m === 15) return `${las} y cuarto`;
    if (m === 30) return `${las} y media`;
    return `${las} y ${m}`;
}
/** «son las 3 y cuarto», «es la 1 en punto». */
const esLaHora = (h, m) => `${h === 1 ? "es" : "son"} ${horaEnVoz(h, m)}`;
const FRACCION_HORA = { 1: ["un cuarto de hora", 15], 2: ["media hora", 30], 3: ["tres cuartos de hora", 45] };
/** Un múltiplo de 5 entre lo y hi. */
const cincoEntre = (lo, hi) => 5 * entre(Math.ceil(lo / 5), Math.floor(hi / 5));
const unoDe = (lista) => lista[entre(0, lista.length - 1)];

/** Diez preguntas: tres de leer, tres de sumar, dos de cuánto dura y dos de convertir. */
function bolsaDeTiempo() {
    const pocas = parejasConocidas().length < MIN_CONOCIDAS;
    const clases = barajar(["leer", "leer", "leer", "sumar", "sumar", "sumar", "duracion", "duracion", "convertir", "convertir"]);
    const vistas = new Set();
    return clases.map((clase) => {
        let reto;
        let intentos = 0;
        do { reto = crearRetoTiempo(clase, pocas); } while (vistas.has(JSON.stringify(reto)) && ++intentos < 30);
        vistas.add(JSON.stringify(reto));
        return { a: numerosDeTiempo(reto)[0], b: 1, reto };
    });
}

function crearRetoTiempo(clase, pocas) {
    // Con pocas tablas sabidas: en punto, y cuarto, y media y menos cuarto.
    if (clase === "leer") return { clase, h: entre(1, 12), m: pocas ? unoDe([0, 15, 30, 45]) : cincoEntre(0, 55) };
    if (clase === "sumar" || clase === "duracion") {
        // Siempre se pasa a la hora siguiente (ahí está el error), sin llegar
        // justo a la hora en punto ni pasar de las 12.
        const h = entre(1, 10);
        if (pocas) {
            const [m, d] = unoDe([[30, 45], [45, 30], [45, 45]]);
            return { clase, h, m, d };
        }
        const m = cincoEntre(15, 55);
        return { clase, h, m, d: cincoEntre(65 - m, 55) };
    }
    if (pocas || Math.random() < 0.4) return { clase, f: entre(1, 3) };
    return { clase, H: entre(1, 3), M: cincoEntre(5, 55) };
}

/** Un número del 1 al 9 que represente el reto (para el color de la planta). */
function numerosDeTiempo(r) {
    const n = r.h ?? r.H ?? r.f;
    return [((n - 1) % 9) + 1, 1];
}

/**
 * Un reloj de manecillas en SVG. Con `minutos`, cada número lleva al lado
 * sus minutos (5, 10, 15…): la tabla del 5. Sin texto: lo describe quien lo usa.
 */
function relojSVG(h, m, { minutos = false, tam = 128 } = {}) {
    const c = 70;
    const punto = (ang, r) => [c + r * Math.sin((ang * Math.PI) / 180), c - r * Math.cos((ang * Math.PI) / 180)].map((v) => v.toFixed(1));
    let s = `<svg class="reloj shrink-0" viewBox="0 0 140 140" width="${tam}" height="${tam}" aria-hidden="true" focusable="false">`;
    s += `<circle cx="${c}" cy="${c}" r="52" fill="#fff" stroke="#4338ca" stroke-width="4"/>`;
    for (let i = 0; i < 60; i++) {
        const [x1, y1] = punto(i * 6, i % 5 ? 48 : 45);
        const [x2, y2] = punto(i * 6, 50);
        s += `<line class="${i % 5 ? "marca-minuto" : "marca-hora"}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6366f1" stroke-width="${i % 5 ? 1 : 2}"/>`;
    }
    for (let n = 1; n <= 12; n++) {
        const [x, y] = punto(n * 30, 37);
        s += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="700" fill="#1f2937">${n}</text>`;
        if (minutos) {
            const [mx, my] = punto(n * 30, 62);
            s += `<text class="minutos-reloj" x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" font-size="8" font-weight="700" fill="#be123c">${(n * 5) % 60}</text>`;
        }
    }
    const [hx, hy] = punto(((h % 12) + m / 60) * 30, 26);
    const [mx, my] = punto(m * 6, 42);
    s += `<line class="manecilla-hora" x1="${c}" y1="${c}" x2="${hx}" y2="${hy}" stroke="#1e1b4b" stroke-width="6" stroke-linecap="round"/>`;
    s += `<line class="manecilla-minuto" x1="${c}" y1="${c}" x2="${mx}" y2="${my}" stroke="#be123c" stroke-width="3" stroke-linecap="round"/>`;
    s += `<circle cx="${c}" cy="${c}" r="4" fill="#1e1b4b"/></svg>`;
    return s;
}

/** Para el lector de pantalla: dónde están las manecillas, sin decir la hora. */
function manecillasEnPalabras(h, m) {
    const corta = m === 0 ? `en el ${h}` : `entre el ${h} y el ${horaDelReloj(h + 1)}`;
    const larga = m === 0 ? "en el 12" : m % 5 === 0 ? `en el ${m / 5}` : `cerca del ${Math.round(m / 5) || 12}`;
    return `Un reloj de manecillas: la manecilla corta está ${corta}, y la larga, ${larga}.`;
}

function armarTiempo(reto) {
    const falsas = [];
    const anadir = (valor, etiqueta, porQue, vale) => {
        if (valor === vale || valor < 1 || falsas.some((f) => f.opcion.valor === valor) || falsas.length >= 3) return;
        falsas.push({ opcion: { valor, etiqueta }, porQue });
    };
    const hora = (h, m) => ({ valor: h * 100 + m, etiqueta: escribirHora(h, m) });
    const conHora = (h, m, porQue, vale) => { const o = hora(h, m); anadir(o.valor, o.etiqueta, porQue, vale); };
    const minutos = (n) => ({ valor: n, etiqueta: `${n} min` });
    const conMinutos = (n, porQue, vale) => anadir(n, `${n} min`, porQue, vale);
    const { clase } = reto;
    let p;
    if (clase === "leer") {
        const { h, m } = reto;
        const buena = hora(h, m);
        const r = buena.valor;
        const numeroLarga = m / 5 || 12;
        const cuenta = m === 0 ? "en el 12 marca 0 minutos: es la hora en punto" : `en el ${m / 5} marca ${m} minutos: ${m / 5} × 5 = ${m}`;
        conHora(h, numeroLarga, `La larga ${cuenta}. Cada número son 5 minutos.`, r);
        conHora(numeroLarga, (h * 5) % 60, `Cambiaste las manecillas: la corta marca la hora (${h}) y la larga los minutos (${m}).`, r);
        if (m >= 30) conHora(horaDelReloj(h + 1), m, `La corta ya casi llega al ${horaDelReloj(h + 1)}, pero todavía no: ${esLaHora(h, m)}. La hora cambia cuando la larga llega al 12.`, r);
        else conHora(horaDelReloj(h - 1), m, m === 0
            ? `La corta está justo en el ${h}: ${esLaHora(h, 0)}.`
            : `La corta ya pasó el ${h}: ${esLaHora(h, m)}, no ${horaEnVoz(horaDelReloj(h - 1), m)}.`, r);
        // Si el reloj marca justo donde las manecillas cambiadas coinciden (3:15), otras dos trampas.
        conHora(h, (m + 30) % 60, `La larga ${cuenta}. Cuenta de 5 en 5 desde el 12.`, r);
        conHora(horaDelReloj(h + 1), (m + 30) % 60, `La corta marca la hora (${h}) y la larga ${m} minutos.`, r);
        p = { respuesta: r, opcionBuena: buena,
            texto: "¿Qué hora marca el reloj?",
            descripcion: manecillasEnPalabras(h, m),
            dibujo: relojSVG(h, m, { tam: 104 }),
            pista: "La manecilla corta marca la hora. La larga, los minutos: cuenta de 5 en 5 desde el 12 hasta donde apunta.",
            explicacion: `El reloj marca las ${escribirHora(h, m)}: la corta ${m === 0 ? "está en el" : "pasó el"} ${h}, y la larga marca ${m} minutos.`,
            voz: "¿Qué hora marca el reloj?" };
    } else if (clase === "sumar") {
        const { h, m, d } = reto;
        const e = m + d - 60;
        const buena = hora(h + 1, e);
        const r = buena.valor;
        const camino = `De ${escribirHora(h, m)} a ${escribirHora(h + 1, 0)} son ${60 - m} minutos, y faltan ${d - (60 - m)} más: ${buena.etiqueta}.`;
        // «3:70»: solo si se ve como una hora (con 105 minutos ya no engaña).
        if (m + d < 100) conHora(h, m + d, `Una hora tiene 60 minutos, no 100: ${m} + ${d} = ${m + d} minutos es 1 hora y ${e}. ${camino}`, r);
        conHora(h, e, `Te faltó pasar a la hora siguiente. ${camino}`, r);
        conHora(h + 1, (e + 10) % 60, camino, r);
        conHora(h + 2, e, `Es una hora de más. ${camino}`, r);
        p = { respuesta: r, opcionBuena: buena,
            texto: `Son las ${escribirHora(h, m)}. ¿Qué hora será en ${d} minutos?`,
            pista: `Primero llega a la hora en punto: de ${escribirHora(h, m)} a ${escribirHora(h + 1, 0)} son ${60 - m} minutos. Luego suma lo que falta.`,
            explicacion: `En ${d} minutos serán las ${buena.etiqueta}. ${camino}`,
            voz: `Son ${horaEnVoz(h, m)}. ¿Qué hora será en ${d} minutos?` };
    } else if (clase === "duracion") {
        const { h, m, d } = reto;
        const e = m + d - 60;
        const buena = minutos(d);
        const camino = `De ${escribirHora(h, m)} a ${escribirHora(h + 1, 0)} son ${60 - m} minutos, y de ahí a ${escribirHora(h + 1, e)}, ${e} más: ${60 - m} + ${e} = ${d}.`;
        conMinutos(d + 40, `Restaste ${(h + 1) * 100 + e} − ${h * 100 + m}, como si la hora tuviera 100 minutos. Tiene 60. ${camino}`, d);
        conMinutos(60 - m, `Eso es solo hasta las ${escribirHora(h + 1, 0)}. ${camino}`, d);
        conMinutos(e, `Eso es solo desde las ${escribirHora(h + 1, 0)}. ${camino}`, d);
        conMinutos(60 - d, `Restaste solo los minutos, ${Math.max(m, e)} − ${Math.min(m, e)}. ${camino}`, d);
        conMinutos(d + 60, `Es una hora de más. ${camino}`, d);
        p = { respuesta: d, opcionBuena: buena,
            texto: `Sale a las ${escribirHora(h, m)} y llega a las ${escribirHora(h + 1, e)}. ¿Cuántos minutos tardó?`,
            pista: `Ve por partes: primero hasta las ${escribirHora(h + 1, 0)}, y luego hasta las ${escribirHora(h + 1, e)}.`,
            explicacion: `Tardó ${d} minutos. ${camino}`,
            voz: `Sale a ${horaEnVoz(h, m)} y llega a ${horaEnVoz(h + 1, e)}. ¿Cuántos minutos tardó?` };
    } else if (reto.f) {
        const [nombre, r] = FRACCION_HORA[reto.f];
        const de100 = r * 100 / 60;
        conMinutos(de100, `${de100} sería ${nombre} si la hora tuviera 100 minutos. Tiene 60: ${reto.f === 2 ? "60 ÷ 2" : reto.f === 1 ? "60 ÷ 4" : "60 ÷ 4 × 3"} = ${r}.`, r);
        for (const [otro, v] of Object.values(FRACCION_HORA)) conMinutos(v, `${v} minutos son ${otro}.`, r);
        conMinutos(60, "60 minutos son una hora entera.", r);
        p = { respuesta: r, opcionBuena: minutos(r),
            texto: `¿Cuántos minutos son ${nombre}?`,
            pista: `Una hora son 60 minutos. ${reto.f === 2 ? "Media hora es la mitad." : "Un cuarto es partirla en 4."}`,
            explicacion: `${nombre[0].toUpperCase()}${nombre.slice(1)} son ${r} minutos: ${reto.f === 2 ? "60 ÷ 2 = 30" : reto.f === 1 ? "60 ÷ 4 = 15" : "60 ÷ 4 = 15, y 15 × 3 = 45"}.`,
            voz: `¿Cuántos minutos son ${nombre}?` };
    } else {
        const { H, M } = reto;
        const r = 60 * H + M;
        const horas = H === 1 ? "1 hora" : `${H} horas`;
        const cuenta = `${H} × 60 = ${60 * H}, y ${60 * H} + ${M} = ${r}.`;
        conMinutos(100 * H + M, `Una hora tiene 60 minutos, no 100: ${cuenta}`, r);
        conMinutos(60 * H, `Te faltaron los ${M} minutos: ${cuenta}`, r);
        if (H > 1) conMinutos(60 + M, `Contaste una sola hora, y son ${H}: ${cuenta}`, r);
        conMinutos(H + M, `Las horas no son minutos: cada hora son 60. ${cuenta}`, r);
        conMinutos(r + 60, `Es una hora de más: ${cuenta}`, r);
        p = { respuesta: r, opcionBuena: minutos(r),
            texto: `¿Cuántos minutos son ${horas} y ${M} minutos?`,
            pista: `Cada hora son 60 minutos (12 × 5). Multiplica las horas por 60 y suma los minutos.`,
            explicacion: `${horas} y ${M} minutos son ${r} minutos: ${cuenta}`,
            voz: `¿Cuántos minutos son ${horas} y ${M} minutos?` };
    }
    const tres = falsas.slice(0, 3);
    return {
        tipo: "tiempo", clase, reto, ...p,
        opcionesMedianas: clase === "duracion" || clase === "convertir",
        opciones: barajar([p.opcionBuena, ...tres.map((f) => f.opcion)]),
        porQue: Object.fromEntries(tres.map((f) => [f.opcion.valor, f.porQue])),
    };
}

/**
 * La ayuda. Al leer: el reloj grande con los minutos junto a cada número
 * (la tabla del 5). Al sumar y en cuánto dura: el tiempo en bloques de 5
 * minutos, partido en la hora en punto. Al convertir: cada hora son 12
 * bloques de 5 minutos.
 */
function dibujarTiempo() {
    const { reto } = pregunta;
    document.getElementById("help-truco").innerText = pistaPara().texto;
    const caja = document.createElement("div");
    caja.className = "bg-white border-2 border-indigo-100 rounded-xl p-3 space-y-2 w-72 max-w-full shrink-0";
    caja.setAttribute("aria-hidden", "true");
    const bloques = (n, color, extra = "") => Array.from({ length: n }, () => `<span class="bloque-cinco block w-4 h-5 rounded-sm ${color} ${extra}"></span>`).join("");
    const fila = (contenido) => `<div class="flex flex-wrap gap-0.5 items-center">${contenido}</div>`;
    let explica;
    if (reto.clase === "leer") {
        caja.innerHTML = `<div class="flex justify-center">${relojSVG(reto.h, reto.m, { minutos: true, tam: 200 })}</div>`;
        explica = "Los números rojos son los minutos: cada número del reloj vale 5 más, como la tabla del 5.";
    } else if (reto.clase === "sumar" || reto.clase === "duracion") {
        const { h, m, d } = reto;
        const antes = (60 - m) / 5, despues = (d - (60 - m)) / 5;
        const fin = reto.clase === "sumar" ? "?" : escribirHora(h + 1, m + d - 60);
        // Cada hora junto a su lugar: el inicio, la raya de la hora en punto y el final.
        caja.innerHTML = `<div class="linea-tiempo flex items-end justify-center gap-0.5 text-sm font-bold text-indigo-900">` +
            `<span class="mr-1">${escribirHora(h, m)}</span>${bloques(antes, "bg-indigo-400", "bloque-antes")}` +
            `<span class="flex flex-col items-center mx-0.5"><span class="text-xs text-rose-700">${escribirHora(h + 1, 0)}</span><span class="hora-en-punto block w-1 h-7 bg-rose-500 rounded"></span></span>` +
            `${bloques(despues, "bg-amber-400", "bloque-despues")}<span class="ml-1">${fin}</span></div>`;
        explica = "Cada bloque son 5 minutos. La raya roja es la hora en punto: ahí se pasa a la hora siguiente.";
    } else if (reto.f) {
        caja.innerHTML = fila(Array.from({ length: 12 }, (_, i) => `<span class="bloque-cinco block w-4 h-5 rounded-sm ${i % 3 === 2 ? "mr-1" : ""} bg-indigo-300"></span>`).join(""));
        explica = "Una hora: 12 bloques de 5 minutos, en 4 partes iguales. 12 × 5 = 60.";
    } else {
        caja.innerHTML = Array.from({ length: reto.H }, () => fila(bloques(12, "bg-indigo-400", "bloque-hora"))).join("") + fila(bloques(reto.M / 5, "bg-amber-400", "bloque-minutos"));
        explica = "Cada fila azul es una hora: 12 bloques de 5 minutos, 60. Los amarillos son los minutos que sobran.";
    }
    document.getElementById("help-explain").innerText = explica;
    document.getElementById("help-visual-container").replaceChildren(caja);
}
