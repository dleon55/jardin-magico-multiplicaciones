// Lumi crece contigo.
//
// Salió de index.html (Hito 7.7) tal cual, sin cambiar lo que hace. Es un script
// clásico que solo declara: lo que lee o guarda vive dentro de funciones, que
// se llaman cuando el principal ya cargó (ver pruebas/archivos.spec.mjs).

// --- LUMI CRECE CONTIGO ---
//
// Lumi pasa de semilla a árbol en flor según las tablas (del 2 al 9)
// que se saben. Se guarda la etapa más alta alcanzada: si una tabla se
// marchita, Lumi no encoge. Faltar no quita nada.
const tablasSabidasLumi = () => [2, 3, 4, 5, 6, 7, 8, 9].filter((n) => tablaSabida(n)).length;

function etapaGuardadaLumi() {
    const e = parseInt(almacen.leer("lumi") || "0", 10);
    return Number.isInteger(e) && e >= 0 && e < ETAPAS_LUMI.length ? e : 0;
}

/** Sube la etapa si toca. Devuelve la nueva etapa si creció, o null. */
function crecerLumi() {
    const antes = etapaGuardadaLumi();
    const ahora = etapaLumiPorTablas(tablasSabidasLumi());
    if (ahora <= antes) { ponerEtapaLumi(antes); return null; }
    almacen.guardar("lumi", String(ahora));
    ponerEtapaLumi(ahora);
    return ahora;
}

/** Dice que Lumi creció (una vez); si no creció, quita el aviso. */
function anunciarLumi(etapa) {
    const aviso = document.getElementById("lumi-crecio");
    aviso.classList.toggle("hidden", etapa === null);
    if (etapa === null) { aviso.textContent = ""; return; }
    const texto = `¡Lumi creció! Ahora es ${ETAPAS_LUMI[etapa].nombre}: ya sabes ${tablasSabidasLumi()} tablas.`;
    aviso.textContent = texto;
    lumi("lumi-seguir", "celebrando", 2500);
    sonar("florecer");
    speak(texto);
}

/** «Lumi es un brote. Con 2 tablas más será una plantita.» */
function textoEtapaLumi() {
    const e = etapaGuardadaLumi();
    const sig = ETAPAS_LUMI[e + 1];
    if (!sig) return `Lumi es ${ETAPAS_LUMI[e].nombre}: ¡sabes todas las tablas!`;
    const faltan = Math.max(1, sig.desde - tablasSabidasLumi());
    return `Lumi es ${ETAPAS_LUMI[e].nombre}. Con ${faltan === 1 ? "1 tabla" : `${faltan} tablas`} más será ${sig.nombre}.`;
}

function pintarMundoVivo() {
    const mapa = document.getElementById("mundo-mapa");
    const extras = document.getElementById("mundo-extras");
    pintarExpedicion();
    // Con la lista a la vista, el mundo no se dibuja (ni duplica sus botones).
    if (ajustes.lista === true) { mapa.replaceChildren(); extras.replaceChildren(); return; }
    extras.replaceChildren(...[["btn-aventura-mundo", "La Aventura", mostrarAventura, "bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white"],
        ["btn-equipo-mundo", "En equipo", mostrarEquipo, "bg-gradient-to-r from-rose-200 to-pink-200 hover:from-rose-300 hover:to-pink-300 text-gray-900"],
        ["btn-ensenar-mundo", "Enséñale a Lumi", mostrarEnsenar, "col-span-2 bg-gradient-to-r from-yellow-100 to-amber-200 hover:from-yellow-200 hover:to-amber-300 text-gray-900"],
        ...(esBrote() ? [["btn-semillero-mundo", "Antes de multiplicar", mostrarSemillero, "col-span-2 bg-gradient-to-r from-lime-100 to-green-200 hover:from-lime-200 hover:to-green-300 text-gray-900"]] : [["btn-reto-mundo", "Retos con código", () => mostrarRetos(), "col-span-2 bg-gradient-to-r from-indigo-100 to-violet-200 hover:from-indigo-200 hover:to-violet-300 text-gray-900"]])].map(([id, texto, accion, color]) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.id = id;
        boton.className = `bubble-font ${color} py-3 px-2 rounded-2xl shadow-md transition text-lg min-h-11`;
        boton.textContent = texto;
        boton.onclick = accion;
        return boton;
    }));
    const dormidos = new Set(LUGARES.filter((l) => faltanParaLugar(l).length > 0).map((l) => l.id));
    const florecidas = cuentaPorEstado().florecida;
    // Con la primera flor ya se ve una en el camino; con las 54, todas.
    const flores = florecidas === 0 ? 0 : Math.max(1, Math.round((florecidas / plantas().length) * FLORES_MUNDO.length));
    mapa.innerHTML = svgMundo(dormidos, flores, leerExpediciones().length, rachaActual(), repasoHechoEstaSemana());
    for (const lugar of LUGARES) {
        const faltan = faltanParaLugar(lugar);
        const b = document.createElement("button");
        b.type = "button";
        b.className = `lugar-mundo${faltan.length ? " lugar-dormido" : ""}`;
        b.dataset.lugar = lugar.id;
        b.style.left = `${((lugar.cx - 105) / MUNDO_ANCHO) * 100}%`;
        b.style.top = `${((lugar.cy - 80) / MUNDO_ALTO) * 100}%`;
        b.style.width = `${(210 / MUNDO_ANCHO) * 100}%`;
        b.style.height = `${(196 / MUNDO_ALTO) * 100}%`;
        b.style.setProperty("--borde-lugar", lugar.borde);
        const rotulo = document.createElement("span");
        rotulo.className = "rotulo-lugar";
        const nombre = document.createElement("b");
        nombre.textContent = tonoActual() === "brote" ? lugar.corto : lugar.nombre;
        const detalle = document.createElement("span");
        // En el rótulo, corto; al tocarlo se dice la lista entera.
        detalle.textContent = faltan.length > 2 ? `Despierta con ${faltan.length} tablas más`
            : faltan.length ? `Despierta con ${listaTablas(faltan)}`
            : lugar.id === "huerto" ? "Las tablas y el Desafío" : `${lugar.juegos.length} juegos`;
        rotulo.append(nombre, detalle);
        b.appendChild(rotulo);
        b.setAttribute("aria-label", faltan.length ? `${lugar.nombre}, dormido: despierta cuando sepas ${listaTablas(faltan)}` : `${lugar.nombre}: ${detalle.textContent}`);
        b.onclick = () => (faltan.length ? avisarLugarDormido(lugar, faltan) : abrirLugar(lugar.id));
        mapa.appendChild(b);
    }
    // Lumi, junto al último lugar despierto.
    const ultimo = LUGARES.filter((l) => !dormidos.has(l.id)).at(-1);
    const lumiMapa = document.createElement("span");
    lumiMapa.className = "lumi-mundo";
    lumiMapa.dataset.lugar = ultimo.id;
    lumiMapa.style.left = `${((ultimo.cx + (ultimo.cx > MUNDO_ANCHO / 2 ? -112 : 112)) / MUNDO_ANCHO) * 100}%`;
    lumiMapa.style.top = `${((ultimo.cy + 40) / MUNDO_ALTO) * 100}%`;
    // Más grande con cada etapa.
    lumiMapa.style.width = `${(15 + etapaLumi * 2) * ({ brote: 1.15, pro: 0.8 }[tonoActual()] ?? 1)}%`;
    lumiMapa.appendChild(lumiSuelta("contenta"));
    document.getElementById("mundo-etapa").textContent = textoEtapaLumi() +
        (repasoHechoEstaSemana() ? " Repaso de la semana: hecho." : repasoPendiente() ? " Esta semana toca repaso." : "");
    document.getElementById("mundo-datos").textContent = tonoActual() === "pro" ? datosPro() : "";
    mapa.appendChild(lumiMapa);
    document.getElementById("mundo-aviso").textContent = "";
}

function avisarLugarDormido(lugar, faltan) {
    const texto = `${lugar.nombre} sigue dormido: despierta cuando sepas ${listaTablas(faltan)}.`;
    document.getElementById("mundo-aviso").textContent = texto;
    speak(texto);
}

function abrirLugar(id) {
    const lugar = LUGARES.find((l) => l.id === id);
    if (!lugar || faltanParaLugar(lugar).length > 0) return;
    lugarAbierto = id;
    regresoLugar = document.activeElement;
    const titulo = document.getElementById("lugar-titulo");
    titulo.textContent = lugar.nombre;
    titulo.style.color = lugar.tinta;
    document.getElementById("lugar-panel").style.borderTop = `6px solid ${lugar.borde}`;
    document.getElementById("lugar-sub").textContent = lugar.sub;
    const tablas = document.getElementById("lugar-tablas");
    tablas.classList.toggle("hidden", id !== "huerto");
    tablas.replaceChildren();
    if (id === "huerto") {
        for (let n = 1; n <= TABLAS; n++) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = `tabla-lugar${tablaSabida(n) ? " tabla-sabida" : ""}`;
            b.dataset.tabla = String(n);
            b.innerHTML = `<span class="bubble-font text-2xl">${n}</span><span class="text-xs font-bold">${tablaSabida(n) ? "la sabes" : "practicar"}</span>`;
            b.setAttribute("aria-label", `Tabla del ${n}${tablaSabida(n) ? ", ya la sabes" : ""}`);
            b.onclick = () => { cerrarLugar(false); elegirTabla(n); };
            tablas.appendChild(b);
        }
    }
    document.getElementById("lugar-juegos").replaceChildren(...lugar.juegos.map(([icono, nombre, detalle, destino], i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `juego-lugar${lugar.juegos.length % 2 && i === lugar.juegos.length - 1 ? " col-span-2" : ""}`;
        b.dataset.juego = destino;
        b.innerHTML = iconoTema(icono);
        const texto = document.createElement("span");
        const fuerte = document.createElement("b");
        fuerte.className = "bubble-font block text-lg leading-tight";
        fuerte.textContent = nombre;
        const chico = document.createElement("span");
        chico.className = "block text-xs text-gray-700";
        chico.textContent = detalle;
        texto.append(fuerte, chico);
        b.appendChild(texto);
        b.onclick = () => { cerrarLugar(false); if (destino === "fracciones") mostrarFracciones(); else startTable(destino); };
        return b;
    }));
    document.getElementById("lugar-fondo").classList.remove("hidden");
    titulo.focus();
    sonar("lugar");
    speak(`${lugar.nombre}. ${lugar.sub}`);
}

function cerrarLugar(devolverFoco = true) {
    if (!lugarAbierto) return;
    lugarAbierto = null;
    document.getElementById("lugar-fondo").classList.add("hidden");
    if (devolverFoco) { callarVoz(); regresoLugar?.focus?.(); }
}

function saltarDiagnostico() {
    almacen.guardar("diagnostico", "saltado");
    diag = null;
    callarVoz();
    backToSelector();
}

function terminarDiagnostico() {
    diag = null;
    backToSelector();
}

function elegirTabla(n) {
    if (!descubiertas.includes(n) && !tablaYaJugada(n)) {
        mostrarDescubrir(n);
    } else {
        startTable(n);
    }
}

function mostrarDescubrir(n) {
    initAudio();
    cancelarEspera();
    callarVoz();
    descubriendo = { tabla: n, filas: 0 };
    if (!descubiertas.includes(n)) {
        descubiertas.push(n);
        almacen.guardar("descubiertas", JSON.stringify(descubiertas));
    }
    document.getElementById("descubrir-tabla").textContent = String(n);
    document.querySelectorAll(".descubrir-n").forEach((e) => { e.textContent = String(n); });
    const intro = n === 1
        ? "Cada fila tiene 1 punto. Toca «Otra fila» y mira cómo crece."
        : `Cada fila tiene ${n} puntos. Toca «Otra fila» y mira cómo crece.`;
    document.getElementById("descubrir-intro").textContent = intro;
    document.getElementById("descubrir-final").classList.add("hidden");
    pintarDescubrir();
    mostrarPantalla("screen-descubrir");
    speak(`Descubre la tabla del ${n}. ${intro.replace(/«|»/g, "")}`);
}

function otraFila() {
    const d = descubriendo;
    if (pantallaActual !== "screen-descubrir" || d.filas >= MULTIPLICADORES) return;
    d.filas++;
    pintarDescubrir();
    const total = d.tabla * d.filas;
    callarVoz();
    speak(d.filas === 1 ? `Una fila de ${d.tabla}: ${d.tabla}.` : `${d.filas} filas de ${d.tabla}: ${total}.`);
    if (d.filas === MULTIPLICADORES) {
        const final = document.getElementById("descubrir-final");
        final.classList.remove("hidden");
        speak(`¡Ya tienes la tabla entera! ${textoParaVoz(document.getElementById("descubrir-truco").textContent)}`);
        document.getElementById("descubrir-practicar").focus();
    }
}

function pintarDescubrir() {
    const { tabla: n, filas } = descubriendo;
    const rejilla = document.getElementById("descubrir-rejilla");
    rejilla.style.gridTemplateColumns = `repeat(${n}, auto)`;
    const puntos = [];
    for (let f = 0; f < filas; f++) {
        for (let c = 0; c < n; c++) {
            const punto = document.createElement("span");
            // Como en la ayuda: filas de dos colores y un hueco cada 5.
            punto.className = `punto block w-3 h-3 md:w-4 md:h-4 rounded-full ${f % 2 ? "bg-orange-600" : "bg-indigo-500"}`;
            if (c > 0 && c % 5 === 0) punto.style.marginLeft = "0.5rem";
            if (f > 0 && f % 5 === 0) punto.style.marginTop = "0.5rem";
            puntos.push(punto);
        }
    }
    rejilla.replaceChildren(...puntos);
    rejilla.classList.toggle("hidden", filas === 0);

    document.getElementById("descubrir-cuenta").textContent = filas === 0
        ? ""
        // Una sola regla en todo el juego: a × b son a filas de b (como
        // en la ayuda de la partida). Aquí se suman filas de n, así que
        // 3 filas de 7 son 3 × 7; la del 7 se cuenta de 7 en 7.
        : `${filas} × ${n} = ${n * filas}: ${filas === 1 ? "1 fila" : `${filas} filas`} de ${n}`;
    const saltos = document.getElementById("descubrir-saltos");
    saltos.replaceChildren(...Array.from({ length: filas }, (_, i) => {
        const li = document.createElement("li");
        li.className = "bubble-font bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-2 py-1";
        li.textContent = String(n * (i + 1));
        return li;
    }));
    if (filas === 0) {
        const li = document.createElement("li");
        li.className = "text-sm text-gray-600";
        li.textContent = "Aún nada: toca «Otra fila».";
        saltos.appendChild(li);
    }
    document.getElementById("descubrir-otra").disabled = filas >= MULTIPLICADORES;
    document.getElementById("descubrir-truco").textContent = trucoDeTabla(n);
    document.getElementById("descubrir-nuevas").textContent = nuevasDeTabla(n);
}

/** El truco de la tabla con un ejemplo de la propia tabla (n × n). */
function trucoDeTabla(n) {
    const { texto } = trucoPara(n, n);
    if (n === 1 || n === 10) return texto;
    return texto.replace(/^(Truco del \d+: [^.]+\.)\s*/, `$1 Por ejemplo, ${n} × ${n}: `);
}

/**
 * Cuáles de la tabla son nuevas. Las de antes (7 × 3) ya se vieron
 * del otro lado (3 × 7): el jardín lo cuenta como la misma planta.
 */
function nuevasDeTabla(n) {
    if (n === 1) return "Todas sus multiplicaciones son nuevas: es la primera tabla de tu jardín.";
    const nuevas = [];
    for (let b = n; b <= MULTIPLICADORES; b++) nuevas.push(`${n} × ${b}`);
    const lista = nuevas.length === 1 ? nuevas[0] : `${nuevas.slice(0, -1).join(", ")} y ${nuevas.at(-1)}`;
    const vistas = n === 2 ? "2 × 1 es lo mismo que 1 × 2, que ya está en la tabla del 1"
        : `De ${n} × 1 a ${n} × ${n - 1} son las mismas que 1 × ${n} a ${n - 1} × ${n}, de las tablas de antes`;
    return `${vistas}. Las nuevas son ${nuevas.length}: ${lista}.`;
}

function practicarDescubierta() {
    startTable(descubriendo.tabla);
}
