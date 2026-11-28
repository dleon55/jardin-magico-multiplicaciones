// La pantalla de los retos con código.
//
// Salió de index.html (Hito 7.7) tal cual, sin cambiar lo que hace. Es un script
// clásico que solo declara: lo que lee o guarda vive dentro de funciones, que
// se llaman cuando el principal ya cargó (ver pruebas/archivos.spec.mjs).

// --- RETOS CON CÓDIGO (js/retos.js) ---
//
// Crear un reto es jugarlo: al terminar, el código lleva la marca. Quien
// lo recibe (por el enlace o escribiendo el código) juega las mismas diez
// preguntas y, al terminar, tiene su propio código para la revancha.
const piezaReto = (id) => document.getElementById(`reto-${id}`);

/** Las tablas de un reto nuevo: las que ya se empezaron (o la del 2). */
function tablasParaCrearReto() {
    const empezadas = RETO_TABLAS.filter((n) => tablaYaJugada(n));
    return empezadas.length ? empezadas : [2];
}

function verParteDeReto(parte) {
    for (const p of ["inicio", "juego", "fin"]) piezaReto(p).classList.toggle("hidden", p !== parte);
    // La explicación es para elegir qué hacer; al jugar y al terminar solo estorba.
    piezaReto("intro").classList.toggle("hidden", parte !== "inicio");
}

/** La pantalla de retos; con `codigo`, el que llegó en un enlace. */
function mostrarRetos(codigo = "") {
    initAudio();
    cancelarEspera();
    callarVoz();
    retoEnJuego = null;
    mostrarPantalla("screen-reto");
    verParteDeReto("inicio");
    piezaReto("cuenta").textContent = "";
    piezaReto("error").textContent = "";
    piezaReto("crear-detalle").textContent = `Diez multiplicaciones de ${tablasDeReto(tablasParaCrearReto())}.`;
    const leido = codigo ? leerCodigoDeReto(codigo) : null;
    piezaReto("codigo").value = leido ? codigoALaVista(leido.codigo) : codigo;
    const llego = piezaReto("llego");
    llego.classList.toggle("hidden", !leido);
    llego.textContent = leido ? `¡Te llegó un reto! Son diez multiplicaciones de ${tablasDeReto(leido.tablas)}. La marca a vencer: ${leido.marca} de ${RETO_PREGUNTAS}.` : "";
    if (codigo && !leido) piezaReto("error").textContent = "El código del enlace no es de un reto. Pide que te lo manden otra vez.";
    // Con un reto recibido, jugarlo va primero; si no, crear uno.
    const crear = document.getElementById("reto-crear");
    const formulario = piezaReto("form");
    if (leido) crear.before(formulario); else formulario.before(crear);
    // Sin voz aquí: al llegar por un enlace, el saludo de la bienvenida está sonando.
    if (leido) document.getElementById("btn-reto-codigo").focus({ preventScroll: true });
}

function empezarRetoNuevo() {
    empezarReto({ tablas: tablasParaCrearReto(), semilla: entre(0, RETO_SEMILLAS - 1), marca: null });
}

/** «Jugar ese reto»: con el código escrito. */
function jugarCodigoDeReto(evento) {
    evento?.preventDefault();
    const leido = leerCodigoDeReto(piezaReto("codigo").value);
    if (!leido) {
        piezaReto("error").textContent = "Ese código no es de un reto. Revísalo signo por signo: son 6 letras y números.";
        piezaReto("codigo").focus();
        return;
    }
    empezarReto(leido);
}

/** `marca`: la que hay que vencer, o null si el reto es nuevo. */
function empezarReto({ tablas, semilla, marca }) {
    retoEnJuego = { tablas, semilla, marca, preguntas: preguntasDeReto(tablas, semilla), n: 0, bien: 0, paso: "pregunta" };
    verParteDeReto("juego");
    siguientePreguntaDeReto();
}

function siguientePreguntaDeReto() {
    const r = retoEnJuego;
    if (!r || r.paso === "fin") return;
    if (r.n >= RETO_PREGUNTAS) { terminarReto(); return; }
    const pregunta = r.preguntas[r.n];
    r.n++;
    r.paso = "pregunta";
    piezaReto("cuenta").textContent = `Pregunta ${r.n} de ${RETO_PREGUNTAS}`;
    piezaReto("nota").textContent = "";
    piezaReto("sigue").classList.add("hidden");
    const caja = piezaReto("pregunta");
    caja.textContent = pregunta.texto;
    piezaReto("opciones").replaceChildren(...pregunta.opciones.map((valor) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "reto-opcion bubble-font bg-white hover:bg-sky-50 border-4 border-sky-200 text-gray-900 text-3xl rounded-2xl shadow-md px-3 py-4 min-h-11";
        b.dataset.valor = String(valor);
        b.textContent = String(valor);
        b.onclick = () => responderReto(valor, b);
        return b;
    }));
    caja.focus({ preventScroll: true });
    speak(textoParaVoz(pregunta.texto));
}

/** Una sola oportunidad por pregunta: así la marca dice algo. */
function responderReto(valor, boton) {
    const r = retoEnJuego;
    if (!r || r.paso !== "pregunta") return;
    r.paso = "respondida";
    const pregunta = r.preguntas[r.n - 1];
    const acerto = valor === pregunta.respuesta;
    for (const b of piezaReto("opciones").querySelectorAll("button")) {
        b.disabled = true;
        if (Number(b.dataset.valor) === pregunta.respuesta) b.classList.add("ensenar-buena");
    }
    if (acerto) {
        r.bien++;
        ganarEstrellas(1);
        avanzarMision("acierto");
        sonar("acierto");
    } else boton.classList.add("ensenar-mala");
    const nota = acerto ? `¡Bien! ${pregunta.texto} = ${pregunta.respuesta}.`
        : `Era ${pregunta.respuesta}: ${pregunta.a} × ${pregunta.b} son ${pregunta.a === 1 ? "1 fila" : `${pregunta.a} filas`} de ${pregunta.b}.`;
    piezaReto("nota").textContent = nota;
    const sigue = piezaReto("sigue");
    sigue.textContent = r.n >= RETO_PREGUNTAS ? "Ver el resultado" : "Siguiente";
    sigue.classList.remove("hidden");
    sigue.focus();
    speak(textoParaVoz(nota));
}

function terminarReto() {
    const r = retoEnJuego;
    r.paso = "fin";
    r.codigo = codigoDeReto({ tablas: r.tablas, semilla: r.semilla, marca: r.bien });
    anotarActividad("retos", r.marca === null ? { creados: 1, aciertos: r.bien, preguntas: RETO_PREGUNTAS }
        : { recibidos: 1, superados: r.bien > r.marca ? 1 : 0, aciertos: r.bien, preguntas: RETO_PREGUNTAS });
    verParteDeReto("fin");
    piezaReto("cuenta").textContent = "";
    const resultado = `Hiciste ${r.bien} de ${RETO_PREGUNTAS}`;
    const comparacion = r.marca === null ? "Tu marca va en el código. ¡A ver quién la vence!"
        : r.bien > r.marca ? `¡Superaste la marca de ${r.marca}!`
        : r.bien === r.marca ? `¡Empate! La marca también era ${r.marca}.`
        : `La marca era ${r.marca}. ¡Pide la revancha!`;
    piezaReto("resultado").textContent = resultado;
    piezaReto("comparacion").textContent = comparacion;
    piezaReto("estrellas").textContent = r.bien ? `Ganaste ${r.bien === 1 ? "1 estrella" : `${r.bien} estrellas`}.` : "";
    const propio = piezaReto("codigo-propio");
    propio.textContent = codigoALaVista(r.codigo);
    propio.setAttribute("aria-label", r.codigo.split("").join(" "));
    piezaReto("copiado").textContent = "";
    // «Compartir» solo donde el aparato lo ofrece; «Copiar enlace» ocupa entonces todo el ancho.
    const puedeCompartir = typeof navigator.share === "function";
    document.getElementById("btn-reto-compartir").classList.toggle("hidden", !puedeCompartir);
    document.getElementById("btn-reto-copiar").classList.toggle("col-span-2", !puedeCompartir);
    lumi("lumi-reto", r.marca !== null && r.bien < r.marca ? "animando" : "celebrando");
    piezaReto("resultado").focus({ preventScroll: true });
    speak(`${resultado}. ${comparacion}`);
}

/** El mensaje para mandar: el reto y la marca, sin nombres. */
function textoDeReto() {
    const r = retoEnJuego;
    return `¡Te reto en el Jardín Mágico! Hice ${r.bien} de ${RETO_PREGUNTAS} en ${tablasDeReto(r.tablas)}. Código: ${codigoALaVista(r.codigo)}`;
}

async function copiarReto() {
    if (retoEnJuego?.paso !== "fin") return;
    const aviso = piezaReto("copiado");
    try {
        await navigator.clipboard.writeText(`${textoDeReto()}\n${enlaceDeReto(retoEnJuego.codigo)}`);
        aviso.textContent = "Copiado. Pégalo en un mensaje.";
    } catch (e) {
        aviso.textContent = `No se pudo copiar. Dicta el código: ${codigoALaVista(retoEnJuego.codigo)}.`;
    }
}

async function compartirReto() {
    if (retoEnJuego?.paso !== "fin") return;
    try {
        await navigator.share({ title: "Reto del Jardín Mágico", text: textoDeReto(), url: enlaceDeReto(retoEnJuego.codigo) });
    } catch (e) { /* se cerró la hoja de compartir: no pasa nada */ }
}

/** El enlace del reto como código QR, en grande: para proyectarlo y abrirlo con la cámara. */
function abrirQRDeReto() {
    const r = retoEnJuego;
    if (r?.paso !== "fin") return;
    const dibujo = document.getElementById("qr-dibujo");
    dibujo.innerHTML = svgQR(enlaceDeReto(r.codigo));
    dibujo.setAttribute("aria-label", `Código QR con el enlace del reto ${r.codigo.split("").join(" ")}`);
    document.getElementById("qr-detalle").textContent = `Diez multiplicaciones de ${tablasDeReto(r.tablas)}. La marca a vencer: ${r.bien} de ${RETO_PREGUNTAS}. Apunta la cámara al código.`;
    document.getElementById("qr-codigo").textContent = codigoALaVista(r.codigo);
    document.getElementById("qr-fondo").classList.remove("hidden");
    qrAbierto = true;
    document.getElementById("qr-titulo").focus({ preventScroll: true });
}

function cerrarQRDeReto(devolverFoco = true) {
    if (!qrAbierto) return;
    qrAbierto = false;
    document.getElementById("qr-fondo").classList.add("hidden");
    if (devolverFoco) document.getElementById("btn-reto-qr").focus({ preventScroll: true });
}

/**
 * La hoja del reto, para imprimir: el QR y el código para quien tiene
 * aparato, y las diez preguntas con su renglón para quien no. Sin
 * respuestas, y sin nombres ni datos de quien lo creó.
 */
function armarHojaDeReto(r) {
    const el = (tag, texto, clase) => {
        const e = document.createElement(tag);
        if (clase) e.className = clase;
        if (texto !== undefined) e.textContent = texto;
        return e;
    };
    const cabecera = el("header");
    cabecera.append(el("h1", "Reto del Jardín Mágico"),
        el("p", `Diez multiplicaciones de ${tablasDeReto(r.tablas)}. La marca a vencer: ${r.bien} de ${RETO_PREGUNTAS}.`, "informe-quien"));
    const entrada = el("section", undefined, "hoja-entrada");
    const qr = el("div", undefined, "hoja-qr");
    qr.innerHTML = svgQR(enlaceDeReto(r.codigo));
    const como = el("div");
    como.append(el("h2", "Con un teléfono o una tableta"),
        el("p", "Apunta la cámara al código QR, o abre el juego, entra a «Retos con código» y escribe:"),
        el("p", codigoALaVista(r.codigo), "hoja-codigo"),
        el("p", enlaceDeReto(r.codigo), "hoja-enlace"));
    entrada.append(qr, como);
    const papel = el("section");
    const lista = el("ol", undefined, "hoja-preguntas");
    for (const pregunta of r.preguntas) lista.append(el("li", `${pregunta.texto} = ______`));
    papel.append(el("h2", "En papel"), el("p", "Nombre: ______________________________    Aciertos: ____ de 10"), lista);
    return [cabecera, entrada, papel,
        el("footer", "Son las mismas diez preguntas que salen en el juego con este código. La hoja no lleva las respuestas ni datos de quien creó el reto.")];
}

function imprimirHojaDeReto() {
    const r = retoEnJuego;
    if (r?.paso !== "fin") return;
    document.getElementById("informe").replaceChildren(...armarHojaDeReto(r));
    document.body.classList.add("imprimiendo");
    window.print();
}

/** Las mismas diez, contra la misma marca. */
function repetirReto() {
    if (retoEnJuego?.paso !== "fin") return;
    empezarReto(retoEnJuego);
}
