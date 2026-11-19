// EL CALENDARIO (issue #108): días, semanas y meses.
//
// Nada cuenta de 10 en 10: la semana tiene 7 días, los meses 28, 30 o 31, y
// el año da la vuelta de diciembre a enero. Se une con la tabla del 7
// (3 semanas = 21 días) y con la división con residuo (10 días son 1 semana
// y 3 días: de martes, a viernes). Cuatro clases, para elegir:
//   semanas      ¿Cuántos días son 2 semanas y 3 días?                → 17
//   diaSemana    Hoy es martes. ¿Qué día será en 10 días?              → viernes
//                El 1 de marzo es jueves (calendario dibujado): ¿y el 15? → jueves
//   meses        ¿Cuántos días tiene abril? / 3 meses después de noviembre
//   cuantosDias  Del 25 de mayo al 3 de junio, ¿cuántos días pasan?     → 9
// Las falsas son los errores típicos, cada uno explicado: semanas de 10 o
// de 5 días, contar el día de hoy, no dar la vuelta a la semana o al año,
// «todos los meses tienen 30 días», restar las fechas sin mirar el mes.
//
// No usa la fecha del aparato: todo se inventa en cada reto. Febrero tiene
// 28 días (los años bisiestos quedan fuera). Un día de la semana o un mes,
// como opción, vale su lugar más 1 (lunes = 1, enero = 1). Es un script
// clásico que solo declara (ver pruebas/archivos.spec.mjs).

const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** 0 → lunes, 8 → martes, −1 → domingo: dando la vuelta a la semana. */
const diaDeLaSemana = (i) => DIAS_SEMANA[((i % 7) + 7) % 7];
const vueltaSemana = (i) => ((i % 7) + 7) % 7;
const vueltaAnio = (i) => ((i % 12) + 12) % 12;
/** «1 día», «3 días»; «1 semana», «2 semanas». */
const enDias = (n) => `${n} ${n === 1 ? "día" : "días"}`;
const enSemanas = (n) => `${n} ${n === 1 ? "semana" : "semanas"}`;

/** Diez preguntas: tres de semanas, tres de qué día será, dos de meses y dos de días entre fechas. */
function bolsaDeCalendario() {
    const pocas = parejasConocidas().length < MIN_CONOCIDAS;
    const clases = barajar(["semanas", "semanas", "semanas", "diaSemana", "diaSemana", "diaSemana", "meses", "meses", "cuantosDias", "cuantosDias"]);
    const vistas = new Set();
    return clases.map((clase) => {
        let reto;
        let intentos = 0;
        do { reto = crearRetoCalendario(clase, pocas); } while (vistas.has(JSON.stringify(reto)) && ++intentos < 30);
        vistas.add(JSON.stringify(reto));
        return { a: numerosDeCalendario(reto)[0], b: 1, reto };
    });
}

function crearRetoCalendario(clase, pocas) {
    if (clase === "semanas") {
        // Con pocas tablas sabidas, semanas enteras hasta 4; si no, hasta 5 y con días sueltos.
        if (pocas) return { clase, s: entre(2, 4), d: 0 };
        return { clase, s: entre(2, 5), d: Math.random() < 0.3 ? 0 : entre(1, 6) };
    }
    if (clase === "diaSemana") {
        // Contar desde hoy, o leer un calendario dibujado.
        if (Math.random() < 0.5) return { clase, forma: "hoy", i: entre(0, 6), n: pocas ? entre(2, 7) : entre(8, 20) };
        return { clase, forma: "mes", mes: entre(0, 11), i: entre(0, 6), k: pocas ? entre(2, 8) : entre(9, 28) };
    }
    if (clase === "meses") {
        if (Math.random() < 0.5) return { clase, forma: "dias", mes: entre(0, 11) };
        // Con muchas tablas, casi siempre se da la vuelta al año.
        const mes = pocas ? entre(0, 8) : entre(6, 11);
        return { clase, forma: "despues", mes, n: pocas ? entre(1, 3) : entre(12 - mes, 11) };
    }
    // cuantosDias: con pocas, dentro de un mes; con muchas, cruzando al siguiente.
    const mes = entre(0, 11);
    if (pocas) {
        const a = entre(2, 15);
        return { clase, mes, a, b: a + entre(4, 12) };
    }
    return { clase, mes, a: DIAS_MES[mes] - entre(1, 8), b: entre(2, 9) };
}

/** Un número del 1 al 9 que represente el reto (para el color de la planta). */
function numerosDeCalendario(r) {
    const n = r.s ?? (r.i !== undefined ? r.i + 1 : (r.mes % 9) + 1);
    return [((n - 1) % 9) + 1, 1];
}

/**
 * Un mes dibujado: los días de la semana arriba y solo la primera semana con
 * números (el resto, cuadritos vacíos). Para saber el 15 hay que contar de 7
 * en 7, no leerlo.
 */
function calendarioSVG(mes, inicio) {
    const ancho = 7 * 18 + 4, filas = Math.ceil((inicio + DIAS_MES[mes]) / 7);
    let s = `<svg class="calendario-dibujo shrink-0" viewBox="0 0 ${ancho} ${32 + filas * 18}" width="${ancho}" height="${32 + filas * 18}" aria-hidden="true" focusable="false">`;
    s += `<text x="${ancho / 2}" y="9" text-anchor="middle" font-size="10" font-weight="700" fill="#4338ca">${MESES[mes]}</text>`;
    DIAS_SEMANA.forEach((d, j) => {
        s += `<text x="${2 + j * 18 + 8}" y="23" text-anchor="middle" font-size="8" font-weight="700" fill="${j >= 5 ? "#be123c" : "#1f2937"}">${d[0].toUpperCase()}</text>`;
    });
    for (let dia = 1; dia <= DIAS_MES[mes]; dia++) {
        const lugar = inicio + dia - 1;
        const x = 2 + (lugar % 7) * 18, y = 28 + Math.floor(lugar / 7) * 18;
        const conNumero = lugar < 7;
        s += `<rect class="${conNumero ? "dia-con-numero" : "dia-vacio"}" x="${x}" y="${y}" width="16" height="16" rx="3" fill="${conNumero ? "#e0e7ff" : "#f3f4f6"}" stroke="#c7d2fe"/>`;
        if (conNumero) s += `<text x="${x + 8}" y="${y + 8}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" fill="#1e1b4b">${dia}</text>`;
    }
    return `${s}</svg>`;
}

function armarCalendario(reto) {
    const falsas = [];
    const anadir = (opcion, porQue, vale) => {
        if (opcion.valor === vale || opcion.valor < 1 || falsas.some((f) => f.opcion.valor === opcion.valor) || falsas.length >= 3) return;
        falsas.push({ opcion, porQue });
    };
    const dias = (n) => ({ valor: n, etiqueta: enDias(n) });
    const dia = (i) => ({ valor: vueltaSemana(i) + 1, etiqueta: diaDeLaSemana(i) });
    const mesOp = (i) => ({ valor: vueltaAnio(i) + 1, etiqueta: MESES[vueltaAnio(i)] });
    const { clase } = reto;
    let p;
    if (clase === "semanas") {
        const { s, d } = reto;
        const r = 7 * s + d;
        const mas = d ? ` y ${enDias(d)}` : "";
        const cuenta = d ? `${s} × 7 = ${7 * s}, y ${7 * s} + ${d} = ${r}.` : `${s} × 7 = ${r}.`;
        anadir(dias(10 * s + d), `Una semana tiene 7 días, no 10: ${cuenta}`, r);
        anadir(dias(5 * s + d), `5 son los días de escuela; la semana entera tiene 7: ${cuenta}`, r);
        anadir(dias(s + 7 + d), `Sumaste ${s} + 7, pero son ${enSemanas(s)} de 7 días: se multiplica. ${cuenta}`, r);
        if (d) anadir(dias(7 * s), `Te faltaron los ${enDias(d)}: ${cuenta}`, r);
        anadir(dias(r + 7), `Es una semana de más: ${cuenta}`, r);
        p = { respuesta: r, opcionBuena: dias(r), opcionesMedianas: true,
            texto: `¿Cuántos días son ${enSemanas(s)}${mas}?`,
            pista: `Cada semana tiene 7 días: es la tabla del 7.${d ? " Luego suma los días que sobran." : ""}`,
            explicacion: `${enSemanas(s)[0].toUpperCase()}${enSemanas(s).slice(1)}${mas} son ${r} días: ${cuenta}`,
            voz: `¿Cuántos días son ${enSemanas(s)}${mas}?` };
    } else if (clase === "diaSemana" && reto.forma === "hoy") {
        const { i, n } = reto;
        const q = Math.floor(n / 7), resto = n % 7;
        const buena = dia(i + n);
        const vueltas = q ? `${n} días son ${enSemanas(q)}${resto ? ` y ${enDias(resto)}` : ""}: cada semana se vuelve al ${DIAS_SEMANA[i]}${resto ? `, y luego ${resto} más` : ""}.` : `Del ${DIAS_SEMANA[i]}, ${n} días más.`;
        const camino = `${vueltas} Es ${buena.etiqueta}.`;
        anadir(dia(i + n - 1), `Contaste el ${DIAS_SEMANA[i]} como el primer día, pero hoy no cuenta: se empieza mañana. ${camino}`, buena.valor);
        if (q) anadir(dia(i + q), `Contaste las semanas (${q}) y no los días que sobran. ${camino}`, buena.valor);
        anadir(dia(i - n), `Fuiste hacia atrás: «en ${n} días» es hacia adelante. ${camino}`, buena.valor);
        anadir(dia(i + n + 1), `Es un día de más. ${camino}`, buena.valor);
        anadir(dia(i + n + 2), camino, buena.valor);
        p = { respuesta: buena.valor, opcionBuena: buena, opcionesLargas: true,
            texto: `Hoy es ${DIAS_SEMANA[i]}. ¿Qué día será en ${n} días?`,
            pista: n >= 7 ? `Cada 7 días es otra vez ${DIAS_SEMANA[i]}. ¿Cuántas semanas caben en ${n}, y cuántos días sobran?` : `Cuenta desde mañana: el primer día después del ${DIAS_SEMANA[i]} es el ${diaDeLaSemana(i + 1)}.`,
            explicacion: `En ${n} días será ${buena.etiqueta}. ${vueltas}`,
            voz: `Hoy es ${DIAS_SEMANA[i]}. ¿Qué día será en ${n} días?` };
    } else if (clase === "diaSemana") {
        const { mes, i, k } = reto;
        const buena = dia(i + k - 1);
        const q = Math.floor((k - 1) / 7);
        const sobran = (k - 1) % 7;
        const camino = !q ? `Del 1 al ${k} hay ${enDias(k - 1)}: el ${k} es ${buena.etiqueta}.`
            : !sobran ? `Del 1 al ${k} hay ${k - 1} días: ${enSemanas(q)} justas, así que el ${k} cae igual que el 1: ${buena.etiqueta}.`
            : `Del 1 al ${k} hay ${k - 1} días: ${enSemanas(q)} y ${enDias(sobran)}. El ${1 + 7 * q} también es ${DIAS_SEMANA[i]}, y el ${k} es ${buena.etiqueta}.`;
        anadir(dia(i + k), `Contaste el 1 dos veces: del 1 al ${k} hay ${k - 1} días, no ${k}. ${camino}`, buena.valor);
        anadir(dia(k - 1), `Eso sería si el 1 fuera lunes, pero es ${DIAS_SEMANA[i]}. ${camino}`, buena.valor);
        anadir(dia(i + k - 2), `Es un día de menos. ${camino}`, buena.valor);
        anadir(dia(i + q), `Contaste las semanas y no los días que sobran. ${camino}`, buena.valor);
        anadir(dia(i + k + 1), camino, buena.valor);
        p = { respuesta: buena.valor, opcionBuena: buena, opcionesLargas: true,
            texto: `El 1 de ${MESES[mes]} es ${DIAS_SEMANA[i]}. ¿Qué día de la semana es el ${k}?`,
            dibujo: calendarioSVG(mes, i),
            descripcion: `Un calendario de ${MESES[mes]} con los números de la primera semana: el 1 cae en ${DIAS_SEMANA[i]}.`,
            pista: `En el calendario, bajar una fila es sumar 7 días: el 1, el 8, el 15, el 22 y el 29 caen el mismo día de la semana.`,
            explicacion: `El ${k} de ${MESES[mes]} es ${buena.etiqueta}. ${camino}`,
            voz: `El 1 de ${MESES[mes]} es ${DIAS_SEMANA[i]}. ¿Qué día de la semana es el ${k}?` };
    } else if (clase === "meses" && reto.forma === "dias") {
        const { mes } = reto;
        const r = DIAS_MES[mes];
        const regla = "Tienen 31 días enero, marzo, mayo, julio, agosto, octubre y diciembre; 30, abril, junio, septiembre y noviembre; y febrero, 28.";
        anadir(dias(30), `No todos los meses tienen 30 días. ${regla}`, r);
        anadir(dias(31), `${MESES[mes][0].toUpperCase()}${MESES[mes].slice(1)} no tiene 31. ${regla}`, r);
        anadir(dias(28), `Solo febrero tiene 28. ${regla}`, r);
        anadir(dias(29), `29 días los tiene febrero solo en los años bisiestos. ${regla}`, r);
        p = { respuesta: r, opcionBuena: dias(r), opcionesMedianas: true,
            texto: `¿Cuántos días tiene ${MESES[mes]}${mes === 1 ? " (en un año que no es bisiesto)" : ""}?`,
            pista: "Cierra los puños y cuenta los meses en los nudillos y los huecos: en un nudillo, 31 días; en un hueco, 30, y febrero 28.",
            explicacion: `${MESES[mes][0].toUpperCase()}${MESES[mes].slice(1)} tiene ${r} días.`,
            voz: `¿Cuántos días tiene ${MESES[mes]}${mes === 1 ? ", en un año que no es bisiesto" : ""}?` };
    } else if (clase === "meses") {
        const { mes, n } = reto;
        const buena = mesOp(mes + n);
        const daVuelta = mes + n > 11;
        const hastaDic = 11 - mes;
        const faltan = n - hastaDic - 1;   // después de llegar a enero
        const yMas = faltan === 0 ? "" : faltan === 1 ? ", y falta 1 más" : `, y faltan ${faltan} más`;
        const camino = !daVuelta ? `Contando desde ${MESES[vueltaAnio(mes + 1)]}, ${n} meses llegan a ${buena.etiqueta}.`
            : `${hastaDic === 0 ? "" : `De ${MESES[mes]} a diciembre ${hastaDic === 1 ? "es 1 mes" : `son ${hastaDic} meses`}; `}después de diciembre sigue enero${yMas}: ${buena.etiqueta}.`;
        anadir(mesOp(mes + n - 1), `Contaste ${MESES[mes]} como el primero, pero se empieza en el mes siguiente. ${camino}`, buena.valor);
        if (daVuelta) anadir(mesOp(11), `El año no se acaba en diciembre: después viene enero. ${camino}`, buena.valor);
        anadir(mesOp(mes - n), `Fuiste hacia atrás: «después» es hacia adelante. ${camino}`, buena.valor);
        anadir(mesOp(mes + n + 1), `Es un mes de más. ${camino}`, buena.valor);
        anadir(mesOp(mes + n + 2), camino, buena.valor);
        p = { respuesta: buena.valor, opcionBuena: buena, opcionesLargas: true,
            texto: `¿Qué mes es ${n === 1 ? "1 mes" : `${n} meses`} después de ${MESES[mes]}?`,
            pista: `Cuenta desde el mes que sigue a ${MESES[mes]}. Después de diciembre, el año vuelve a empezar en enero.`,
            explicacion: `${n === 1 ? "1 mes" : `${n} meses`} después de ${MESES[mes]} es ${buena.etiqueta}. ${camino}`,
            voz: `¿Qué mes es ${n === 1 ? "1 mes" : `${n} meses`} después de ${MESES[mes]}?` };
    } else {
        const { mes, a, b } = reto;
        const mismo = b > a;   // con pocas tablas, dentro de un mes; si no, el 2.º día es del mes siguiente
        let r, texto, camino;
        if (mismo) {
            r = b - a;
            texto = `Del ${a} al ${b} de ${MESES[mes]}, ¿cuántos días pasan?`;
            camino = `${b} − ${a} = ${r}.`;
            anadir(dias(r + 1), `Contaste los dos días, el ${a} y el ${b}: del ${a} al ${a + 1} pasa 1 día, no 2. ${camino}`, r);
            anadir(dias(a + b), `Se resta, no se suma: ${camino}`, r);
            anadir(dias(r - 1), `Es un día de menos. ${camino}`, r);
            anadir(dias(r + 2), camino, r);
        } else {
            const sig = vueltaAnio(mes + 1);
            const dm = DIAS_MES[mes];
            r = dm - a + b;
            texto = `Del ${a} de ${MESES[mes]} al ${b} de ${MESES[sig]}, ¿cuántos días pasan?`;
            camino = `${MESES[mes][0].toUpperCase()}${MESES[mes].slice(1)} tiene ${dm} días: del ${a} al ${dm} son ${dm - a}, y luego ${b} de ${MESES[sig]}: ${dm - a} + ${b} = ${r}.`;
            anadir(dias(a - b), `Restaste ${a} − ${b}, pero son de meses distintos. ${camino}`, r);
            const otro = dm === 30 ? 31 : 30;
            anadir(dias(otro - a + b), `Eso sería si ${MESES[mes]} tuviera ${otro} días. ${camino}`, r);
            anadir(dias(r + 1), `Contaste los dos días, el ${a} y el ${b}. ${camino}`, r);
            anadir(dias(r - 1), `Es un día de menos. ${camino}`, r);
            anadir(dias(r + 2), camino, r);
        }
        p = { respuesta: r, opcionBuena: dias(r), opcionesMedianas: true, texto,
            pista: mismo ? `Resta los dos números: cuántos días hay que avanzar desde el ${a} para llegar al ${b}.` : `Ve por partes: primero hasta el último día de ${MESES[mes]} (que tiene ${DIAS_MES[mes]}), y luego los días del mes siguiente.`,
            explicacion: `Pasan ${r} días. ${camino}`,
            voz: texto };
    }
    const tres = falsas.slice(0, 3);
    const { opcionBuena, ...resto } = p;
    return {
        tipo: "calendario", clase, reto, ...resto,
        opciones: barajar([opcionBuena, ...tres.map((f) => f.opcion)]),
        porQue: Object.fromEntries(tres.map((f) => [f.opcion.valor, f.porQue])),
    };
}

/**
 * La ayuda. Semanas: una fila de 7 cuadritos por semana. Qué día será: los
 * 7 días en fila, con hoy marcado. Calendario: la columna del 1 llena (1, 8,
 * 15, 22, 29). Días del mes: los nudillos. Meses después: los 12 en fila.
 * Días entre fechas: el camino pintado.
 */
function dibujarCalendario() {
    const { reto } = pregunta;
    document.getElementById("help-truco").innerText = pistaPara().texto;
    const caja = document.createElement("div");
    caja.className = "bg-white border-2 border-indigo-100 rounded-xl p-3 space-y-1 w-72 max-w-full shrink-0";
    caja.setAttribute("aria-hidden", "true");
    const cuadros = (n, clase, color) => Array.from({ length: n }, () => `<span class="${clase} block w-6 h-6 rounded ${color}"></span>`).join("");
    const fila = (contenido, extra = "") => `<div class="flex flex-wrap gap-1 items-center justify-center ${extra}">${contenido}</div>`;
    const chip = (texto, clase, color) => `<span class="${clase} inline-block px-1.5 py-1 rounded text-xs font-bold ${color}">${texto}</span>`;
    let explica;
    if (reto.clase === "semanas") {
        caja.innerHTML = Array.from({ length: reto.s }, () => fila(cuadros(7, "dia-semana", "bg-indigo-400"), "fila-semana")).join("") +
            (reto.d ? fila(cuadros(reto.d, "dia-suelto", "bg-amber-400")) : "");
        explica = "Cada fila azul es una semana: 7 días. Los amarillos son los días sueltos.";
    } else if (reto.clase === "diaSemana" && reto.forma === "hoy") {
        caja.innerHTML = fila(DIAS_SEMANA.map((d, j) => chip(d.slice(0, 3), j === reto.i ? "dia-hoy" : "dia-chip", j === reto.i ? "bg-rose-700 text-white" : "bg-indigo-100 text-indigo-900")).join(""));
        explica = `Hoy es el rojo. Después del domingo vuelve el lunes: cada 7 días es otra vez ${DIAS_SEMANA[reto.i]}.`;
    } else if (reto.clase === "diaSemana") {
        // La columna del 1: bajar una fila es sumar 7.
        const cabeza = DIAS_SEMANA.map((d) => `<span class="w-7 text-center text-xs font-bold text-indigo-900">${d[0].toUpperCase()}</span>`).join("");
        let celdas = "";
        for (let lugar = 0; lugar < 35; lugar++) {
            const n = lugar - reto.i + 1;
            const columna = lugar % 7 === reto.i && n >= 1 && n <= DIAS_MES[reto.mes];
            celdas += `<span class="${columna ? "dia-columna bg-indigo-600 text-white" : "bg-gray-100"} w-7 h-6 rounded text-xs font-bold flex items-center justify-center">${columna ? n : ""}</span>`;
        }
        caja.innerHTML = `<div class="grid gap-0.5 justify-center" style="grid-template-columns: repeat(7, auto)">${cabeza}${celdas}</div>`;
        explica = `Todos los de la columna azul son ${DIAS_SEMANA[reto.i]}: cada fila suma 7 días.`;
    } else if (reto.clase === "meses" && reto.forma === "dias") {
        const nudillo = [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];
        // Dos puños: de enero a julio, y se vuelve a empezar en agosto.
        const punio = (desde, hasta) => `<div class="punio flex gap-1 items-end justify-center">${MESES.slice(desde, hasta).map((m, j) => `<span class="flex flex-col items-center w-6"><span class="${nudillo[desde + j] ? "nudillo h-6 bg-indigo-500" : "hueco h-3 bg-indigo-200"} block w-4 rounded-t-full"></span><span class="text-[10px] font-bold text-indigo-900">${m.slice(0, 3)}</span></span>`).join("")}</div>`;
        caja.innerHTML = punio(0, 7) + punio(7, 12);
        explica = "Los meses en los nudillos de los dos puños: los altos (nudillos) tienen 31 días; los huecos, 30, y febrero 28. Julio acaba un puño y agosto empieza el otro: los dos tienen 31.";
    } else if (reto.clase === "meses") {
        caja.innerHTML = fila(MESES.map((m, j) => chip(m.slice(0, 3), j === reto.mes ? "mes-inicio" : "mes-chip", j === reto.mes ? "bg-rose-700 text-white" : "bg-indigo-100 text-indigo-900")).join(""));
        explica = `${MESES[reto.mes][0].toUpperCase()}${MESES[reto.mes].slice(1)} es el rojo. Después de diciembre sigue enero.`;
    } else {
        const { mes, a, b } = reto;
        const mismo = b > a;
        const desde = (n0, n1, pintar) => Array.from({ length: n1 - n0 + 1 }, (_, j) => {
            const n = n0 + j;
            const paso = pintar(n);
            return `<span class="${paso ? "dia-camino bg-amber-400" : n === a && n0 <= a ? "dia-inicio bg-rose-700 text-white" : "bg-gray-100"} w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center">${n}</span>`;
        }).join("");
        if (mismo) {
            caja.innerHTML = fila(desde(a, b, (n) => n > a));
        } else {
            const sig = vueltaAnio(mes + 1);
            caja.innerHTML = `<p class="text-xs font-bold text-indigo-900">${MESES[mes]}</p>` + fila(desde(a, DIAS_MES[mes], (n) => n > a)) +
                `<p class="text-xs font-bold text-indigo-900">${MESES[sig]}</p>` + fila(desde(1, b, () => true));
        }
        explica = "El rojo es el día de salida. Cada amarillo es un día que pasa: cuéntalos.";
    }
    document.getElementById("help-explain").innerText = explica;
    document.getElementById("help-visual-container").replaceChildren(caja);
}
