// Las estrellas, el vivero y la misión del día.
//
// Salió de index.html (Hito 7.7) tal cual, sin cambiar lo que hace. Es un script
// clásico que solo declara: lo que lee o guarda vive dentro de funciones, que
// se llaman cuando el principal ya cargó (ver pruebas/archivos.spec.mjs).

// --- ESTRELLAS QUE SE GASTAN: EL VIVERO MÁGICO (Fase 3) ---
//
// Antes las estrellas solo se contaban: un número que subía y no servía
// para nada. Ahora son lo que se gasta en el vivero, y lo que se compra
// se queda para siempre en «Mi jardín» y acompaña cada partida. Es una
// razón concreta para jugar un poco más («me faltan 5 para la rana»).
//
// Se ganan sobre todo por APRENDER, no solo por responder: 1 por
// acierto, pero 5 cuando una multiplicación florece y 10 por la misión
// del día. Jugar la tabla del 1 sin parar da estrellas; dominar la del 7
// da muchas más.
//
// Los precios crecen poco a poco: lo primero se compra en la primera
// partida, para que se entienda enseguida qué hacen las estrellas; lo
// último lleva semanas.
const VIVERO = [
    { id: "mariposa", emoji: "🦋", nombre: "Mariposa", precio: 10 },
    { id: "catarina", emoji: "🐞", nombre: "Catarina", precio: 20 },
    { id: "abeja", emoji: "🐝", nombre: "Abeja", precio: 25 },
    { id: "caracol", emoji: "🐌", nombre: "Caracol", precio: 30 },
    { id: "hongos", emoji: "🍄", nombre: "Hongos", precio: 35 },
    { id: "pajarito", emoji: "🐦", nombre: "Pajarito", precio: 45 },
    { id: "rana", emoji: "🐸", nombre: "Rana", precio: 55 },
    { id: "fuente", emoji: "⛲", nombre: "Fuente", precio: 70 },
    { id: "conejo", emoji: "🐇", nombre: "Conejo", precio: 85 },
    { id: "casita", emoji: "🏡", nombre: "Casita", precio: 100 },
    { id: "arcoiris", emoji: "🌈", nombre: "Arcoíris", precio: 130 },
    { id: "unicornio", emoji: "🦄", nombre: "Unicornio", precio: 180 },
    // Más variados: antes casi todo eran bichitos tiernos y el premio
    // mayor era solo el unicornio. Los precios no cambian lo que sigue
    // a la mariposa (la catarina), para no mover las primeras metas.
    { id: "tortuga", emoji: "🐢", nombre: "Tortuga", precio: 40 },
    { id: "buho", emoji: "🦉", nombre: "Búho", precio: 60 },
    { id: "tractor", emoji: "🚜", nombre: "Tractor", precio: 90 },
    { id: "dinosaurio", emoji: "🦖", nombre: "Dinosaurio", precio: 120 },
    { id: "cohete", emoji: "🚀", nombre: "Cohete", precio: 150 },
    { id: "dragon", emoji: "🐉", nombre: "Dragón", precio: 180 },
].sort((x, y) => x.precio - y.precio);
const BONO_FLOR = 5;
const BONO_MISION = 10;
let compras = [];   // ids del VIVERO, en el orden en que se compraron

function cargarCompras() {
    try {
        const guardadas = JSON.parse(almacen.leer("compras") || "[]");
        const validas = new Set(VIVERO.map((v) => v.id));
        compras = Array.isArray(guardadas) ? [...new Set(guardadas.filter((id) => validas.has(id)))] : [];
    } catch (e) { compras = []; }
}

function ganarEstrellas(n) {
    globalStars += n;
    almacen.guardar("estrellas", String(globalStars));
    actualizarEstrellas();
}

function actualizarEstrellas() {
    document.getElementById("global-stars").innerText = globalStars;
    document.querySelectorAll(".cuenta-estrellas").forEach((e) => { e.textContent = String(globalStars); });
    const antojo = siguienteAntojo();
    document.getElementById("vivero-antojo").textContent = !antojo
        ? "¡Ya tienes todo el vivero!"
        : globalStars >= antojo.precio
            ? `¡Ya te alcanza para ${articulo(antojo)}!`
            : `Te faltan ${antojo.precio - globalStars} ⭐ para ${articulo(antojo)}`;
}

/** Lo más barato que aún no se tiene: la siguiente meta a la vista. */
function siguienteAntojo() {
    return VIVERO.find((v) => !compras.includes(v.id)) || null;
}

function articulo(v) {
    const femeninos = ["mariposa", "catarina", "abeja", "rana", "fuente", "casita", "tortuga"];
    if (v.id === "hongos") return "los hongos";
    return `${femeninos.includes(v.id) ? "la" : "el"} ${v.nombre.toLowerCase()}`;
}

/** Compra un amigo o adorno. Devuelve false si ya se tiene o no alcanza. */
function comprar(id) {
    const v = VIVERO.find((x) => x.id === id);
    if (!v || compras.includes(id) || globalStars < v.precio) return false;
    compras.push(id);
    almacen.guardar("compras", JSON.stringify(compras));
    ganarEstrellas(-v.precio);
    sonar("comprar");
    const aviso = `¡${v.emoji} ${v.nombre} llegó a tu jardín!`;
    document.getElementById("vivero-aviso").textContent = aviso;
    speak(`¡${articulo(v).replace(/^./, (c) => c.toUpperCase())} llegó a tu jardín!`);
    pintarVivero();
    return true;
}

function pintarVivero() {
    const lista = document.getElementById("vivero-lista");
    lista.replaceChildren();
    VIVERO.forEach((v) => {
        const tiene = compras.includes(v.id);
        const li = document.createElement("li");
        li.dataset.vivero = v.id;
        li.className = `rounded-2xl border-2 p-3 text-center flex flex-col items-center gap-1 ${tiene ? "bg-green-50 border-green-300" : "bg-white border-amber-200"}`;
        li.innerHTML = `<span class="text-4xl" aria-hidden="true">${v.emoji}</span>` +
            `<span class="font-bold text-gray-800">${v.nombre}</span>`;
        if (tiene) {
            li.insertAdjacentHTML("beforeend", '<span class="text-sm font-bold text-green-800">✓ En tu jardín</span>');
        } else {
            const boton = document.createElement("button");
            boton.type = "button";
            const falta = v.precio - globalStars;
            boton.disabled = falta > 0;
            boton.className = "w-full min-h-11 rounded-xl px-2 py-1 text-sm font-bold bg-green-700 hover:bg-green-800 text-white disabled:bg-gray-200 disabled:text-gray-700 disabled:cursor-not-allowed";
            // Sin estrellas, «faltan 10» repetía el precio: se dice solo el precio.
            boton.innerHTML = falta > 0
                ? `<span aria-hidden="true">${v.precio} ⭐${globalStars > 0 ? ` · faltan ${falta}` : ""}</span><span class="sr-only">${v.nombre}: cuesta ${v.precio} estrellas, te faltan ${falta}</span>`
                : `<span aria-hidden="true">Comprar · ${v.precio} ⭐</span><span class="sr-only">Comprar ${v.nombre} por ${v.precio} estrellas</span>`;
            boton.onclick = () => comprar(v.id);
            li.appendChild(boton);
        }
        lista.appendChild(li);
    });
}

function mostrarVivero() {
    document.getElementById("vivero-aviso").textContent = "";
    actualizarEstrellas();
    pintarVivero();
    mostrarPantalla("screen-vivero");
}

function pintarAmigos() {
    const ul = document.getElementById("jardin-amigos");
    ul.replaceChildren();
    compras.forEach((id) => {
        const v = VIVERO.find((x) => x.id === id);
        const li = document.createElement("li");
        li.dataset.amigo = id;
        li.innerHTML = `<span aria-hidden="true">${v.emoji}</span><span class="sr-only">${v.nombre}</span>`;
        ul.appendChild(li);
    });
    document.getElementById("jardin-amigos-vacio").classList.toggle("hidden", compras.length > 0);
}

// --- MISIÓN DEL DÍA (Fase 3) ---
//
// LA META DE HOY. Antes había cuatro misiones que rotaban («termina una
// partida», «escribe 5», «gana el reto del arcoíris», «el repaso»):
// cada día una regla distinta que había que leer y entender. Ahora es
// una sola, clara y siempre igual: acertar 10 respuestas en el día, en
// lo que se quiera (tablas, retos, fracciones o la Aventura). Son unos
// minutos, y da una razón para volver mañana, que es cuando de verdad
// se aprende: florecer exige acertar rápido en dos días distintos.
//
// Los días seguidos se cuentan, pero faltar un día NO quita nada: las
// estrellas, los amigos y el total de días cumplidos se quedan. Solo la
// racha vuelve a empezar. Una racha de hoy pendiente sigue viva hasta
// que acabe el día. Se guarda donde se guardaban las misiones: la semana
// y la racha de antes se conservan.
const META_DIARIA = 10;
const MISIONES = { meta: { texto: `Acierta ${META_DIARIA} respuestas hoy, en lo que quieras`, meta: META_DIARIA } };
let misiones = { hoy: null, dias: [] };   // hoy: { d, tipo, cuenta, cumplida }

function cargarMisiones() {
    try {
        const g = JSON.parse(almacen.leer("misiones") || "{}") || {};
        const fecha = /^\d{4}-\d{2}-\d{2}$/;
        misiones = {
            // Una misión vieja (de otro tipo) se vuelve la meta: si ya se
            // había cumplido hoy, la meta de hoy también queda cumplida.
            hoy: g.hoy && fecha.test(g.hoy.d)
                ? { d: g.hoy.d, tipo: "meta",
                    cuenta: g.hoy.cumplida === true ? META_DIARIA
                        // «escribe 5» contaba respuestas: lo que llevaba vale. Las
                        // demás misiones contaban partidas, que no se comparan.
                        : ["meta", "escribir"].includes(g.hoy.tipo) && Number.isFinite(g.hoy.cuenta) && g.hoy.cuenta >= 0 ? Math.min(g.hoy.cuenta, META_DIARIA) : 0,
                    cumplida: g.hoy.cumplida === true }
                : null,
            dias: Array.isArray(g.dias) ? [...new Set(g.dias.filter((d) => fecha.test(d)))].sort() : [],
        };
    } catch (e) { misiones = { hoy: null, dias: [] }; }
}

function guardarMisiones() {
    // Basta con los últimos 400 días para la racha y el total del año.
    misiones.dias = misiones.dias.slice(-400);
    almacen.guardar("misiones", JSON.stringify(misiones));
}

/** La meta de hoy; un día nuevo empieza en cero. */
function misionDeHoy() {
    const d = hoy();
    if (!misiones.hoy || misiones.hoy.d !== d) {
        const cumplida = misiones.dias.includes(d);
        misiones.hoy = { d, tipo: "meta", cuenta: cumplida ? META_DIARIA : 0, cumplida };
        guardarMisiones();
    }
    return misiones.hoy;
}

/**
 * Suma un acierto a la meta de hoy (de cualquier juego). Devuelve true
 * solo en el momento en que se cumple: el premio se da una sola vez.
 */
function avanzarMision(evento) {
    const m = misionDeHoy();
    if (m.cumplida || evento !== "acierto") return false;
    m.cuenta = Math.min(m.cuenta + 1, META_DIARIA);
    if (m.cuenta >= META_DIARIA) {
        m.cumplida = true;
        if (!misiones.dias.includes(m.d)) misiones.dias.push(m.d);
        misiones.dias.sort();
        guardarMisiones();
        ganarEstrellas(BONO_MISION);
        return true;
    }
    guardarMisiones();
    return false;
}

function fechaMenos(fecha, dias) {
    return new Date(Date.parse(fecha) - dias * 86400000).toISOString().slice(0, 10);
}

/** Días seguidos con la misión cumplida, contando hasta hoy o hasta ayer. */
function rachaActual() {
    const cumplidos = new Set(misiones.dias);
    let dia = cumplidos.has(hoy()) ? hoy() : fechaMenos(hoy(), 1);
    let racha = 0;
    while (cumplidos.has(dia)) { racha++; dia = fechaMenos(dia, 1); }
    return racha;
}

function actualizarMision() {
    const m = misionDeHoy();
    const def = MISIONES[m.tipo];
    document.getElementById("mision-texto").textContent = m.cumplida
        ? `✓ ¡Meta de hoy cumplida! Ganaste ${BONO_MISION} estrellas. Mañana, otra.`
        : `${def.texto} (${m.cuenta} de ${def.meta}). Premio: ${BONO_MISION} estrellas.`;
    const barra = document.getElementById("mision-progreso");
    barra.setAttribute("aria-valuemax", String(def.meta));
    barra.setAttribute("aria-valuenow", String(m.cuenta));
    document.getElementById("mision-barra").style.width = `${(m.cuenta / def.meta) * 100}%`;

    const racha = rachaActual();
    const total = misiones.dias.length;
    document.getElementById("mision-racha").textContent = racha >= 2
        ? `🔥 ${racha} días seguidos`
        : total > 0 ? `${total} ${total === 1 ? "día cumplido" : "días cumplidos"}` : "";

    // Los últimos 7 días, de más antiguo a hoy, con su inicial.
    const semana = document.getElementById("mision-semana");
    semana.replaceChildren();
    const nombreDia = new Intl.DateTimeFormat("es-MX", { weekday: "narrow", timeZone: "UTC" });
    const nombreLargo = new Intl.DateTimeFormat("es-MX", { weekday: "long", timeZone: "UTC" });
    for (let k = 6; k >= 0; k--) {
        const d = fechaMenos(hoy(), k);
        const hecho = misiones.dias.includes(d);
        const li = document.createElement("li");
        li.dataset.dia = d;
        li.dataset.cumplida = hecho ? "si" : "no";
        li.className = "flex flex-col items-center gap-0.5 flex-1";
        const quien = k === 0 ? "hoy" : nombreLargo.format(new Date(Date.parse(d)));
        // Hoy se llama «Hoy» (una letra sola no decía cuál era) y los días
        // sin misión quedan vacíos: el «·» de antes parecía un botón.
        const letra = k === 0 ? "Hoy" : nombreDia.format(new Date(Date.parse(d)));
        li.innerHTML = `<span aria-hidden="true" class="font-bold ${k === 0 ? "text-sky-800" : "text-gray-700"}">${letra}</span>` +
            `<span aria-hidden="true" class="w-7 h-7 rounded-full flex items-center justify-center font-bold ${hecho ? "bg-emerald-200 text-emerald-900" : "bg-white border border-sky-200"} ${k === 0 ? "ring-2 ring-sky-500" : ""}">${hecho ? "✓" : ""}</span>` +
            `<span class="sr-only">${quien}: ${hecho ? "meta cumplida" : "sin meta"}</span>`;
        semana.appendChild(li);
    }
}

function mostrarMapa() {
    const tabla = document.getElementById("mapa-tabla");
    tabla.querySelectorAll("thead, tbody").forEach((n) => n.remove());

    const cabecera = tabla.createTHead().insertRow();
    const esquina = document.createElement("th");
    esquina.innerHTML = '<span class="sr-only">Tabla</span>';
    cabecera.appendChild(esquina);
    for (let b = 1; b <= MULTIPLICADORES; b++) {
        const th = document.createElement("th");
        th.scope = "col";
        th.className = "text-xs text-gray-600 font-bold";
        th.textContent = `×${b}`;
        cabecera.appendChild(th);
    }

    const cuerpo = tabla.createTBody();
    for (let a = 1; a <= TABLAS; a++) {
        const fila = cuerpo.insertRow();
        const th = document.createElement("th");
        th.scope = "row";
        // En pantallas estrechas solo se ve el número: con "Tabla del" la
        // cuadrícula no cabe en un teléfono. El lector oye el nombre entero.
        const estatus = estatusTabla(a);
        th.dataset.estatus = estatus || "";
        th.innerHTML = `<button type="button" class="mapa-fila inline-flex flex-col items-center justify-center leading-none text-sm font-bold text-green-800 bg-green-50 border border-green-200 rounded-lg hover:underline px-1 whitespace-nowrap">` +
            `<span><span class="sr-only sm:not-sr-only">Tabla del </span>${a}</span>` +
            (estatus ? `${dibujoEstatus(estatus)}<span class="sr-only">, ${NOMBRE_ESTATUS[estatus]}</span>` : "") + "</button>";
        th.querySelector("button").onclick = () => startTable(a);
        fila.appendChild(th);
        for (let b = 1; b <= MULTIPLICADORES; b++) {
            const estado = estaMarchita(a, b) ? "marchita" : estadoHecho(a, b);
            const td = fila.insertCell();
            td.className = `celda-mapa celda-${estado}`;
            td.dataset.hecho = `${a}x${b}`;
            td.dataset.estado = estado;
            td.innerHTML = `<span aria-hidden="true">${simboloEstado(estado)}</span><span class="sr-only">${a} por ${b}: ${NOMBRES_ESTADO[estado]}</span>`;
        }
    }
    actualizarBotonesFalta();
    // Se cuentan plantas, no casillas: 7 × 8 y 8 × 7 son una sola.
    const cuenta = cuentaPorEstado();
    const total = plantas().length;
    document.getElementById("mapa-resumen").innerText = cuenta.nuevo === total
        ? "Juega una tabla y aquí verás lo que vas aprendiendo."
        : `Florecidas: ${cuenta.florecida} de ${total}. Casi: ${cuenta.casi}. Practicando: ${cuenta.practica}.`;
    mostrarPantalla("screen-mapa");
}

function llenarBolsa() {
    if (currentTable === "falta") {
        // Ya viene ordenada por urgencia: no se baraja.
        bolsa = bolsaDeLoQueFalta();
    } else if (currentTable === "div") {
        bolsa = bolsaDeDivisiones();
    } else if (currentTable === "problemas") {
        bolsa = bolsaDeProblemas();
    } else if (currentTable === "logica") {
        bolsa = bolsaDeRetos();
    } else if (currentTable === "porcentajes") {
        bolsa = bolsaDePorcentajes();
    } else if (currentTable === "decimales") {
        bolsa = bolsaDeDecimales();
    } else if (currentTable === "tiempo") {
        bolsa = bolsaDeTiempo();
    } else if (currentTable === "calendario") {
        bolsa = bolsaDeCalendario();
    } else if (currentTable === "dinero") {
        bolsa = bolsaDeDinero();
    } else if (currentTable === "area") {
        bolsa = bolsaDeArea();
    } else if (currentTable === "multiplos") {
        bolsa = bolsaDeMultiplos();
    } else if (currentTable === "residuo") {
        bolsa = bolsaDeResiduos();
    } else if (currentTable === "fracciones") {
        bolsa = bolsaDeFracciones();
    } else {
        const lista = [];
        if (currentTable === "mix") {
            // EXCLUSIÓN DE 1s: factores entre 2 y 9. Cada pareja una
            // vez (7 × 8 y 8 × 7 son la misma planta), en un orden al
            // azar: 36 multiplicaciones distintas.
            for (let a = 2; a <= 9; a++) {
                for (let b = a; b <= 9; b++) lista.push(Math.random() < 0.5 ? { a, b } : { a: b, b: a });
            }
        } else {
            for (let b = 1; b <= MULTIPLICADORES; b++) lista.push({ a: currentTable, b });
        }
        bolsa = barajar(lista);
    }

    // Al rellenar, el primer hecho de la bolsa nueva podría coincidir
    // con el último de la anterior: se apartaría la bolsa entera para
    // evitar UNA repetición. Basta con moverlo al fondo.
    const siguiente = bolsa[bolsa.length - 1];
    if (bolsa.length > 1 && claveHecho(siguiente.a, siguiente.b) === ultimoHecho) {
        bolsa.unshift(bolsa.pop());
    }
}
