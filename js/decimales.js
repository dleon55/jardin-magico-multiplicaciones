// FRACCIONES DECIMALES (issue #102): décimos y centésimos.
//
// Une las fracciones con los decimales: 3/10 es 0.3, 25/100 es 0.25, y 0.5
// es lo mismo que 0.50. Cuatro clases, para elegir:
//   aDecimal   ¿Cómo se escribe 3/10 con punto?          → 0.3
//   aFraccion  ¿Qué fracción es 0.25?                     → 25/100
//   comparar   ¿Cuál es el más grande? (0.7, 0.65, 6/10, 69/100)
//   sumar      0.6 + 0.5                                  → 1.1
// Las falsas son los errores típicos, cada uno explicado: décimos por
// centésimos (3/10 = 0.03), el número de abajo equivocado (0.25 = 25/10),
// «más cifras es más grande», sumar sin llevar al entero (0.11).
//
// Todo se cuenta en milésimos enteros (nada de 0.1 + 0.2). Es un script
// clásico que solo declara (ver pruebas/archivos.spec.mjs).

/** 300 → «0.3», 250 → «0.25», 1100 → «1.1», 2000 → «2»: sin ceros de más. */
function escribirDecimal(milesimos) {
    const entero = Math.floor(milesimos / 1000);
    const resto = String(milesimos % 1000).padStart(3, "0").replace(/0+$/, "");
    return resto ? `${entero}.${resto}` : String(entero);
}
/** Una fracción como opción: su valor (arriba × 10000 + abajo) y su texto. */
const fraccionOpcion = (arriba, abajo) => ({ valor: arriba * 10000 + abajo, etiqueta: `${arriba}/${abajo}` });
/** Lo que vale una fracción, en milésimos (redondeado: solo se usa para comparar). */
const milesimosDe = (arriba, abajo) => Math.round((arriba * 1000) / abajo);

/** Diez preguntas: tres de cada conversión, dos de comparar y dos de sumar. */
function bolsaDeDecimales() {
    const pocas = parejasConocidas().length < MIN_CONOCIDAS;
    const clases = barajar(["aDecimal", "aDecimal", "aDecimal", "aFraccion", "aFraccion", "aFraccion", "comparar", "comparar", "sumar", "sumar"]);
    const vistas = new Set();
    return clases.map((clase) => {
        let reto;
        let intentos = 0;
        do { reto = crearRetoDecimales(clase, pocas); } while (vistas.has(JSON.stringify(reto)) && ++intentos < 30);
        vistas.add(JSON.stringify(reto));
        return { a: numerosDeDecimales(reto)[0], b: 1, reto };
    });
}

function crearRetoDecimales(clase, pocas) {
    if (clase === "aDecimal" || clase === "aFraccion") {
        // Con pocas tablas sabidas, solo décimos; si no, la mitad centésimos.
        if (pocas || Math.random() < 0.5) return { clase, arriba: entre(1, 9), abajo: 10 };
        let arriba;
        do { arriba = entre(1, 99); } while (arriba % 10 === 0);   // 30/100 es 3/10: ya está en décimos
        return { clase, arriba, abajo: 100 };
    }
    if (clase === "comparar") {
        // 0.t contra 0.(t−1)x: «65» parece más que «7».
        const t = entre(3, 9);
        return { clase, t, x: entre(1, 8) };
    }
    // sumar: dos décimos que pasan del entero (0.6 + 0.5), sin dar justo 1.
    const a = entre(2, 9);
    return { clase, a, b: entre(Math.max(2, 11 - a), 9) };
}

/** Un número del 1 al 9 que represente el reto (para el color de la planta). */
function numerosDeDecimales(r) {
    const n = r.clase === "comparar" ? r.t : r.clase === "sumar" ? r.a : r.arriba % 10 || 1;
    return [n, 1];
}

function armarDecimales(reto) {
    const falsas = [];
    const anadir = (opcion, porQue, vale) => {
        if (!opcion || opcion.valor === vale || falsas.some((f) => f.opcion.valor === opcion.valor) || falsas.length >= 3) return;
        if (opcion.valor < 1) return;
        falsas.push({ opcion, porQue });
    };
    const num = (v) => ({ valor: v, etiqueta: escribirDecimal(v) });
    const { clase } = reto;
    let p;
    if (clase === "aDecimal") {
        const { arriba, abajo } = reto;
        const r = milesimosDe(arriba, abajo);
        const de = abajo === 10 ? "décimos" : "centésimos";
        if (abajo === 10) {
            anadir(num(arriba * 10), `${escribirDecimal(arriba * 10)} son ${arriba} centésimos. ${arriba}/10 son ${arriba} décimos: ${escribirDecimal(r)}.`, r);
            anadir(num(arriba * 1000), `${arriba}/10 es menos que un entero: ${arriba} de 10 partes, ${escribirDecimal(r)}.`, r);
            anadir(num(arriba), `${escribirDecimal(arriba)} son ${arriba} milésimos: con décimos va una sola cifra después del punto.`, r);
        } else {
            anadir(num(arriba * 100), `${escribirDecimal(arriba * 100)} serían ${arriba} décimos. ${arriba}/100 son ${arriba} centésimos: ${escribirDecimal(r)}.`, r);
            anadir(num(arriba * 1000), `${arriba}/100 es menos que un entero: ${arriba} de 100 partes, ${escribirDecimal(r)}.`, r);
            anadir(num(arriba), `${escribirDecimal(arriba)} son ${arriba} milésimos: con centésimos van dos cifras después del punto.`, r);
        }
        p = { respuesta: r, opcionBuena: num(r),
            texto: `¿Cómo se escribe ${arriba}/${abajo} con punto decimal?`,
            pista: `${arriba}/${abajo} son ${arriba} ${de}. Los ${de} van ${abajo === 10 ? "en la primera cifra" : "en las dos primeras cifras"} después del punto.`,
            explicacion: `${arriba}/${abajo} = ${escribirDecimal(r)}: ${arriba} ${de}.`,
            voz: `¿Cómo se escribe ${arriba} ${abajo === 10 ? "décimos" : "centésimos"} con punto decimal?` };
    } else if (clase === "aFraccion") {
        const { arriba, abajo } = reto;
        const v = milesimosDe(arriba, abajo);
        const buena = fraccionOpcion(arriba, abajo);
        const otroAbajo = abajo === 10 ? 100 : 10;
        const vale = (o) => milesimosDe(Math.floor(o.valor / 10000), o.valor % 10000) === v;
        const sinIgual = (o) => (vale(o) ? null : o);
        anadir(sinIgual(fraccionOpcion(arriba, otroAbajo)), `${arriba}/${otroAbajo} es ${escribirDecimal(milesimosDe(arriba, otroAbajo))}. ${escribirDecimal(v)} son ${arriba} ${abajo === 10 ? "décimos" : "centésimos"}: ${arriba}/${abajo}.`, buena.valor);
        anadir(sinIgual(fraccionOpcion(1, arriba)), `1/${arriba} no es ${escribirDecimal(v)}: el ${arriba} va arriba, y abajo va ${abajo}.`, buena.valor);
        anadir(sinIgual(fraccionOpcion(arriba, 1)), `${arriba}/1 son ${arriba} enteros. ${escribirDecimal(v)} es menos que uno.`, buena.valor);
        anadir(sinIgual(fraccionOpcion(arriba, 1000)), `${arriba}/1000 son ${arriba} milésimos.`, buena.valor);
        p = { respuesta: buena.valor, opcionBuena: buena,
            texto: `¿Qué fracción es ${escribirDecimal(v)}?`,
            pista: `Lee el número: ${escribirDecimal(v)} son ${arriba} ${abajo === 10 ? "décimos" : "centésimos"}. Arriba va ${arriba}; abajo, ${abajo}.`,
            explicacion: `${escribirDecimal(v)} = ${arriba}/${abajo}: ${arriba} ${abajo === 10 ? "décimos" : "centésimos"}.`,
            voz: `¿Qué fracción es ${escribirDecimal(v).replace(".", " punto ")}?` };
    } else if (clase === "comparar") {
        const { t, x } = reto;
        const r = t * 100;
        const b = (t - 1) * 100 + x * 10;
        const casi = t * 10 - 1;   // 69/100: un centésimo menos que 0.7
        anadir(num(b), `Más cifras no es más grande: ${escribirDecimal(r)} es ${escribirDecimal(r)}0, y ${t * 10} centésimos son más que ${b / 10}.`, r);
        anadir({ valor: (t - 1) * 100 + 1, etiqueta: `${t - 1}/10` }, `${t - 1}/10 es ${escribirDecimal((t - 1) * 100)}: un décimo menos que ${escribirDecimal(r)}.`, r);
        anadir({ valor: casi * 10 + 2, etiqueta: `${casi}/100` }, `${casi}/100 es ${escribirDecimal(casi * 10)}: le falta un centésimo para ${escribirDecimal(r)}.`, r);
        p = { respuesta: r, opcionBuena: num(r),
            texto: "¿Cuál es el número más grande?",
            pista: `Escribe todos con dos cifras después del punto: ${escribirDecimal(r)} es 0.${t}0, y ${t - 1}/10 es 0.${t - 1}0. Luego compáralos.`,
            explicacion: `${escribirDecimal(r)} es el más grande: ${t * 10} centésimos.`,
            voz: "¿Cuál es el número más grande?" };
        // Las fracciones de esta clase llevan un valor propio (no milésimos),
        // pero el más grande es siempre el decimal 0.t.
    } else {
        const { a, b } = reto;
        const r = (a + b) * 100;
        anadir(num((a + b) * 10), `Sumaste las cifras: ${a} + ${b} = ${a + b}, pero son décimos. ${a + b} décimos son 1 entero y ${a + b - 10} ${a + b === 11 ? "décimo" : "décimos"}: ${escribirDecimal(r)}.`, r);
        anadir(num((a + b - 10) * 100), `Te faltó el entero: 10 décimos hacen 1. ${escribirDecimal(r)}.`, r);
        anadir(num((a + b) * 1000), `${a + b} enteros es demasiado: son ${a + b} décimos, o sea ${escribirDecimal(r)}.`, r);
        p = { respuesta: r, opcionBuena: num(r),
            texto: `¿Cuánto es ${escribirDecimal(a * 100)} + ${escribirDecimal(b * 100)}?`,
            pista: `Son ${a} décimos y ${b} décimos. Cada 10 décimos hacen 1 entero.`,
            explicacion: `${escribirDecimal(a * 100)} + ${escribirDecimal(b * 100)} = ${escribirDecimal(r)}: ${a + b} décimos son 1 entero y ${a + b - 10} ${a + b === 11 ? "décimo" : "décimos"}.`,
            voz: `¿Cuánto es ${escribirDecimal(a * 100).replace(".", " punto ")} más ${escribirDecimal(b * 100).replace(".", " punto ")}?` };
    }
    const tres = falsas.slice(0, 3);
    return {
        tipo: "decimales", clase, reto, ...p,
        opciones: barajar([p.opcionBuena, ...tres.map((f) => f.opcion)]),
        porQue: Object.fromEntries(tres.map((f) => [f.opcion.valor, f.porQue])),
    };
}

/**
 * La ayuda: tiras de 10 partes para los décimos y 100 cuadritos para los
 * centésimos. En «comparar», una tira por opción, llena según lo que vale.
 */
function dibujarDecimales() {
    const { reto } = pregunta;
    document.getElementById("help-truco").innerText = pistaPara().texto;
    const caja = document.createElement("div");
    caja.className = "bg-white border-2 border-indigo-100 rounded-xl p-3 space-y-2 w-64 max-w-full shrink-0";
    caja.setAttribute("aria-hidden", "true");
    const tira = (pintadas, color = "bg-indigo-500") => `<div class="tira-decimos flex h-6 border-2 border-indigo-300 rounded overflow-hidden">${
        Array.from({ length: 10 }, (_, i) => `<span class="decimo flex-1 ${i < pintadas ? `${color} decimo-pintado` : "bg-gray-100"} ${i ? "border-l border-white" : ""}"></span>`).join("")}</div>`;
    const cien = (pintados) => `<div class="cien-decimales inline-grid gap-0.5" style="grid-template-columns: repeat(10, auto)">${
        Array.from({ length: 100 }, (_, i) => `<span class="cuadro-decimal block w-3 h-3 rounded-sm ${i < pintados ? "bg-indigo-500 centesimo-pintado" : "bg-gray-100"}"></span>`).join("")}</div>`;
    let explica;
    if (reto.clase === "aDecimal" || reto.clase === "aFraccion") {
        caja.innerHTML = reto.abajo === 10 ? tira(reto.arriba) : `<div class="flex justify-center">${cien(reto.arriba)}</div>`;
        explica = reto.abajo === 10 ? "Un entero partido en 10 partes: cada parte es un décimo." : "Un entero partido en 100 cuadritos: cada uno es un centésimo, como un centavo de un peso.";
    } else if (reto.clase === "comparar") {
        const valor = (o) => (o.etiqueta.includes("/") ? milesimosDe(...o.etiqueta.split("/").map(Number)) : Math.round(parseFloat(o.etiqueta) * 1000));
        caja.innerHTML = pregunta.opciones.map((o) => `<div class="tira-comparar flex items-center gap-2"><span class="w-14 text-right font-bold text-indigo-900">${o.etiqueta}</span>` +
            `<span class="flex-1 h-5 bg-gray-100 border border-indigo-200 rounded overflow-hidden"><span class="block h-full bg-indigo-400" style="width:${valor(o) / 10}%"></span></span></div>`).join("");
        explica = "Cada tira es un entero. La más llena es el número más grande.";
    } else {
        caja.innerHTML = tira(reto.a) + tira(reto.b, "bg-amber-400");
        explica = "Junta las partes pintadas de las dos tiras: cada 10 hacen un entero.";
    }
    document.getElementById("help-explain").innerText = explica;
    document.getElementById("help-visual-container").replaceChildren(caja);
}
