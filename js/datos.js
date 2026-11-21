// DATOS: mundos, personajes, trucos por tabla y colores del menú.
//
// Separado de index.html para que el archivo principal no crezca sin fin.
// Es un script clásico (no un módulo): lo que declara es global, como
// cuando vivía dentro de index.html, y se carga antes del script principal.
// Lo que aquí se usa del principal se usa solo dentro de funciones, cuando
// ya está cargado todo.

// --- COLORES Y EMOJIS DE LAS TABLAS EN EL MENÚ ---
const emojisTablas = ["🌱", "🍓", "🍊", "🍋", "🍏", "🍇", "🍒", "🍀", "🌻"];
const coloresTablas = [
    "from-red-300 to-pink-300 hover:from-red-400 hover:to-pink-400",
    "from-orange-300 to-yellow-300 hover:from-orange-400 hover:to-yellow-400",
    "from-yellow-300 to-green-300 hover:from-yellow-400 hover:to-green-400",
    "from-green-300 to-emerald-300 hover:from-green-400 hover:to-emerald-400",
    "from-teal-300 to-cyan-300 hover:from-teal-400 hover:to-cyan-400",
    "from-blue-300 to-indigo-300 hover:from-blue-400 hover:to-indigo-400",
    "from-purple-300 to-fuchsia-300 hover:from-purple-400 hover:to-fuchsia-400",
    "from-pink-300 to-rose-300 hover:from-pink-400 hover:to-rose-400",
    "from-rose-300 to-amber-300 hover:from-rose-400 hover:to-amber-400"
];

// --- MUNDOS Y PERSONAJES ---
//
// El juego empezó como un jardín de flores rosa, y a muchos niños eso
// les dice «no es para ti». Ahora cada quien elige su mundo y su
// personaje. La mecánica es la misma en todos: lo que se aprende
// crece. Solo cambia qué crece y el ambiente. «Florecer» sigue siendo
// el nombre de saberla de memoria, en todos los mundos.
//   flora: lo que crece al florecer, una por tabla (del 1 al 9)
//   capullo: lo «casi»; crecen: lo que brota en cada partida
// Solo emojis de Unicode 13 o anteriores: en tabletas viejas, los más
// nuevos salen como cuadros vacíos.
// nombreFlores: lo que se cuenta en el jardín de ese mundo («3 de 54 dinosaurios»).
const MUNDOS = {
    huerto: {
        nombre: "Huerto", emoji: "🥕", flor: "🍅", nombreFlor: "cosecha", nombreFlores: "cosechas", capullo: "🌿", nombreCapullo: "mata, casi",
        flora: ["🥕", "🍅", "🌽", "🥦", "🍆", "🥔", "🥬", "🍓", "🎃"],
        crecen: ["🥕", "🍅", "🌽", "🥦", "🍆", "🥔", "🥬", "🍓", "🎃", "🌱"],
    },
    bosque: {
        nombre: "Bosque", emoji: "🌲", flor: "🌳", nombreFlor: "árbol", nombreFlores: "árboles", capullo: "🌿", nombreCapullo: "arbolito, casi",
        flora: ["🌲", "🌳", "🍄", "🌰", "🍁", "🍂", "🦔", "🦉", "🦌"],
        crecen: ["🌲", "🌳", "🍄", "🌰", "🍁", "🍂", "🦔", "🦉", "🦌", "🐿️"],
    },
    dinos: {
        nombre: "Selva de dinosaurios", emoji: "🦖", flor: "🦕", nombreFlor: "dinosaurio", nombreFlores: "dinosaurios", capullo: "🥚", nombreCapullo: "huevo, casi",
        flora: ["🦕", "🦖", "🐊", "🦎", "🐢", "🌴", "🌋", "🐉", "🦕"],
        crecen: ["🦕", "🦖", "🌴", "🐊", "🦎", "🐢", "🌋", "🥚", "🌿", "🐉"],
    },
    espacio: {
        nombre: "Espacio", emoji: "🚀", flor: "🌟", nombreFlor: "estrella", nombreFlores: "estrellas", capullo: "🌙", nombreCapullo: "luna, casi",
        flora: ["🌍", "🌙", "⭐", "☄️", "🛸", "🌌", "🛰️", "🌠", "🚀"],
        crecen: ["⭐", "🌟", "🌙", "☄️", "🛸", "🛰️", "🌠", "🌍", "🌌", "✨"],
    },
    mar: {
        nombre: "Fondo del mar", emoji: "🐠", flor: "🐠", nombreFlor: "pez", nombreFlores: "peces", capullo: "🐚", nombreCapullo: "concha, casi",
        flora: ["🐟", "🐠", "🐡", "🐙", "🦀", "🐢", "🐬", "🐳", "🦈"],
        crecen: ["🐟", "🐠", "🐡", "🐙", "🦀", "🐢", "🐬", "🐳", "🐚", "🦐"],
    },
    granja: {
        nombre: "Granja", emoji: "🐄", flor: "🐔", nombreFlor: "animal de la granja", nombreFlores: "animales", capullo: "🐣", nombreCapullo: "pollito, casi",
        flora: ["🐔", "🐄", "🐖", "🐑", "🐐", "🐴", "🦆", "🐇", "🐓"],
        crecen: ["🐔", "🐄", "🐖", "🐑", "🐐", "🐴", "🦆", "🐇", "🌾", "🚜"],
    },
    desierto: {
        nombre: "Desierto", emoji: "🌵", flor: "🌵", nombreFlor: "cactus", nombreFlores: "cactus", capullo: "🌾", nombreCapullo: "brote de cactus, casi",
        flora: ["🌵", "🌴", "🦎", "🦂", "🐪", "🌞", "🏜️", "🐫", "🦅"],
        crecen: ["🌵", "🌴", "🦎", "🦂", "🐪", "🌞", "🏜️", "🐫", "🦅", "🌾"],
    },
    flores: {
        nombre: "Jardín de flores", emoji: "🌸", flor: "🌸", nombreFlor: "flor", nombreFlores: "flores", capullo: "🌷", nombreCapullo: "capullo, casi",
        flora: ["🌼", "🌸", "🌺", "🌻", "🌹", "💐", "🏵️", "💮", "🌼"],
        crecen: ["🌸", "🌹", "🌺", "🌻", "🌼", "🌷", "🌱", "🍀", "🏵️", "💮"],
    },
};
// Quien no elige empieza en el huerto: un jardín, sin inclinarse por
// nadie. Lo guardado antes de los mundos sigue siendo de flores.
const MUNDO_INICIAL = "huerto";
// LOS TRES TONOS (Hito 4.3): el mismo juego para distintas edades. Lo elige
// quien juega, y no lleva la edad escrita: nadie tiene que sentirse «de
// kínder». Brote: grande y con pocas palabras (6 a 8 años, de orientación).
// Explora: el de siempre (8 a 10). Pro: sobrio, de noche y con tiempos (11+).
const TONOS = {
    brote: { nombre: "Brote", detalle: "Grande y con pocas palabras", dibujo: "🌱" },
    explora: { nombre: "Explora", detalle: "Con todo, como siempre", dibujo: "🧭" },
    pro: { nombre: "Pro", detalle: "Sobrio, con tiempos y marcas", dibujo: "⚡" },
};
const TONO_INICIAL = "explora";
const FELICITACIONES_PRO = ["Correcto.", "Bien.", "Exacto."];
const PERSONAJES = ["🦊", "🐸", "🦖", "🐢", "🦉", "🐝", "🚀", "🦁", "🐼", "🐙", "🦄", "🐱"];
const PERSONAJE_INICIAL = "🧑‍🌾";
// Los emojis de flor que se asignaban solos antes de elegir personaje.
const EMOJIS_PERFIL = ["🌻", "🌷", "🌼", "🌹", "🌺", "🌸", "💐", "🏵️"];
const personajeValido = (e) => e === PERSONAJE_INICIAL || PERSONAJES.includes(e) || EMOJIS_PERFIL.includes(e);
// --- TRUCOS POR TABLA ---
//
// El botón prometía "ver truco" y solo mostraba el conteo. Estos sí
// ahorran trabajo: convierten la tabla dificil en una fácil que ya se
// sabe. Dan los pasos con los números de la pregunta, pero el último lo
// hace quien juega: la ayuda no debe ser la respuesta.
//
// Se elige el factor con el truco más útil (el orden de abajo), y como
// el orden de los factores no importa, sirve igual para 9 × 3 que para
// 3 × 9.
const ORDEN_TRUCOS = [1, 10, 2, 5, 9, 4, 3, 6, 8, 7];

function trucoPara(a, b) {
    const t = ORDEN_TRUCOS.find((x) => x === a || x === b);
    const n = t === a ? b : a;
    const textos = {
        1: `Truco del 1: por 1, el número se queda igual.`,
        10: `Truco del 10: por 10, se le pone un cero al final.`,
        2: `Truco del 2: por 2 es el doble. Suma ${n} + ${n}.`,
        5: `Truco del 5: es la mitad de por 10. ${n} × 10 = ${n * 10}, y busca la mitad.`,
        9: `Truco del 9: es por 10 y una vez menos. ${n} × 10 = ${n * 10}, y quítale ${n}.`,
        4: `Truco del 4: es el doble del doble. ${n} + ${n} = ${n * 2}, y ahora el doble de ${n * 2}.`,
        3: `Truco del 3: es el doble y una vez más. ${n} + ${n} = ${n * 2}, y súmale ${n}.`,
        6: `Truco del 6: es por 5 y una vez más. ${n} × 5 = ${n * 5}, y súmale ${n}.`,
        8: `Truco del 8: es el doble del doble del doble. ${n} → ${n * 2} → ${n * 4} → ¿?`,
        7: `Truco del 7: es por 5 más por 2. ${n} × 5 = ${n * 5}, y súmale ${n} × 2 = ${n * 2}.`,
    };
    const texto = textos[t];
    return { texto, voz: textoParaVoz(texto) };
}

/**
 * La pista de la pregunta en curso. Al multiplicar, el truco de la
 * tabla. Al dividir, la multiplicación al revés y contar de tanto en
 * tanto. En un problema, qué operación pide la historia. Ninguna da
 * la respuesta.
 */
function pistaPara() {
    if (["logica", "fraccion", "residuo", "multiplos", "area", "dinero", "porcentaje", "decimales", "tiempo", "calendario"].includes(pregunta?.tipo)) return { texto: pregunta.pista, voz: textoParaVoz(pregunta.pista) };
    if (!pregunta || pregunta.tipo === "mult") {
        const truco = trucoPara(numA, numB);
        const puente = puenteDesdeLoSabido(numA, numB);
        if (!puente) return truco;
        return { texto: `${puente.texto} Otro camino: ${truco.texto}`, voz: textoParaVoz(puente.texto) };
    }
    const total = numA * numB;
    const saltos = [1, 2, 3].map((k) => numA * k).join(", ");
    const alReves = `piensa en la multiplicación: ${numA} × ? = ${total}. Cuenta de ${numA} en ${numA} (${saltos}…) hasta llegar a ${total}.`;
    let texto;
    if (pregunta.tipo === "div") {
        texto = `Dividir es multiplicar al revés: ${alReves}`;
    } else if (pregunta.op === "×") {
        texto = `Pista: hay ${numA} grupos iguales, y en cada uno hay ${numB}. Para juntar grupos iguales, se multiplica.`;
    } else {
        texto = `Pista: hay que repartir ${total} en partes iguales. Para repartir, se divide: ${alReves}`;
    }
    return { texto, voz: textoParaVoz(texto) };
}

// --- HÉROES Y MUNDOS DE LA AVENTURA ---
const HEROES = [
    { emoji: "🐱", nombre: "gatito" }, { emoji: "🐶", nombre: "perrito" }, { emoji: "🐰", nombre: "conejito" },
    { emoji: "🦊", nombre: "zorrito" }, { emoji: "🐼", nombre: "panda" }, { emoji: "🐸", nombre: "ranita" },
    { emoji: "🐯", nombre: "tigrito" }, { emoji: "🐨", nombre: "koala" },
];
const AVENTURA_MUNDOS = [
    { nombre: "El huerto de los brócolis", enemigo: "🥦", plural: "brócolis", retos: "Tablas del 2, del 5 y del 10", cruce: 16, tablas: [2, 5, 10] },
    { nombre: "El bosque de los monstruos", enemigo: "👾", plural: "monstruos", retos: "Tablas del 3, del 4 y del 6", cruce: 15, tablas: [3, 4, 6] },
    { nombre: "El castillo de los fantasmas", enemigo: "👻", plural: "fantasmas", retos: "Tablas del 7, del 8 y del 9", cruce: 15, tablas: [7, 8, 9] },
    { nombre: "La noche de los zombis", enemigo: "🧟", plural: "zombis", retos: "Todas las tablas, más rápido", cruce: 12, tablas: [2, 3, 4, 5, 6, 7, 8, 9] },
    { nombre: "El espacio de los aliens", enemigo: "👽", plural: "aliens", retos: "Dividir", cruce: 15, tipo: "div" },
    { nombre: "El mar de las criaturas", enemigo: "🐙", plural: "criaturas", retos: "Fracciones de un número", cruce: 17, tipo: "fraccion" },
];

// Lo que dice Lumi en los temas nuevos: una frase al empezar la partida y
// un truco corto si se fallan dos seguidas. Cortas, porque el globo es de
// una línea; lo mismo va también en el texto, para el lector de pantalla.
const LUMI_TEMAS = {
    residuo: { hola: "¡Lo que sobra es menos!", truco: "Sobra menos que el divisor." },
    multiplos: { hola: "¡Busca en las tablas!", truco: "Un múltiplo está en su tabla." },
    area: { hola: "¡A contar cuadritos!", truco: "Área: adentro. Perímetro: orilla." },
    dinero: { hola: "¡100 centavos, un peso!", truco: "Cada 100 centavos, un peso." },
    porcentajes: { hola: "¡Tantos de cada 100!", truco: "El 50% es la mitad." },
    decimales: { hola: "¡Décimos y centésimos!", truco: "Décimos: 1 cifra tras el punto." },
    tiempo: { hola: "¡Una hora, 60 minutos!", truco: "Cuenta de 5 en 5 en el reloj." },
    calendario: { hola: "¡La semana tiene 7 días!", truco: "Cada 7 días, el mismo día." },
};
