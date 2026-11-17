// SONIDO: música de fondo, audio sintético y sonidos por capas.
//
// Separado de index.html para que el archivo principal no crezca sin fin.
// Es un script clásico (no un módulo): lo que declara es global, como
// cuando vivía dentro de index.html, y se carga antes del script principal.
// Lo que aquí se usa del principal se usa solo dentro de funciones, cuando
// ya está cargado todo.

// --- MÚSICA DE FONDO ---
// Compuesta para el juego y tocada con el sintetizador del navegador: sin
// archivos ni internet. Dos piezas: «jardín», tranquila, y «aventura»,
// con más ritmo. Va bajita, baja más mientras habla la voz, y se calla
// si se cambia de app. Ocho compases que se repiten: melodía en escala
// pentatónica (nunca suena «mal»), bajo y un acorde suave por compás.
// Ganancia de la música según el ajuste (0 a 10): 5, el de serie, da 0,05.
const VOLUMEN_MAXIMO_MUSICA = 0.1;
const volumenMusica = () => (VOLUMEN_MAXIMO_MUSICA * ajustes.volumenMusica) / 10;
// Cada pieza: escala (semitonos desde la base), acordes (uno por compás,
// en semitonos desde la base) y ocho compases de melodía en grados de
// su escala (0 = la base; 5 = la base una octava arriba, si la escala
// tiene 5 notas). «pulso»: cada cuántas corcheas suena el bajo.
const MAYOR_PENTA = [0, 2, 4, 7, 9];
const MENOR_PENTA = [0, 3, 5, 7, 10];
const LIDIA = [0, 2, 4, 6, 7, 9, 11];   // la cuarta subida suena «espacial»
const FRIGIA_DOMINANTE = [0, 1, 4, 5, 7, 8, 10];   // el sabor del desierto
// Acordes por su grado: mayúscula, mayor; minúscula, menor (y «m» en los de tono menor).
const AC = {
    I: [0, 4, 7], bII: [1, 5, 8], ii: [2, 5, 9], II: [2, 6, 9], iii: [4, 7, 11], IV: [5, 9, 12], V: [7, 11, 14], vi: [9, 12, 16],
    im: [0, 3, 7], ivm: [5, 8, 12], VIm: [8, 12, 15], VIIm: [10, 14, 17], Vm: [7, 11, 14],
};
const PIEZAS = {
    // Fuera de la Aventura: tranquila.
    jardin: {
        tempo: 84, base: 60, escala: MAYOR_PENTA, onda: "sine", bajo: "triangle", pulso: 2,
        acordes: [AC.I, AC.vi, AC.IV, AC.V, AC.I, AC.vi, AC.V, AC.I],
        melodia: [
            [2, null, 3, null, 4, 3, 2, null], [1, null, 2, null, 0, null, null, null],
            [2, null, 3, null, 4, 5, 4, null], [3, null, null, null, null, null, null, null],
            [5, null, 4, null, 3, null, 2, 3], [4, null, 3, null, 2, null, null, null],
            [1, 2, 3, null, 2, null, 1, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // 1. El huerto de los brócolis: alegre.
    brocolis: {
        tempo: 116, base: 62, escala: MAYOR_PENTA, onda: "triangle", bajo: "triangle", pulso: 1,
        acordes: [AC.I, AC.V, AC.vi, AC.IV, AC.I, AC.V, AC.vi, AC.IV],
        melodia: [
            [3, null, 3, 4, 5, null, 4, 3], [4, null, 3, null, 1, null, null, null],
            [2, null, 3, 2, 3, null, 4, null], [3, null, null, 2, 1, null, null, null],
            [5, null, 5, 6, 7, null, 6, 5], [6, null, 5, null, 4, null, null, null],
            [3, 4, 5, null, 4, 3, 2, null], [0, null, 2, null, 0, null, null, null],
        ],
    },
    // 2. El bosque de los monstruos: saltarina, con el bajo marcado.
    monstruos: {
        tempo: 104, base: 55, escala: MAYOR_PENTA, onda: "triangle", bajo: "square", pulso: 2,
        acordes: [AC.I, AC.IV, AC.V, AC.I, AC.vi, AC.IV, AC.V, AC.I],
        melodia: [
            [0, 0, 2, null, 0, 0, 3, null], [2, null, 1, null, 0, null, null, null],
            [3, 3, 4, null, 3, 3, 5, null], [4, null, 3, null, 2, null, null, null],
            [5, null, 4, 3, 4, null, 3, 2], [3, null, 2, 1, 2, null, null, null],
            [0, 0, 2, null, 3, null, 4, null], [5, null, 0, null, 0, null, null, null],
        ],
    },
    // 3. El castillo de los fantasmas: misteriosa, en menor y sin prisa.
    fantasmas: {
        tempo: 92, base: 57, escala: MENOR_PENTA, onda: "sine", bajo: "triangle", pulso: 4,
        acordes: [AC.im, AC.VIm, AC.ivm, AC.Vm, AC.im, AC.VIm, AC.VIIm, AC.im],
        melodia: [
            [5, null, null, 4, 3, null, null, null], [2, null, 3, null, 1, null, null, null],
            [5, null, null, 6, 7, null, 6, null], [5, null, null, null, 4, null, null, null],
            [3, null, 4, null, 5, null, 3, null], [2, null, null, 1, 0, null, null, null],
            [1, null, 2, null, 4, null, 3, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // 4. La noche de los zombis: menor y apurada.
    zombis: {
        tempo: 124, base: 52, escala: MENOR_PENTA, onda: "triangle", bajo: "square", pulso: 1,
        acordes: [AC.im, AC.VIm, AC.VIIm, AC.im, AC.im, AC.ivm, AC.Vm, AC.im],
        melodia: [
            [0, null, 0, 1, 2, null, 1, 0], [3, null, 2, null, 1, null, null, null],
            [0, null, 0, 1, 2, null, 3, null], [4, null, 3, null, 2, null, null, null],
            [5, null, 4, 5, 6, null, 5, 4], [3, null, 4, null, 2, null, null, null],
            [1, 2, 3, null, 2, 1, 0, null], [0, null, null, -1, 0, null, null, null],
        ],
    },
    // 5. El espacio de los aliens: notas largas y una escala que suena rara.
    aliens: {
        tempo: 100, base: 60, escala: LIDIA, onda: "square", bajo: "sine", pulso: 4,
        acordes: [AC.I, AC.II, AC.I, AC.II, AC.iii, AC.II, AC.I, AC.I],
        melodia: [
            [7, null, 4, null, 3, null, 4, null], [6, null, null, null, 4, null, null, null],
            [7, null, 9, null, 8, null, 7, null], [6, null, null, 4, 3, null, null, null],
            [2, null, 3, null, 4, null, 6, null], [7, null, null, null, 9, null, null, null],
            [8, null, 7, null, 6, null, 4, null], [7, null, null, null, null, null, null, null],
        ],
    },
    // 6. El mar de las criaturas: lenta, que se mece como las olas.
    mar: {
        tempo: 76, base: 65, escala: MAYOR_PENTA, onda: "sine", bajo: "sine", pulso: 4,
        acordes: [AC.I, AC.vi, AC.IV, AC.V, AC.I, AC.vi, AC.IV, AC.I],
        melodia: [
            [2, null, 3, 4, 3, null, 2, null], [1, null, null, 2, 0, null, null, null],
            [3, null, 4, 5, 4, null, 3, null], [2, null, null, null, null, null, null, null],
            [4, null, 5, 6, 5, null, 4, null], [3, null, null, 2, 1, null, null, null],
            [2, null, 1, null, 0, null, 1, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // --- Los mundos del jardín: más tranquilas que las de la Aventura,
    // porque aquí se practica. Una por mundo.
    // Huerto: campirana y alegre.
    jardin_huerto: {
        tempo: 88, base: 67, escala: MAYOR_PENTA, onda: "triangle", bajo: "triangle", pulso: 2,
        acordes: [AC.I, AC.IV, AC.I, AC.V, AC.vi, AC.IV, AC.V, AC.I],
        melodia: [
            [0, null, 1, 2, 3, null, 2, null], [1, null, 0, null, 1, null, null, null],
            [2, null, 3, 4, 5, null, 4, null], [3, null, null, null, 2, null, null, null],
            [4, null, 3, null, 2, null, 3, null], [2, null, 1, null, 0, null, null, null],
            [1, null, 2, null, 3, null, 1, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // Bosque: suave, en menor.
    jardin_bosque: {
        tempo: 80, base: 57, escala: MENOR_PENTA, onda: "sine", bajo: "triangle", pulso: 4,
        acordes: [AC.im, AC.VIm, AC.VIIm, AC.im, AC.ivm, AC.VIm, AC.Vm, AC.im],
        melodia: [
            [0, null, null, 1, 2, null, null, null], [3, null, 2, null, 1, null, null, null],
            [2, null, null, 3, 4, null, null, null], [5, null, 4, null, 3, null, null, null],
            [4, null, 3, null, 2, null, 3, null], [2, null, null, 1, 0, null, null, null],
            [1, null, 2, null, 1, null, 0, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // Selva de dinosaurios: pasos grandes, bajo marcado.
    jardin_dinos: {
        tempo: 96, base: 65, escala: MAYOR_PENTA, onda: "triangle", bajo: "square", pulso: 2,
        acordes: [AC.I, AC.I, AC.IV, AC.IV, AC.V, AC.IV, AC.V, AC.I],
        melodia: [
            [0, null, 0, null, 2, null, 2, null], [3, null, 2, null, 0, null, null, null],
            [0, null, 0, null, 3, null, 3, null], [4, null, 3, null, 2, null, null, null],
            [5, null, 4, null, 3, null, 4, null], [3, null, 2, null, 1, null, null, null],
            [2, null, 3, null, 4, null, 3, null], [0, null, null, null, 0, null, null, null],
        ],
    },
    // Espacio: flotante, notas muy largas.
    jardin_espacio: {
        tempo: 72, base: 60, escala: LIDIA, onda: "sine", bajo: "sine", pulso: 4,
        acordes: [AC.I, AC.II, AC.I, AC.II, AC.iii, AC.II, AC.I, AC.I],
        melodia: [
            [4, null, null, null, 6, null, null, null], [7, null, null, null, null, null, null, null],
            [8, null, null, null, 6, null, null, null], [4, null, null, null, null, null, null, null],
            [3, null, 4, null, 6, null, 7, null], [9, null, null, null, 8, null, null, null],
            [7, null, null, 6, 4, null, null, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // Fondo del mar: lenta, como olas.
    jardin_mar: {
        tempo: 70, base: 62, escala: MAYOR_PENTA, onda: "sine", bajo: "sine", pulso: 4,
        acordes: [AC.I, AC.IV, AC.I, AC.V, AC.vi, AC.IV, AC.V, AC.I],
        melodia: [
            [0, null, 1, null, 2, null, null, null], [1, null, 2, null, 3, null, null, null],
            [4, null, 3, null, 2, null, null, null], [1, null, null, null, null, null, null, null],
            [2, null, 3, null, 4, null, null, null], [5, null, 4, null, 3, null, null, null],
            [2, null, 1, null, 2, null, 1, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // Granja: saltarina, de rancho.
    jardin_granja: {
        tempo: 96, base: 60, escala: MAYOR_PENTA, onda: "triangle", bajo: "triangle", pulso: 1,
        acordes: [AC.I, AC.IV, AC.V, AC.I, AC.I, AC.IV, AC.V, AC.I],
        melodia: [
            [2, 2, 3, null, 2, null, 1, null], [0, null, 1, null, 2, null, null, null],
            [3, 3, 4, null, 3, null, 2, null], [1, null, null, null, null, null, null, null],
            [2, 2, 3, null, 4, null, 5, null], [4, null, 3, null, 2, null, null, null],
            [1, null, 1, 2, 1, null, 0, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // Desierto: sabor árabe.
    jardin_desierto: {
        tempo: 84, base: 64, escala: FRIGIA_DOMINANTE, onda: "triangle", bajo: "sine", pulso: 2,
        acordes: [AC.I, AC.bII, AC.I, AC.bII, AC.ivm, AC.bII, AC.I, AC.I],
        melodia: [
            [4, null, 5, null, 4, 3, 2, null], [1, null, 2, null, 0, null, null, null],
            [4, null, 5, null, 6, 5, 4, null], [5, null, null, null, 4, null, null, null],
            [7, null, 6, null, 5, 4, 5, null], [4, null, 3, null, 2, null, null, null],
            [3, null, 2, null, 1, null, 2, null], [0, null, null, null, null, null, null, null],
        ],
    },
    // Jardín de flores: dulce.
    jardin_flores: {
        tempo: 80, base: 69, escala: MAYOR_PENTA, onda: "sine", bajo: "triangle", pulso: 2,
        acordes: [AC.I, AC.vi, AC.ii, AC.V, AC.I, AC.vi, AC.V, AC.I],
        melodia: [
            [4, null, 3, null, 2, null, 3, null], [4, null, null, null, 5, null, null, null],
            [3, null, 2, null, 1, null, 2, null], [3, null, null, null, null, null, null, null],
            [5, null, 4, null, 3, null, 4, null], [5, null, 6, null, 7, null, null, null],
            [6, null, 5, null, 4, null, 2, null], [5, null, null, null, null, null, null, null],
        ],
    },
};
// La pieza de cada mundo de la Aventura, en su orden.
const MUSICA_DE_MUNDO = ["brocolis", "monstruos", "fantasmas", "zombis", "aliens", "mar"];
// Y la de cada mundo del jardín (fuera de la Aventura); en la bienvenida, «jardin».
const MUSICA_DE_JARDIN = {
    huerto: "jardin_huerto", bosque: "jardin_bosque", dinos: "jardin_dinos", espacio: "jardin_espacio",
    mar: "jardin_mar", granja: "jardin_granja", desierto: "jardin_desierto", flores: "jardin_flores",
};

/** La música de la pantalla en que se está: la del nivel, la del mundo del jardín o la de la bienvenida. */
function elegirMusica() {
    if (pantallaActual === "screen-aventura-juego") ambienteMusical(MUSICA_DE_MUNDO[aventura.mundo]);
    else if (pantallaActual === "screen-welcome") ambienteMusical("jardin");
    else ambienteMusical(MUSICA_DE_JARDIN[perfilEnUso().mundo] || "jardin");
}
const musica = { pieza: "jardin", salida: null, siguiente: 0, paso: 0, temporizador: null };

const midiAHz = (m) => 440 * 2 ** ((m - 69) / 12);
/** La nota de un grado de la escala; los grados de más dan la vuelta por octavas. */
const notaDeGrado = (p, grado) => {
    const n = p.escala.length;
    return p.base + p.escala[((grado % n) + n) % n] + 12 * Math.floor(grado / n);
};

function ambienteMusical(nombre) {
    if (musica.pieza === nombre && musica.temporizador) return;
    musica.pieza = nombre;
    arrancarMusica();
}

function arrancarMusica() {
    pararMusica();
    if (!ajustes.musica || !audioCtx || document.hidden) return;
    try {
        if (!musica.salida) {
            musica.salida = audioCtx.createGain();
            musica.salida.connect(audioCtx.destination);
        }
        musica.salida.gain.value = volumenMusica();
        musica.siguiente = audioCtx.currentTime + 0.15;
        musica.paso = 0;
        musica.temporizador = setInterval(programarMusica, 100);
    } catch (e) { pararMusica(); }
}

function pararMusica() {
    clearInterval(musica.temporizador);
    musica.temporizador = null;
}

/** Programa las notas de los próximos 0,35 s (así no se entrecorta). */
function programarMusica() {
    if (!audioCtx || !ajustes.musica) { pararMusica(); return; }
    const p = PIEZAS[musica.pieza];
    const corchea = 60 / p.tempo / 2;
    const hablando = "speechSynthesis" in window && Boolean(window.speechSynthesis.speaking);
    musica.salida.gain.value = volumenMusica() * (hablando ? 0.3 : 1);
    // Si el reloj se adelantó (pestaña en pausa), se retoma desde ahora.
    if (musica.siguiente < audioCtx.currentTime) musica.siguiente = audioCtx.currentTime + 0.05;
    while (musica.siguiente < audioCtx.currentTime + 0.35) {
        tocarPaso(p, musica.paso, musica.siguiente, corchea);
        musica.siguiente += corchea;
        musica.paso = (musica.paso + 1) % (melodiaCompleta(p).length * 8);
    }
}

// FORMA DE CANCIÓN. Cada pieza se escribe con ocho compases (el tema,
// A) y suena en cuatro partes de ocho: A, B (la respuesta, el tema una
// tercera más arriba sobre los mismos acordes), A′ (el tema con la
// segunda mitad una octava arriba) y C (un respiro: solo los tiempos
// fuertes, con el bajo y los acordes). Así tarda de uno a dos minutos en
// repetirse, en lugar de 16 a 28 segundos, sin dejar de sonar a sí misma.
const PARTES = ["A", "B", "A′", "C"];
const NOTA_MAS_AGUDA = 88;   // más arriba, chilla

/** Los 32 compases de melodía de una pieza (se calculan una vez). */
function melodiaCompleta(p) {
    if (p.completa) return p.completa;
    const octava = p.escala.length;
    const parte = (k) => p.melodia.map((compas, c) => compas.map((g, d) => {
        if (k === 0) return g;
        if (g === null) return null;
        if (k === 1) return notaDeGrado(p, g + 2) <= NOTA_MAS_AGUDA ? g + 2 : g;
        if (k === 2) return c >= 4 && notaDeGrado(p, g + octava) <= NOTA_MAS_AGUDA ? g + octava : g;
        return d % 4 === 0 ? g : null;
    }));
    p.completa = [0, 1, 2, 3].flatMap(parte);
    return p.completa;
}

function tocarPaso(p, paso, t, corchea) {
    const compasTotal = Math.floor(paso / 8), dentro = paso % 8;
    const compas = compasTotal % p.melodia.length;
    const acorde = p.acordes[compas];
    const grado = melodiaCompleta(p)[compasTotal][dentro];
    if (grado !== null) notaMusica(notaDeGrado(p, grado), t, corchea * 1.7, p.onda, p.onda === "square" ? 0.22 : 0.5);
    if (dentro % p.pulso === 0) {
        const octava = p.pulso === 1 && dentro % 2 ? 12 : 0;
        notaMusica(p.base - 24 + acorde[0] + octava, t, corchea * p.pulso * 0.9, p.bajo, p.bajo === "square" ? 0.18 : p.pulso === 1 ? 0.28 : 0.4);
    }
    if (dentro === 0) for (const i of acorde) notaMusica(p.base - 12 + i, t, corchea * 8, "sine", 0.1);
}

function notaMusica(midi, t, dur, onda, vol) {
    try {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = onda;
        o.frequency.value = midiAHz(midi);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(musica.salida);
        o.start(t);
        o.stop(t + dur + 0.05);
    } catch (e) { /* una nota menos */ }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) pararMusica();
    else arrancarMusica();
});

// --- SISTEMA DE AUDIO SINTÉTICO (Sin archivos externos) ---
function playTone(freq, type, duration, volumen = 0.15) {
    if (!ajustes.efectos) return;
    try {
        initAudio();
        if (!audioCtx) return;
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();

        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(volumen, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.log("Error de audio:", e);
    }
}

// --- SONIDOS POR CAPAS ---
//
// Antes, cada efecto era un pitido de un solo tono. Ahora cada nota
// tiene tres capas, como un instrumento: un ataque corto y brillante
// (triangular), el cuerpo (seno, con su envolvente) y un brillo una
// octava y una quinta arriba, muy suave. Todas las notas son de la
// escala pentatónica de do, así ningún efecto desafina con la música,
// y pasan por un mismo volumen («volumenEfectos») para sonar parejas.
// El fallo sube un poquito, como una pregunta: no suena a castigo.
const DO = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760, C7: 2093 };
// [segundos desde el inicio, nota, duración, volumen relativo, nota final (deslizar)]
const SONIDOS = {
    toque: [[0, "G6", 0.05, 0.35]],
    acierto: [[0, "E5", 0.12, 0.8], [0.07, "G5", 0.12, 0.8], [0.14, "C6", 0.26, 0.9]],
    fallo: [[0, "G4", 0.16, 0.55], [0.12, "A4", 0.22, 0.5]],
    racha: [[0, "C6", 0.08, 0.6], [0.05, "E6", 0.08, 0.6], [0.1, "G6", 0.08, 0.6], [0.15, "C7", 0.3, 0.7]],
    florecer: [[0, "C5", 0.14, 0.7], [0.08, "E5", 0.14, 0.7], [0.16, "G5", 0.14, 0.7], [0.24, "C6", 0.16, 0.75], [0.32, "E6", 0.5, 0.8]],
    nivel: [[0, "C5", 0.16, 0.75], [0.18, "C5", 0.16, 0.75], [0.36, "G5", 0.2, 0.8], [0.6, "C6", 0.6, 0.9], [0.6, "E5", 0.6, 0.5], [0.6, "G5", 0.6, 0.5]],
    vencer: [[0, "A6", 0.12, 0.5, "E5"], [0.06, "C6", 0.14, 0.55]],
    jefe: [[0, "G4", 0.18, 0.7], [0.16, "C5", 0.18, 0.75], [0.32, "E5", 0.18, 0.8], [0.48, "G5", 0.6, 0.9], [0.48, "C6", 0.6, 0.55]],
    comprar: [[0, "A5", 0.08, 0.6], [0.08, "E6", 0.3, 0.7]],
    entrar: [[0, "C5", 0.14, 0.7], [0.12, "E5", 0.14, 0.7], [0.24, "G5", 0.3, 0.75]],
};
// Ajuste de cada efecto, medido sin conexión (RMS de los 100 ms más
// fuertes): los de logro quedan parejos (≈ 0,10), los grandes apenas
// más fuertes (≈ 0,12), el fallo más suave (≈ 0,07) y el toque, casi
// un susurro (≈ 0,03).
const AJUSTE_SONIDO = { toque: 1.5, acierto: 0.94, fallo: 1.43, racha: 1.19, florecer: 0.95, nivel: 0.73, vencer: 1.85, jefe: 0.81, comprar: 1.32, entrar: 1 };
const VOLUMEN_EFECTOS = 0.32;
let salidaEfectos = null;

/** Una nota de tres capas en `ctx`, que sale por `destino`, a los `t` s. */
function notaPorCapas(ctx, destino, t, frec, dur, vol, frecFinal) {
    const capas = [
        { tipo: "triangle", mult: 1, vol: vol * 0.55, dur: Math.min(0.06, dur) },   // ataque
        { tipo: "sine", mult: 1, vol, dur },                                       // cuerpo
        { tipo: "sine", mult: 3, vol: vol * 0.12, dur: dur * 0.7 },               // brillo (octava + quinta)
    ];
    for (const c of capas) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = c.tipo;
        osc.frequency.setValueAtTime(frec * c.mult, t);
        if (frecFinal) osc.frequency.exponentialRampToValueAtTime?.(frecFinal * c.mult, t + c.dur);
        // Envolvente: arranca casi en silencio, sube en 8 ms y se apaga.
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, c.vol), t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + c.dur);
        osc.connect(g);
        g.connect(destino);
        osc.start(t);
        osc.stop(t + c.dur + 0.02);
    }
}

/** Pinta el sonido `nombre` en un contexto (también sin conexión, para medirlo). */
function tocarSonido(ctx, destino, nombre, inicio = ctx.currentTime) {
    const ajuste = AJUSTE_SONIDO[nombre] ?? 1;
    for (const [t, nota, dur, vol, final] of SONIDOS[nombre] || []) {
        notaPorCapas(ctx, destino, inicio + t, DO[nota], dur, vol * ajuste, final ? DO[final] : null);
    }
}

/** Un efecto del juego. Respeta «Sonidos: No». */
function sonar(nombre) {
    if (!ajustes.efectos || !SONIDOS[nombre]) return;
    try {
        initAudio();
        if (!audioCtx) return;
        if (!salidaEfectos) {
            salidaEfectos = audioCtx.createGain();
            salidaEfectos.gain.setValueAtTime(VOLUMEN_EFECTOS, audioCtx.currentTime);
            salidaEfectos.connect(audioCtx.destination);
        }
        tocarSonido(audioCtx, salidaEfectos, nombre);
    } catch (e) { /* sin audio, el juego sigue */ }
}

// Nombres de siempre, para no cambiar cada llamada: ahora son efectos por capas.
function playCorrectSound() { sonar("acierto"); }
function playIncorrectSound() { sonar("fallo"); }
function playVictorySound() { sonar("nivel"); }
