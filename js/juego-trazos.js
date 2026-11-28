// Escribir con el dedo: reconocer las cifras trazadas.
//
// Salió de index.html (Hito 7.7) tal cual, sin cambiar lo que hace. Es un script
// clásico que solo declara: lo que lee o guarda vive dentro de funciones, que
// se llaman cuando el principal ya cargó (ver pruebas/archivos.spec.mjs).

// --- ESCRIBIR CON EL DEDO ---
//
// Reconocedor de cifras propio, sin internet: cada cifra se compara
// como «nube de puntos» con modelos de cómo se suele escribir (varios
// por cifra: el 1 con y sin gancho, el 4 abierto y cerrado, el 7 con y
// sin raya). Comparar nubes, y no trazos en orden, hace que no importe
// por dónde se empezó ni en cuántos trazos. Las cifras se separan por
// dónde están: los trazos que se tocan a lo ancho son una cifra.
//
// Reconocer la letra de un niño falla a veces. Por eso lo reconocido
// se muestra en grande y solo se lanza al tocar «¡Lanzar!»: si salió
// otra cosa, se borra y se escribe otra vez.
const PUNTOS_NUBE = 32;

function trazoLinea(x1, y1, x2, y2, n = 12) {
    return Array.from({ length: n }, (_, i) => ({ x: x1 + ((x2 - x1) * i) / (n - 1), y: y1 + ((y2 - y1) * i) / (n - 1) }));
}

/** Un arco de elipse; los ángulos en grados, 0 a la derecha y 90 abajo. */
function trazoArco(cx, cy, rx, ry, a0, a1, n = 24) {
    return Array.from({ length: n }, (_, i) => {
        const a = ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
        return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    });
}

const unir = (...partes) => partes.flat();

// Cada modelo: una lista de trazos. Caja de 60 de ancho por 100 de alto.
const MODELOS_CIFRAS = {
    0: [[trazoArco(30, 50, 30, 50, 270, 630, 40)], [trazoArco(30, 50, 22, 50, 260, 620, 40)]],
    1: [[trazoLinea(30, 0, 30, 100)], [unir(trazoLinea(12, 22, 30, 0, 6), trazoLinea(30, 0, 30, 100))],
        [unir(trazoLinea(12, 22, 30, 0, 6), trazoLinea(30, 0, 30, 100)), trazoLinea(12, 100, 48, 100, 8)]],
    2: [[unir(trazoArco(30, 27, 27, 25, 195, 375, 18), trazoLinea(57, 34, 0, 100, 14), trazoLinea(0, 100, 60, 100, 10))],
        [unir(trazoArco(30, 30, 28, 28, 200, 400, 18), trazoArco(-10, 100, 70, 70, 330, 300, 8), trazoLinea(2, 98, 60, 98, 10))]],
    3: [[unir(trazoArco(28, 25, 25, 24, 210, 450, 18), trazoArco(28, 74, 29, 26, 270, 520, 20))],
        [unir(trazoLinea(4, 2, 56, 2, 8), trazoLinea(56, 2, 26, 42, 8), trazoArco(28, 70, 29, 28, 280, 520, 18))]],
    4: [[unir(trazoLinea(40, 0, 0, 66, 12), trazoLinea(0, 66, 60, 66, 10)), trazoLinea(44, 28, 44, 100, 12)],
        [unir(trazoLinea(8, 0, 8, 56, 10), trazoLinea(8, 56, 60, 56, 10)), trazoLinea(46, 0, 46, 100, 14)],
        [unir(trazoLinea(42, 100, 42, 0, 14), trazoLinea(42, 0, 0, 66, 12), trazoLinea(0, 66, 60, 66, 10))]],
    5: [[unir(trazoLinea(8, 0, 6, 44, 8), trazoArco(30, 68, 28, 30, 225, 520, 20)), trazoLinea(8, 0, 56, 0, 8)],
        [unir(trazoLinea(56, 0, 8, 0, 8), trazoLinea(8, 0, 6, 44, 8), trazoArco(30, 68, 28, 30, 225, 520, 20))]],
    6: [[unir(trazoArco(44, 62, 40, 62, 268, 165, 16), trazoArco(30, 72, 27, 27, 165, 525, 24))],
        [unir(trazoLinea(48, 0, 6, 60, 12), trazoArco(30, 74, 26, 26, 180, 540, 24))]],
    7: [[unir(trazoLinea(0, 0, 60, 0, 10), trazoLinea(60, 0, 18, 100, 14))],
        [unir(trazoLinea(0, 0, 60, 0, 10), trazoLinea(60, 0, 18, 100, 14)), trazoLinea(16, 50, 52, 50, 8)],
        [unir(trazoLinea(0, 14, 0, 0, 4), trazoLinea(0, 0, 60, 0, 10), trazoLinea(60, 0, 30, 100, 14))]],
    8: [[unir(trazoArco(30, 25, 23, 24, 90, 450, 22), trazoArco(30, 74, 29, 26, 270, 630, 24))],
        [unir(trazoArco(30, 26, 24, 26, 0, -320, 18), trazoLinea(48, 42, 4, 80, 8), trazoArco(30, 76, 26, 24, 180, 0, 12), trazoLinea(56, 76, 10, 42, 8))]],
    9: [[unir(trazoArco(30, 28, 27, 28, 0, 360, 26), trazoLinea(57, 28, 54, 100, 12))],
        [unir(trazoArco(30, 28, 27, 28, 340, -20, 26), trazoArco(-20, 28, 77, 72, 0, 60, 10))]],
};

/** Remuestrea una nube (varios trazos) a n puntos repartidos por igual. */
function remuestrear(trazos, n = PUNTOS_NUBE) {
    const puntos = trazos.flatMap((t, id) => t.map((p) => ({ x: p.x, y: p.y, id })));
    let largo = 0;
    for (let i = 1; i < puntos.length; i++) if (puntos[i].id === puntos[i - 1].id) largo += Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y);
    if (puntos.length === 0) return [];
    if (largo === 0) return Array.from({ length: n }, () => ({ ...puntos[0] }));
    const paso = largo / (n - 1);
    const nuevos = [{ ...puntos[0] }];
    let acumulado = 0;
    const lista = puntos.map((p) => ({ ...p }));
    for (let i = 1; i < lista.length; i++) {
        if (lista[i].id !== lista[i - 1].id) continue;
        const d = Math.hypot(lista[i].x - lista[i - 1].x, lista[i].y - lista[i - 1].y);
        if (acumulado + d >= paso && d > 0) {
            const t = (paso - acumulado) / d;
            const q = { x: lista[i - 1].x + t * (lista[i].x - lista[i - 1].x), y: lista[i - 1].y + t * (lista[i].y - lista[i - 1].y), id: lista[i].id };
            nuevos.push(q);
            lista.splice(i, 0, q);
            acumulado = 0;
        } else {
            acumulado += d;
        }
    }
    while (nuevos.length < n) nuevos.push({ ...lista[lista.length - 1] });
    return nuevos.slice(0, n);
}

/** A escala 1 (el lado mayor) y con el centro en el origen. */
function normalizarNube(puntos) {
    const xs = puntos.map((p) => p.x), ys = puntos.map((p) => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const lado = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
    const escalados = puntos.map((p) => ({ x: (p.x - minX) / lado, y: (p.y - minY) / lado }));
    const cx = escalados.reduce((a, p) => a + p.x, 0) / escalados.length;
    const cy = escalados.reduce((a, p) => a + p.y, 0) / escalados.length;
    return escalados.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}

function distanciaNube(a, b, inicio) {
    const usado = new Array(a.length).fill(false);
    let suma = 0;
    let i = inicio;
    do {
        let mejor = Infinity, indice = -1;
        for (let j = 0; j < b.length; j++) {
            if (usado[j]) continue;
            const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
            if (d < mejor) { mejor = d; indice = j; }
        }
        usado[indice] = true;
        const peso = 1 - ((i - inicio + a.length) % a.length) / a.length;
        suma += peso * mejor;
        i = (i + 1) % a.length;
    } while (i !== inicio);
    return suma;
}

function compararNubes(a, b) {
    const paso = Math.floor(Math.pow(a.length, 0.5));
    let min = Infinity;
    for (let i = 0; i < a.length; i += paso) min = Math.min(min, distanciaNube(a, b, i), distanciaNube(b, a, i));
    return min;
}

let nubesModelo = null;
function modelosNormalizados() {
    if (!nubesModelo) {
        nubesModelo = Object.entries(MODELOS_CIFRAS).flatMap(([cifra, variantes]) =>
            variantes.map((trazos) => ({ cifra: Number(cifra), nube: normalizarNube(remuestrear(trazos)) })));
    }
    return nubesModelo;
}

/**
 * Los modelos de la letra de quien juega: cifras que el juego leyó mal
 * y el niño corrigió (ver «APRENDER LA LETRA»). Se comparan igual que
 * los de serie, así que su forma de escribir el 5 pasa a ser un 5.
 */
function modelosPropios() {
    return Object.entries(letra.muestras).flatMap(([cifra, nubes]) =>
        nubes.map((n) => ({ cifra: Number(cifra), nube: n.map(([x, y]) => ({ x, y })) })));
}

/** La cifra más parecida a unos trazos, o null si no hay trazos. */
function reconocerCifra(trazos) {
    const validos = trazos.filter((t) => t.length > 0);
    if (validos.length === 0) return null;
    const nube = normalizarNube(remuestrear(validos));
    let mejor = null;
    for (const m of [...modelosNormalizados(), ...modelosPropios()]) {
        const d = compararNubes(nube, m.nube);
        if (!mejor || d < mejor.d) mejor = { cifra: m.cifra, d };
    }
    return mejor.cifra;
}

/** Separa los trazos en cifras, de izquierda a derecha, por dónde caen a lo ancho. */
function separarCifras(trazos) {
    const cajas = trazos.filter((t) => t.length > 0).map((t) => {
        const xs = t.map((p) => p.x);
        return { t, min: Math.min(...xs), max: Math.max(...xs) };
    }).sort((a, b) => a.min - b.min);
    const grupos = [];
    for (const c of cajas) {
        const g = grupos.at(-1);
        // Se toca con la cifra anterior (con un poco de margen): es la misma.
        const margen = g ? Math.max(4, 0.15 * (g.max - g.min)) : 0;
        if (g && c.min <= g.max + margen && (c.max - c.min) < 3 * (g.max - g.min + 10)) {
            g.trazos.push(c.t);
            g.max = Math.max(g.max, c.max);
        } else {
            grupos.push({ trazos: [c.t], min: c.min, max: c.max });
        }
    }
    return grupos.map((g) => g.trazos);
}

/** El número escrito (hasta 3 cifras), o null. */
function reconocerNumero(trazos) {
    const cifras = separarCifras(trazos).slice(0, 3).map(reconocerCifra);
    if (cifras.length === 0 || cifras.some((c) => c === null)) return null;
    return Number(cifras.join(""));
}
