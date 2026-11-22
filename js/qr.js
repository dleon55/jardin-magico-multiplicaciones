// CÓDIGO QR (Hito 5.5): el juego dibuja por sí mismo el código QR del enlace
// de un reto, para proyectarlo o imprimirlo en el salón. No usa bibliotecas
// ni internet: aquí está lo necesario del estándar (ISO/IEC 18004) para
// textos cortos: modo de bytes, corrección de errores M y versiones 1 a 10
// (hasta 213 bytes; un enlace de reto ronda los 70).
//
// Es un script clásico que solo declara (ver pruebas/archivos.spec.mjs).

// Por versión (1 a 10), con corrección M: códigos de corrección por bloque y
// los bloques de datos como [cuántos, de cuántos códigos].
const QR_BLOQUES = [null,
    { ec: 10, grupos: [[1, 16]] }, { ec: 16, grupos: [[1, 28]] }, { ec: 26, grupos: [[1, 44]] }, { ec: 18, grupos: [[2, 32]] },
    { ec: 24, grupos: [[2, 43]] }, { ec: 16, grupos: [[4, 27]] }, { ec: 18, grupos: [[4, 31]] }, { ec: 22, grupos: [[2, 38], [2, 39]] },
    { ec: 22, grupos: [[3, 36], [2, 37]] }, { ec: 26, grupos: [[4, 43], [1, 44]] }];
// Los centros de los patrones de alineación de cada versión.
const QR_ALINEACION = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const QR_MARGEN = 4;   // la zona en blanco que pide el estándar alrededor

/** Cuántos bytes de texto caben en una versión. */
function capacidadQR(version) {
    const datos = QR_BLOQUES[version].grupos.reduce((s, [n, de]) => s + n * de, 0);
    // El encabezado: 4 bits de modo y 8 de longitud (16 desde la versión 10).
    return datos - (version >= 10 ? 3 : 2);
}

/** Multiplicación en el campo de 256 elementos del estándar (polinomio 0x11d). */
function multiplicarQR(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11d);
        z ^= ((y >>> i) & 1) * x;
    }
    return z;
}

/** Los códigos de corrección (Reed-Solomon) de un bloque de datos. */
function correccionQR(datos, cuantos) {
    // El divisor: (x - 1)(x - 2)(x - 4)…, guardado sin el término mayor.
    const divisor = new Array(cuantos).fill(0);
    divisor[cuantos - 1] = 1;
    let raiz = 1;
    for (let i = 0; i < cuantos; i++) {
        for (let j = 0; j < cuantos; j++) {
            divisor[j] = multiplicarQR(divisor[j], raiz);
            if (j + 1 < cuantos) divisor[j] ^= divisor[j + 1];
        }
        raiz = multiplicarQR(raiz, 2);
    }
    const resto = new Array(cuantos).fill(0);
    for (const b of datos) {
        const factor = b ^ resto.shift();
        resto.push(0);
        divisor.forEach((coef, i) => { resto[i] ^= multiplicarQR(coef, factor); });
    }
    return resto;
}

/** Todos los códigos del símbolo, ya intercalados: datos con relleno y su corrección. */
function codigosQR(bytes, version) {
    const { ec, grupos } = QR_BLOQUES[version];
    const total = grupos.reduce((s, [n, de]) => s + n * de, 0);
    const bits = [];
    const poner = (valor, largo) => { for (let i = largo - 1; i >= 0; i--) bits.push((valor >>> i) & 1); };
    poner(4, 4);   // modo de bytes
    poner(bytes.length, version >= 10 ? 16 : 8);
    for (const b of bytes) poner(b, 8);
    poner(0, Math.min(4, total * 8 - bits.length));   // el fin
    while (bits.length % 8) bits.push(0);
    const datos = [];
    for (let i = 0; i < bits.length; i += 8) datos.push(bits.slice(i, i + 8).reduce((v, b) => (v << 1) | b, 0));
    for (let relleno = 0xec; datos.length < total; relleno ^= 0xec ^ 0x11) datos.push(relleno);
    // En bloques, cada uno con su corrección.
    const bloques = [];
    let desde = 0;
    for (const [n, de] of grupos) {
        for (let i = 0; i < n; i++) {
            const bloque = datos.slice(desde, desde + de);
            bloques.push({ datos: bloque, ec: correccionQR(bloque, ec) });
            desde += de;
        }
    }
    // Intercalados: el primer código de cada bloque, luego el segundo…
    const salida = [];
    const largo = Math.max(...bloques.map((b) => b.datos.length));
    for (let i = 0; i < largo; i++) for (const b of bloques) if (i < b.datos.length) salida.push(b.datos[i]);
    for (let i = 0; i < ec; i++) for (const b of bloques) salida.push(b.ec[i]);
    return salida;
}

/** ¿Va invertido ese módulo con la máscara dada? (x: columna, y: fila). */
function mascaraQR(mascara, x, y) {
    switch (mascara) {
        case 0: return (x + y) % 2 === 0;
        case 1: return y % 2 === 0;
        case 2: return x % 3 === 0;
        case 3: return (x + y) % 3 === 0;
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
        case 5: return (x * y) % 2 + (x * y) % 3 === 0;
        case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
        default: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    }
}

/** Qué tan difícil de leer queda una matriz: menos es mejor (las cuatro reglas del estándar). */
function penaQR(m) {
    const n = m.length;
    let pena = 0;
    const lineas = [];
    for (let i = 0; i < n; i++) {
        lineas.push(m[i]);
        lineas.push(m.map((fila) => fila[i]));
    }
    for (const linea of lineas) {
        // Cinco o más seguidos del mismo color.
        let racha = 1;
        for (let i = 1; i <= n; i++) {
            if (i < n && linea[i] === linea[i - 1]) racha++;
            else { if (racha >= 5) pena += racha - 2; racha = 1; }
        }
        // Algo que se parece a un patrón de posición (1:1:3:1:1 con cuatro claros a un lado).
        const texto = linea.map((v) => (v ? "1" : "0")).join("");
        for (const patron of ["10111010000", "00001011101"]) {
            for (let i = texto.indexOf(patron); i >= 0; i = texto.indexOf(patron, i + 1)) pena += 40;
        }
    }
    // Bloques de 2 × 2 del mismo color.
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
        if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) pena += 3;
    }
    // Lejos de mitad oscuro y mitad claro.
    const oscuros = m.reduce((s, fila) => s + fila.filter(Boolean).length, 0);
    pena += Math.floor(Math.abs(oscuros * 20 - n * n * 10) / (n * n)) * 10;
    return pena;
}

/**
 * La matriz del código QR de un texto: filas de true (oscuro) y false
 * (claro), sin el margen. Devuelve null si el texto no cabe en la versión 10.
 */
function matrizQR(texto) {
    const bytes = [...new TextEncoder().encode(String(texto))];
    let version = 1;
    while (version <= 10 && bytes.length > capacidadQR(version)) version++;
    if (version > 10) return null;
    const n = version * 4 + 17;
    const m = Array.from({ length: n }, () => new Array(n).fill(false));
    const fija = Array.from({ length: n }, () => new Array(n).fill(false));   // lo que no son datos
    const fijar = (x, y, oscuro) => { m[y][x] = oscuro; fija[y][x] = true; };

    // Las líneas de sincronía.
    for (let i = 0; i < n; i++) { fijar(6, i, i % 2 === 0); fijar(i, 6, i % 2 === 0); }
    // Los tres patrones de posición, con su borde claro.
    for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
        for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
            const [x, y] = [cx + dx, cy + dy];
            if (x < 0 || x >= n || y < 0 || y >= n) continue;
            const d = Math.max(Math.abs(dx), Math.abs(dy));
            fijar(x, y, d !== 2 && d !== 4);
        }
    }
    // Los de alineación (menos donde ya hay uno de posición).
    const centros = QR_ALINEACION[version];
    for (const cy of centros) for (const cx of centros) {
        const enEsquina = (cx === 6 && cy === 6) || (cx === 6 && cy === n - 7) || (cx === n - 7 && cy === 6);
        if (enEsquina) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fijar(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    // El formato (corrección M y la máscara), en sus dos copias.
    const ponerFormato = (mascara) => {
        const dato = mascara;   // corrección M: los dos bits de arriba en cero
        let resto = dato;
        for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
        const bits = ((dato << 10) | resto) ^ 0x5412;
        const bit = (i) => ((bits >>> i) & 1) === 1;
        for (let i = 0; i <= 5; i++) fijar(8, i, bit(i));
        fijar(8, 7, bit(6)); fijar(8, 8, bit(7)); fijar(7, 8, bit(8));
        for (let i = 9; i < 15; i++) fijar(14 - i, 8, bit(i));
        for (let i = 0; i < 8; i++) fijar(n - 1 - i, 8, bit(i));
        for (let i = 8; i < 15; i++) fijar(8, n - 15 + i, bit(i));
        fijar(8, n - 8, true);   // el módulo siempre oscuro
    };
    ponerFormato(0);   // reserva el sitio; el definitivo va al elegir la máscara
    // La versión, desde la 7.
    if (version >= 7) {
        let resto = version;
        for (let i = 0; i < 12; i++) resto = (resto << 1) ^ ((resto >>> 11) * 0x1f25);
        const bits = (version << 12) | resto;
        for (let i = 0; i < 18; i++) {
            const oscuro = ((bits >>> i) & 1) === 1;
            const [a, b] = [n - 11 + (i % 3), Math.floor(i / 3)];
            fijar(a, b, oscuro); fijar(b, a, oscuro);
        }
    }
    // Los datos, en zigzag de dos en dos columnas desde abajo a la derecha.
    const codigos = codigosQR(bytes, version);
    let i = 0;
    for (let derecha = n - 1; derecha >= 1; derecha -= 2) {
        if (derecha === 6) derecha = 5;
        for (let paso = 0; paso < n; paso++) {
            for (let j = 0; j < 2; j++) {
                const x = derecha - j;
                const sube = ((derecha + 1) & 2) === 0;
                const y = sube ? n - 1 - paso : paso;
                if (!fija[y][x] && i < codigos.length * 8) {
                    m[y][x] = ((codigos[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
                    i++;
                }
            }
        }
    }
    // La máscara que deja la matriz más fácil de leer.
    const aplicar = (mascara) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fija[y][x] && mascaraQR(mascara, x, y)) m[y][x] = !m[y][x]; };
    let mejor = 0, menor = Infinity;
    for (let mascara = 0; mascara < 8; mascara++) {
        aplicar(mascara);
        ponerFormato(mascara);
        const pena = penaQR(m);
        if (pena < menor) { menor = pena; mejor = mascara; }
        aplicar(mascara);   // aplicarla otra vez la quita
    }
    aplicar(mejor);
    ponerFormato(mejor);
    return m;
}

/** El QR como SVG: fondo blanco, módulos negros y el margen del estándar. */
function svgQR(texto) {
    const m = matrizQR(texto);
    if (!m) return "";
    const lado = m.length + QR_MARGEN * 2;
    let trazo = "";
    m.forEach((fila, y) => fila.forEach((oscuro, x) => { if (oscuro) trazo += `M${x + QR_MARGEN} ${y + QR_MARGEN}h1v1h-1z`; }));
    return `<svg class="qr" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">` +
        `<rect width="${lado}" height="${lado}" fill="#fff"/><path d="${trazo}" fill="#000"/></svg>`;
}
