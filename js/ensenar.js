// ENSÉÑALE A LUMI (Hito 4.4): Lumi da su respuesta a una pregunta y quien
// juega decide si está bien. Lumi se equivoca con los errores típicos que el
// juego ya conoce (las opciones falsas de cada tema, cada una con su
// explicación), y a veces acierta, para que no baste decir siempre «no».
// Si Lumi se equivocó, se le enseña cuál es la buena. Explicarle a otro es
// de las mejores maneras de aprender.
//
// Las preguntas salen de lo que quien juega ya tiene a la mano: sus tablas
// y los temas de los lugares despiertos; y, si los hay, de sus propios errores
// en las tablas (Hito 6.2). Cada duda resuelta a la primera da
// una estrella y cuenta para la meta del día; no toca el jardín ni el mapa.
//
// Es un script clásico que solo declara (ver pruebas/archivos.spec.mjs).

const DUDAS_POR_RONDA = 5;
const LUMI_ACIERTA = 0.25;   // una de cada cuatro veces, Lumi tiene razón
// Cada tema, con el lugar del mundo que lo trae y cómo se arma una pregunta.
const TEMAS_ENSENAR = [
    ["bosque", () => armarResiduo(bolsaDeResiduos()[0].reto)],
    ["rio", () => armarMultiplos(bolsaDeMultiplos()[0].reto)],
    ["partes", () => armarDecimales(bolsaDeDecimales()[0].reto)],
    ["partes", () => armarPorcentaje(bolsaDePorcentajes()[0].reto)],
    ["mercado", () => armarDinero(bolsaDeDinero()[0].reto)],
    ["mercado", () => armarTiempo(bolsaDeTiempo()[0].reto)],
    ["mercado", () => armarCalendario(bolsaDeCalendario()[0].reto)],
    ["mercado", () => armarArea(bolsaDeArea()[0].reto)],
];
// La ronda en curso: { n, bien, duda, paso: "juzgar" | "corregir" | "resuelta" | "fin", primera }.
let ensenar = null;

/** Una multiplicación de las tablas que ya se empezaron, con sus errores típicos. */
function dudaDeTabla() {
    const empezadas = [2, 3, 4, 5, 6, 7, 8, 9].filter((n) => tablaYaJugada(n));
    const a = empezadas.length ? empezadas[entre(0, empezadas.length - 1)] : 2;
    const b = entre(3, 9);
    const r = a * b;
    const porQue = {};
    const falsa = (valor, texto) => { if (valor !== r && valor > 0 && !porQue[valor]) porQue[valor] = texto; };
    falsa(a + b, `${a} + ${b} es sumar. ${a} × ${b} son ${a} filas de ${b}: ${r}.`);
    falsa((a - 1) * b, `${(a - 1) * b} es ${a - 1} × ${b}: falta una fila de ${b}. ${a} × ${b} = ${r}.`);
    falsa((a + 1) * b, `${(a + 1) * b} es ${a + 1} × ${b}: sobra una fila de ${b}. ${a} × ${b} = ${r}.`);
    return {
        texto: `${a} × ${b}`, respuesta: r, porQue,
        explicacion: `${a} × ${b} = ${r}.`,
        opciones: barajar([r, ...Object.keys(porQue).map(Number)]).map((v) => ({ valor: v, etiqueta: String(v) })),
    };
}

/**
 * Los errores propios (Hito 6.2): lo que quien juega respondió mal en las
 * tablas, con cuántas veces, de más repetido a menos. Solo de lo que aún no
 * florece: un error viejo de algo que ya se sabe no hace falta repasarlo.
 */
function erroresPropios() {
    const errores = new Map();
    for (const [clave, intentos] of Object.entries(hechos)) {
        const [a, b] = clave.split("x").map(Number);
        if (estadoHecho(a, b) === "florecida") continue;
        for (const i of intentos) {
            // Solo los fallos guardan lo respondido («r»).
            if (!Number.isInteger(i.r) || i.r <= 0 || i.r === a * b) continue;
            const huella = `${clave}:${i.r}`;
            const e = errores.get(huella) || { a, b, r: i.r, veces: 0 };
            e.veces++;
            errores.set(huella, e);
        }
    }
    return [...errores.values()].sort((x, y) => y.veces - x.veces || x.a * x.b - y.a * y.b);
}

/** Por qué ese error no es la respuesta, dicho para explicárselo a Lumi. */
function porQueNoEs(a, b, r) {
    const p = a * b;
    const c = confusionDe(a, b, r);
    if (c?.tipo === "vecina") return `${r} es ${c.con[0]} × ${c.con[1]}, la de al lado. ${a} × ${b} = ${p}.`;
    if (c?.tipo === "suma") return `${a} + ${b} es sumar. ${a} × ${b} son ${a} filas de ${b}: ${p}.`;
    if (c?.tipo === "cifras") return `${r} tiene las mismas cifras, pero al revés. ${a} × ${b} = ${p}.`;
    if (c?.tipo === "tabla") return `${r} es ${c.con[0]} × ${c.con[1]}, otra de la misma tabla. ${a} × ${b} = ${p}.`;
    return `${r} no es. ${a} × ${b} son ${a} filas de ${b}: ${p}.`;
}

/**
 * Una duda hecha con un error propio: Lumi dirá justo lo que quien juega
 * respondió alguna vez (de los tres más repetidos, uno al azar). Corregirla
 * practica lo que más falta, sin señalar de quién era el error.
 */
function dudaPropia(errores = erroresPropios(), azar = Math.random()) {
    const { a, b, r } = errores[Math.floor(azar * Math.min(3, errores.length))];
    const p = a * b;
    const porQue = { [r]: porQueNoEs(a, b, r) };
    for (const otra of [(a + 1) * b, (a - 1) * b, a + b, p + 1]) {
        if (Object.keys(porQue).length < 3 && otra > 0 && otra !== p && !porQue[otra]) porQue[otra] = porQueNoEs(a, b, otra);
    }
    return {
        texto: `${a} × ${b}`, respuesta: p, porQue, lumiDice: r, propia: true,
        explicacion: `${a} × ${b} = ${p}.`,
        opciones: barajar([p, ...Object.keys(porQue).map(Number)]).map((v) => ({ valor: v, etiqueta: String(v) })),
    };
}

/**
 * Una pregunta al azar de lo que quien juega tiene a la mano: tablas (el
 * doble de veces), un tema despierto o, si los hay, sus errores propios
 * (tantas veces como las tablas).
 */
function preguntaParaLumi() {
    const despiertos = TEMAS_ENSENAR.filter(([lugar]) => faltanParaLugar(LUGARES.find((l) => l.id === lugar)).length === 0);
    const propios = erroresPropios().length ? [dudaPropia, dudaPropia] : [];
    const bolsaDeTemas = [dudaDeTabla, dudaDeTabla, ...propios.map((armar) => () => armar()), ...despiertos.map(([, armar]) => armar)];
    return bolsaDeTemas[entre(0, bolsaDeTemas.length - 1)]();
}

/**
 * Una duda: la pregunta, lo que dice Lumi y si acertó. Si la pregunta no
 * trae ninguna falsa explicada, Lumi acierta (no se inventa un error).
 */
function nuevaDuda(pregunta = preguntaParaLumi(), azar = Math.random()) {
    const buena = pregunta.opciones.find((o) => o.valor === pregunta.respuesta);
    const falsas = pregunta.opciones.filter((o) => o.valor !== pregunta.respuesta && pregunta.porQue?.[o.valor]);
    const acierta = falsas.length === 0 || azar < LUMI_ACIERTA;
    // Con un error propio, Lumi dice justo ese; si no, una de las falsas explicadas.
    const dicha = acierta ? buena : (falsas.find((o) => o.valor === pregunta.lumiDice) || falsas[Math.floor(azar * 997) % falsas.length]);
    return { pregunta, buena, dicha, acierta, error: acierta ? "" : pregunta.porQue[dicha.valor] };
}

/** Lo que Lumi dice de una duda. */
function fraseDeLumi(duda) {
    return `Yo digo que es ${duda.dicha.etiqueta}. ¿Está bien?`;
}
