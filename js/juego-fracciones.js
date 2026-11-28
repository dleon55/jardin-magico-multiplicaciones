// Dividir con lo que sobra y fracciones de un número.
//
// Salió de index.html (Hito 7.7) tal cual, sin cambiar lo que hace. Es un script
// clásico que solo declara: lo que lee o guarda vive dentro de funciones, que
// se llaman cuando el principal ya cargó (ver pruebas/archivos.spec.mjs).

// --- DIVIDIR CON LO QUE SOBRA (issue #71) ---
//
// 17 ÷ 5 = 3 y sobran 2. El primer tema nuevo después de las tablas,
// con el mismo método: ayuda visual (filas de 5 y lo que sobra aparte),
// errores típicos como opciones falsas, repaso de lo fallado y registro
// en la vista para adultos. Siempre se elige: la respuesta son dos
// números. Una opción vale cociente × 100 + residuo.
const valorResiduo = (q, r) => q * 100 + r;
const textoResiduo = (q, r) => `${q}, ${r === 1 ? "sobra 1" : `sobran ${r}`}`;

/** Diez divisiones con residuo, distintas; con pocas tablas sabidas, divisores del 2 al 5. */
function bolsaDeResiduos() {
    const [lo, hi] = parejasConocidas().length >= MIN_CONOCIDAS ? [2, 9] : [2, 5];
    const vistas = new Set();
    const lista = [];
    while (lista.length < 10) {
        const d = entre(lo, hi), q = entre(2, 9), r = entre(1, d - 1);
        const D = d * q + r;
        if (vistas.has(`${D}/${d}`)) continue;
        vistas.add(`${D}/${d}`);
        lista.push({ a: d, b: q, reto: { D, d, q, r } });
    }
    return lista;
}

/**
 * Las opciones falsas son los errores típicos, cada uno con su
 * explicación:
 *   sobra demasiado  una fila menos: q − 1 y sobran r + d (no cabe);
 *   al revés         el cociente y lo que sobra cambiados;
 *   olvidó lo que sobra  q y sobran 0;
 *   contó mal        q y sobran r ± 1.
 */
function armarResiduo(reto) {
    const { D, d, q, r } = reto;
    const falsas = [];
    const anadir = (fq, fr, porQue) => {
        if (fq < 0 || fr < 0 || (fq === q && fr === r) || falsas.some((f) => f.q === fq && f.r === fr)) return;
        falsas.push({ q: fq, r: fr, porQue });
    };
    if (q >= 2) anadir(q - 1, r + d, `Con ${q - 1} sobrarían ${r + d}, y en ${r + d} cabe otro ${d}: lo que sobra siempre es menos que ${d}.`);
    if (r !== q) anadir(r, q, `Cambiaste las dos partes: ${q} es cuántas veces cabe el ${d}, y ${r} lo que sobra.`);
    anadir(q, 0, `Sí sobra algo: ${d} × ${q} = ${d * q}, y de ${d * q} a ${D} faltan ${r}.`);
    anadir(q, r + 1, `Casi: de ${d * q} a ${D} hay ${r}, no ${r + 1}.`);
    if (r >= 2) anadir(q, r - 1, `Casi: de ${d * q} a ${D} hay ${r}, no ${r - 1}.`);
    anadir(q + 1, r, `${d} × ${q + 1} = ${d * (q + 1)}, que se pasa de ${D}.`);
    const tres = falsas.slice(0, 3);
    const opciones = barajar([{ q, r }, ...tres]).map((o) => ({ valor: valorResiduo(o.q, o.r), etiqueta: textoResiduo(o.q, o.r) }));
    return {
        tipo: "residuo", reto, a: d, b: q,
        respuesta: valorResiduo(q, r),
        texto: `${D} ÷ ${d}`,
        voz: `¿Cuánto es ${D} entre ${d}, y cuánto sobra?`,
        opciones,
        porQue: Object.fromEntries(tres.map((f) => [valorResiduo(f.q, f.r), f.porQue])),
        pista: `Busca en la tabla del ${d} el número más grande que no se pase de ${D}. Lo que falta para llegar a ${D} es lo que sobra.`,
        explicacion: `${D} ÷ ${d} = ${q} y ${r === 1 ? "sobra 1" : `sobran ${r}`}, porque ${d} × ${q} = ${d * q} y de ${d * q} a ${D} ${r === 1 ? "falta 1" : `faltan ${r}`}.`,
    };
}

/** Diez retos: dos de cada clase. Con pocas tablas sabidas, del 2 al 5. */
function bolsaDeRetos() {
    const [lo, hi] = parejasConocidas().length >= MIN_CONOCIDAS ? [2, 9] : [2, 5];
    return barajar(CLASES_RETO.flatMap((c) => [c, c]).map((c) => {
        const reto = crearReto(c, lo, hi);
        const [a, b] = numerosDelReto(reto);
        return { a, b, reto };
    }));
}

/** Dos números que representan el reto (para el repaso y la ayuda). */
function numerosDelReto(r) {
    if (r.clase === "mayor") return r.pares.reduce((m, p) => (p[0] * p[1] > m[0] * m[1] ? p : m));
    if (r.clase === "misterio") return [r.m, r.n];
    if (r.clase === "sigue") return [r.n, r.k + 3];
    if (r.clase === "partir") return [r.a, r.b];
    return [r.n, 2];
}

/** Completa hasta 4 opciones distintas con números cercanos. */
function cuatroOpciones(respuesta, otras) {
    const lista = [respuesta];
    for (const x of [...otras, respuesta + 1, respuesta + 2, respuesta - 1, respuesta + 3]) {
        if (lista.length < 4 && Number.isInteger(x) && x > 0 && !lista.includes(x)) lista.push(x);
    }
    return barajar(lista).map((v) => ({ valor: v, etiqueta: String(v) }));
}

/** La pregunta de un reto: texto, voz, opciones, respuesta, pista y explicación. */
function armarReto(r) {
    const base = { tipo: "logica", clase: r.clase, reto: r };
    if (r.clase === "mayor") {
        const pares = r.pares.map(([x, y]) => ({ x, y, p: x * y }));
        const max = pares.reduce((m, q) => (q.p > m.p ? q : m));
        const otras = pares.filter((q) => q !== max).sort((u, v) => v.p - u.p);
        const texto = "¿Cuál da más?";
        return { ...base, texto, respuesta: max.p,
            voz: `¿Cuál da más: ${comas(pares.map((q) => `${q.x} por ${q.y}`)).replace(/ y ([^y]*)$/, " o $1")}?`,
            opciones: barajar(pares).map((q) => ({ valor: q.p, etiqueta: `${q.x} × ${q.y}` })),
            pista: "Calcula cada una y compáralas. Empieza por las que ya te sabes.",
            explicacion: `${max.x} × ${max.y} = ${max.p} es la que da más. Las otras: ${comas(otras.map((q) => `${q.x} × ${q.y} = ${q.p}`))}.` };
    }
    if (r.clase === "misterio") {
        const { m, n } = r;
        const mcm = (m * n) / mcd(m, n);
        const deM = (k) => Array.from({ length: k }, (_, i) => m * (i + 1));
        const deN = (k) => Array.from({ length: k }, (_, i) => n * (i + 1));
        const soloM = [mcm + m, mcm - m, mcm + 2 * m].find((x) => x > 0 && x % n !== 0);
        const soloN = [mcm + n, mcm - n].find((x) => x > 0 && x % m !== 0);
        const otraComun = m * n !== mcm ? m * n : 2 * mcm;
        const texto = `Soy el número más pequeño que está en la tabla del ${m} y también en la del ${n}. ¿Quién soy?`;
        return { ...base, texto, voz: texto, respuesta: mcm,
            opciones: cuatroOpciones(mcm, [soloM, soloN, otraComun]),
            pista: `Di la tabla del ${n} (${deN(3).join(", ")}…) y busca el primero que también esté en la del ${m}.`,
            explicacion: `Es ${mcm}: la tabla del ${m} va ${deM(mcm / m).join(", ")}, y la del ${n}, ${deN(mcm / n).join(", ")}. El ${mcm} es el primero que está en las dos.` };
    }
    if (r.clase === "sigue") {
        const { n, k, hueco } = r;
        const serie = [0, 1, 2, 3].map((i) => n * (k + i));
        const respuesta = serie[hueco];
        const visible = serie.map((x, i) => (i === hueco ? "__" : String(x))).join(", ");
        const texto = `¿Qué número falta? ${visible}`;
        return { ...base, texto, respuesta,
            voz: `¿Qué número falta? ${serie.map((x, i) => (i === hueco ? "cuál" : x)).join(", ")}`,
            opciones: cuatroOpciones(respuesta, [respuesta + n, respuesta - 1, respuesta + 1].filter((x) => !serie.includes(x) || x === respuesta)),
            pista: "¿Cuánto aumenta de un número al siguiente? Mira los que están juntos.",
            explicacion: `Van de ${n} en ${n}: ${serie.join(", ")}. Es la tabla del ${n}.` };
    }
    if (r.clase === "partir") {
        const { a, b } = r;
        const resto = b - 5;
        const texto = `Completa: ${a} × ${b} = ${a} × 5 + ${a} × __`;
        return { ...base, texto, respuesta: resto,
            voz: `Completa: ${a} por ${b} es ${a} por 5, más ${a} por cuánto`,
            opciones: cuatroOpciones(resto, [resto + 1, resto - 1, b].filter((x) => x !== 5)),
            pista: `Parte el ${b} en 5 y lo que falta para llegar a ${b}: el rectángulo tiene un hueco después de 5 columnas.`,
            explicacion: `${b} es 5 + ${resto}, así que ${a} × ${b} = ${a} × 5 + ${a} × ${resto} = ${a * 5} + ${a * resto} = ${a * b}.` };
    }
    const { n, dentro, intruso } = r;
    const abajo = Math.floor(intruso / n) * n;
    const texto = `¿Cuál NO está en la tabla del ${n}?`;
    return { ...base, texto, respuesta: intruso,
        voz: `¿Cuál no está en la tabla del ${n}: ${comas([...dentro, intruso].sort((x, y) => x - y)).replace(/ y ([^y]*)$/, " o $1")}?`,
        opciones: barajar([...dentro, intruso]).map((v) => ({ valor: v, etiqueta: String(v) })),
        pista: `Los de la tabla del ${n} se reparten en grupos de ${n} sin que sobre nada. Prueba con cada uno.`,
        explicacion: `${intruso} no está: ${n} × ${abajo / n} = ${abajo} y ${n} × ${abajo / n + 1} = ${abajo + n}. Los demás sí: ${comas(dentro.map((x) => `${x} = ${n} × ${x / n}`))}.` };
}

// --- FRACCIONES DE UN NÚMERO ---
//
// «¾ de 24» es dividir y multiplicar con lo que ya se sabe: un cuarto
// de 24 es 24 ÷ 4 = 6 (la tabla del 4), y tres cuartos, 3 × 6 = 18.
// Para 4.º a 6.º de primaria. Se ve con el mismo rectángulo de la
// ayuda: 24 puntos en 4 filas iguales (cada fila, un cuarto), con las
// filas que se toman en otro color. Las opciones falsas son los errores
// de siempre: quedarse con una parte, calcular lo que sobra o dividir
// entre el número de arriba. No cuentan para el mapa ni el jardín.
const NOMBRE_PARTE = { 2: ["medio", "medios"], 3: ["tercio", "tercios"], 4: ["cuarto", "cuartos"], 5: ["quinto", "quintos"],
    6: ["sexto", "sextos"], 7: ["séptimo", "séptimos"], 8: ["octavo", "octavos"], 9: ["noveno", "novenos"], 10: ["décimo", "décimos"],
    12: ["doceavo", "doceavos"], 14: ["catorceavo", "catorceavos"], 15: ["quinceavo", "quinceavos"], 16: ["dieciseisavo", "dieciseisavos"],
    18: ["dieciochoavo", "dieciochoavos"], 20: ["veinteavo", "veinteavos"], 24: ["veinticuatroavo", "veinticuatroavos"] };
const NUMERO_PALABRA = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];

/** «tres cuartos», «un tercio». */
function nombreFraccion(m, d) {
    const [uno, varios] = NOMBRE_PARTE[d] || [`${d}avo`, `${d}avos`];
    return `${NUMERO_PALABRA[m] || m} ${m === 1 ? uno : varios}`;
}

/**
 * Diez preguntas de fracciones, de cuatro clases:
 *   - «de»: m/d de d·k ({ m, d, k }). Una de una parte (1/4 de 24) y
 *     dos de varias (3/4 de 24), que es lo que más cuesta;
 *   - «equivalente»: ¿cuál es igual a a/b? ({ a, b, k }: a·k/b·k), dos;
 *   - «comparar»: ¿cuál es la más grande?, una de estas: mismo
 *     denominador, mismo numerador (1/3 > 1/5, el error clásico) y
 *     distintos;
 *   - «sumar»: 2/7 + 3/7 y 5/8 − 2/8, con el mismo denominador;
 *   - «sumarDistinto»: 1/2 + 1/4 (un denominador múltiplo del otro) y
 *     1/2 + 1/3 (no), con el común hasta 12.
 * Por partida: 3 «de», 2 equivalentes, 1 comparar, 2 sumar o restar
 * con el mismo denominador y 2 sumas con distinto.
 * Con pocas multiplicaciones sabidas, partes del 2 al 5 al sacar «de».
 */
// Qué fracciones se practican: "mezcla" o una sola clase.
let claseFracciones = "mezcla";
const NOMBRE_CLASE_FRACCION = {
    de: "De un número", equivalente: "Equivalentes", comparar: "Comparar",
    sumar: "Sumar y restar", sumarDistinto: "Sumar con distinto número de abajo",
};

function mostrarFracciones() {
    mostrarPantalla("screen-fracciones");
}

function practicarFracciones(clase) {
    claseFracciones = NOMBRE_CLASE_FRACCION[clase] ? clase : "mezcla";
    startTable("fracciones");
}

/** Diez de una sola clase. */
function bolsaDeUnaClase(clase, hi) {
    const diez = Array.from({ length: 10 }, (_, i) => i);
    if (clase === "de") {
        // Cuatro de una parte y seis de varias, que es lo que más cuesta.
        return diez.map((i) => {
            const d = entre(i < 4 ? 2 : 3, hi);
            return { clase: "de", m: i < 4 ? 1 : entre(2, d - 1), d, k: entre(2, 9) };
        });
    }
    if (clase === "equivalente") return diez.map(() => crearEquivalente());
    if (clase === "comparar") return diez.map((i) => crearComparacion(["mismoDen", "mismoNum", "distintos"][i % 3]));
    if (clase === "sumar") return diez.map((i) => crearSuma(i % 2 ? "−" : "+"));
    return diez.map((i) => crearSumaDistinta(i % 2 === 0));
}

function bolsaDeFracciones() {
    const hi = parejasConocidas().length >= MIN_CONOCIDAS ? 9 : 5;
    if (claseFracciones !== "mezcla") {
        return barajar(bolsaDeUnaClase(claseFracciones, hi).map((reto) => {
            const [a, b] = numerosDeFraccion(reto);
            return { a, b, reto };
        }));
    }
    const de = Array.from({ length: 3 }, (_, i) => {
        const d = entre(i < 1 ? 2 : 3, hi);
        return { clase: "de", m: i < 1 ? 1 : entre(2, d - 1), d, k: entre(2, 9) };
    });
    const equivalentes = Array.from({ length: 2 }, () => crearEquivalente());
    const comparar = [crearComparacion(azar(["mismoDen", "mismoNum", "distintos"]))];
    const sumas = ["+", "−"].map(crearSuma);
    const distintas = [crearSumaDistinta(true), crearSumaDistinta(false)];
    return barajar([...de, ...equivalentes, ...comparar, ...sumas, ...distintas].map((reto) => {
        const [a, b] = numerosDeFraccion(reto);
        return { a, b, reto };
    }));
}

/** Dos números que representan la pregunta (para el repaso). */
function numerosDeFraccion(r) {
    if (r.clase === "sumar") return [r.d, r.a];
    if (r.clase === "sumarDistinto") return [r.b, r.d];
    if (r.clase === "equivalente") return [r.b, r.k];
    if (r.clase === "comparar") return [r.fracs[0][1], r.fracs.length];
    return [r.d, r.k];
}

// Fracciones propias en mínima expresión con denominador del 2 al 6.
function fraccionesBase() {
    const lista = [];
    for (let b = 2; b <= 6; b++) for (let a = 1; a < b; a++) if (mcd(a, b) === 1) lista.push([a, b]);
    return lista;
}

function crearEquivalente() {
    const [a, b] = azar(fraccionesBase());
    return { clase: "equivalente", a, b, k: entre(2, b <= 3 ? 4 : 3) };
}

function crearComparacion(variante) {
    const valorDe = ([m, d]) => m / d;
    const distintas = (lista) => new Set(lista.map((f) => valorDe(f).toFixed(6))).size === lista.length;
    for (;;) {
        let fracs;
        if (variante === "mismoDen") {
            const d = entre(5, 10);
            fracs = barajar(Array.from({ length: d - 1 }, (_, i) => [i + 1, d])).slice(0, 4);
        } else if (variante === "mismoNum") {
            const m = entre(1, 3);
            fracs = barajar([2, 3, 4, 5, 6, 7, 8, 9, 10].filter((d) => d > m).map((d) => [m, d])).slice(0, 4);
        } else {
            // Denominadores que caben en 12 o 24: el común es fácil de hallar.
            const pool = [];
            for (const d of [2, 3, 4, 6, 8, 12]) for (let m = 1; m < d; m++) if (mcd(m, d) === 1) pool.push([m, d]);
            fracs = barajar(pool).slice(0, 4);
            if (new Set(fracs.map((f) => f[1])).size < 3) continue;   // que de verdad sean distintos
        }
        if (fracs.length === 4 && distintas(fracs)) return { clase: "comparar", variante, fracs };
    }
}

/** a/d op b/d con resultado propio y distinto de cero. */
function crearSuma(op) {
    const d = entre(4, 10);
    if (op === "+") {
        const a = entre(1, d - 2);
        return { clase: "sumar", op, a, b: entre(1, d - 1 - a), d };
    }
    const a = entre(2, d - 1);
    return { clase: "sumar", op, a, b: entre(1, a - 1), d };
}

/**
 * a/b + c/d con b ≠ d, en mínima expresión, el común (mcm) hasta 12 y
 * la suma menor que uno. `multiplo`: un denominador divide al otro
 * (1/2 + 1/4), que es el caso más fácil.
 */
function crearSumaDistinta(multiplo) {
    const dens = [2, 3, 4, 5, 6, 8, 10, 12];
    const opciones = [];
    for (const b of dens) for (const d of dens) {
        if (b >= d || (d % b === 0) !== multiplo || (b * d) / mcd(b, d) > 12) continue;
        for (let a = 1; a < b; a++) for (let c = 1; c < d; c++) {
            if (mcd(a, b) === 1 && mcd(c, d) === 1 && a * d + c * b < b * d) opciones.push({ a, b, c, d });
        }
    }
    const elegida = azar(opciones);
    return { clase: "sumarDistinto", ...(Math.random() < 0.5 ? elegida : { a: elegida.c, b: elegida.d, c: elegida.a, d: elegida.b }) };
}

const codigoFraccion = (m, d) => m * 100 + d;   // el valor de un botón que muestra «m/d»
const textoFraccion = (m, d) => `${m}/${d}`;

function armarEquivalente(r) {
    const { a, b, k } = r;
    const [c, d] = [a * k, b * k];
    const falsas = [[a + k, b + k], [a, d], [c, b], [a * (k + 1), d], [c, d + b], [a + 1, b + 1]]
        .filter(([m, n]) => m < n && !(m * b === a * n));   // propias y no equivalentes
    const lista = [[c, d]];
    for (const f of falsas) if (lista.length < 4 && !lista.some(([m, n]) => m === f[0] && n === f[1])) lista.push(f);
    const texto = `¿Cuál fracción es igual a ${textoFraccion(a, b)}?`;
    // La ayuda dibuja la de la pregunta y una tira por opción, en el
    // orden de los botones: se compara, no se regala la respuesta.
    const enOrden = barajar(lista);
    return {
        tipo: "fraccion", clase: "equivalente", reto: r, a: b, b: k,
        respuesta: codigoFraccion(c, d), texto, voz: texto.replace(/\d+\/\d+/, nombreFraccion(a, b)),
        opciones: enOrden.map(([m, n]) => ({ valor: codigoFraccion(m, n), etiqueta: textoFraccion(m, n) })),
        tiras: [[a, b], ...enOrden],
        pista: `Una fracción no cambia si multiplicas el número de arriba y el de abajo por lo mismo. Busca cuál se hizo así a partir de ${textoFraccion(a, b)}.`,
        explicacion: `${textoFraccion(c, d)} = ${textoFraccion(a, b)}: arriba y abajo se multiplicaron por ${k} (${a} × ${k} = ${c} y ${b} × ${k} = ${d}). Sumar lo mismo arriba y abajo no da una igual.`,
    };
}

function armarComparacion(r) {
    const { variante, fracs } = r;
    const max = fracs.reduce((x, f) => (f[0] / f[1] > x[0] / x[1] ? f : x));
    const t = textoFraccion(...max);
    let pista;
    let explicacion;
    if (variante === "mismoDen") {
        pista = "Todas están partidas en las mismas partes: gana la que toma más partes.";
        explicacion = `Todas están partidas en ${NOMBRE_PARTE[max[1]]?.[1] || `${max[1]} partes`}: ${t} es la que toma más partes.`;
    } else if (variante === "mismoNum") {
        pista = "Todas toman las mismas partes: gana la que tiene las partes más grandes, es decir, el número de abajo más chico.";
        const chica = fracs.reduce((x, f) => (f[1] > x[1] ? f : x));
        explicacion = `${t} es la más grande: entre más partes se reparte, más chica es cada una. Por eso ${textoFraccion(...chica)} es la más chica.`;
    } else {
        const D = fracs.reduce((acc, [, d]) => (acc * d) / mcd(acc, d), 1);
        pista = `Pásalas todas al mismo número de abajo, ${D}: multiplica arriba y abajo por lo que haga falta, y compara.`;
        explicacion = `Con ${D} abajo: ${fracs.map(([m, d]) => `${textoFraccion(m, d)} = ${textoFraccion(m * (D / d), D)}`).join(", ")}. La más grande es ${t}.`;
    }
    return {
        tipo: "fraccion", clase: "comparar", reto: r, a: max[1], b: fracs.length,
        respuesta: codigoFraccion(...max),
        texto: "¿Cuál fracción es la más grande?",
        voz: `¿Cuál fracción es la más grande: ${comas(fracs.map(([m, d]) => nombreFraccion(m, d))).replace(/ y ([^y]*)$/, " o $1")}?`,
        opciones: barajar(fracs).map(([m, d]) => ({ valor: codigoFraccion(m, d), etiqueta: textoFraccion(m, d) })),
        tiras: fracs, pista, explicacion,
    };
}

function armarSuma(r) {
    const { op, a, b, d } = r;
    const suma = op === "+";
    const m = suma ? a + b : a - b;
    const fr = (x) => textoFraccion(x, d);
    const plural = NOMBRE_PARTE[d]?.[1] || `partes de ${d}`;
    // Los errores de siempre: operar también los de abajo, hacer la
    // otra operación, y quedarse una parte arriba o abajo.
    const falsas = suma
        ? [[m, 2 * d], [m + 1, d], [m - 1, d], [a * b, d], [m, d + 1]]
        : [[a + b, d], [m + 1, d], [m - 1, d], [m, d - 1], [m, 2 * d]];
    const lista = [[m, d]];
    for (const [x, y] of falsas) {
        if (lista.length < 4 && x > 0 && x < y && !lista.some(([u, v]) => u === x && v === y) && x * d !== m * y) lista.push([x, y]);
    }
    const enOrden = barajar(lista);
    const signo = suma ? "+" : "−";
    const texto = `¿Cuánto es ${fr(a)} ${signo} ${fr(b)}?`;
    return {
        tipo: "fraccion", clase: "sumar", reto: r, a: d, b: a,
        respuesta: codigoFraccion(m, d), texto, voz: textoParaVoz(texto),
        opciones: enOrden.map(([x, y]) => ({ valor: codigoFraccion(x, y), etiqueta: textoFraccion(x, y) })),
        tiras: suma ? [[a, d], [b, d]] : [[a, d]],
        pista: suma
            ? `Las dos fracciones son ${plural}: suma cuántas partes hay. El número de abajo dice el tamaño de las partes y no cambia.`
            : `Las dos fracciones son ${plural}: a ${a} partes quítale ${b}. El número de abajo dice el tamaño de las partes y no cambia.`,
        explicacion: suma
            ? `${fr(a)} + ${fr(b)} = ${fr(m)}: son ${plural} las dos, así que se suman las partes (${a} + ${b} = ${m}) y siguen siendo ${plural}. Los de abajo no se suman.`
            : `${fr(a)} − ${fr(b)} = ${fr(m)}: se quitan partes (${a} − ${b} = ${m}) y siguen siendo ${plural}. Los de abajo no se restan.`,
    };
}

function armarSumaDistinta(r) {
    const { a, b, c, d } = r;
    const L = (b * d) / mcd(b, d);
    const [x, y] = [a * (L / b), c * (L / d)];
    const m = x + y;
    // Los errores de siempre: sumar arriba y abajo, sumar arriba y
    // dejar el de abajo más grande, y una parte de más o de menos.
    const falsas = [[a + c, b + d], [a + c, Math.max(b, d)], [m + 1, L], [m - 1, L], [a + c, L], [a * c, b * d]];
    const lista = [[m, L]];
    for (const [u, v] of falsas) {
        if (lista.length < 4 && u > 0 && u < v && !lista.some(([p, q]) => p * v === u * q)) lista.push([u, v]);
    }
    const enOrden = barajar(lista);
    const texto = `¿Cuánto es ${textoFraccion(a, b)} + ${textoFraccion(c, d)}?`;
    const pasa = (n, den, nuevo) => (den === L ? `${textoFraccion(n, den)} ya está en ${L}` : `${textoFraccion(n, den)} = ${textoFraccion(nuevo, L)}`);
    return {
        tipo: "fraccion", clase: "sumarDistinto", reto: r, a: b, b: d,
        respuesta: codigoFraccion(m, L), texto, voz: textoParaVoz(texto),
        opciones: enOrden.map(([u, v]) => ({ valor: codigoFraccion(u, v), etiqueta: textoFraccion(u, v) })),
        tiras: [[a, b], [c, d], [0, L]],
        pista: `Las partes son de distinto tamaño: primero pásalas al mismo número de abajo, ${L}, multiplicando arriba y abajo. Después suma las de arriba.`,
        explicacion: `${texto.replace("¿Cuánto es ", "").replace("?", "")} = ${textoFraccion(m, L)}: con ${L} abajo, ${pasa(a, b, x)} y ${pasa(c, d, y)}; ${x} + ${y} = ${m}. Sumar arriba y abajo (${textoFraccion(a + c, b + d)}) no sirve: las partes no son del mismo tamaño.`,
    };
}

function armarFraccion(r) {
    if (r.clase === "sumarDistinto") return armarSumaDistinta(r);
    if (r.clase === "sumar") return armarSuma(r);
    if (r.clase === "equivalente") return armarEquivalente(r);
    if (r.clase === "comparar") return armarComparacion(r);
    const { m, d, k } = r;
    const total = d * k;
    const respuesta = m * k;
    const fr = `${m}/${d}`;
    const unaParte = `${total} ÷ ${d} = ${k}`;
    const explicacion = m === 1
        ? `${fr} de ${total} = ${k}: es repartir ${total} en ${d} partes iguales, ${unaParte}.`
        : `${fr} de ${total} = ${respuesta}: un ${NOMBRE_PARTE[d][0]} es ${unaParte}, y ${nombreFraccion(m, d)} son ${m} × ${k} = ${respuesta}.`;
    const pista = m === 1
        ? `Reparte ${total} en ${d} partes iguales: ¿cuánto toca a cada parte? Piensa en la tabla del ${d}.`
        : `Primero busca un ${NOMBRE_PARTE[d][0]}: reparte ${total} en ${d} partes iguales. Luego toma ${m} de esas partes.`;
    const falsas = [m > 1 ? k : null, (d - m) * k, total % m === 0 && m > 1 ? total / m : null, respuesta + k, respuesta - k, total]
        .filter((x) => x !== null && x !== respuesta);
    return {
        tipo: "fraccion", reto: r, a: d, b: k, respuesta,
        texto: `¿Cuánto es ${fr} de ${total}?`,
        voz: `¿Cuánto es ${nombreFraccion(m, d)} de ${total}?`,
        opciones: cuatroOpciones(respuesta, falsas),
        pista, explicacion,
    };
}

/**
 * Arma la pregunta de un hecho según la partida: qué se ve, qué se
 * oye, la respuesta y la explicación que se da al contestar.
 */
function armarPregunta(h) {
    const { a, b } = h;
    const producto = a * b;
    if (currentTable === "div") {
        return {
            tipo: "div", a, b, respuesta: b,
            texto: `${producto} ÷ ${a}`,
            voz: `¿Cuánto es, ${producto} entre ${a}?`,
            explicacion: `${producto} ÷ ${a} = ${b}, porque ${a} × ${b} = ${producto}.`,
        };
    }
    if (currentTable === "fracciones" && h.reto) return armarFraccion(h.reto);
    if (currentTable === "residuo" && h.reto) return armarResiduo(h.reto);
    if (currentTable === "multiplos" && h.reto) return armarMultiplos(h.reto);
    if (currentTable === "area" && h.reto) return armarArea(h.reto);
    if (currentTable === "dinero" && h.reto) return armarDinero(h.reto);
    if (currentTable === "porcentajes" && h.reto) return armarPorcentaje(h.reto);
    if (currentTable === "decimales" && h.reto) return armarDecimales(h.reto);
    if (currentTable === "tiempo" && h.reto) return armarTiempo(h.reto);
    if (currentTable === "calendario" && h.reto) return armarCalendario(h.reto);
    if (currentTable === "logica" && h.reto) {
        return { ...armarReto(h.reto), a, b };
    }
    if (currentTable === "problemas") {
        const op = h.op === "÷" ? "÷" : "×";
        const lista = PROBLEMAS[op];
        const t = Number.isInteger(h.t) ? h.t % lista.length : 0;
        const p = lista[t](a, b);
        const cuenta = op === "×"
            ? `Es una multiplicación: ${a} × ${b} = ${producto}.`
            : `Es una división: ${producto} ÷ ${a} = ${b}.`;
        return {
            tipo: "problema", a, b, op, t,
            respuesta: op === "×" ? producto : b,
            texto: p.texto, voz: p.texto,
            explicacion: `${cuenta} ${p.solucion}`,
        };
    }
    return {
        tipo: "mult", a, b, respuesta: producto,
        texto: `${a} × ${b}`,
        voz: `¿Cuánto es, ${a} por ${b}?`,
        explicacion: `${a} × ${b} = ${producto}`,
    };
}

/** ¿La pregunta en curso es de dividir (una división o un problema de dividir)? */
function seDivide() {
    return Boolean(pregunta) && (pregunta.tipo === "div" || pregunta.op === "÷");
}

function sacarDeLaBolsa() {
    if (bolsa.length === 0) {
        llenarBolsa();
    }
    return bolsa.pop();
}
