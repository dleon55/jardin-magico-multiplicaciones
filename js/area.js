// PERÍMETRO Y ÁREA (issue #71): el tercer tema nuevo de la Fase 3.
//
// Enlaza con el rectángulo de la ayuda de las tablas: un huerto de 7 × 4
// metros son 7 filas de 4 cuadritos de un metro. Tres clases, para elegir:
//   área       los cuadritos de adentro: largo × ancho;
//   perímetro  la orilla: la suma de los cuatro lados;
//   lado       conocida el área y un lado, el otro (se divide).
// Las falsas son los errores típicos, cada uno explicado: confundir área y
// perímetro, sumar solo dos lados, olvidar uno, restar en lugar de dividir.
//
// Es un script clásico que solo declara (ver pruebas/archivos.spec.mjs).

const LUGARES_AREA = ["un huerto", "un jardín", "un corral", "un estanque", "una cancha", "un patio"];

/** Diez preguntas: cuatro de área, tres de perímetro y tres de un lado, sin repetir. */
function bolsaDeArea() {
    const [lo, hi] = parejasConocidas().length >= MIN_CONOCIDAS ? [2, 9] : [2, 5];
    const clases = barajar(["area", "area", "area", "area", "perimetro", "perimetro", "perimetro", "lado", "lado", "lado"]);
    const vistas = new Set();
    return clases.map((clase, i) => {
        let reto;
        let intentos = 0;
        do { reto = crearRetoArea(clase, lo, hi, i); } while (vistas.has(`${reto.clase}${reto.a}x${reto.b}`) && ++intentos < 30);
        vistas.add(`${reto.clase}${reto.a}x${reto.b}`);
        return { a: reto.a, b: reto.b, reto };
    });
}

/**
 * Largo a y ancho b. Se evitan los rectángulos en que área y perímetro dan
 * el mismo número (4 × 4 y 3 × 6): ahí la confusión no se notaría.
 */
function crearRetoArea(clase, lo, hi, i = 0) {
    let a, b;
    do { a = entre(lo, hi); b = entre(2, hi); } while (a * b === 2 * (a + b) || a === b);
    return { clase, a, b, lugar: LUGARES_AREA[i % LUGARES_AREA.length] };
}

function armarArea(reto) {
    const { clase, a, b, lugar } = reto;
    const area = a * b, perimetro = 2 * (a + b);
    const falsas = [];
    const anadir = (x, porQue, vale) => {
        if (!Number.isInteger(x) || x < 1 || x === vale || falsas.some((f) => f.x === x) || falsas.length >= 3) return;
        falsas.push({ x, porQue });
    };
    const Lugar = lugar[0].toUpperCase() + lugar.slice(1);
    let p;
    if (clase === "area") {
        anadir(perimetro, `${perimetro} es la orilla (el perímetro: ${a} + ${b} + ${a} + ${b}). El área son los cuadritos de adentro.`, area);
        anadir(a + b, `Sumaste los lados: ${a} + ${b} = ${a + b}. El área se multiplica: ${a} filas de ${b} cuadritos.`, area);
        anadir(a * (b + 1), `Contaste una fila de más: ${a} × ${b + 1} = ${a * (b + 1)}.`, area);
        anadir(a * (b - 1), `Te faltó una fila: ${a} × ${b - 1} = ${a * (b - 1)}.`, area);
        anadir((a + 1) * b, `Contaste una columna de más: ${a + 1} × ${b} = ${(a + 1) * b}.`, area);
        p = { respuesta: area, unidad: "m²",
            texto: `${Lugar} mide ${a} m de largo y ${b} m de ancho. ¿Cuál es su área?`,
            pista: `El área son los cuadritos de un metro que caben adentro: ${a} filas de ${b}, como el rectángulo de la ayuda de las tablas.`,
            explicacion: `El área es ${a} × ${b} = ${area} m²: ${area} cuadritos de un metro.` };
    } else if (clase === "perimetro") {
        anadir(area, `${area} son los cuadritos de adentro (el área). El perímetro es la orilla: ${a} + ${b} + ${a} + ${b}.`, perimetro);
        anadir(a + b, `Sumaste solo dos lados: ${a} + ${b} = ${a + b}. La orilla da la vuelta completa: son cuatro lados.`, perimetro);
        anadir(2 * a + b, `Te faltó un lado: ${a} + ${b} + ${a} = ${2 * a + b}. Falta otro de ${b}.`, perimetro);
        anadir(a + 2 * b, `Te faltó un lado: ${a} + ${b} + ${b} = ${a + 2 * b}. Falta otro de ${a}.`, perimetro);
        p = { respuesta: perimetro, unidad: "m",
            texto: `${Lugar} mide ${a} m de largo y ${b} m de ancho. ¿Cuánto mide su orilla (el perímetro)?`,
            pista: `La orilla da toda la vuelta: dos lados de ${a} y dos de ${b}.`,
            explicacion: `El perímetro es ${a} + ${b} + ${a} + ${b} = ${perimetro} m.` };
    } else {
        anadir(area - a, `Restaste: ${area} − ${a} = ${area - a}. El área es lado × lado, así que se divide: ${area} ÷ ${a}.`, b);
        anadir(a, `${a} m es el lado que ya sabías. Busca el otro: ${a} × ? = ${area}.`, b);
        anadir(b + 1, `${a} × ${b + 1} = ${a * (b + 1)}, que se pasa de ${area}.`, b);
        anadir(b - 1, `${a} × ${b - 1} = ${a * (b - 1)}, que no llega a ${area}.`, b);
        anadir(area, `${area} m² es el área, no un lado. El lado que falta es ${area} ÷ ${a}.`, b);
        anadir(b + 2, `${a} × ${b + 2} = ${a * (b + 2)}, que se pasa de ${area}.`, b);
        p = { respuesta: b, unidad: "m",
            texto: `${Lugar} tiene ${area} m² de área y un lado de ${a} m. ¿Cuánto mide el otro lado?`,
            pista: `Área = lado × lado. Piensa: ${a} × ? = ${area}. Es una división: ${area} ÷ ${a}.`,
            explicacion: `El otro lado mide ${area} ÷ ${a} = ${b} m, porque ${a} × ${b} = ${area}.` };
    }
    const tres = falsas.slice(0, 3);
    return {
        tipo: "area", clase, reto, a, b, ...p,
        voz: p.texto.replace(/ m²/g, " metros cuadrados").replace(/ m\b/g, " metros"),
        opciones: barajar([p.respuesta, ...tres.map((f) => f.x)]).map((v) => ({ valor: v, etiqueta: `${v} ${p.unidad}` })),
        porQue: Object.fromEntries(tres.map((f) => [f.x, f.porQue])),
    };
}

/**
 * La ayuda: el rectángulo en cuadritos de un metro, con la medida de cada
 * lado. En el perímetro se resalta la orilla; en «un lado», el lado que
 * falta lleva «?» y los cuadritos se ven en filas del lado que se sabe.
 */
function dibujarArea() {
    const { reto, clase } = pregunta;
    const { a, b } = reto;
    document.getElementById("help-truco").innerText = pistaPara().texto;
    document.getElementById("help-explain").innerText = clase === "perimetro"
        ? "La orilla, en naranja: suma los cuatro lados."
        : clase === "lado" ? `${a * b} cuadritos en filas de ${a}: ¿cuántas filas hay?`
        : "Cada cuadrito es un metro por lado: cuéntalos fila a fila.";
    // c: el cuadrito; mx y my: márgenes para las medidas (a los lados el
    // texto, como «9 m», necesita más sitio que arriba y abajo).
    const c = 22, mx = 44, my = 26;
    const ancho = a * c + 2 * mx, alto = b * c + 2 * my;
    let celdas = "";
    for (let f = 0; f < b; f++) {
        for (let k = 0; k < a; k++) {
            celdas += `<rect class="cuadrito-area" x="${mx + k * c}" y="${my + f * c}" width="${c}" height="${c}" fill="${clase === "perimetro" ? "#f8fafc" : f % 2 ? "#c7d2fe" : "#e0e7ff"}" stroke="#a5b4fc" stroke-width="1"/>`;
        }
    }
    const orilla = clase === "perimetro" ? "#ea580c" : "#4338ca";
    const lado = clase === "lado" ? "?" : `${b} m`;
    const medida = (x, y, texto, ancla = "middle") => `<text class="medida-area" x="${x}" y="${y}" text-anchor="${ancla}" font-size="14" font-weight="700" fill="#1e1b4b">${texto}</text>`;
    const svg = `<svg viewBox="0 0 ${ancho} ${alto}" width="${Math.min(ancho, 300)}" aria-hidden="true" focusable="false" class="dibujo-area max-w-full h-auto">
        ${celdas}
        <rect class="orilla-area" x="${mx}" y="${my}" width="${a * c}" height="${b * c}" fill="none" stroke="${orilla}" stroke-width="${clase === "perimetro" ? 5 : 2.5}" stroke-linejoin="round"/>
        ${medida(mx + (a * c) / 2, my - 8, `${a} m`)}
        ${medida(mx - 8, my + (b * c) / 2 + 5, lado, "end")}
        ${clase === "perimetro" ? medida(mx + (a * c) / 2, my + b * c + 18, `${a} m`) + medida(mx + a * c + 8, my + (b * c) / 2 + 5, `${b} m`, "start") : ""}
    </svg>`;
    const caja = document.createElement("div");
    caja.className = "bg-white border-2 border-indigo-100 rounded-xl p-2 flex justify-center";
    caja.setAttribute("aria-hidden", "true");
    caja.innerHTML = svg;
    document.getElementById("help-visual-container").replaceChildren(caja);
}
