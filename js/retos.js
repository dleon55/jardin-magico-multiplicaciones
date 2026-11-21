// RETOS CON CÓDIGO (Hito 4.6): diez multiplicaciones que se pueden mandar a
// alguien con un código de seis letras o un enlace. No hay cuentas ni
// servidor: el código mismo dice qué tablas entran, cuáles preguntas salen
// (una semilla) y la marca a vencer. Quien lo recibe juega exactamente las
// mismas diez preguntas, con las mismas opciones y en el mismo orden.
//
// El código no lleva nombres ni nada de quien lo creó: solo el reto.
// Cada acierto da una estrella y cuenta para la meta del día; no toca el
// jardín ni el mapa.
//
// Es un script clásico que solo declara (ver pruebas/archivos.spec.mjs).

const RETO_PREGUNTAS = 10;
const RETO_TABLAS = [2, 3, 4, 5, 6, 7, 8, 9];
// 32 signos fáciles de dictar y copiar: sin 0, 1, I ni O, que se confunden.
const RETO_SIGNOS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const RETO_LARGO = 6;
const RETO_SEMILLAS = 1024;
const RETO_MASCARA = 0x2b5a9c13;   // para que dos retos vecinos no se parezcan
// El reto en curso: { tablas, semilla, marca, preguntas, n, bien, paso: "inicio" | "pregunta" | "respondida" | "fin" }.
let retoEnJuego = null;
// El código que llegó en el enlace (?reto=…), hasta que se muestra.
let retoPendiente = null;

/** Números al azar repetibles: la misma semilla da siempre la misma serie (mulberry32). */
function azarDeReto(semilla) {
    let s = semilla >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Baraja con un azar dado (el de `barajar` no se puede repetir). */
function barajarConAzar(lista, azar) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(azar() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

/** Ocho bits que delatan un código mal copiado. */
function sumaDeReto(datos) {
    return (Math.imul(datos ^ 0x5bd1e995, 0x9e3779b1) >>> 24) & 0xff;
}

/** El código de un reto: tablas (de RETO_TABLAS), semilla (0 a 1023) y marca (0 a 10). */
function codigoDeReto({ tablas, semilla, marca }) {
    const bits = RETO_TABLAS.reduce((m, t, i) => (tablas.includes(t) ? m | (1 << i) : m), 0);
    const datos = (bits << 14) | (semilla << 4) | marca;
    let valor = (((datos << 8) | sumaDeReto(datos)) ^ RETO_MASCARA) & 0x3fffffff;
    let codigo = "";
    for (let i = 0; i < RETO_LARGO; i++) {
        codigo = RETO_SIGNOS[valor & 31] + codigo;
        valor >>>= 5;
    }
    return codigo;
}

/** Como se escribe para leerlo: «K7M 2QX». */
function codigoALaVista(codigo) {
    return `${codigo.slice(0, 3)} ${codigo.slice(3)}`;
}

/** Lo que dice un código, o null si no es de un reto. Perdona minúsculas, espacios y guiones. */
function leerCodigoDeReto(texto) {
    const limpio = String(texto ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (limpio.length !== RETO_LARGO) return null;
    let valor = 0;
    for (const signo of limpio) {
        const i = RETO_SIGNOS.indexOf(signo);
        if (i < 0) return null;
        valor = (valor << 5) | i;
    }
    valor ^= RETO_MASCARA & 0x3fffffff;
    const datos = valor >>> 8;
    if ((valor & 0xff) !== sumaDeReto(datos)) return null;
    const tablas = RETO_TABLAS.filter((t, i) => (datos >>> 14) & (1 << i));
    const marca = datos & 15;
    if (tablas.length === 0 || marca > RETO_PREGUNTAS) return null;
    return { tablas, semilla: (datos >>> 4) & (RETO_SEMILLAS - 1), marca, codigo: limpio };
}

/** Tres respuestas falsas de a × b: los errores de siempre (una fila de más o de menos, sumar), sin repetir. */
function falsasDeReto(a, b, azar) {
    const r = a * b;
    const candidatas = barajarConAzar([(a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1), a + b, r + 1, r - 1, r + 10, r + 2], azar);
    const falsas = [];
    for (const c of candidatas) {
        if (c > 0 && c !== r && !falsas.includes(c)) falsas.push(c);
        if (falsas.length === 3) break;
    }
    return falsas;
}

/**
 * Las diez preguntas de un reto, siempre las mismas para las mismas tablas y
 * semilla: sin repetir, del × 2 al × 9 (con una sola tabla hacen falta
 * también el × 10 y el × 1).
 */
function preguntasDeReto(tablas, semilla) {
    const azar = azarDeReto(semilla);
    const pares = [];
    for (const a of tablas) for (let b = 2; b <= 9; b++) pares.push([a, b]);
    const elegidos = barajarConAzar(pares, azar).slice(0, RETO_PREGUNTAS);
    for (const b of [10, 1]) if (elegidos.length < RETO_PREGUNTAS) elegidos.push([tablas[0], b]);
    return barajarConAzar(elegidos, azar).map(([a, b]) => ({
        a, b, respuesta: a * b, texto: `${a} × ${b}`,
        opciones: barajarConAzar([a * b, ...falsasDeReto(a, b, azar)], azar),
    }));
}

/** «la tabla del 2», «las tablas del 2 y del 5», «las tablas del 2, del 3 y del 5». */
function tablasDeReto(tablas) {
    const nombres = tablas.map((t) => `del ${t}`);
    if (nombres.length === 1) return `la tabla ${nombres[0]}`;
    if (nombres.length === RETO_TABLAS.length) return "todas las tablas";
    return `las tablas ${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}

/** El enlace de un reto: esta misma página con ?reto=CÓDIGO. */
function enlaceDeReto(codigo, base = location.href) {
    const url = new URL(base);
    url.search = `?reto=${codigo}`;
    url.hash = "";
    return url.href;
}
