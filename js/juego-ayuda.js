// La ayuda que se toca: el rectángulo de filas y columnas.
//
// Salió de index.html (Hito 7.7) tal cual, sin cambiar lo que hace. Es un script
// clásico que solo declara: lo que lee o guarda vive dentro de funciones, que
// se llaman cuando el principal ya cargó (ver pruebas/archivos.spec.mjs).

// --- AYUDA QUE SE TOCA (issue #63) ---
//
// Como con material concreto: se ponen y quitan filas, se parte el
// rectángulo en dos (7 × 8 = 5 × 8 + 2 × 8) tocando una fila, y se
// gira. El total se escribe y se dice al momento. El de la pregunta
// misma, no: sale «?» y lo cuenta el niño; si no, la ayuda daría la
// respuesta. Partida, sí da cada parte: sumarlas es lo que se aprende.
//
// Con teclado, sobre el rectángulo: flecha arriba quita una fila,
// abajo la pone, y izquierda o derecha mueven el corte.
const MAX_FILAS_AYUDA = 10;
let ayudaRect = null;   // { filas, columnas, corte }: corte = filas de la parte de arriba; 0, sin partir

/** Solo multiplicar: al dividir, lo que se busca es otra cosa, y los retos traen su dibujo. */
function ayudaManipulable() {
    return Boolean(pregunta) && !seDivide() && (pregunta.tipo === "mult" || pregunta.tipo === "problema");
}

function rectAyuda() {
    if (!ayudaRect) ayudaRect = { filas: ayudaGirada ? numB : numA, columnas: ayudaGirada ? numA : numB, corte: 0 };
    return ayudaRect;
}

function esRectDeLaPregunta({ filas, columnas }) {
    return (filas === numA && columnas === numB) || (filas === numB && columnas === numA);
}

/** Lo que dice el total: «6 × 8 = 48», «7 × 8 = ?» o «5 × 8 + 2 × 8 = 40 + 16 = ?». */
function totalAyuda(rect) {
    const { filas, columnas, corte } = rect;
    const todo = esRectDeLaPregunta(rect) ? "?" : String(filas * columnas);
    if (!corte) return `${filas} × ${columnas} = ${todo}`;
    const abajo = filas - corte;
    return `${corte} × ${columnas} + ${abajo} × ${columnas} = ${corte * columnas} + ${abajo * columnas} = ${todo}`;
}

/** Lo mismo, para decirlo: «5 por 8 es 40, y 2 por 8 es 16. Súmalos…». */
function vozTotalAyuda(rect) {
    const { filas, columnas, corte } = rect;
    const deLaPregunta = esRectDeLaPregunta(rect);
    if (!corte) return deLaPregunta ? `${filas} filas de ${columnas}. Cuéntalos.` : `${filas} por ${columnas} es ${filas * columnas}.`;
    const abajo = filas - corte;
    return `${corte} por ${columnas} es ${corte * columnas}, y ${abajo} por ${columnas} es ${abajo * columnas}. ` +
        (deLaPregunta ? "Súmalos y sabrás cuánto es todo junto." : `Todo junto, ${filas * columnas}.`);
}

/** Las filas que hay que poner o quitar para volver a la pregunta. */
function textoAyudaTocada(rect) {
    const { filas, columnas, corte } = rect;
    const meta = columnas === numB ? numA : numB;
    if (esRectDeLaPregunta(rect)) {
        return `Partido en dos: ${corte} ${corte === 1 ? "fila" : "filas"} de ${columnas} y ${filas - corte} ${filas - corte === 1 ? "fila" : "filas"} de ${columnas}. Suma las dos partes.`;
    }
    const falta = meta - filas;
    const n = Math.abs(falta);
    return `Ahora hay ${filas} ${filas === 1 ? "fila" : "filas"} de ${columnas}. ${falta > 0 ? "Pon" : "Quita"} ${n} ${n === 1 ? "fila" : "filas"} y vuelves a ${numA} × ${numB}.`;
}

function pintarControlesAyuda(manipulable, rect) {
    document.getElementById("ayuda-total").classList.toggle("hidden", !manipulable);
    document.querySelectorAll("#ayuda-controles .btn-ayuda").forEach((b) => b.classList.toggle("hidden", !manipulable));
    if (!manipulable) return;
    document.getElementById("btn-quitar-fila").disabled = rect.filas <= 1;
    document.getElementById("btn-poner-fila").disabled = rect.filas >= MAX_FILAS_AYUDA;
    const partir = document.getElementById("btn-partir");
    partir.textContent = rect.corte ? "Juntar" : "Partir";
    partir.disabled = rect.filas < 2;
}

/** El rectángulo se toca (una fila: partir ahí) y se maneja con flechas. */
function hacerTocable(rejilla, rect) {
    rejilla.id = "ayuda-rect";
    rejilla.tabIndex = 0;
    rejilla.setAttribute("role", "group");
    rejilla.setAttribute("aria-label", `Rectángulo de ${rect.filas} filas de ${rect.columnas}. ` +
        "Flecha arriba quita una fila y flecha abajo la pone; izquierda y derecha mueven el corte.");
    rejilla.classList.add("cursor-pointer", "touch-manipulation");
    rejilla.addEventListener("click", (e) => {
        const f = filaTocada(rejilla, e);
        if (f === null) return;
        const r = rectAyuda();
        partirAyuda(r.corte === f + 1 ? 0 : f + 1);
    });
    rejilla.addEventListener("keydown", (e) => {
        const r = rectAyuda();
        const acciones = {
            ArrowUp: () => cambiarFilasAyuda(-1),
            ArrowDown: () => cambiarFilasAyuda(1),
            ArrowLeft: () => partirAyuda(Math.max(0, r.corte - 1)),
            ArrowRight: () => partirAyuda(Math.min(r.filas - 1, r.corte + 1)),
        };
        if (!acciones[e.key]) return;
        e.preventDefault();
        acciones[e.key]();
    });
}

/** La fila más cercana al dedo: los puntos son chicos para atinarles. */
function filaTocada(rejilla, e) {
    const directa = e.target.closest?.(".punto");
    if (directa) return Number(directa.dataset.fila);
    let mejor = null;
    let distancia = Infinity;
    rejilla.querySelectorAll(".punto").forEach((p) => {
        const caja = p.getBoundingClientRect();
        const d = Math.abs(caja.top + caja.height / 2 - e.clientY);
        if (d < distancia) { distancia = d; mejor = Number(p.dataset.fila); }
    });
    return mejor;
}

/** Vuelve a dibujar tras tocarla, sin perder el foco, y dice el total. */
function repintarAyuda() {
    const conFoco = document.activeElement?.id === "ayuda-rect";
    generateHelpVisual();
    if (conFoco) document.getElementById("ayuda-rect")?.focus();
    callarVoz();
    speak(vozTotalAyuda(rectAyuda()));
}

function cambiarFilasAyuda(d) {
    if (!ayudaManipulable()) return;
    const r = rectAyuda();
    const filas = Math.min(MAX_FILAS_AYUDA, Math.max(1, r.filas + d));
    if (filas === r.filas) return;
    r.filas = filas;
    if (r.corte >= filas) r.corte = 0;
    sonar("toque");
    repintarAyuda();
}

function partirAyuda(corte) {
    if (!ayudaManipulable()) return;
    const r = rectAyuda();
    const nuevo = corte > 0 && corte < r.filas ? corte : 0;
    if (nuevo === r.corte) return;
    r.corte = nuevo;
    sonar("toque");
    repintarAyuda();
}

/** «Partir» corta tras la quinta fila (o por la mitad); «Juntar» lo deshace. */
function alternarCorteAyuda() {
    const r = rectAyuda();
    partirAyuda(r.corte ? 0 : (r.filas > 5 ? 5 : Math.floor(r.filas / 2)));
}

/** m/d de d·k: d filas de k puntos; las m primeras, en verde. */
/**
 * Tiras del mismo largo, cada una partida en partes iguales, con las
 * partes que se toman en verde: se VE que 1/2 y 2/4 ocupan lo mismo,
 * y cuál de varias es la más grande.
 */
function dibujarTiras(tiras) {
    document.getElementById("help-truco").innerText = pistaPara().texto;
    const { reto } = pregunta;
    document.getElementById("help-explain").innerText = pregunta.clase === "equivalente"
        ? `Todas las tiras miden lo mismo. ¿Cuál tiene tanto verde como ${textoFraccion(...tiras[0])}?`
        : pregunta.clase === "sumarDistinto"
            ? `Las partes de las dos primeras tiras son de distinto tamaño. La de abajo está partida en ${tiras[2][1]}: ¿cuántas de esas partes cubre lo verde de las dos juntas?`
        : pregunta.clase === "sumar"
            ? (reto.op === "+"
                ? "Las dos tiras están partidas igual. Junta lo verde de las dos: ¿cuántas partes son?"
                : `Quita ${reto.b} de las partes verdes: ¿cuántas quedan?`)
            : "Todas las tiras miden lo mismo. ¿Cuál tiene más verde?";
    const caja = document.createElement("div");
    caja.className = "bg-white border-2 border-indigo-100 rounded-xl p-3 space-y-2 w-full max-w-sm";
    caja.setAttribute("aria-hidden", "true");
    tiras.forEach(([m, d], i) => {
        const fila = document.createElement("div");
        // En equivalentes, la primera es la de la pregunta: separada.
        // En equivalentes, la primera es la de la pregunta; al sumar con
        // distinto denominador, la última es la vacía, para contar.
        const aparte = pregunta.clase === "equivalente" && i === 0 ? "pb-2 border-b-2 border-dashed border-indigo-200"
            : pregunta.clase === "sumarDistinto" && i === 2 ? "pt-2 border-t-2 border-dashed border-indigo-200" : "";
        fila.className = `tira flex items-center gap-2 ${aparte}`;
        const nombre = document.createElement("span");
        nombre.className = "w-12 text-right font-bold text-indigo-900";
        nombre.textContent = m === 0 ? `?/${d}` : textoFraccion(m, d);
        const barra = document.createElement("div");
        barra.className = "flex flex-1 h-6 border-2 border-indigo-300 rounded";
        for (let i = 0; i < d; i++) {
            const parte = document.createElement("span");
            parte.className = `flex-1 ${i < m ? "bg-green-600 parte-tomada" : "bg-gray-200"} ${i > 0 ? "border-l-2 border-white" : ""}`;
            barra.appendChild(parte);
        }
        fila.append(nombre, barra);
        caja.appendChild(fila);
    });
    document.getElementById("help-visual-container").replaceChildren(caja);
}

/**
 * D puntos en filas de d: las filas completas son el cociente, y lo
 * que no llena una fila, en naranja, es lo que sobra.
 */
function dibujarResiduo() {
    const { D, d, q, r } = pregunta.reto;
    document.getElementById("help-truco").innerText = pistaPara().texto;
    document.getElementById("help-explain").innerText =
        `${D} puntos en filas de ${d}. ¿Cuántas filas completas salen? Los que no llenan una fila, en naranja, son los que sobran.`;
    const rejilla = document.createElement("div");
    rejilla.className = "inline-grid gap-1 bg-white border-2 border-indigo-100 rounded-xl p-3";
    rejilla.style.gridTemplateColumns = `repeat(${d}, auto)`;
    rejilla.setAttribute("aria-hidden", "true");
    for (let i = 0; i < D; i++) {
        const f = Math.floor(i / d);
        const sobra = f >= q;
        const punto = document.createElement("span");
        punto.className = `punto block w-3 h-3 md:w-4 md:h-4 rounded-full ${sobra ? "bg-orange-600 punto-sobra" : f % 2 ? "bg-sky-600" : "bg-indigo-500"}`;
        if (f > 0) punto.style.marginTop = sobra ? "0.6rem" : "0.15rem";
        rejilla.appendChild(punto);
    }
    document.getElementById("help-visual-container").replaceChildren(rejilla);
}

function dibujarFraccion() {
    const { m, d, k } = pregunta.reto;
    document.getElementById("help-truco").innerText = pistaPara().texto;
    document.getElementById("help-explain").innerText =
        `${d * k} puntos en ${d} filas iguales: cada fila es un ${NOMBRE_PARTE[d][0]}. ` +
        (m === 1 ? "Cuenta los puntos de la fila verde." : `Cuenta los puntos de las ${m} filas verdes.`);
    const rejilla = document.createElement("div");
    rejilla.className = "inline-grid gap-1 bg-white border-2 border-indigo-100 rounded-xl p-3";
    rejilla.style.gridTemplateColumns = `repeat(${k}, auto)`;
    rejilla.setAttribute("aria-hidden", "true");
    for (let f = 0; f < d; f++) {
        for (let c = 0; c < k; c++) {
            const punto = document.createElement("span");
            const tomada = f < m;
            punto.className = `punto block w-3 h-3 md:w-4 md:h-4 rounded-full ${tomada ? "bg-green-600 punto-tomado" : "bg-gray-300"}`;
            if (c > 0 && c % 5 === 0) punto.style.marginLeft = "0.5rem";
            // Entre fila y fila, un poco de aire: cada fila es una parte.
            if (f > 0) punto.style.marginTop = "0.35rem";
            rejilla.appendChild(punto);
        }
    }
    document.getElementById("help-visual-container").replaceChildren(rejilla);
}

function girarAyuda() {
    ayudaGirada = !ayudaGirada;
    if (ayudaRect) ayudaRect = { filas: ayudaRect.columnas, columnas: ayudaRect.filas, corte: 0 };
    generateHelpVisual();
}
