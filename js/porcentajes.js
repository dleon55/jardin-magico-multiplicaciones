// PORCENTAJES SENCILLOS (issue #71): el quinto tema nuevo de la Fase 3.
//
// Solo los porcentajes amables: 10, 20, 25, 50 y 75 %. Un porcentaje es
// «tantos de cada 100»: el 25 % es la cuarta parte. Tres clases, para elegir:
//   de          ¿Cuánto es el 25 % de 40?
//   descuento   $80 con 25 % de descuento: ¿cuánto pagas?
//   fraccion    ¿Qué porcentaje es la cuarta parte?
// Las falsas son los errores típicos, cada uno explicado: tomar el
// porcentaje como la respuesta, restar el número en lugar de sacar el
// porcentaje, confundir la mitad con la cuarta parte, pagar el descuento en
// lugar del precio, y «la cuarta parte es el 4 %».
//
// Es un script clásico que solo declara (ver pruebas/archivos.spec.mjs).

const PORCENTAJES = [10, 20, 25, 50, 75];
const PARTE_DE = { 10: ["la décima parte", 10], 20: ["la quinta parte", 5], 25: ["la cuarta parte", 4], 50: ["la mitad", 2], 75: ["tres cuartas partes", 4] };
/** Para que el porcentaje dé exacto: el 25 % pide múltiplos de 4; el 10 %, de 10… */
// Para el 50 %, de 4 y no de 2: así la cuarta parte también da exacto y
// sirve de trampa (el 50 % de 18 dejaría casi sin errores típicos).
const MULTIPLO_PORCENTAJE = { 10: 10, 20: 5, 25: 4, 50: 4, 75: 4 };
// [nombre, en plural]: «unos tenis cuestan», «un juguete cuesta».
const COSAS_DESCUENTO = [["un juguete", false], ["unos tenis", true], ["una mochila", false], ["un libro", false], ["una pelota", false]];

const porcentajeDe = (p, n) => (p * n) / 100;
/** Un número entre lo y hi que sea múltiplo de m. */
const multiploEntre = (m, lo, hi) => m * entre(Math.ceil(lo / m), Math.floor(hi / m));

/** Diez preguntas: cuatro de «el tanto por ciento de», tres de descuento y tres de fracciones. */
function bolsaDePorcentajes() {
    const pocas = parejasConocidas().length < MIN_CONOCIDAS;
    const clases = barajar(["de", "de", "de", "de", "descuento", "descuento", "descuento", "fraccion", "fraccion", "fraccion"]);
    const vistas = new Set();
    return clases.map((clase, i) => {
        let reto;
        let intentos = 0;
        do { reto = crearRetoPorcentaje(clase, pocas, i); } while (vistas.has(JSON.stringify(reto)) && ++intentos < 30);
        vistas.add(JSON.stringify(reto));
        return { a: numerosDePorcentaje(reto)[0], b: 1, reto };
    });
}

function crearRetoPorcentaje(clase, pocas, i = 0) {
    // Con pocas tablas sabidas, solo la mitad, la cuarta y la décima parte.
    const lista = pocas ? [10, 25, 50] : PORCENTAJES;
    const p = lista[entre(0, lista.length - 1)];
    if (clase === "fraccion") return { clase, p };
    const tope = pocas ? 40 : 200;
    // Múltiplo de lo que pide el porcentaje (el 25 %, de 4) y, en precios, de
    // 10: así el descuento del 25 % es múltiplo de 20 y no deja centavos.
    const m = clase === "descuento" ? (MULTIPLO_PORCENTAJE[p] === 4 ? 20 : 10) : MULTIPLO_PORCENTAJE[p];
    const n = multiploEntre(m, Math.max(12, m), tope);
    return clase === "descuento" ? { clase, p, n, cosa: i % COSAS_DESCUENTO.length } : { clase, p, n };
}

/** Un número del 1 al 9 que represente el reto (para el color de la planta). */
function numerosDePorcentaje(r) {
    return [PARTE_DE[r.p][1] > 9 ? 1 : PARTE_DE[r.p][1], 1];
}

function armarPorcentaje(reto) {
    const falsas = [];
    const anadir = (x, porQue, vale) => {
        if (!Number.isInteger(x) || x < 1 || x === vale || falsas.some((f) => f.x === x) || falsas.length >= 3) return;
        falsas.push({ x, porQue });
    };
    const { clase, p } = reto;
    const [parte, partes] = PARTE_DE[p];
    let p2;
    if (clase === "de") {
        const { n } = reto;
        const r = porcentajeDe(p, n);
        anadir(p, `${p} es el porcentaje, no la respuesta: el ${p}% de ${n} es ${parte} de ${n}.`, r);
        anadir(n - p, `Restaste ${p}: el ${p}% no es quitar ${p}, es tomar ${p} de cada 100, o sea ${parte}.`, r);
        // La fracción equivocada: primero la que más se confunde (la mitad por
        // la cuarta parte), luego cualquier otro porcentaje que dé exacto.
        const otra = { 10: 20, 20: 10, 25: 50, 50: 25, 75: 25 }[p];
        const otroPorcentaje = (q) => anadir(porcentajeDe(q, n), `Eso es el ${q}% (${PARTE_DE[q][0]}). El ${p}% es ${parte}.`, r);
        otroPorcentaje(otra);
        anadir(n, `${n} es todo: el 100%. El ${p}% es solo ${parte}.`, r);
        PORCENTAJES.filter((x) => x !== p && x !== otra).forEach(otroPorcentaje);
        if (2 * p <= 100) anadir(2 * r, `${2 * r} es el doble: el ${2 * p}%. El ${p}% es ${parte}.`, r);
        anadir(r / 2, `${r / 2} es la mitad: el ${p / 2}%. El ${p}% es ${parte}.`, r);
        p2 = { respuesta: r, unidad: "",
            texto: `¿Cuánto es el ${p}% de ${n}?`,
            pista: `El ${p}% es ${parte}: ${p === 75 ? `divide ${n} entre 4 y toma tres partes` : `divide ${n} entre ${partes}`}.`,
            explicacion: `El ${p}% de ${n} es ${r}: ${p === 75 ? `${n} ÷ 4 = ${n / 4}, y tres partes son ${r}` : `${n} ÷ ${partes} = ${r}`}.`,
            voz: `¿Cuánto es el ${p} por ciento de ${n}?` };
    } else if (clase === "descuento") {
        const { n } = reto;
        const d = porcentajeDe(p, n), r = n - d;
        const [cosa, plural] = COSAS_DESCUENTO[reto.cosa];
        const cuesta = plural ? "cuestan" : "cuesta", tiene = plural ? "tienen" : "tiene";
        anadir(d, `$${d} es lo que te descuentan, no lo que pagas: $${n} − $${d}.`, r);
        anadir(n - p, `Restaste ${p} pesos, pero el ${p}% de $${n} son $${d}.`, r);
        anadir(n + d, `Sumaste el descuento: con descuento se paga menos, no más.`, r);
        anadir(n, `$${n} es el precio sin descuento.`, r);
        for (const q of PORCENTAJES.filter((x) => x !== p)) {
            anadir(n - porcentajeDe(q, n), `Eso sería con ${q}% de descuento; aquí es el ${p}%: $${d}.`, r);
        }
        p2 = { respuesta: r, unidad: "$",
            texto: `${cosa[0].toUpperCase()}${cosa.slice(1)} ${cuesta} $${n} y ${tiene} ${p}% de descuento. ¿Cuánto pagas?`,
            pista: `Primero el descuento: el ${p}% de $${n} es ${parte}. Luego réstalo del precio.`,
            explicacion: `El descuento es el ${p}% de $${n} = $${d}, y pagas $${n} − $${d} = $${r}.`,
            voz: `${cosa} ${cuesta} ${n} pesos y ${tiene} ${p} por ciento de descuento. ¿Cuánto pagas?` };
    } else {
        // «La cuarta parte es el 4 %»: el número de la fracción tomado como porcentaje.
        const cuantas = p === 75 ? 3 : 1;
        const confusion = p === 75 ? 3 : partes === 10 ? 1 : partes;
        const Parte = parte[0].toUpperCase() + parte.slice(1);
        anadir(confusion, `${Parte} ${cuantas === 1 ? "es 1" : "son 3"} de cada ${partes}, no ${confusion} de cada 100: son ${p} de cada 100.`, p);
        for (const q of PORCENTAJES) anadir(q, `El ${q}% es ${PARTE_DE[q][0]}.`, p);
        p2 = { respuesta: p, unidad: "%",
            texto: `¿Qué porcentaje es ${parte}?`,
            pista: `Un porcentaje es «de cada 100». Reparte 100 cuadritos en ${partes} partes iguales: ¿cuántos hay en ${p === 75 ? "tres partes" : "una"}?`,
            explicacion: `${parte[0].toUpperCase()}${parte.slice(1)} es el ${p}%: ${p === 75 ? `100 ÷ 4 = 25, y tres partes son 75` : `100 ÷ ${partes} = ${p}`}.`,
            voz: `¿Qué porcentaje es ${parte}?` };
    }
    const tres = falsas.slice(0, 3);
    const etiqueta = (v) => p2.unidad === "$" ? `$${v}` : p2.unidad === "%" ? `${v}%` : String(v);
    return {
        tipo: "porcentaje", clase, reto, ...p2,
        opciones: barajar([p2.respuesta, ...tres.map((f) => f.x)]).map((v) => ({ valor: v, etiqueta: etiqueta(v) })),
        porQue: Object.fromEntries(tres.map((f) => [f.x, f.porQue])),
    };
}

/**
 * La ayuda: 100 cuadritos en 10 filas. En «de» y «descuento» se pinta el
 * porcentaje, para ver qué parte del todo es; en «fracción», el 100 se ve
 * partido en sus partes iguales (sin pintar la respuesta).
 */
function dibujarPorcentaje() {
    const { reto } = pregunta;
    const [parte, partes] = PARTE_DE[reto.p];
    document.getElementById("help-truco").innerText = pistaPara().texto;
    document.getElementById("help-explain").innerText = reto.clase === "fraccion"
        ? `100 cuadritos partidos en ${partes} partes iguales, cada una de otro color.`
        : `Cada cuadrito es 1 de cada 100. El ${reto.p}% son ${reto.p} cuadritos: ${parte}.`;
    const rejilla = document.createElement("div");
    rejilla.className = "cien-porcentaje inline-grid gap-0.5 bg-white border-2 border-indigo-100 rounded-xl p-2";
    rejilla.style.gridTemplateColumns = "repeat(10, auto)";
    rejilla.setAttribute("aria-hidden", "true");
    const colores = ["bg-indigo-400", "bg-sky-300", "bg-amber-300", "bg-emerald-300", "bg-rose-300", "bg-violet-300", "bg-lime-300", "bg-orange-300", "bg-teal-300", "bg-pink-300"];
    for (let i = 0; i < 100; i++) {
        const c = document.createElement("span");
        const color = reto.clase === "fraccion" ? colores[Math.floor(i / (100 / partes))] : i < reto.p ? "bg-indigo-500 cuadro-pintado" : "bg-gray-100";
        c.className = `cuadro-porcentaje block w-3 h-3 md:w-4 md:h-4 rounded-sm ${color}`;
        rejilla.appendChild(c);
    }
    document.getElementById("help-visual-container").replaceChildren(rejilla);
}
