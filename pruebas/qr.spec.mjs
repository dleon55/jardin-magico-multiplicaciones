// Código QR de un reto (Hito 5.5): el juego lo dibuja por sí mismo, sin
// bibliotecas. Aquí se comprueba de tres maneras:
//  1. huellas de matrices que se verificaron con un lector de QR
//     independiente (jsQR) fuera del repositorio: si el dibujo cambia, avisa;
//  2. un lector propio, escrito aparte del generador, que vuelve a sacar el
//     texto de la matriz (formato, máscara, zigzag, bloques y modo de bytes);
//  3. la pantalla: el diálogo, su accesibilidad y que el QR lleve el enlace.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";

const huella = (m) => createHash("sha256").update(m.map((f) => f.map((o) => (o ? "1" : "0")).join("")).join("\n")).digest("hex").slice(0, 16);

// --- Un lector de QR mínimo, para matrices exactas (sin corrección de errores) ---
const BLOQUES_M = [null, [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]], [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]]];
const CENTROS = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const MASCARAS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];

/** ¿Es ese módulo de un patrón fijo (no de datos)? */
function esFijo(x, y, n, version) {
  if (x === 6 || y === 6) return true;                                             // sincronía
  if ((x < 9 && y < 9) || (x >= n - 8 && y < 9) || (x < 9 && y >= n - 8)) return true;   // posición y formato
  if (version >= 7 && ((x >= n - 11 && y < 6) || (y >= n - 11 && x < 6))) return true;  // versión
  for (const cy of CENTROS[version]) for (const cx of CENTROS[version]) {
    if ((cx === 6 && cy === 6) || (cx === 6 && cy === n - 7) || (cx === n - 7 && cy === 6)) continue;
    if (Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2) return true;
  }
  return false;
}

/** El texto de una matriz QR (filas de booleanos), o un error que dice qué no cuadra. */
function leerQR(m) {
  const n = m.length;
  const version = (n - 17) / 4;
  if (!Number.isInteger(version) || version < 1 || version > 10 || m.some((f) => f.length !== n)) throw new Error(`tamaño ${n}`);
  // El formato, junto al patrón de arriba a la izquierda: 15 bits, con su máscara fija.
  const lugares = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  let formato = 0;
  lugares.forEach(([x, y], i) => { if (m[y][x]) formato |= 1 << i; });
  formato ^= 0x5412;
  const cinco = formato >>> 10;
  let resto = cinco;
  for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
  if (((cinco << 10) | resto) !== formato) throw new Error("el formato no pasa su comprobación");
  if (cinco >>> 3 !== 0) throw new Error(`corrección ${cinco >>> 3}, no M`);
  const mascara = MASCARAS[cinco & 7];
  // La segunda copia del formato dice lo mismo.
  let copia = 0;
  for (let i = 0; i < 8; i++) if (m[8][n - 1 - i]) copia |= 1 << i;
  for (let i = 8; i < 15; i++) if (m[n - 15 + i][8]) copia |= 1 << i;
  if ((copia ^ 0x5412) !== formato) throw new Error("las dos copias del formato difieren");
  if (!m[n - 8][8]) throw new Error("falta el módulo siempre oscuro");
  // Los datos, en zigzag.
  const bits = [];
  for (let derecha = n - 1; derecha >= 1; derecha -= 2) {
    if (derecha === 6) derecha = 5;
    for (let paso = 0; paso < n; paso++) for (let j = 0; j < 2; j++) {
      const x = derecha - j;
      const y = ((derecha + 1) & 2) === 0 ? n - 1 - paso : paso;
      if (!esFijo(x, y, n, version)) bits.push(m[y][x] !== mascara(x, y) ? 1 : 0);
    }
  }
  const [ec, grupos] = BLOQUES_M[version];
  const largos = grupos.flatMap(([cuantos, de]) => Array(cuantos).fill(de));
  const total = largos.reduce((s, l) => s + l, 0) + ec * largos.length;
  if (bits.length < total * 8 || bits.length - total * 8 > 7) throw new Error(`sobran o faltan módulos: ${bits.length} para ${total} códigos`);
  const codigos = [];
  for (let i = 0; i < total; i++) codigos.push(bits.slice(i * 8, i * 8 + 8).reduce((v, b) => (v << 1) | b, 0));
  // Desintercalar los datos (la corrección no hace falta: la matriz es exacta).
  const bloques = largos.map(() => []);
  let i = 0;
  for (let k = 0; k < Math.max(...largos); k++) largos.forEach((l, b) => { if (k < l) bloques[b].push(codigos[i++]); });
  const datos = bloques.flat();
  const flujo = datos.flatMap((c) => [7, 6, 5, 4, 3, 2, 1, 0].map((s) => (c >>> s) & 1));
  const tomar = (desde, cuantos) => flujo.slice(desde, desde + cuantos).reduce((v, b) => (v << 1) | b, 0);
  if (tomar(0, 4) !== 4) throw new Error(`modo ${tomar(0, 4)}, no bytes`);
  const bitsLargo = version >= 10 ? 16 : 8;
  const largo = tomar(4, bitsLargo);
  const bytes = Array.from({ length: largo }, (_, k) => tomar(4 + bitsLargo + k * 8, 8));
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
}

/** La matriz que dibuja un SVG del juego: de sus trazos «M x y h1v1h-1z», quitando el margen. */
function matrizDeSvg(svg) {
  const lado = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)[1]);
  const n = lado - 8;
  const m = Array.from({ length: n }, () => Array(n).fill(false));
  for (const [, x, y] of svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) m[Number(y) - 4][Number(x) - 4] = true;
  return m;
}

test.describe("el dibujo", () => {
  test.beforeEach(async ({ page }) => { await page.goto("./"); });

  test("las matrices comprobadas con un lector independiente no han cambiado", async ({ page }) => {
    const casos = [
      ["https://dleon55.github.io/jardin-magico-multiplicaciones/?reto=NKWK4S", 37, "72fdd60c43364fb0"],
      ["A", 21, "bc9009ae87ca68f1"],
      ["¡Hola, ñandú! 7 × 8 = 56", 29, "b858377073c70eea"],
      ["x".repeat(100), 41, "898a791db8daf879"],
      ["y".repeat(213), 57, "3bb4dc258df63cd7"],
    ];
    for (const [texto, lado, esperada] of casos) {
      const m = await page.evaluate((t) => matrizQR(t), texto);
      expect(m.length, texto.slice(0, 20)).toBe(lado);
      expect(huella(m), texto.slice(0, 20)).toBe(esperada);
      expect(leerQR(m)).toBe(texto);
    }
  });

  test("ida y vuelta con el lector propio: todos los largos de 1 a 213 bytes, en las diez versiones", async ({ page }) => {
    const textos = Array.from({ length: 213 }, (_, k) => Array.from({ length: k + 1 }, (_, i) => "abcdefghijklmnopqrstuvwxyzABCDEFGH0123456789:/?=._-&%"[(i * 7 + k * 3) % 52]).join(""));
    const matrices = await page.evaluate((ts) => ts.map((t) => matrizQR(t)), textos);
    const versiones = new Set();
    matrices.forEach((m, k) => {
      versiones.add((m.length - 17) / 4);
      expect(leerQR(m), `largo ${k + 1}`).toBe(textos[k]);
    });
    expect([...versiones].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("cabe lo que dice el estándar por versión, y lo que no cabe no se dibuja", async ({ page }) => {
    expect(await page.evaluate(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(capacidadQR))).toEqual([14, 26, 42, 62, 84, 106, 122, 152, 180, 213]);
    // Justo en el borde de cada versión: lo que cabe usa esa versión; un byte más, la siguiente.
    const lados = await page.evaluate(() => [14, 15, 26, 27, 106, 107, 180, 181, 213].map((l) => matrizQR("z".repeat(l)).length));
    expect(lados).toEqual([21, 25, 25, 29, 41, 45, 53, 57, 57]);
    expect(await page.evaluate(() => [matrizQR("z".repeat(214)), svgQR("z".repeat(214))])).toEqual([null, ""]);
    // Las letras con acento ocupan dos bytes: cuentan los bytes, no las letras.
    expect(await page.evaluate(() => [matrizQR("ñ".repeat(7)).length, matrizQR("ñ".repeat(8)).length])).toEqual([21, 25]);
  });

  test("los patrones fijos están donde deben: posición, sincronía y alineación", async ({ page }) => {
    const m = await page.evaluate(() => matrizQR("https://ejemplo.org/jardin/?reto=ABC234"));   // versión 3
    const n = m.length;
    expect(n).toBe(29);
    const POSICION = ["1111111", "1000001", "1011101", "1011101", "1011101", "1000001", "1111111"];
    const recorte = (x0, y0, lado) => Array.from({ length: lado }, (_, y) => Array.from({ length: lado }, (_, x) => (m[y0 + y][x0 + x] ? "1" : "0")).join(""));
    for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]]) expect(recorte(x, y, 7)).toEqual(POSICION);
    // El borde claro junto a cada patrón de posición.
    for (let i = 0; i < 8; i++) for (const [x, y] of [[7, i], [i, 7], [n - 8, i], [n - 1 - i, 7], [7, n - 1 - i], [i, n - 8]]) expect(m[y][x], `${x},${y}`).toBe(false);
    // La sincronía: alternando, entre los patrones.
    for (let i = 8; i < n - 8; i++) { expect(m[6][i]).toBe(i % 2 === 0); expect(m[i][6]).toBe(i % 2 === 0); }
    // El de alineación de la versión 3, centrado en (22, 22).
    expect(recorte(20, 20, 5)).toEqual(["11111", "10001", "10101", "10001", "11111"]);
  });

  test("la pena de una matriz sigue las cuatro reglas: rachas, bloques, falsos patrones y equilibrio", async ({ page }) => {
    const penas = await page.evaluate(() => {
      const de = (f) => Array.from({ length: 21 }, (_, y) => Array.from({ length: 21 }, (_, x) => f(x, y)));
      return {
        oscuro: penaQR(de(() => true)),                  // 42 rachas de 21 (19 cada una) + 400 bloques × 3 + 100 de desequilibrio
        claro: penaQR(de(() => false)),
        ajedrez: penaQR(de((x, y) => (x + y) % 2 === 0)),   // ni rachas, ni bloques, ni patrones, y casi mitad y mitad
        rayas: penaQR(de((x, y) => y % 2 === 0)),           // 21 filas enteras de un color: 21 rachas de 21; mitad y mitad (11 de 21 filas)
        patron: penaQR(de((x, y) => (y === 0 ? "101110100001010101010"[x] === "1" : (x + y) % 2 === 0))),
      };
    });
    expect(penas.oscuro).toBe(42 * 19 + 400 * 3 + 100);
    expect(penas.claro).toBe(42 * 19 + 400 * 3 + 100);
    expect(penas.ajedrez).toBe(0);
    expect(penas.rayas).toBe(21 * 19);
    expect(penas.patron).toBeGreaterThanOrEqual(40);
    expect(penas.patron).toBeLessThan(80);
  });

  test("el SVG: cuadrado, con el margen del estándar, fondo blanco y los mismos módulos que la matriz", async ({ page }) => {
    const [svg, m] = await page.evaluate(() => [svgQR("https://ejemplo.org/?reto=ABC234"), matrizQR("https://ejemplo.org/?reto=ABC234")]);
    expect(svg).toMatch(new RegExp(`^<svg class="qr" viewBox="0 0 ${m.length + 8} ${m.length + 8}" shape-rendering="crispEdges" aria-hidden="true"`));
    expect(svg).toContain(`<rect width="${m.length + 8}" height="${m.length + 8}" fill="#fff"/>`);
    expect(svg).toContain('fill="#000"');
    expect(matrizDeSvg(svg)).toEqual(m);
    expect(leerQR(matrizDeSvg(svg))).toBe("https://ejemplo.org/?reto=ABC234");
    expect(await page.evaluate(() => QR_MARGEN)).toBe(4);
  });

  test("el lector propio sí detecta un dibujo estropeado (la prueba no pasa por pasar)", async ({ page }) => {
    const m = await page.evaluate(() => matrizQR("https://ejemplo.org/?reto=ABC234"));
    const copia = () => m.map((f) => [...f]);
    const formato = copia(); formato[8][2] = !formato[8][2];
    expect(() => leerQR(formato)).toThrow(/formato/);
    const dato = copia(); dato[m.length - 1][m.length - 1] = !dato[m.length - 1][m.length - 1];   // el primer bit de datos: el modo
    expect(() => leerQR(dato)).toThrow(/modo/);
    const texto = copia(); texto[m.length - 3][m.length - 4] = !texto[m.length - 3][m.length - 4];
    let leido = null;
    try { leido = leerQR(texto); } catch (e) { leido = "error"; }
    expect(leido).not.toBe("https://ejemplo.org/?reto=ABC234");
  });
});

// --- La pantalla ---
async function alFinalDeUnReto(page, aciertos = 8) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.evaluate((aciertos) => {
    mostrarRetos();
    empezarReto({ tablas: [2, 5], semilla: 77, marca: null });
    for (let i = 0; i < 10; i++) {
      const q = retoEnJuego.preguntas[retoEnJuego.n - 1];
      responderReto(i < aciertos ? q.respuesta : q.opciones.find((o) => o !== q.respuesta), document.querySelector(".reto-opcion"));
      siguientePreguntaDeReto();
    }
  }, aciertos);
  await expect(page.locator("#reto-fin")).toBeVisible();
}

test("«Mostrar código QR» abre el QR en grande, con el enlace de este reto y su marca", async ({ page }) => {
  await alFinalDeUnReto(page, 8);
  await expect(page.locator("#qr-fondo")).toBeHidden();
  await page.click("#btn-reto-qr");
  await expect(page.locator("#qr-fondo")).toBeVisible();
  await expect(page.locator("#qr-panel")).toHaveAttribute("role", "dialog");
  await expect(page.locator("#qr-panel")).toHaveAttribute("aria-modal", "true");
  await expect(page.locator("#qr-panel")).toHaveAccessibleName("Reto con código QR");
  await expect(page.locator("#qr-titulo")).toBeFocused();
  await expect(page.locator("#qr-detalle")).toHaveText("Diez multiplicaciones de las tablas del 2 y del 5. La marca a vencer: 8 de 10. Apunta la cámara al código.");
  await expect(page.locator("#qr-codigo")).toHaveText("NKW K4S");
  await expect(page.locator("#qr-dibujo")).toHaveAttribute("aria-label", "Código QR con el enlace del reto N K W K 4 S");
  // Lo dibujado, leído de vuelta: el enlace de esta misma página con ?reto=NKWK4S.
  const svg = await page.locator("#qr-dibujo").innerHTML();
  const base = await page.evaluate(() => location.origin + location.pathname);
  expect(leerQR(matrizDeSvg(svg))).toBe(`${base}?reto=NKWK4S`);
  // Cuadrado y grande: al menos 240 px de lado en cualquier pantalla de prueba.
  const caja = await page.locator("#qr-dibujo svg").boundingBox();
  expect(Math.abs(caja.width - caja.height)).toBeLessThan(1);
  expect(caja.width).toBeGreaterThanOrEqual(240);
});

test("se cierra con el botón y con Escape, el foco vuelve, y un cambio de pantalla no lo deja abierto", async ({ page }, testInfo) => {
  await alFinalDeUnReto(page);
  await page.click("#btn-reto-qr");
  await page.click("#qr-cerrar");
  await expect(page.locator("#qr-fondo")).toBeHidden();
  await expect(page.locator("#btn-reto-qr")).toBeFocused();
  expect(await page.evaluate(() => qrAbierto)).toBe(false);
  if (testInfo.project.name === "escritorio") {
    await page.click("#btn-reto-qr");
    await page.keyboard.press("Escape");
    await expect(page.locator("#qr-fondo")).toBeHidden();
    await expect(page.locator("#screen-reto")).toBeVisible();   // Escape cerró el QR, no la pantalla
    await expect(page.locator("#btn-reto-qr")).toBeFocused();
  }
  await page.click("#btn-reto-qr");
  await page.evaluate(() => backToSelector());
  await expect(page.locator("#qr-fondo")).toBeHidden();
  expect(await page.evaluate(() => qrAbierto)).toBe(false);
  // Sin un reto terminado no hay nada que mostrar.
  await page.evaluate(() => { mostrarRetos(); abrirQRDeReto(); });
  await expect(page.locator("#qr-fondo")).toBeHidden();
});

test("el QR cambia con la marca: otro resultado, otro código y otro dibujo", async ({ page }) => {
  await alFinalDeUnReto(page, 8);
  await page.click("#btn-reto-qr");
  const antes = await page.locator("#qr-dibujo").innerHTML();
  await page.click("#qr-cerrar");
  await page.evaluate(() => {
    repetirReto();
    for (let i = 0; i < 10; i++) { const q = retoEnJuego.preguntas[retoEnJuego.n - 1]; responderReto(q.respuesta, document.querySelector(".reto-opcion")); siguientePreguntaDeReto(); }
  });
  await page.click("#btn-reto-qr");
  const despues = await page.locator("#qr-dibujo").innerHTML();
  expect(despues).not.toBe(antes);
  const codigo = await page.evaluate(() => retoEnJuego.codigo);
  expect(leerQR(matrizDeSvg(despues))).toContain(`?reto=${codigo}`);
  await expect(page.locator("#qr-detalle")).toContainText("La marca a vencer: 10 de 10.");
});

for (const [nombre, tam] of [["teléfono en vertical", { width: 360, height: 640 }], ["teléfono acostado", { width: 740, height: 360 }]]) {
  test(`cabe en un ${nombre}, con el botón de cerrar a la vista, y pasa la revisión de accesibilidad`, async ({ page }, testInfo) => {
    await page.setViewportSize(tam);
    await alFinalDeUnReto(page);
    const boton = await page.locator("#btn-reto-qr").boundingBox();
    expect(boton.height).toBeGreaterThanOrEqual(44);
    await page.click("#btn-reto-qr");
    const panel = await page.locator("#qr-panel").boundingBox();
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(tam.width);
    expect(panel.y).toBeGreaterThanOrEqual(0);
    expect(panel.y + panel.height).toBeLessThanOrEqual(tam.height);
    const cerrar = await page.locator("#qr-cerrar").boundingBox();
    expect(cerrar.width).toBeGreaterThanOrEqual(44);
    expect(cerrar.height).toBeGreaterThanOrEqual(44);
    expect(cerrar.y).toBeGreaterThanOrEqual(0);
    // El QR entero a la vista, sin desplazarse, y cuadrado.
    const dibujo = await page.locator("#qr-dibujo svg").boundingBox();
    expect(dibujo.width).toBeGreaterThanOrEqual(150);
    expect(Math.abs(dibujo.width - dibujo.height)).toBeLessThan(1);
    expect(dibujo.y).toBeGreaterThanOrEqual(0);
    expect(dibujo.y + dibujo.height).toBeLessThanOrEqual(tam.height);
    expect(await page.locator("#qr-panel").evaluate((p) => p.scrollHeight <= p.clientHeight + 1)).toBe(true);
    const codigo = await page.locator("#qr-codigo").boundingBox();
    expect(codigo.y + codigo.height).toBeLessThanOrEqual(tam.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include("#qr-fondo").analyze();
    expect(axe.violations.map((v) => v.id), testInfo.project.name).toEqual([]);
  });
}

// --- Hito 6.5: la hoja para el salón ---
test("«Imprimir la hoja» arma una hoja con el QR, el código y las diez preguntas, sin respuestas", async ({ page }) => {
  await alFinalDeUnReto(page, 8);
  await page.evaluate(() => { window.__impresiones = 0; window.print = () => { window.__impresiones++; }; });
  await page.click("#btn-reto-hoja");
  expect(await page.evaluate(() => [window.__impresiones, document.body.classList.contains("imprimiendo")])).toEqual([1, true]);
  const hoja = page.locator("#informe");
  await expect(hoja.locator("h1")).toHaveText("Reto del Jardín Mágico");
  await expect(hoja.locator("header p")).toHaveText("Diez multiplicaciones de las tablas del 2 y del 5. La marca a vencer: 8 de 10.");
  await expect(hoja.locator(".hoja-codigo")).toHaveText("NKW K4S");
  const base = await page.evaluate(() => location.origin + location.pathname);
  await expect(hoja.locator(".hoja-enlace")).toHaveText(`${base}?reto=NKWK4S`);
  // El QR de la hoja lleva ese mismo enlace.
  expect(leerQR(matrizDeSvg(await hoja.locator(".hoja-qr").innerHTML()))).toBe(`${base}?reto=NKWK4S`);
  // Las diez preguntas del reto, en su orden, con renglón y sin la respuesta.
  const preguntas = await page.evaluate(() => retoEnJuego.preguntas.map((q) => [q.texto, q.respuesta]));
  await expect(hoja.locator(".hoja-preguntas li")).toHaveText(preguntas.map(([texto]) => `${texto} = ______`));
  const renglones = await hoja.locator(".hoja-preguntas li").allTextContents();
  preguntas.forEach(([, respuesta], i) => expect(renglones[i].replace(/^\d+ × \d+/, ""), `renglón ${i + 1}`).not.toContain(String(respuesta)));
  await expect(hoja).toContainText("Nombre: ______");
  await expect(hoja).toContainText("no lleva las respuestas ni datos de quien creó el reto");
  await expect(hoja).not.toContainText("Ana");
  // Al terminar de imprimir, la pantalla vuelve a ser la de siempre.
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  expect(await page.evaluate(() => document.body.classList.contains("imprimiendo"))).toBe(false);
  await expect(page.locator("#reto-fin")).toBeVisible();
});

test("la hoja cabe en una sola hoja carta, también con el enlace más largo y todas las tablas", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "page.pdf solo existe en Chromium");
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.evaluate(() => {
    window.print = () => {};
    mostrarRetos();
    empezarReto({ tablas: [2, 3, 4, 5, 6, 7, 8, 9], semilla: 1023, marca: 10 });
    for (let i = 0; i < 10; i++) { const q = retoEnJuego.preguntas[retoEnJuego.n - 1]; responderReto(q.respuesta, document.querySelector(".reto-opcion")); siguientePreguntaDeReto(); }
    imprimirHojaDeReto();
  });
  await page.emulateMedia({ media: "print" });
  // Impresa, solo se ve la hoja.
  await expect(page.locator("#informe")).toBeVisible();
  await expect(page.locator("#screen-reto")).toBeHidden();
  // El QR impreso: entre 4 y 7 cm de lado (a 96 px por pulgada), cuadrado. (Se mide antes del PDF: al acabar de imprimir, la hoja se oculta.)
  const qr = await page.locator("#informe .hoja-qr svg").boundingBox();
  expect(Math.abs(qr.width - qr.height)).toBeLessThan(1);
  expect(qr.width).toBeGreaterThan(4 * 37.8);
  expect(qr.width).toBeLessThan(7 * 37.8);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  expect((pdf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length).toBe(1);
  expect(pdf.toString("latin1")).toMatch(/\/MediaBox\s*\[\s*0 0 612 792\s*\]/);
});

test("sin un reto terminado no se imprime nada, y el botón es táctil", async ({ page }) => {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.evaluate(() => { window.__impresiones = 0; window.print = () => { window.__impresiones++; }; mostrarRetos(); imprimirHojaDeReto(); });
  expect(await page.evaluate(() => [window.__impresiones, document.body.classList.contains("imprimiendo"), document.getElementById("informe").children.length])).toEqual([0, false, 0]);
  await alFinalDeUnReto(page);
  const caja = await page.locator("#btn-reto-hoja").boundingBox();
  expect(caja.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator("#btn-reto-hoja")).toHaveText("Imprimir la hoja");
});
