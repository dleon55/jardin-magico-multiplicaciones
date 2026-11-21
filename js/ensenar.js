// ENSÉÑALE A LUMI (Hito 4.4): Lumi da su respuesta a una pregunta y quien
// juega decide si está bien. Lumi se equivoca con los errores típicos que el
// juego ya conoce (las opciones falsas de cada tema, cada una con su
// explicación), y a veces acierta, para que no baste decir siempre «no».
// Si Lumi se equivocó, se le enseña cuál es la buena. Explicarle a otro es
// de las mejores maneras de aprender.
//
// Las preguntas salen de lo que quien juega ya tiene a la mano: sus tablas
// y los temas de los lugares despiertos. Cada duda resuelta a la primera da
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

/** Una pregunta al azar de lo que quien juega tiene a la mano: tablas (el doble de veces) o un tema despierto. */
function preguntaParaLumi() {
    const despiertos = TEMAS_ENSENAR.filter(([lugar]) => faltanParaLugar(LUGARES.find((l) => l.id === lugar)).length === 0);
    const bolsaDeTemas = [dudaDeTabla, dudaDeTabla, ...despiertos.map(([, armar]) => armar)];
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
    const dicha = acierta ? buena : falsas[Math.floor(azar * 997) % falsas.length];
    return { pregunta, buena, dicha, acierta, error: acierta ? "" : pregunta.porQue[dicha.valor] };
}

/** Lo que Lumi dice de una duda. */
function fraseDeLumi(duda) {
    return `Yo digo que es ${duda.dicha.etiqueta}. ¿Está bien?`;
}
