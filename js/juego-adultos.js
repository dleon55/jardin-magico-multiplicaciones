// Cuidar el progreso (copias) y la actividad que ve la persona adulta.
//
// Salió de index.html (Hito 7.7) tal cual, sin cambiar lo que hace. Es un script
// clásico que solo declara: lo que lee o guarda vive dentro de funciones, que
// se llaman cuando el principal ya cargó (ver pruebas/archivos.spec.mjs).

// --- CUIDAR EL PROGRESO ---
//
// Lo guardado vive solo en este navegador. Tres riesgos: Safari (iPad,
// iPhone) borra lo de un sitio que pasa 7 días sin abrirse si no está
// instalado en la pantalla de inicio; borrar los datos de navegación
// lo borra; y al cambiar de tableta no hay cómo llevárselo. Por eso:
//   - se pide al navegador que lo conserve (storage.persist);
//   - en iPad o iPhone sin instalar, se avisa cómo instalarlo;
//   - la copia de seguridad es un archivo que guarda el adulto: sin
//     servidor ni cuentas, y se recupera aquí o en otro dispositivo.
const APP_COPIA = "jardin-magico-multiplicaciones";
const VERSION_COPIA = 1;
let conservado = null;   // true, false o null si el navegador no lo dice
let copiaPendiente = null;

async function pedirQueLoConserve() {
    try {
        if (!navigator.storage?.persist) return;
        conservado = (await navigator.storage.persisted()) || (await navigator.storage.persist());
    } catch (e) { conservado = null; }
}

function esIosSinInstalar() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const instalado = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
    return ios && !instalado;
}

function pintarCuidar() {
    document.getElementById("cuidar-ios").classList.toggle("hidden", !esIosSinInstalar());
    let ultima = null;
    try { ultima = localStorage.getItem(PREFIJO + "ultima-copia"); } catch (e) { ultima = null; }
    const textoUltima = ultima && fechaValida(ultima)
        ? `Última copia descargada: ${fechaLarga(ultima)}.`
        : "Aún no has guardado ninguna copia.";
    const textoConserva = conservado === true ? " Este navegador se comprometió a conservar los datos."
        : conservado === false ? " Este navegador podría borrar los datos si le falta espacio: conviene guardar una copia de vez en cuando."
        : "";
    document.getElementById("cuidar-estado").textContent =
        // «Todo se guarda solo en este dispositivo» ya lo dice el pie de la pantalla.
        `${textoUltima}${textoConserva}`;
}

/** Todo lo de los jardines (no los ajustes del dispositivo), como objeto. */
function armarCopia() {
    const datos = {};
    for (const p of perfiles) {
        datos[p.id] = {};
        for (const clave of DEL_PERFIL) {
            const valor = almacen.leerDe(p.id, clave);
            if (valor !== null) datos[p.id][clave] = valor;
        }
    }
    return { app: APP_COPIA, version: VERSION_COPIA, creada: hoy(), perfiles, datos };
}

function guardarCopia() {
    if (!perfiles.some((p) => p.iniciado)) {
        document.getElementById("aviso-copia").textContent = "Aún no hay ningún jardín que guardar.";
        return;
    }
    const texto = JSON.stringify(armarCopia());
    const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `jardin-magico-copia-${hoy()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    try { localStorage.setItem(PREFIJO + "ultima-copia", hoy()); } catch (e) { /* sin memoria */ }
    pintarCuidar();
    document.getElementById("aviso-copia").textContent =
        `Se descargó la copia ${a.download}. Comprueba que quedó en tus descargas y guárdala en un lugar seguro.`;
}

/**
 * Revisa una copia antes de usarla. Devuelve { perfiles, datos } o un
 * texto con el problema. Solo pasan claves conocidas y textos: lo que
 * hay dentro lo vuelven a validar los cargadores de siempre.
 */
function revisarCopia(texto) {
    if (texto.length > 2_000_000) return "El archivo es demasiado grande para ser una copia del jardín.";
    let c;
    try { c = JSON.parse(texto); } catch (e) { return "El archivo no es una copia del jardín."; }
    if (!c || c.app !== APP_COPIA || !Array.isArray(c.perfiles) || typeof c.datos !== "object" || c.datos === null) {
        return "El archivo no es una copia del jardín.";
    }
    if (c.version > VERSION_COPIA) return "La copia es de una versión más nueva del juego: actualízalo y vuelve a intentarlo.";
    const lista = limpiarPerfiles(c.perfiles).slice(0, 50);
    // Recuperar una copia sin jardines empezados solo borraría todo.
    if (!lista.some((p) => p.iniciado)) return "La copia no tiene ningún jardín.";
    const datos = {};
    for (const p of lista) {
        datos[p.id] = {};
        const suyos = c.datos[p.id] || {};
        for (const clave of DEL_PERFIL) {
            if (typeof suyos[clave] === "string") datos[p.id][clave] = suyos[clave];
        }
    }
    return { perfiles: lista, datos, creada: typeof c.creada === "string" && fechaValida(c.creada) ? c.creada : null };
}

function leerCopia(input) {
    const archivo = input.files?.[0];
    input.value = "";   // poder elegir el mismo archivo otra vez
    if (!archivo) return;
    archivo.text().then(mostrarCopia, () => mostrarCopia(null));
}

function mostrarCopia(texto) {
    const aviso = document.getElementById("aviso-copia");
    const r = texto === null ? "No se pudo leer el archivo." : revisarCopia(texto);
    if (typeof r === "string") {
        copiaPendiente = null;
        document.getElementById("confirmar-copia").classList.add("hidden");
        aviso.textContent = r;
        return;
    }
    copiaPendiente = r;
    aviso.textContent = "";
    const nombres = r.perfiles.filter((p) => p.iniciado).map(nombreDe);
    const deCuando = r.creada ? ` del ${fechaLarga(r.creada)}` : "";
    document.getElementById("confirmar-copia-texto").textContent =
        `La copia${deCuando} tiene ${nombres.length === 1 ? "1 jardín" : `${nombres.length} jardines`}` +
        (nombres.length ? `: ${nombres.join(", ")}` : "") +
        ". Reemplaza todos los jardines de este dispositivo. No se puede deshacer.";
    document.getElementById("confirmar-copia").classList.remove("hidden");
    document.getElementById("btn-copia-no").focus();
}

function cancelarCopia() {
    copiaPendiente = null;
    document.getElementById("confirmar-copia").classList.add("hidden");
    document.getElementById("btn-copia").focus();
}

function aplicarCopia() {
    if (!copiaPendiente) return;
    const { perfiles: lista, datos } = copiaPendiente;
    // Se guarda lo de ahora para volver a dejarlo si algo falla a
    // medias (sin espacio, almacenamiento bloqueado): o se recupera
    // todo, o no se toca nada.
    const esJardin = (k) => /^jardin:p\d+:/.test(k) || k === PREFIJO + "perfiles" || k === PREFIJO + "perfil";
    let antes = {};
    try {
        antes = Object.fromEntries(Object.keys(localStorage).filter(esJardin).map((k) => [k, localStorage.getItem(k)]));
        Object.keys(antes).forEach((k) => localStorage.removeItem(k));
        for (const [id, claves] of Object.entries(datos)) {
            for (const [clave, valor] of Object.entries(claves)) localStorage.setItem(`${PREFIJO}${id}:${clave}`, valor);
        }
        const primero = (lista.find((p) => p.iniciado) || lista[0]).id;
        localStorage.setItem(PREFIJO + "perfiles", JSON.stringify(lista));
        localStorage.setItem(PREFIJO + "perfil", primero);
    } catch (e) {
        try {
            Object.keys(localStorage).filter(esJardin).forEach((k) => localStorage.removeItem(k));
            Object.entries(antes).forEach(([k, v]) => localStorage.setItem(k, v));
        } catch (e2) { /* nada más que hacer */ }
        copiaPendiente = null;
        document.getElementById("confirmar-copia").classList.add("hidden");
        document.getElementById("aviso-copia").textContent =
            "No se pudo recuperar la copia: este dispositivo no dejó guardarla (¿sin espacio?). No se cambió nada.";
        return;
    }
    perfiles = lista;
    perfilActual = (perfiles.find((p) => p.iniciado) || perfiles[0]).id;
    cargarPerfilActual();
    copiaPendiente = null;
    document.getElementById("confirmar-copia").classList.add("hidden");
    adultosDesde = "screen-welcome";   // a elegir quién juega con lo recuperado
    pintarAdultos();
    document.getElementById("aviso-copia").textContent = "Copia recuperada.";
    document.querySelector("#screen-adultos [data-foco]").focus();
}

// --- LO QUE SE HIZO EN LAS ACTIVIDADES NUEVAS (para las personas adultas) ---
//
// «Enséñale a Lumi» y los retos con código no tocan el jardín, así que
// aquí se lleva su cuenta: cuántas rondas, cuántas dudas resueltas,
// cuántos errores de Lumi se notaron y cómo fueron los retos. Es de
// cada jardín y viaja en la copia.
const ACTIVIDAD_VACIA = {
    ensenar: { rondas: 0, dudas: 0, bien: 0, atrapados: 0, pasados: 0, ultimo: "", dias: [] },
    retos: { creados: 0, recibidos: 0, superados: 0, aciertos: 0, preguntas: 0, ultimo: "", dias: [] },
    semillero: { rondas: 0, bien: 0, preguntas: 0, ultimo: "", dias: [] },
};
const esFecha = (valor) => typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);

/** Lo guardado, limpio: solo las cuentas conocidas, enteras y no negativas. */
function limpiarActividad(guardado) {
    let dato = {};
    try { dato = JSON.parse(guardado || "{}"); } catch (e) { dato = {}; }
    const limpia = {};
    for (const [cual, vacia] of Object.entries(ACTIVIDAD_VACIA)) {
        limpia[cual] = {};
        for (const [campo, inicial] of Object.entries(vacia)) {
            const valor = dato?.[cual]?.[campo];
            limpia[cual][campo] = Array.isArray(inicial) ? (Array.isArray(valor) ? [...new Set(valor.filter(esFecha))] : [])
                : inicial === "" ? (esFecha(valor) ? valor : "")
                : (Number.isInteger(valor) && valor > 0 ? valor : 0);
        }
        // Lo guardado antes de llevar los días: al menos, el último.
        if (limpia[cual].ultimo && !limpia[cual].dias.includes(limpia[cual].ultimo)) limpia[cual].dias.push(limpia[cual].ultimo);
    }
    return limpia;
}

function actividadDePerfil(id) {
    return limpiarActividad(almacen.leerDe(id, "actividad"));
}

/** Suma a las cuentas de una actividad del jardín en uso, con la fecha de hoy. */
function anotarActividad(cual, sumas) {
    const actividad = actividadDePerfil(perfilActual);
    for (const [campo, n] of Object.entries(sumas)) actividad[cual][campo] += n;
    actividad[cual].ultimo = hoy();
    actividad[cual].dias = [...new Set([...actividad[cual].dias, hoy()])].slice(-60);
    almacen.guardar("actividad", JSON.stringify(actividad));
}

/** Una línea por actividad jugada, para la vista de adultos y el informe. */
function lineasDeActividad(id) {
    const { ensenar: e, retos: r, semillero: s } = actividadDePerfil(id);
    const dias = leerExpediciones(almacen.leerDe(id, "expediciones"));
    const lineas = [];
    if (s.rondas > 0) {
        lineas.push(`Antes de multiplicar (contar a saltos, grupos y dobles): ${s.bien} de ${s.preguntas} bien en ${s.rondas === 1 ? "1 ronda" : `${s.rondas} rondas`}.`);
    }
    if (e.rondas > 0) {
        const errores = e.atrapados + e.pasados;
        lineas.push(`Enséñale a Lumi: ${e.rondas === 1 ? "1 ronda" : `${e.rondas} rondas`}; resolvió ${e.bien} de ${e.dudas} dudas.` +
            (errores > 0 ? ` Notó ${e.atrapados} de ${errores} errores de Lumi.` : ""));
    }
    if (dias.length > 0) {
        lineas.push(`Expedición de hoy: la completó ${dias.length === 1 ? "1 día" : `${dias.length} días`} (el último, el ${fechaLarga([...dias].sort().at(-1))}).`);
    }
    const total = r.creados + r.recibidos;
    if (total > 0) {
        lineas.push(`Retos con código: ${r.aciertos} de ${r.preguntas} bien en ${total === 1 ? "1 reto" : `${total} retos`}.` +
            (r.recibidos > 0 ? ` Superó la marca en ${r.superados} de ${r.recibidos === 1 ? "1 recibido" : `${r.recibidos} recibidos`}.` : ""));
    }
    const semanas = leerRepasos(almacen.leerDe(id, "repasos"));
    if (semanas.length > 0) {
        lineas.push(`Repaso de la semana (ya sabe todas las tablas): hecho ${semanas.length === 1 ? "1 semana" : `${semanas.length} semanas`} (la última, la del ${fechaLarga([...semanas].sort().at(-1))}).`);
    }
    return lineas;
}

function otrosDePerfil(id) {
    return id === perfilActual ? otros : limpiarOtros(almacen.leerDe(id, "otros"));
}

/**
 * «de un número 9 de 10, equivalentes 4 de 8», de sus últimas 10
 * respuestas por clase, y cuál le cuesta más (con al menos 4
 * respuestas y menos de 6 de cada 10 bien).
 */
function resumenOtros(o, prefijo) {
    const filas = Object.keys(CLASES_OTROS)
        .filter((k) => k.startsWith(prefijo) && o[k]?.length)
        .map((k) => {
            const ultimas = o[k].slice(-10);
            return { k, nombre: CLASES_OTROS[k], bien: ultimas.filter((i) => i.ok).length, de: ultimas.length };
        });
    const cuesta = filas.filter((f) => f.de >= 4 && f.bien / f.de < 0.6)
        .sort((x, y) => x.bien / x.de - y.bien / y.de)[0] || null;
    return { filas, cuesta };
}

/** Los días con «Enséñale a Lumi», una expedición completa o un reto. */
function diasDeActividad(id) {
    const { ensenar: e, retos: r, semillero: s } = actividadDePerfil(id);
    return [...e.dias, ...r.dias, ...s.dias, ...leerExpediciones(almacen.leerDe(id, "expediciones"))];
}

function diasDePractica(h, o = {}, otrosDias = []) {
    const dias = new Set(otrosDias);
    Object.values(h).forEach((lista) => lista.forEach((i) => { if (i.d) dias.add(i.d); }));
    Object.values(o).forEach((lista) => lista.forEach((i) => { if (i.d) dias.add(i.d); }));
    return dias;
}

function pintarAdultos() {
    pintarCuidar();
    const contenedor = document.getElementById("adultos-perfiles");
    const iniciados = perfiles.filter((p) => p.iniciado);
    if (iniciados.length === 0) {
        const p = document.createElement("p");
        p.className = "text-center text-gray-700";
        p.textContent = "Todavía nadie ha jugado en este dispositivo.";
        contenedor.replaceChildren(p);
        return;
    }
    const hoyMs = Date.parse(`${hoy()}T00:00:00Z`);
    const ultimos = Array.from({ length: DIAS_VISTOS }, (_, i) =>
        new Date(hoyMs - (DIAS_VISTOS - 1 - i) * 86400000).toISOString().slice(0, 10));

    contenedor.replaceChildren(...iniciados.map((perfil) => {
        const h = intentosDePerfil(perfil.id);
        const cuenta = conIntentos(h, () => cuentaPorEstado());
        const marchitas = conIntentos(h, () => plantas().filter(({ a, b }) => estaMarchita(a, b)).length);
        const cuesta = loQueCuesta(h);
        const o = otrosDePerfil(perfil.id);
        const dias = diasDePractica(h, o, diasDeActividad(perfil.id));

        const tarjeta = document.createElement("section");
        tarjeta.className = "tarjeta-adulto bg-white border-2 border-green-200 rounded-2xl p-3 space-y-2";
        tarjeta.dataset.perfil = perfil.id;
        tarjeta.setAttribute("aria-labelledby", `adulto-${perfil.id}`);
        const parrafo = (clase, texto) => {
            const p = document.createElement("p");
            p.className = clase;
            p.textContent = texto;
            return p;
        };

        const titulo = document.createElement("h3");
        titulo.id = `adulto-${perfil.id}`;
        titulo.className = "bubble-font text-xl text-green-800";
        titulo.textContent = `${perfil.emoji} ${nombreDe(perfil)}`;

        const resumen = parrafo("adulto-resumen text-gray-900 font-bold",
            `Flores: ${cuenta.florecida} de ${plantas().length}. Casi: ${cuenta.casi}. Practicando: ${cuenta.practica}.` +
            (marchitas ? ` Marchitas: ${marchitas}.` : ""));

        const veces = (x) => x.fallos < x.de ? `falló ${x.fallos} de las últimas ${x.de}`
            : x.de === 1 ? "falló la única vez" : `falló las ${x.de} últimas veces`;
        const nombreCuesta = cuesta.map((x) => `${x.a} × ${x.b} (${veces(x)})`);
        const cuestaTexto = Object.keys(h).length === 0 ? "Aún no ha jugado a multiplicar."
            : cuesta.length === 0 ? "Le cuestan más: nada por ahora."
            : `Le cuestan más: ${nombreCuesta.join(", ")}.`;
        const cuestaP = parrafo("adulto-cuesta text-gray-800", cuestaTexto);
        const confusiones = confusionesFrecuentes(h);

        const practicados = ultimos.filter((d) => dias.has(d)).length;
        const ultimoDia = [...dias].sort().at(-1);
        const diasP = parrafo("adulto-dias text-gray-800",
            `Practicó ${practicados} de los últimos ${DIAS_VISTOS} días.` +
            (ultimoDia ? ` Último día: ${fechaLarga(ultimoDia)}.` : ""));
        const semana = document.createElement("ol");
        // Dos semanas de 7: antes, en el teléfono, se partía al azar (11 + 3).
        semana.className = "adulto-semanas grid grid-cols-7 gap-1 w-max";
        semana.setAttribute("aria-label", `Los últimos ${DIAS_VISTOS} días`);
        ultimos.forEach((d) => {
            const li = document.createElement("li");
            const si = dias.has(d);
            li.className = `w-6 h-6 rounded text-xs flex items-center justify-center ${si ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 border border-gray-300"}`;
            li.innerHTML = `<span aria-hidden="true">${si ? "✓" : ""}</span>`;
            const sr = document.createElement("span");
            sr.className = "sr-only";
            sr.textContent = `${fechaLarga(d)}: ${si ? "practicó" : "no practicó"}`;
            li.appendChild(sr);
            semana.appendChild(li);
        });

        // Una sola moneda: las estrellas. Se dice cómo se ganan y la meta.
        const estrellasP = Number(almacen.leerDe(perfil.id, "estrellas")) || 0;
        let metas = 0;
        try { metas = (JSON.parse(almacen.leerDe(perfil.id, "misiones") || "{}").dias || []).length; } catch (e) { metas = 0; }
        const monedaP = parrafo("adulto-estrellas text-gray-800",
            `Estrellas: ${Math.max(0, estrellasP)}. Se consiguen 1 por acierto, 5 cuando una multiplicación florece, ` +
            `${BONO_MISION} por la meta de hoy (acertar ${META_DIARIA} en un día) y de 1 a 3 por nivel de la Aventura; ` +
            `se gastan en el vivero. Metas cumplidas: ${metas} ${metas === 1 ? "día" : "días"}.`);
        const piezas = [titulo, resumen, cuestaP, diasP, semana, monedaP];
        if (confusiones.length) {
            piezas.splice(3, 0, parrafo("adulto-confusiones text-gray-800",
                `Se le cruzan: ${confusiones.map(([n, v]) => `${n} (${v} veces)`).join("; ")}. ` +
                "El juego se lo dice al fallar y, si se repite, las pregunta juntas."));
        }
        const av = aventuraDePerfil(perfil.id);
        if (puntajeAventura(av) > 0) {
            const m = Math.floor(av.alcanzado / NIVELES_POR_MUNDO);
            piezas.push(parrafo("adulto-aventura text-gray-800",
                `La Aventura: ${puntajeAventura(av)} puntos, ${estrellasAventura(av)} estrellas; va en el mundo ${m + 1} (${AVENTURA_MUNDOS[m].retos.toLowerCase()}).` +
                (av.sinPrisa ? " Juega «sin prisa»: los enemigos lo esperan." : "")));
        }
        const actividad = lineasDeActividad(perfil.id);
        if (actividad.length) {
            const caja = document.createElement("div");
            caja.className = "adulto-actividad text-gray-800 space-y-1";
            caja.append(...actividad.map((linea) => parrafo("", linea)));
            piezas.push(caja);
        }
        const cifrasLetra = Object.keys(letraDePerfil(perfil.id).muestras);
        if (cifrasLetra.length) {
            const lista = cifrasLetra.map((c) => `el ${c}`);
            const caja = document.createElement("div");
            caja.className = "adulto-letra text-gray-800 space-y-1";
            caja.appendChild(parrafo("", `Escribir con el dedo: aprendió cómo escribe ${lista.length === 1 ? lista[0] : `${lista.slice(0, -1).join(", ")} y ${lista.at(-1)}`}. Si lo enseñó mal jugando y ahora lee cosas raras, se puede olvidar.`));
            const olvidar = document.createElement("button");
            olvidar.type = "button";
            olvidar.className = "btn-olvidar-letra enlace-tactil text-sm font-bold text-indigo-800 underline";
            olvidar.textContent = "Olvidar cómo escribe";
            olvidar.onclick = () => { olvidarLetraDe(perfil.id); pintarAdultos(); };
            caja.appendChild(olvidar);
            piezas.push(caja);
        }
        const temas = document.createElement("div");
        temas.className = "adulto-temas grid gap-2 sm:grid-cols-2";
        for (const [prefijo, nombre, clase] of [["fraccion:", "Fracciones", "adulto-fracciones"], ["logica:", "Retos de lógica", "adulto-retos"], ["residuo:", "División con residuo", "adulto-residuo"], ["multiplos:", "Múltiplos y divisores", "adulto-multiplos"], ["area:", "Perímetro y área", "adulto-area"], ["dinero:", "Decimales y dinero", "adulto-dinero"], ["porcentaje:", "Porcentajes", "adulto-porcentajes"], ["decimales:", "Fracciones decimales", "adulto-decimales"], ["tiempo:", "Medidas de tiempo", "adulto-tiempo"], ["calendario:", "El calendario", "adulto-calendario"]]) {
            const { filas, cuesta: dificil } = resumenOtros(o, prefijo);
            if (filas.length === 0) continue;
            // Antes, un párrafo por tema: diez seguidos eran un muro de texto.
            // Ahora una tarjeta: el nombre, una pastilla por clase y lo que le
            // cuesta en su renglón. El texto que se lee es el mismo (las
            // comas y los dos puntos van ocultos, para el lector de pantalla).
            const tarjeta = document.createElement("div");
            tarjeta.className = `${clase} adulto-tema bg-white border border-gray-200 rounded-xl p-2 text-gray-800`;
            const titulo = document.createElement("p");
            titulo.className = "font-bold text-gray-900";
            titulo.append(nombre);
            const oculto = (t) => { const e = document.createElement("span"); e.className = "sr-only"; e.textContent = t; return e; };
            titulo.append(oculto(" (sus últimas respuestas): "));
            const pastillas = document.createElement("p");
            pastillas.className = "flex flex-wrap gap-1 mt-1 text-sm";
            filas.forEach((f, i) => {
                const pastilla = document.createElement("span");
                const nivel = f.bien / f.de >= 0.8 ? "bg-green-100 border-green-300" : f.bien / f.de >= 0.5 ? "bg-amber-50 border-amber-300" : "bg-rose-50 border-rose-300";
                pastilla.className = `adulto-clase border rounded-full px-2 py-0.5 ${nivel}`;
                pastilla.textContent = `${f.nombre} ${f.bien} de ${f.de}`;
                pastillas.append(pastilla, oculto(i < filas.length - 1 ? ", " : "."));
            });
            tarjeta.append(titulo, pastillas);
            if (dificil) {
                let texto = ` Le cuesta más: ${dificil.nombre}.`;
                if (BOTON_CLASE_FRACCION[dificil.k]) texto += ` Para practicar solo eso: «🍕 Fracciones» → «${BOTON_CLASE_FRACCION[dificil.k]}».`;
                tarjeta.append(parrafo("adulto-cuesta text-sm text-amber-900 mt-1", texto));
            }
            temas.append(tarjeta);
        }
        if (temas.children.length) piezas.push(temas);
        if (marchitas > 0 || cuesta.length > 0) {
            const porDonde = cuesta.length > 0 && marchitas > 0 ? "por lo que falló y por las flores marchitas"
                : cuesta.length > 0 ? "por lo que falló" : "por las flores marchitas";
            piezas.push(parrafo("adulto-consejo text-sm text-amber-900",
                `Para repasar: «Practicar lo que me falta» empieza justo ${porDonde}.`));
        }

        const informe = document.createElement("button");
        informe.type = "button";
        informe.className = "btn-informe min-h-11 bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded-lg";
        informe.textContent = "Imprimir o guardar el informe";
        informe.onclick = () => imprimirInforme(perfil.id);
        piezas.push(informe);

        // Borrar pide confirmar: no se puede deshacer.
        const borrar = document.createElement("div");
        borrar.className = "pt-1";
        const pedir = document.createElement("button");
        pedir.type = "button";
        pedir.className = "btn-borrar enlace-tactil text-sm font-bold text-red-800 underline";
        pedir.textContent = "Borrar este jardín";
        const confirmar = document.createElement("div");
        confirmar.className = "confirmar-borrar hidden bg-red-50 border border-red-200 rounded-xl p-2 space-y-2";
        confirmar.appendChild(parrafo("text-sm text-red-900",
            `Se borrarán las flores, estrellas y amigos de ${nombreDe(perfil)}. No se puede deshacer.`));
        const si = document.createElement("button");
        si.type = "button";
        si.className = "btn-borrar-si min-h-11 bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded-lg mr-2";
        si.textContent = "Sí, borrarlo";
        const no = document.createElement("button");
        no.type = "button";
        no.className = "btn-borrar-no min-h-11 bg-white border border-gray-400 text-gray-800 font-bold px-4 py-2 rounded-lg";
        no.textContent = "No, dejarlo";
        confirmar.append(si, no);
        pedir.onclick = () => { confirmar.classList.remove("hidden"); pedir.classList.add("hidden"); no.focus(); };
        no.onclick = () => { confirmar.classList.add("hidden"); pedir.classList.remove("hidden"); pedir.focus(); };
        si.onclick = () => {
            const eraElDeAhora = perfil.id === perfilActual;
            borrarPerfil(perfil.id);
            if (eraElDeAhora) adultosDesde = "screen-welcome";
            pintarAdultos();
            document.querySelector("#screen-adultos [data-foco]").focus();
        };
        borrar.append(pedir, confirmar);
        piezas.push(borrar);

        tarjeta.append(...piezas);
        return tarjeta;
    }));
}
