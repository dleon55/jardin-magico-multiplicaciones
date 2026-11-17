// MÚLTIPLOS Y DIVISORES (issue #71): el segundo tema nuevo de la Fase 3.
//
// Tres clases de pregunta, siempre para elegir:
//   múltiplo  ¿Cuál es múltiplo de 6?          (está en su tabla)
//   divisor   ¿Cuál es divisor de 24?          (en su tabla está el 24)
//   común     ¿Qué número está en la tabla del 4 y en la del 6?
// Las opciones falsas son los errores típicos, cada uno con su explicación:
// confundir divisor con múltiplo, quedarse a uno de la tabla, un número de
// otra tabla, sumar en lugar de buscar en las dos. La ayuda muestra las
// tablas como filas de números: un divisor de 24 es un número en cuya tabla
// está el 24.
//
// Es un script clásico que solo declara (ver pruebas/archivos.spec.mjs): lo
// que usa del principal (entre, barajar, parejasConocidas…) lo usa dentro
// de funciones, cuando ya está todo cargado.

const CLASES_MULTIPLOS = ["multiplo", "divisor", "comun"];
// mcd viene del script principal (las fracciones también lo usan).
const minimoComun = (a, b) => (a / mcd(a, b)) * b;
const tablaDe = (n, hasta = 10) => Array.from({ length: hasta }, (_, i) => n * (i + 1));
const puntosSuspensivos = (n) => `${n}, ${2 * n}, ${3 * n}…`;

/** Diez preguntas: cuatro de múltiplos, tres de divisores y tres de comunes, sin repetir. */
function bolsaDeMultiplos() {
    const [lo, hi] = parejasConocidas().length >= MIN_CONOCIDAS ? [2, 9] : [2, 5];
    const clases = barajar(["multiplo", "multiplo", "multiplo", "multiplo", "divisor", "divisor", "divisor", "comun", "comun", "comun"]);
    const vistas = new Set();
    return clases.map((clase) => {
        let reto;
        let intentos = 0;
        do { reto = crearRetoMultiplos(clase, lo, hi); } while (vistas.has(JSON.stringify(reto)) && ++intentos < 30);
        vistas.add(JSON.stringify(reto));
        const [a, b] = numerosDeMultiplos(reto);
        return { a, b, reto };
    });
}

function crearRetoMultiplos(clase, lo, hi) {
    if (clase === "multiplo") return { clase, n: entre(lo, hi), k: entre(3, 9) };
    if (clase === "divisor") return { clase, d: entre(lo, hi), q: entre(3, 9) };
    // Dos tablas con un común que no sea una de ellas (2 y 4 darían 4) y no
    // pase de 60.
    const tope = hi > 5 ? 9 : 6;
    let a, b;
    do { a = entre(2, tope); b = entre(2, tope); } while (a >= b || minimoComun(a, b) > 60 || minimoComun(a, b) === b);
    return { clase, a, b };
}

/** Dos números del reto (para el repaso y el color de la planta de la partida). */
function numerosDeMultiplos(r) {
    return [r.n || r.d || r.a, 1];
}

/** La pregunta: texto, voz, opciones, respuesta, el porqué de cada falsa, pista y explicación. */
function armarMultiplos(reto) {
    const falsas = [];
    const anadir = (x, porQue, vale) => {
        if (!Number.isInteger(x) || x < 1 || x === vale || falsas.some((f) => f.x === x) || falsas.length >= 3) return;
        falsas.push({ x, porQue });
    };
    const base = { tipo: "multiplos", clase: reto.clase, reto };
    let p;
    if (reto.clase === "multiplo") {
        const { n, k } = reto;
        const r = n * k;
        const esMultiplo = (x) => x % n === 0;
        // Un divisor de n, que no es múltiplo (para un primo, el 1).
        const divisor = [...Array(n - 1).keys()].map((i) => i + 1).filter((d) => n % d === 0 && d > 1)[0] || 1;
        anadir(divisor, `${divisor} es divisor de ${n} (cabe en ${n}), no múltiplo: los múltiplos de ${n} son ${puntosSuspensivos(n)}`, r);
        anadir(r + 1, `${r + 1} no está en la tabla del ${n}: ${n} × ${k} = ${r} y ${n} × ${k + 1} = ${r + n}.`, r);
        // Uno de otra tabla, cerca del resultado.
        const otra = [r + 2, r - 2, r + 3, r - 3, r + 4, r - 1].find((x) => x > 1 && !esMultiplo(x) && [2, 3, 4, 5, 6, 7, 8, 9].some((m) => m !== n && x % m === 0 && x / m <= 10));
        if (otra) {
            const m = [2, 3, 4, 5, 6, 7, 8, 9].find((q) => q !== n && otra % q === 0 && otra / q <= 10);
            anadir(otra, `${otra} está en la tabla del ${m} (${m} × ${otra / m}), pero no en la del ${n}.`, r);
        }
        anadir(r - 1, `${r - 1} no está en la tabla del ${n}: ${n} × ${k - 1} = ${r - n} y ${n} × ${k} = ${r}.`, r);
        p = { respuesta: r, texto: `¿Cuál es múltiplo de ${n}?`,
            pista: `Los múltiplos de ${n} son los resultados de su tabla: ${puntosSuspensivos(n)} Busca el que esté.`,
            explicacion: `${r} = ${n} × ${k}: está en la tabla del ${n}.` };
    } else if (reto.clase === "divisor") {
        const { d, q } = reto;
        const N = d * q;
        anadir(2 * N, `${2 * N} es múltiplo de ${N}, no divisor: un divisor cabe en ${N} un número exacto de veces, y ${2 * N} es más grande.`, d);
        // Los que no dividen, del 2 al 12, del más cercano a la respuesta al más lejano.
        const noDividen = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((x) => N % x !== 0).sort((x, y) => Math.abs(x - d) - Math.abs(y - d) || x - y);
        for (const x of noDividen) {
            anadir(x, `${N} ÷ ${x} no da exacto: ${x} × ${Math.floor(N / x)} = ${x * Math.floor(N / x)} y sobran ${N % x}.`, d);
        }
        p = { respuesta: d, texto: `¿Cuál es divisor de ${N}?`,
            pista: `Un divisor de ${N} es un número en cuya tabla está el ${N}. Prueba cada opción: ¿llegas justo a ${N} contando de ese en ese?`,
            explicacion: `${N} ÷ ${d} = ${q}, exacto: ${d} × ${q} = ${N}.` };
    } else {
        const { a, b } = reto;
        const m = minimoComun(a, b);
        const comun = (x) => x % a === 0 && x % b === 0;
        const soloDe = (t, otra) => tablaDe(t).filter((x) => !comun(x) && x % otra !== 0)
            .sort((x, y) => Math.abs(x - m) - Math.abs(y - m))[0];
        const deA = soloDe(a, b), deB = soloDe(b, a);
        if (deA) anadir(deA, `${deA} está en la tabla del ${a} (${a} × ${deA / a}), pero no en la del ${b}.`, m);
        if (deB) anadir(deB, `${deB} está en la tabla del ${b} (${b} × ${deB / b}), pero no en la del ${a}.`, m);
        if (!comun(a + b)) anadir(a + b, `Sumaste: ${a} + ${b} = ${a + b}. Hay que buscar uno que esté en las dos tablas.`, m);
        for (const x of [m + 1, m - 1, m + 2, m - 2]) {
            if (!comun(x)) anadir(x, `${x} no está en la tabla del ${a} ni en la del ${b} a la vez.`, m);
        }
        p = { respuesta: m, texto: `¿Qué número está en la tabla del ${a} y en la del ${b}?`,
            pista: `Cuenta de ${a} en ${a} y de ${b} en ${b}: el primero que sale en las dos es la respuesta.`,
            explicacion: `${m} = ${a} × ${m / a} = ${b} × ${m / b}: está en las dos tablas.` };
    }
    const tres = falsas.slice(0, 3);
    return {
        ...base, ...p,
        voz: p.texto,
        opciones: barajar([p.respuesta, ...tres.map((f) => f.x)]).map((v) => ({ valor: v, etiqueta: String(v) })),
        porQue: Object.fromEntries(tres.map((f) => [f.x, f.porQue])),
    };
}

/** La ayuda: las tablas como filas de números, sin marcar la respuesta. */
function dibujarMultiplos() {
    const { reto } = pregunta;
    document.getElementById("help-truco").innerText = pistaPara().texto;
    const filas = reto.clase === "multiplo" ? [[`Tabla del ${reto.n}`, tablaDe(reto.n)]]
        : reto.clase === "comun" ? [[`Tabla del ${reto.a}`, tablaDe(reto.a)], [`Tabla del ${reto.b}`, tablaDe(reto.b)]]
        : [...pregunta.opciones.map((o) => o.valor)].sort((x, y) => x - y).map((x) => {
            const N = reto.d * reto.q;
            const lista = [];
            for (let v = x; lista.length < 12; v += x) { lista.push(v); if (v >= N) break; }
            return [`De ${x} en ${x}`, lista];
        });
    document.getElementById("help-explain").innerText = reto.clase === "multiplo"
        ? `Los múltiplos de ${reto.n}: su tabla.`
        : reto.clase === "comun" ? "Busca un número que esté en las dos filas."
        : `Una fila por opción: ¿en cuál aparece justo el ${reto.d * reto.q}?`;
    const caja = document.createElement("div");
    caja.className = "bg-white border-2 border-indigo-100 rounded-xl p-3 space-y-2 w-full max-w-md";
    caja.setAttribute("aria-hidden", "true");
    for (const [nombre, numeros] of filas) {
        const fila = document.createElement("div");
        fila.className = "fila-multiplos";
        const titulo = document.createElement("p");
        titulo.className = "text-xs font-bold text-indigo-900";
        titulo.textContent = nombre;
        const lista = document.createElement("div");
        lista.className = "flex flex-wrap gap-1";
        for (const v of numeros) {
            const chip = document.createElement("span");
            chip.className = "chip-multiplo inline-block min-w-8 text-center px-1 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-sm font-bold text-indigo-900";
            chip.textContent = String(v);
            lista.appendChild(chip);
        }
        fila.append(titulo, lista);
        caja.appendChild(fila);
    }
    document.getElementById("help-visual-container").replaceChildren(caja);
}
