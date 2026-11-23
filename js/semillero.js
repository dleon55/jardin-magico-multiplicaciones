// ANTES DE MULTIPLICAR (Hito 6.7): para quien aún no llega a las tablas.
// Tres ideas que las preparan, siempre con dibujo y para elegir entre tres:
//   contar   de 2 en 2, de 5 en 5, de 10 en 10 o de 3 en 3: «2, 4, 6, ¿?»
//   grupos   3 grupos de 4 puntos: ¿cuántos hay?
//   doble    el doble de 4
// Las opciones falsas son los tropiezos de siempre, cada uno con su
// explicación: contar de uno en uno, contar un grupo de más o de menos,
// sumar los dos números. Una oportunidad por pregunta; cada acierto da una
// estrella y cuenta para la meta del día. No toca el jardín ni el mapa.
//
// Es un script clásico que solo declara (ver pruebas/archivos.spec.mjs).

const SEMILLERO_PREGUNTAS = 6;
const SEMILLERO_SALTOS = [2, 5, 10, 3];
// La ronda en curso: { preguntas, n, bien, paso: "pregunta" | "respondida" | "fin" }.
let semillero = null;

/** Filas de puntos: `grupos` filas de `porGrupo`, cada fila en su caja. */
function dibujoDeGrupos(grupos, porGrupo) {
    const [r, paso, margen] = [7, 20, 8];
    const ancho = porGrupo * paso + margen * 2;
    const alto = grupos * (paso + 6) + 6;
    let s = `<svg class="dibujo-semillero" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${grupos === 1 ? "1 fila" : `${grupos} filas`} de ${porGrupo === 1 ? "1 punto" : `${porGrupo} puntos`}">`;
    for (let g = 0; g < grupos; g++) {
        const y = 6 + g * (paso + 6);
        s += `<rect x="2" y="${y}" width="${ancho - 4}" height="${paso}" rx="10" fill="#fef3c7" stroke="var(--contorno)" stroke-width="1.5"/>`;
        for (let i = 0; i < porGrupo; i++) s += `<circle cx="${margen + paso / 2 + i * paso}" cy="${y + paso / 2}" r="${r}" fill="#0f766e"/>`;
    }
    return `${s}</svg>`;
}

/** Tres opciones sin repetir: la buena y las dos primeras falsas válidas. */
function opcionesDeSemillero(buena, falsas) {
    const porQue = {};
    for (const [valor, texto] of falsas) {
        if (Object.keys(porQue).length < 2 && valor > 0 && valor !== buena && !porQue[valor]) porQue[valor] = texto;
    }
    return { porQue, opciones: barajar([buena, ...Object.keys(porQue).map(Number)]) };
}

/** Una pregunta de una clase, con sus números. */
function preguntaDeSemillero(clase, a, b) {
    if (clase === "contar") {
        // a: de cuánto en cuánto; b: cuántos pasos se ven (3 o 4).
        const vistos = Array.from({ length: b }, (_, i) => a * (i + 1));
        const buena = a * (b + 1);
        const { porQue, opciones } = opcionesDeSemillero(buena, [
            [vistos.at(-1) + 1, `${vistos.at(-1) + 1} es contar de uno en uno. Aquí se salta de ${a} en ${a}: ${vistos.at(-1)} y ${a} más son ${buena}.`],
            [buena + a, `${buena + a} es un salto de más. Después de ${vistos.at(-1)} va ${buena}.`],
            [buena - 1, `Casi: después de ${vistos.at(-1)}, ${a} más son ${buena}.`],
        ]);
        return { clase, texto: `${vistos.join(", ")}, ¿?`, voz: `De ${a} en ${a}: ${vistos.join(", ")}. ¿Qué sigue?`, respuesta: buena, opciones, porQue,
            dibujo: "", explicacion: `De ${a} en ${a}: ${[...vistos, buena].join(", ")}.` };
    }
    if (clase === "grupos") {
        // a filas de b puntos.
        const buena = a * b;
        const { porQue, opciones } = opcionesDeSemillero(buena, [
            [a + b, `${a} + ${b} es juntar los dos números. Son ${a} filas de ${b}: cuenta todas.`],
            [buena + b, `${buena + b} es una fila de más. Hay ${a} filas de ${b}: ${buena}.`],
            [buena - b, `${buena - b} es una fila de menos. Hay ${a} filas de ${b}: ${buena}.`],
        ]);
        return { clase, texto: `${a === 1 ? "1 fila" : `${a} filas`} de ${b}. ¿Cuántos hay?`, voz: `${a === 1 ? "Una fila" : `${a} filas`} de ${b} puntos. ¿Cuántos hay?`, respuesta: buena, opciones, porQue,
            dibujo: dibujoDeGrupos(a, b), explicacion: `${a} filas de ${b} son ${buena}.` };
    }
    // El doble de a: dos filas iguales.
    const buena = a * 2;
    const { porQue, opciones } = opcionesDeSemillero(buena, [
        [a + 2, `${a + 2} es ${a} y 2 más. El doble es ${a} y otros ${a}: ${buena}.`],
        [a + 1, `${a + 1} es solo uno más. El doble es ${a} y otros ${a}: ${buena}.`],
        [buena + 2, `Casi: ${a} y otros ${a} son ${buena}.`],
    ]);
    return { clase, texto: `El doble de ${a}`, voz: `¿Cuál es el doble de ${a}?`, respuesta: buena, opciones, porQue,
        dibujo: dibujoDeGrupos(2, a), explicacion: `El doble de ${a} es ${a} y otros ${a}: ${buena}.` };
}

/** Seis preguntas: dos de cada clase, mezcladas y sin repetir. */
function rondaDeSemillero() {
    const vistas = new Set();
    const unica = (crear) => {
        let p, intentos = 0;
        do { p = crear(); } while (vistas.has(p.texto) && ++intentos < 30);
        vistas.add(p.texto);
        return p;
    };
    return barajar([
        unica(() => preguntaDeSemillero("contar", SEMILLERO_SALTOS[entre(0, 1)], entre(3, 4))),
        unica(() => preguntaDeSemillero("contar", SEMILLERO_SALTOS[entre(0, 3)], entre(3, 4))),
        unica(() => preguntaDeSemillero("grupos", entre(2, 3), entre(2, 5))),
        unica(() => preguntaDeSemillero("grupos", entre(2, 4), entre(2, 5))),
        unica(() => preguntaDeSemillero("doble", entre(2, 5))),
        unica(() => preguntaDeSemillero("doble", entre(3, 9))),
    ]);
}
