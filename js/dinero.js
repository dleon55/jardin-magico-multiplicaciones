// DECIMALES Y DINERO (issue #71): el cuarto tema nuevo de la Fase 3.
//
// Pesos y centavos: 100 centavos son un peso, y al sumar se lleva y al
// restar se pide prestado, como con los números de siempre. Cuatro clases,
// para elegir:
//   sumar     dos precios, con centavos que pasan de un peso;
//   cambio    pagar con un billete y contar el cambio;
//   por       varias cosas iguales (enlaza con las tablas);
//   decimal   ¿cuál es más grande: 0.5 o 0.45?
// Las falsas son los errores típicos, cada uno explicado: no llevar el
// peso, no pedir prestado, multiplicar solo los pesos, creer que más
// cifras es más grande.
//
// Todo se cuenta en centavos enteros (nada de 0.1 + 0.2). Es un script
// clásico que solo declara (ver pruebas/archivos.spec.mjs).

const COSAS_DINERO = [["una paleta", "un jugo"], ["un lápiz", "un cuaderno"], ["unas galletas", "una fruta"], ["un globo", "un dulce"], ["una goma", "una regla"]];
const COSA_POR = [["cuadernos", "cuaderno"], ["lápices", "lápiz"], ["paletas", "paleta"], ["jugos", "jugo"], ["gomas", "goma"]];
const BILLETES = [20, 50, 100, 200];

/** $12.50 */
const pesos = (centavos) => `$${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, "0")}`;
/** «12 pesos con 50 centavos» (para la voz). */
const pesosEnVoz = (c) => {
    const p = Math.floor(c / 100), cs = c % 100;
    return `${p} ${p === 1 ? "peso" : "pesos"}${cs ? ` con ${cs} centavos` : ""}`;
};
/** 0.5, 0.45, 0.09: centésimos escritos como se dicen en la pregunta. */
const decimal = (centesimos, cifras) => cifras === 1 ? `0.${centesimos / 10}` : `0.${String(centesimos).padStart(2, "0")}`;
/** Centavos múltiplos de 5, entre lo y hi. */
const centavosEntre = (lo, hi) => 5 * entre(Math.ceil(lo / 5), Math.floor(hi / 5));

/** Diez preguntas: tres de sumar, tres de cambio, dos de varias iguales y dos de decimales. */
function bolsaDeDinero() {
    const pocas = parejasConocidas().length < MIN_CONOCIDAS;
    const clases = barajar(["sumar", "sumar", "sumar", "cambio", "cambio", "cambio", "por", "por", "decimal", "decimal"]);
    const vistas = new Set();
    return clases.map((clase, i) => {
        let reto;
        let intentos = 0;
        do { reto = crearRetoDinero(clase, pocas, i); } while (vistas.has(JSON.stringify(reto)) && ++intentos < 30);
        vistas.add(JSON.stringify(reto));
        return { a: numerosDeDinero(reto)[0], b: 1, reto };
    });
}

function crearRetoDinero(clase, pocas, i = 0) {
    if (clase === "sumar") {
        // Centavos que pasan de un peso: así se nota si se lleva.
        const ca = centavosEntre(30, 95);
        const cb = centavosEntre(Math.max(5, 105 - ca), 95);
        return { clase, a: entre(2, pocas ? 15 : 40) * 100 + ca, b: entre(1, pocas ? 9 : 25) * 100 + cb, cosas: i % COSAS_DINERO.length };
    }
    if (clase === "cambio") {
        const billete = BILLETES[entre(0, pocas ? 1 : 3)];
        // Sin 50 centavos: con 50, «pedir prestado» y «no pedirlo» darían lo mismo.
        let c;
        do { c = centavosEntre(5, 95); } while (c === 50);
        return { clase, billete, precio: entre(Math.max(1, billete / 2 - 10), billete - 2) * 100 + c };
    }
    if (clase === "por") {
        return { clase, n: entre(2, pocas ? 5 : 9), precio: entre(2, pocas ? 9 : 20) * 100 + [25, 50, 75][entre(0, 2)], cosa: i % COSA_POR.length };
    }
    // decimal: 0.a contra 0.bc, con bc entre (a − 1)·10 y a·10: «45» parece más que «5».
    const a = entre(2, 9);
    return { clase, a: a * 10, b: entre((a - 1) * 10 + 1, a * 10 - 1) };
}

/** Un número del 1 al 9 que represente el reto (para el color de la planta de la partida). */
function numerosDeDinero(r) {
    return [r.clase === "por" ? r.n : r.clase === "decimal" ? r.a / 10 : 5, 1];
}

function armarDinero(reto) {
    const falsas = [];
    const anadir = (x, porQue, vale) => {
        if (!Number.isInteger(x) || x < 1 || x === vale || falsas.some((f) => f.x === x) || falsas.length >= 3) return;
        falsas.push({ x, porQue });
    };
    let p;
    if (reto.clase === "sumar") {
        const { a, b } = reto;
        const [cosaA, cosaB] = COSAS_DINERO[reto.cosas];
        const r = a + b, cs = (a % 100) + (b % 100);
        anadir(r - 100, `${a % 100} + ${b % 100} = ${cs} centavos, que son 1 peso y ${cs - 100} centavos: te faltó llevar ese peso.`, r);
        anadir(Math.floor(a / 100) * 100 + Math.floor(b / 100) * 100, "Sumaste solo los pesos: faltan los centavos.", r);
        anadir(r + 100, `Llevaste un peso de más: ${pesos(a)} + ${pesos(b)} no llega a ${pesos(r + 100)}.`, r);
        p = { respuesta: r,
            texto: `Compras ${cosaA} de ${pesos(a)} y ${cosaB} de ${pesos(b)}. ¿Cuánto pagas?`,
            pista: `Suma primero los centavos: ${a % 100} + ${b % 100}. Cada 100 centavos son un peso más.`,
            explicacion: `${pesos(a)} + ${pesos(b)} = ${pesos(r)}: los centavos dan ${cs}, que son 1 peso y ${cs - 100} centavos.`,
            voz: `Compras ${cosaA} de ${pesosEnVoz(a)} y ${cosaB} de ${pesosEnVoz(b)}. ¿Cuánto pagas?` };
    } else if (reto.clase === "cambio") {
        const { billete, precio } = reto;
        const P = billete * 100, r = P - precio, c = precio % 100, sinPedir = (billete - Math.floor(precio / 100)) * 100 + c;
        anadir(sinPedir, `Copiaste los ${c} centavos: ${billete} − ${Math.floor(precio / 100)} = ${billete - Math.floor(precio / 100)}, pero de ${pesos(precio)} a ${pesos(Math.ceil(precio / 100) * 100)} faltan ${100 - c} centavos.`, r);
        anadir(r + 100, `Los centavos están bien, pero para darlos hubo que cambiar un peso: son ${Math.floor(r / 100)} pesos, no ${Math.floor(r / 100) + 1}.`, r);
        anadir(sinPedir - 100, `Los pesos están bien, pero los centavos no: de ${c} centavos a un peso faltan ${100 - c}, no ${c}.`, r);
        p = { respuesta: r,
            texto: `Pagas con un billete de $${billete} algo que cuesta ${pesos(precio)}. ¿Cuánto te dan de cambio?`,
            pista: `Cuenta hacia arriba, como en la tienda: de ${pesos(precio)} al siguiente peso, y de ahí hasta $${billete}.`,
            explicacion: `$${billete} − ${pesos(precio)} = ${pesos(r)}: de ${pesos(precio)} a ${pesos(Math.ceil(precio / 100) * 100)} son ${100 - c} centavos, y de ahí a $${billete}, ${billete - Math.ceil(precio / 100)} pesos.`,
            voz: `Pagas con un billete de ${billete} pesos algo que cuesta ${pesosEnVoz(precio)}. ¿Cuánto te dan de cambio?` };
    } else if (reto.clase === "por") {
        const { n, precio } = reto;
        const [plural, singular] = COSA_POR[reto.cosa];
        const r = n * precio, c = precio % 100, pe = Math.floor(precio / 100);
        anadir(n * pe * 100 + c, `Multiplicaste los pesos (${n} × ${pe} = ${n * pe}), pero no los centavos: también son ${n} veces ${c} centavos.`, r);
        anadir(precio + n * 100, `Sumaste ${n}: son ${n} veces ${pesos(precio)}, no ${pesos(precio)} y ${n} pesos más.`, r);
        anadir((n - 1) * precio, `Contaste uno de menos: ${n - 1} × ${pesos(precio)} = ${pesos((n - 1) * precio)}.`, r);
        anadir((n + 1) * precio, `Contaste uno de más: ${n + 1} × ${pesos(precio)} = ${pesos((n + 1) * precio)}.`, r);
        p = { respuesta: r,
            texto: `Compras ${n} ${plural} de ${pesos(precio)} cada ${singular}. ¿Cuánto pagas?`,
            pista: `Son ${n} veces ${pesos(precio)}: multiplica los pesos (${n} × ${pe}) y los centavos (${n} × ${c}), y junta.`,
            explicacion: `${n} × ${pesos(precio)} = ${pesos(r)}: ${n} × ${pe} pesos y ${n} × ${c} = ${n * c} centavos.`,
            voz: `Compras ${n} ${plural} de ${pesosEnVoz(precio)} cada ${singular}. ¿Cuánto pagas?` };
    } else {
        const { a, b } = reto;
        const una = a - 10;   // 0.4, si la pregunta es 0.5
        anadir(b, `Más cifras no es más grande: ${decimal(a, 1)} es lo mismo que ${decimal(a, 2)}, y ${a} centésimos son más que ${b}. Como $${decimal(a, 2)} y $${decimal(b, 2)}.`, a);
        anadir(9, `0.09 son 9 centésimos, como 9 centavos: menos que un décimo.`, a);
        anadir(una, `${decimal(una, 1)} son ${una} centésimos, menos que ${a}.`, a);
        p = { respuesta: a,
            texto: "¿Cuál es el número más grande?",
            pista: `Piensa en dinero: ${decimal(a, 1)} es $${decimal(a, 2)} (${a} centavos) y ${decimal(b, 2)} es $${decimal(b, 2)}. Escribe todos con dos cifras después del punto y compáralos.`,
            explicacion: `${decimal(a, 1)} es el más grande: es ${decimal(a, 2)}, ${a} centésimos.`,
            voz: "¿Cuál es el número más grande?" };
        const tres = falsas.slice(0, 3);
        const cifras = (v) => (v === a || v === una ? 1 : 2);
        return {
            tipo: "dinero", clase: reto.clase, reto, ...p,
            opciones: barajar([a, ...tres.map((f) => f.x)]).map((v) => ({ valor: v, etiqueta: decimal(v, cifras(v)) })),
            porQue: Object.fromEntries(tres.map((f) => [f.x, f.porQue])),
        };
    }
    const tres = falsas.slice(0, 3);
    return {
        tipo: "dinero", clase: reto.clase, reto, ...p,
        opciones: barajar([p.respuesta, ...tres.map((f) => f.x)]).map((v) => ({ valor: v, etiqueta: pesos(v) })),
        porQue: Object.fromEntries(tres.map((f) => [f.x, f.porQue])),
    };
}

/**
 * La ayuda, sin dar la respuesta:
 *   sumar    la cuenta en columnas, pesos y centavos aparte;
 *   cambio   contar hacia arriba, como en la tienda, por saltos;
 *   por      el precio repetido, una vez por cosa;
 *   decimal  una tira por número, llena según sus centésimos.
 */
function dibujarDinero() {
    const { reto } = pregunta;
    document.getElementById("help-truco").innerText = pistaPara().texto;
    const caja = document.createElement("div");
    caja.className = "bg-white border-2 border-indigo-100 rounded-xl p-3 space-y-2 w-full max-w-sm";
    caja.setAttribute("aria-hidden", "true");
    const chip = (texto, clase = "") => `<span class="chip-dinero inline-block px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-sm font-bold text-indigo-900 ${clase}">${texto}</span>`;
    let explica;
    if (reto.clase === "sumar") {
        const fila = (signo, c) => `<tr><td class="pr-2 text-indigo-700">${signo}</td><td class="text-right">${Math.floor(c / 100)}</td><td class="px-1">.</td><td>${String(c % 100).padStart(2, "0")}</td></tr>`;
        caja.innerHTML = `<table class="cuenta-dinero mx-auto text-2xl font-bold text-indigo-900 tabular-nums"><thead><tr class="text-xs text-indigo-700"><th></th><th>pesos</th><th></th><th>centavos</th></tr></thead>` +
            `<tbody>${fila("$", reto.a)}${fila("+ $", reto.b)}<tr class="border-t-2 border-indigo-300"><td></td><td class="text-right">?</td><td class="px-1">.</td><td>?</td></tr></tbody></table>`;
        explica = `Los centavos: ${reto.a % 100} + ${reto.b % 100}. Si pasan de 100, lleva un peso a la columna de los pesos.`;
    } else if (reto.clase === "cambio") {
        const siguiente = Math.ceil(reto.precio / 100) * 100;
        const pasos = [pesos(reto.precio), pesos(siguiente)];
        const decena = Math.ceil(siguiente / 1000) * 1000;
        if (decena > siguiente && decena < reto.billete * 100) pasos.push(pesos(decena));
        pasos.push(`$${reto.billete}.00`);
        caja.innerHTML = `<div class="saltos-dinero flex flex-wrap items-center justify-center gap-1">${pasos.map((t) => chip(t)).join('<span class="text-indigo-500 font-bold" >→</span>')}</div>`;
        explica = "Suma los saltos: lo que falta hasta el siguiente peso y luego hasta el billete.";
    } else if (reto.clase === "por") {
        caja.innerHTML = `<div class="repetido-dinero flex flex-wrap items-center justify-center gap-1">${Array.from({ length: reto.n }, () => chip(pesos(reto.precio))).join('<span class="text-indigo-500 font-bold">+</span>')}</div>`;
        explica = `${reto.n} veces el mismo precio: suma los pesos por un lado y los centavos por otro.`;
    } else {
        caja.innerHTML = pregunta.opciones.map((o) => `<div class="tira-decimal flex items-center gap-2"><span class="w-12 text-right font-bold text-indigo-900">${o.etiqueta}</span>` +
            `<span class="flex-1 h-5 bg-gray-100 border border-indigo-200 rounded overflow-hidden"><span class="block h-full bg-indigo-400" style="width:${o.valor}%"></span></span></div>`).join("");
        explica = "Cada tira es un entero (un peso). La más llena es el número más grande.";
    }
    document.getElementById("help-explain").innerText = explica;
    document.getElementById("help-visual-container").replaceChildren(caja);
}
