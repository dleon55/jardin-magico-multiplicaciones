// El camino y las operaciones de cada mundo de la Aventura.
//
// Salió de index.html (Hito 7.7) tal cual, sin cambiar lo que hace. Es un script
// clásico que solo declara: lo que lee o guarda vive dentro de funciones, que
// se llaman cuando el principal ya cargó (ver pruebas/archivos.spec.mjs).

// --- EL CAMINO (issue #46) ---
//
// Un solo camino une el jardín y la Aventura: las tablas en el orden en
// que se aprenden y, después de las suyas, cada mundo. Un mundo se abre
// al saberse sus tablas (arbolito o más) y, como siempre, al vencer al
// jefe del anterior. El primero está abierto desde el principio, para
// probar la Aventura el primer día. Lo ya jugado de un mundo nunca se
// cierra: nadie pierde su avance.
const CAMINO = [
    { tabla: 2 }, { tabla: 5 }, { mundo: 0 },
    { tabla: 3 }, { tabla: 4 }, { tabla: 9 }, { tabla: 6 }, { mundo: 1 },
    { tabla: 7 }, { tabla: 8 }, { mundo: 2 },
    { tabla: 1 }, { mundo: 3 }, { mundo: 4 }, { mundo: 5 },
];

function tablaSabida(n) {
    return ESTATUS.indexOf(estatusTabla(n)) >= ESTATUS.indexOf("arbolito");
}

/** Las tablas que pide un mundo: las suyas; dividir y fracciones, todas. */
function tablasDelMundo(mi) {
    if (mi === 0) return [];
    return AVENTURA_MUNDOS[mi].tablas || [2, 3, 4, 5, 6, 7, 8, 9];
}

function yaJugoMundo(mi) {
    return Object.keys(aventuraGuardada.estrellas).some((k) => k.startsWith(`${mi}-`));
}

/** Las tablas que faltan para abrir el mundo (vacío si ya se puede). */
function faltanParaMundo(mi) {
    if (yaJugoMundo(mi)) return [];
    return tablasDelMundo(mi).filter((n) => n <= TABLAS && !tablaSabida(n));
}

function nivelDisponible(mi, n) {
    return indiceNivel(mi, n) <= aventuraGuardada.alcanzado && faltanParaMundo(mi).length === 0;
}

// (listaTablas, la del diagnóstico: «la del 3, la del 4 y la del 6».)

/** Cómo está un tramo: hecho, abierto o cerrado (con el motivo). */
function estadoTramo(t) {
    if (t.tabla) {
        return tablaSabida(t.tabla) ? { estado: "hecho", texto: "¡Te la sabes!" }
            : { estado: "abierto", texto: tablaYaJugada(t.tabla) ? "Practícala hasta sabértela" : "Nueva: descúbrela" };
    }
    const mi = t.mundo;
    const jefe = (aventuraGuardada.estrellas[claveNivel(mi, NIVELES_POR_MUNDO - 1)] || 0) > 0;
    if (jefe) return { estado: "hecho", texto: "¡Venciste al jefe!" };
    const faltan = faltanParaMundo(mi);
    if (faltan.length) return { estado: "cerrado", texto: `Se abre cuando sepas ${listaTablas(faltan)}` };
    if (indiceNivel(mi, 0) > aventuraGuardada.alcanzado) return { estado: "cerrado", texto: `Se abre al vencer al jefe del mundo ${mi}` };
    return { estado: "abierto", texto: "¡Abierto! Ve a la Aventura" };
}

/** El primer tramo sin hacer que se puede jugar, o null si todo está hecho. */
function tramoActual() {
    return CAMINO.find((t) => estadoTramo(t).estado === "abierto") || null;
}

function nombreTramo(t) {
    return t.tabla ? `Tabla del ${t.tabla}` : `Mundo ${t.mundo + 1}: ${AVENTURA_MUNDOS[t.mundo].nombre}`;
}

function mostrarCamino() {
    cancelarEspera();
    callarVoz();
    pintarCamino();
    mostrarPantalla("screen-camino");
}

function pintarCamino() {
    const actual = tramoActual();
    const hechos = CAMINO.filter((t) => estadoTramo(t).estado === "hecho").length;
    document.getElementById("camino-resumen").textContent = hechos === CAMINO.length
        ? `¡Recorriste el camino entero: ${hechos} de ${CAMINO.length} tramos!`
        : `Llevas ${hechos} de ${CAMINO.length} tramos.`;
    const lista = document.getElementById("camino-tramos");
    lista.replaceChildren(...CAMINO.map((t) => {
        const { estado, texto } = estadoTramo(t);
        const li = document.createElement("li");
        const esActual = t === actual;
        li.className = `tramo tramo-${estado}${esActual ? " tramo-actual" : ""}`;
        li.dataset.tramo = t.tabla ? `tabla-${t.tabla}` : `mundo-${t.mundo}`;
        li.dataset.estado = estado;
        const caja = document.createElement(estado === "cerrado" ? "div" : "button");
        caja.className = "tramo-caja";
        if (estado !== "cerrado") {
            caja.type = "button";
            caja.onclick = () => t.tabla ? elegirTabla(t.tabla) : mostrarAventura();
        }
        const dibujo = document.createElement("span");
        dibujo.className = "tramo-dibujo";
        dibujo.setAttribute("aria-hidden", "true");
        dibujo.innerHTML = t.tabla
            ? svgEstatus(estatusTabla(t.tabla) || "semilla")
            : estado === "cerrado" ? icono("candado") : svgEnemigo(t.mundo);
        const textos = document.createElement("span");
        textos.className = "flex-1 min-w-0";
        const nombre = document.createElement("span");
        nombre.className = "block font-bold text-sm text-green-900";
        nombre.textContent = nombreTramo(t);
        const detalle = document.createElement("span");
        detalle.className = "tramo-texto block text-xs text-gray-700";
        detalle.textContent = esActual ? `Te toca. ${texto}` : texto;
        textos.append(nombre, detalle);
        caja.append(dibujo, textos);
        li.appendChild(caja);
        return li;
    }));
}

function actualizarResumenCamino() {
    const el = document.getElementById("camino-menu-resumen");
    if (!el) return;
    const hechos = CAMINO.filter((t) => estadoTramo(t).estado === "hecho").length;
    const actual = tramoActual();
    el.textContent = actual ? `${hechos} de ${CAMINO.length} tramos · Ahora: ${nombreTramo(actual)}` : `${hechos} de ${CAMINO.length} tramos`;
}

function mostrarAventura() {
    cancelarEspera();
    callarVoz();
    detenerAventura();
    pintarAventura();
    mostrarPantalla("screen-aventura");
}

function pintarAventura() {
    const g = aventuraGuardada;
    const m = Math.floor(g.alcanzado / NIVELES_POR_MUNDO);
    document.getElementById("aventura-resumen").textContent =
        `Puntaje: ${puntajeAventura()} · Estrellas de nivel: ${estrellasAventura()} de ${AVENTURA_MUNDOS.length * NIVELES_POR_MUNDO * 3} · Vas en el mundo ${m + 1}. Cada estrella que ganas va a tus estrellas del vivero.`;
    pintarFichas(document.querySelector("#screen-aventura .elegir-heroe"),
        HEROES.map((h) => ({ valor: h.emoji, emoji: svgHeroe(h.emoji), texto: { visible: false, valor: h.nombre } })), g.heroe);
    document.querySelectorAll('#screen-aventura input[name="heroe"]').forEach((i) => {
        i.addEventListener("change", () => { aventuraGuardada.heroe = i.value; guardarAventura(); });
    });
    pintarSinPrisa();
    // Compartir un puntaje de 0 no tiene sentido: aparece al ganar algo.
    document.getElementById("btn-compartir").classList.toggle("hidden", puntajeAventura() === 0);
    const lista = document.getElementById("aventura-mundos");
    lista.replaceChildren(...AVENTURA_MUNDOS.map((mundo, mi) => {
        const li = document.createElement("li");
        const abierto = nivelDisponible(mi, 0);
        const faltan = faltanParaMundo(mi);
        li.className = `mundo-aventura rounded-2xl border-2 p-3 ${abierto ? "bg-white border-indigo-200" : "bg-gray-100 border-gray-200"}`;
        li.dataset.mundo = String(mi);
        const titulo = document.createElement("h3");
        titulo.className = "font-bold text-indigo-900 flex items-center gap-2";
        titulo.innerHTML = `<span aria-hidden="true" class="text-2xl titulo-mundo-arte">${abierto ? svgEnemigo(mi) : icono("candado")}</span>`;
        const t = document.createElement("span");
        t.textContent = `${mi + 1}. ${mundo.nombre}`;
        titulo.appendChild(t);
        const retos = document.createElement("p");
        retos.className = "text-sm text-gray-700";
        retos.textContent = abierto ? mundo.retos
            : faltan.length ? `${mundo.retos} · Se abre cuando sepas ${listaTablas(faltan)} en el jardín`
            : `${mundo.retos} · Se abre al vencer al jefe del mundo ${mi}`;
        const niveles = document.createElement("div");
        niveles.className = "grid grid-cols-4 gap-2 mt-2";
        for (let n = 0; n < NIVELES_POR_MUNDO; n++) {
            const b = document.createElement("button");
            b.type = "button";
            const disponible = nivelDisponible(mi, n);
            const est = g.estrellas[claveNivel(mi, n)] || 0;
            b.disabled = !disponible;
            b.dataset.nivel = claveNivel(mi, n);
            // Lo cerrado se distingue por la forma (borde punteado y candado),
            // no por desvanecerse: antes, gris claro sobre gris, casi no se leía.
            b.className = "btn-nivel rounded-xl border-2 py-2 text-sm font-bold disabled:cursor-not-allowed " +
                (disponible ? "bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-900" : "bg-white border-dashed border-gray-400 text-gray-700");
            const estrellas = `<span class="estrellas-nivel text-base leading-none tracking-wide"><span class="text-amber-600">${"★".repeat(est)}</span><span class="text-gray-500">${"☆".repeat(3 - est)}</span></span>`;
            b.innerHTML = `<span>${n === NIVELES_POR_MUNDO - 1 ? `${icono("corona")} Jefe` : n + 1}</span><span class="block" aria-hidden="true">${disponible ? estrellas : icono("candado")}</span>`;
            b.setAttribute("aria-label", `${mundo.nombre}, ${nombreNivel(n)}: ${disponible ? `${est} de 3 estrellas` : "cerrado"}`);
            b.onclick = () => empezarNivel(mi, n);
            niveles.appendChild(b);
        }
        li.append(titulo, retos, niveles);
        return li;
    }));
    actualizarResumenMenuAventura();
}

function actualizarResumenMenuAventura() {
    actualizarResumenCamino();
    const el = document.getElementById("aventura-menu-resumen");
    if (!el) return;
    const pts = puntajeAventura();
    el.textContent = pts > 0
        ? `Puntaje: ${pts} · Mundo ${Math.floor(aventuraGuardada.alcanzado / NIVELES_POR_MUNDO) + 1} de ${AVENTURA_MUNDOS.length}`
        : "Vence a los enemigos con tu varita mágica";
}

// --- Las operaciones de cada mundo ---
function operacionAventura(mi) {
    const mundo = AVENTURA_MUNDOS[mi];
    if (mundo.tipo === "div") {
        const d = entre(2, 9), q = entre(1, 10);
        return { texto: `${d * q} ÷ ${d}`, voz: `${d * q} entre ${d}`, respuesta: q, a: d, b: q };
    }
    if (mundo.tipo === "fraccion") {
        const d = entre(2, 6), k = entre(2, 9), m = entre(1, d - 1);
        return { texto: `${m}/${d} de ${d * k}`, voz: `${nombreFraccion(m, d)} de ${d * k}`, respuesta: m * k, a: d, b: k, m };
    }
    const a = azar(mundo.tablas), b = entre(1, 10);
    const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
    return { texto: `${x} × ${y}`, voz: `${x} por ${y}`, respuesta: x * y, a: x, b: y };
}

/** Qué tan difícil es el nivel: cuántos enemigos, cuántos a la vez y qué tan rápido. */
// SIN PRISA. Para quien se frustra o necesita pensar: los enemigos van
// a la mitad de velocidad, salen de dos en dos como mucho y se paran
// antes de llegar al héroe, esperando la respuesta. No se pierden
// corazones por tardar, así que el nivel siempre se puede terminar;
// el avance y las estrellas cuentan igual. Solo se pierde el premio
// por responder rápido: los récords se hacen con prisa.
const SIN_PRISA_ESPERA = 0.22;   // a qué distancia del centro se para el primero
const SIN_PRISA_FILA = 0.14;     // y cada uno de detrás, un poco más lejos: hacen fila

/** Dónde se para un enemigo sin prisa: tras los de su lado que van delante. */
function paradaSinPrisa(e) {
    const delante = aventura.enemigos.filter((o) => o !== e && o.lado === e.lado && Math.abs(o.x - 0.5) < Math.abs(e.x - 0.5)).length;
    return SIN_PRISA_ESPERA + SIN_PRISA_FILA * delante;
}

function configNivel(mi, n) {
    const base = AVENTURA_MUNDOS[mi].cruce;
    const c = n === NIVELES_POR_MUNDO - 1
        ? { enemigos: 4, simultaneos: 2, cruce: base * 0.9, jefe: true }
        : { enemigos: 6 + 2 * n, simultaneos: n === 0 ? 2 : 3, cruce: base * (1 - 0.12 * n), jefe: false };
    if (aventuraGuardada.sinPrisa) Object.assign(c, { cruce: c.cruce * 2, simultaneos: Math.min(2, c.simultaneos), sinPrisa: true });
    return c;
}

function cambiarSinPrisa() {
    aventuraGuardada.sinPrisa = !aventuraGuardada.sinPrisa;
    guardarAventura();
    pintarSinPrisa();
}

function pintarSinPrisa() {
    const b = document.getElementById("btn-sin-prisa");
    b.setAttribute("aria-pressed", String(aventuraGuardada.sinPrisa));
    b.querySelector(".estado").textContent = aventuraGuardada.sinPrisa ? "Sí" : "No";
}

function empezarNivel(mi, n) {
    if (!nivelDisponible(mi, n)) return;
    initAudio();
    detenerAventura();
    const c = configNivel(mi, n);
    mensajeAventura("");
    aventura.objetivoId = null;
    Object.assign(aventura, {
        activo: true, mundo: mi, nivel: n, enemigos: [], pendientes: [], porSalir: c.enemigos + (c.jefe ? 1 : 0),
        corazones: CORAZONES, puntos: 0, racha: 0, escrito: "", hastaAparecer: 0, terminado: false, jefeSalio: false, config: c,
    });
    const arena = document.getElementById("arena");
    arena.dataset.mundo = String(mi);
    arena.querySelectorAll(".enemigo, .rayo, .puntos-flotan").forEach((e) => e.remove());
    document.getElementById("arena-fin").classList.add("hidden");
    document.getElementById("aventura-entrada").classList.remove("hidden");
    pintarDecor(mi);
    document.getElementById("heroe").innerHTML = svgHeroe(aventuraGuardada.heroe);
    estadoHeroe("quieto");
    document.getElementById("nivel-titulo").textContent = `${AVENTURA_MUNDOS[mi].nombre} · ${nombreNivel(n)}${c.sinPrisa ? " · 🐢 Sin prisa" : ""}`;
    construirTecladoAventura();
    pintarModoAventura();
    pintarMarcador();
    mostrarPantalla("screen-aventura-juego");
    aparecerEnemigo();
    if (!aventura.manual) {
        aventura.ultimo = performance.now();
        aventura.raf = requestAnimationFrame(bucleAventura);
    }
}

/** El paisaje de la arena del mundo `mi`. */
function pintarDecor(mi) {
    document.getElementById("arena-decor").innerHTML = svgPaisajeArena(mi);
}

function detenerAventura() {
    aventura.activo = false;
    if (aventura.raf) cancelAnimationFrame(aventura.raf);
    aventura.raf = null;
}

function bucleAventura(t) {
    if (!aventura.activo) return;
    const dt = Math.min(100, t - aventura.ultimo);   // al volver de otra pestaña, sin saltos
    aventura.ultimo = t;
    if (!document.hidden) aventuraPaso(dt);
    if (aventura.activo) aventura.raf = requestAnimationFrame(bucleAventura);
}

/** Avanza el nivel `dt` milisegundos: mueve enemigos, los hace aparecer y revisa choques. */
function aventuraPaso(dt) {
    if (!aventura.activo || aventura.terminado) return;
    const c = aventura.config;
    for (const e of [...aventura.enemigos]) {
        const velocidad = 0.5 / ((e.jefe ? c.cruce * 1.6 : c.cruce) * 1000);   // de la orilla al centro en `cruce` s
        e.x += (e.lado === "izq" ? 1 : -1) * velocidad * dt;
        const parada = c.sinPrisa ? paradaSinPrisa(e) : 0;
        if (c.sinPrisa && Math.abs(e.x - 0.5) <= parada) {
            e.x = 0.5 + (e.lado === "izq" ? -1 : 1) * parada;
            if (!e.esperando) { e.esperando = true; e.el.classList.add("esperando"); }
            colocarEnemigo(e);
        } else if (Math.abs(e.x - 0.5) < 0.07) enemigoLlega(e);
        else colocarEnemigo(e);
    }
    aventura.hastaAparecer -= dt;
    const vivos = aventura.enemigos.length;
    if (aventura.hastaAparecer <= 0 && vivos < c.simultaneos && (aventura.porSalir > 0 || aventura.pendientes.length)) {
        aparecerEnemigo();
    }
    marcarObjetivo();
}

function aparecerEnemigo() {
    const c = aventura.config;
    const quedanNormales = aventura.porSalir - (c.jefe && !aventura.jefeSalio ? 1 : 0);
    // El jefe sale cuando ya no quedan enemigos normales por salir.
    const esJefe = c.jefe && !aventura.jefeSalio && quedanNormales <= 0 && aventura.enemigos.length === 0;
    if (!esJefe && quedanNormales <= 0 && aventura.pendientes.length === 0) return;
    // Lo que llegó al héroe vuelve tras dos enemigos más (o ya, si no
    // queda ningún otro por salir).
    aventura.pendientes.forEach((p) => { p.turnos--; });
    let i = esJefe ? -1 : aventura.pendientes.findIndex((p) => p.turnos <= 0);
    if (!esJefe && i === -1 && quedanNormales <= 0 && aventura.pendientes.length) i = 0;
    let op = i >= 0 ? aventura.pendientes.splice(i, 1)[0].op : null;
    const dePendientes = Boolean(op);
    if (!dePendientes && !esJefe && quedanNormales <= 0) return;
    // Respuestas distintas a las de los enemigos en pantalla: así una
    // respuesta escrita vence a uno solo y no hay que adivinar a cuál.
    for (let intento = 0; !op || aventura.enemigos.some((e) => e.op.respuesta === op.respuesta); intento++) {
        op = operacionAventura(aventura.mundo);
        if (intento > 30) break;
    }
    const e = {
        id: aventura.siguienteId++, op, lado: Math.random() < 0.5 ? "izq" : "der",
        y: esJefe ? 18 : entre(8, 48), jefe: esJefe, vida: esJefe ? JEFE_VIDA : 1,
    };
    // Entran ya dentro de la arena: medio cortados, no se leería la operación.
    const orilla = esJefe ? 0.15 : 0.09;
    e.x = e.lado === "izq" ? orilla : 1 - orilla;
    if (esJefe) aventura.jefeSalio = true;
    if (!dePendientes) aventura.porSalir--;
    const el = document.createElement("div");
    el.className = `enemigo${esJefe ? " jefe" : ""}`;
    el.dataset.id = String(e.id);
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `${esJefe ? '<span class="vida"><span style="width:100%"></span></span>' : ""}<span class="op"></span><span class="cara"></span>`;
    el.querySelector(".cara").innerHTML = svgEnemigo(aventura.mundo, esJefe);
    el.querySelector(".op").textContent = op.texto;
    e.el = el;
    const arena = document.getElementById("arena");
    arena.appendChild(el);
    // Una operación larga («1/5 de 35») es más ancha que el enemigo: si
    // entra pegado a la orilla, se corta y no se lee. Entra lo justo
    // para que se vea entera.
    if (arena.clientWidth > 0) {
        const medio = Math.min(0.4, el.offsetWidth / 2 / arena.clientWidth + 0.01);
        if (Math.abs(e.x - 0.5) > 0.5 - medio) e.x = e.lado === "izq" ? medio : 1 - medio;
    }
    aventura.enemigos.push(e);
    colocarEnemigo(e);
    aventura.hastaAparecer = (aventura.config.cruce / 2.6) * 1000;
    marcarObjetivo();
}

function colocarEnemigo(e) {
    e.el.style.left = `${e.x * 100}%`;
    e.el.style.top = `${e.y}%`;
}

/** El más cercano al héroe: al que apuntan las opciones y el lector de pantalla. */
function enemigoObjetivo() {
    return aventura.enemigos.reduce((m, e) => (!m || Math.abs(e.x - 0.5) < Math.abs(m.x - 0.5) ? e : m), null);
}

function marcarObjetivo() {
    const obj = enemigoObjetivo();
    aventura.enemigos.forEach((e) => e.el.classList.toggle("objetivo", e === obj));
    const clave = obj ? `${obj.id}-${obj.op.texto}` : "";
    if (aventura.objetivoId === clave) return;
    // Cambió el enemigo más cercano (o la pregunta del jefe): se dice
    // y se cambian las opciones. No antes: no se mueven bajo el dedo.
    aventura.objetivoId = clave;
    document.getElementById("aventura-objetivo").textContent = obj ? `${obj.jefe ? "El jefe" : "Más cerca"}: ${obj.op.texto}` : "";
    pintarOpcionesAventura();
}

function enemigoLlega(e) {
    aventura.corazones--;
    aventura.racha = 0;
    mensajeAventura(`¡Uy! ${e.op.texto} = ${e.op.respuesta}`);
    if (e.jefe) {
        // El jefe no se va: retrocede y sigue.
        e.x = e.lado === "izq" ? 0.15 : 0.85;
        colocarEnemigo(e);
    } else {
        // La respuesta se ve, y la operación vuelve más tarde en el nivel.
        quitarEnemigo(e, false);
        aventura.pendientes.push({ op: e.op, turnos: 3 });   // sale en la tercera aparición: tras dos enemigos
    }
    const heroe = document.getElementById("heroe");
    heroe.classList.remove("golpeado");
    void heroe.offsetWidth;
    heroe.classList.add("golpeado");
    estadoHeroe("golpeado", 600);
    playIncorrectSound();
    pintarMarcador();
    if (aventura.corazones <= 0) terminarNivel(false);
}

function quitarEnemigo(e, vencido) {
    aventura.enemigos = aventura.enemigos.filter((x) => x !== e);
    if (vencido) {
        e.el.classList.add("vencido");
        pof(e);
        setTimeout(() => e.el.remove(), 260);
    } else {
        e.el.remove();
    }
}

/** Una respuesta: vence al enemigo que la lleva, si hay uno. */
function responderAventura(valor, soloA = null) {
    if (!aventura.activo || aventura.terminado) return false;
    const candidatos = aventura.enemigos.filter((e) => e.op.respuesta === valor && (!soloA || e === soloA));
    aventura.escrito = "";
    pintarEscritoAventura();
    if (candidatos.length === 0) {
        aventura.racha = 0;
        const out = document.getElementById("aventura-escrito");
        out.classList.add("border-red-600");
        setTimeout(() => out.classList.remove("border-red-600"), 400);
        playIncorrectSound();
        const obj = soloA || enemigoObjetivo();
        mensajeAventura(obj ? `${valor} no vence a ningún enemigo. Mira: ${obj.op.texto}` : `${valor} no vence a ningún enemigo.`);
        return false;
    }
    const e = candidatos.reduce((m, x) => (Math.abs(x.x - 0.5) < Math.abs(m.x - 0.5) ? x : m));
    estadoHeroe("lanzando", 350);
    lanzarRayo(e);
    aventura.racha++;
    // Más puntos si estaba lejos (se respondió rápido) y por racha.
    // Sin prisa no hay premio por rapidez: los enemigos van despacio.
    const lejos = aventura.config.sinPrisa ? 0 : Math.min(1, Math.abs(e.x - 0.5) / 0.48);
    const pts = (e.jefe ? 20 : 10) + Math.round(10 * lejos) + (aventura.racha >= 3 ? 5 : 0);
    aventura.puntos += pts;
    flotarPuntos(e, pts);
    // Vencer suena a «pof»; el último golpe al jefe, a fanfarria.
    sonar(e.jefe && e.vida <= 1 ? "jefe" : "vencer");
    const metaCumplida = avanzarMision("acierto");   // vencer también es acertar
    if (e.jefe && e.vida > 1) {
        e.vida--;
        e.op = operacionAventura(aventura.mundo);
        e.el.querySelector(".op").textContent = e.op.texto;
        e.el.querySelector(".vida > span").style.width = `${(e.vida / JEFE_VIDA) * 100}%`;
        e.x += (e.lado === "izq" ? -1 : 1) * 0.08;   // retrocede con el golpe
        e.x = Math.max(0.15, Math.min(0.85, e.x));
        colocarEnemigo(e);
    } else {
        quitarEnemigo(e, true);
    }
    mensajeAventura(metaCumplida ? `☀️ ¡Meta de hoy cumplida! +${BONO_MISION} estrellas.`
        : e.jefe && aventura.enemigos.includes(e) ? `¡Golpe al jefe! Le quedan ${e.vida}.` : "¡Bien!");
    pintarMarcador();
    marcarObjetivo();
    if (aventura.enemigos.length === 0 && aventura.porSalir <= 0 && aventura.pendientes.length === 0) terminarNivel(true);
    else if (aventura.enemigos.length === 0) aventura.hastaAparecer = Math.min(aventura.hastaAparecer, 600);
    return true;
}

function mensajeAventura(texto) {
    document.getElementById("aventura-mensaje").textContent = texto;
}

let vueltaHeroe = null;
/** Cambia la cara y la pose del héroe; con `ms`, vuelve a «quieto» después. */
function estadoHeroe(estado, ms = 0) {
    const svg = document.querySelector("#heroe > svg");
    if (!svg) return;
    clearTimeout(vueltaHeroe);
    svg.dataset.estado = estado;
    if (ms > 0) vueltaHeroe = setTimeout(() => { svg.dataset.estado = "quieto"; }, ms);
}

/** Estrellas que se abren donde estaba el enemigo vencido. */
function pof(e) {
    if (calmaEfectiva()) return;
    const arena = document.getElementById("arena");
    const p = document.createElement("span");
    p.className = "pof";
    p.setAttribute("aria-hidden", "true");
    p.style.left = e.el.style.left;
    p.style.top = e.el.style.top;
    p.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%">${[0, 72, 144, 216, 288].map((g) =>
                `<path transform="rotate(${g} 50 50) translate(50 14)" d="M0 -9 L2.6 -2.6 L9 0 L2.6 2.6 L0 9 L-2.6 2.6 L-9 0 L-2.6 -2.6 Z" fill="var(--sol)" stroke="var(--contorno)" stroke-width="2"/>`).join("")}<circle cx="50" cy="50" r="14" fill="#fff" opacity=".8"/></svg>`;
    arena.appendChild(p);
    setTimeout(() => p.remove(), 500);
}

function lanzarRayo(e) {
    if (calmaEfectiva()) return;
    const arena = document.getElementById("arena");
    const caja = arena.getBoundingClientRect();
    const heroe = document.getElementById("heroe").getBoundingClientRect();
    const destino = e.el.getBoundingClientRect();
    const x1 = heroe.left + heroe.width / 2 - caja.left, y1 = heroe.top - caja.top + 10;
    const x2 = destino.left + destino.width / 2 - caja.left, y2 = destino.top + destino.height / 2 - caja.top;
    const rayo = document.createElement("div");
    rayo.className = "rayo";
    rayo.style.left = `${x1}px`;
    rayo.style.top = `${y1}px`;
    rayo.style.width = `${Math.hypot(x2 - x1, y2 - y1)}px`;
    rayo.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
    arena.appendChild(rayo);
    setTimeout(() => rayo.remove(), 250);
}

function flotarPuntos(e, pts) {
    const s = document.createElement("span");
    s.className = "puntos-flotan";
    s.style.left = e.el.style.left;
    s.style.top = e.el.style.top;
    s.textContent = `+${pts}`;
    document.getElementById("arena").appendChild(s);
    setTimeout(() => s.remove(), 900);
}

function pintarMarcador() {
    const c = document.getElementById("nivel-corazones");
    const vivos = Math.max(0, aventura.corazones);
    c.innerHTML = icono("corazon").repeat(vivos) + icono("corazon-vacio").repeat(CORAZONES - vivos);
    c.setAttribute("aria-label", `${Math.max(0, aventura.corazones)} de ${CORAZONES} corazones`);
    document.getElementById("nivel-puntos").textContent = String(aventura.puntos);
}
