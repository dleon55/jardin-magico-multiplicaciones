// Revisión visual completa (19 de noviembre): lo que se veía roto en el
// teléfono y la tableta, y que no vuelva. Cada prueba es un hallazgo.
import { test, expect } from "@playwright/test";

const VERTICAL = { width: 360, height: 640 };
const ACOSTADO = { width: 740, height: 360 };

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}
const caja = (page, sel) => page.locator(sel).evaluate((e) => e.getBoundingClientRect().toJSON());
const seCruzan = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test("Aventura acostada: «¡Lanzar!» cabe en su botón", async ({ page }) => {
  await page.setViewportSize(ACOSTADO);
  await alMenu(page);
  await page.evaluate(() => { mostrarAventura(); empezarNivel(0, 0); });
  const boton = page.locator("#aventura-lanzar");
  await expect(boton).toBeVisible();
  const [scroll, cliente] = await boton.evaluate((b) => [b.scrollWidth, b.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(cliente);
  await expect(boton).toContainText("¡Lanzar!");
});

test("teléfono vertical, respuesta escrita: el teclado entero, con «Listo», a la vista sin desplazarse", async ({ page }) => {
  await page.setViewportSize(VERTICAL);
  await alMenu(page);
  await page.evaluate(() => {
    for (let b = 1; b <= 10; b++) hechos[claveHecho(3, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
    startTable(3);
  });
  await expect(page.locator("#escritura")).toBeVisible();
  const teclado = await caja(page, "#teclado-juego");
  expect(teclado.bottom).toBeLessThanOrEqual(VERTICAL.height);
  // La pregunta sigue en el girasol, más chico.
  await expect(page.locator("#girasol")).toHaveClass(/girasol-escrito/);
  await expect(page.locator("#question-text")).toHaveText(/3 × \d+/);
  const [ancho, cabe] = await page.locator("#question-text").evaluate((q) => [q.scrollWidth, q.parentElement.clientWidth]);
  expect(ancho).toBeLessThanOrEqual(cabe);
});

test("menú acostado: «La Aventura», el Desafío y «Tu progreso» ocupan su fila, no el ancho de su texto", async ({ page }) => {
  await page.setViewportSize(ACOSTADO);
  await alMenu(page);
  const tablas = await caja(page, "#grid-tablas-container");
  for (const texto of ["La Aventura", "Desafío del Arcoíris", "Mi jardín"]) {
    const boton = await page.locator("#screen-selector button", { hasText: texto }).first().evaluate((b) => b.getBoundingClientRect().width);
    expect(boton, texto).toBeGreaterThan(tablas.width * 0.6);
  }
});

test("el gusanito de la barra de avance no se sale por la izquierda ni por la derecha", async ({ page }) => {
  for (const tam of [VERTICAL, ACOSTADO]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await page.evaluate(() => startTable(3));
    const barra = await caja(page, "#progress-bar");
    let bicho = await caja(page, "#progress-bug");
    expect(bicho.left, `${tam.width} al empezar`).toBeGreaterThanOrEqual(barra.left - 1);
    await page.evaluate(() => { score = targetScore; updateHUD(); });
    await page.waitForTimeout(600);
    bicho = await caja(page, "#progress-bug");
    const contenedor = await page.locator("#progress-bar").evaluate((b) => b.parentElement.getBoundingClientRect().right);
    expect(bicho.right, `${tam.width} al terminar`).toBeLessThanOrEqual(contenedor + 1);
  }
});

test("teléfono acostado: el globo de Lumi no tapa las respuestas", async ({ page }) => {
  await page.setViewportSize(ACOSTADO);
  await alMenu(page);
  for (const tema of ["tiempo", "residuo", "calendario"]) {
    await page.evaluate((t) => { backToSelector(); startTable(t); }, tema);
    await expect(page.locator("#globo-lumi")).toBeVisible();
    const globo = await caja(page, "#globo-lumi");
    const opciones = await page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().toJSON()));
    for (const o of opciones) expect(seCruzan(globo, o), tema).toBe(false);
    expect(globo.left, tema).toBeGreaterThanOrEqual(0);
  }
});

test("la frase de Lumi al empezar no se repite escrita bajo las respuestas (queda para el lector de pantalla)", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable("tiempo"));
  await expect(page.locator("#game-feedback .sr-only")).toHaveText(/^Lumi: «/);
  const alto = await page.locator("#game-feedback .sr-only").evaluate((e) => e.getBoundingClientRect().height);
  expect(alto).toBeLessThanOrEqual(1);
});

test("respuestas largas: el número de la tecla no se pega al texto", async ({ page }) => {
  await page.setViewportSize(VERTICAL);
  await alMenu(page);
  await page.evaluate(() => {
    startTable("residuo");
    cancelarEspera(); colaRepaso = [];
    bolsa = [{ a: 9, b: 9, reto: { D: 87, d: 9, q: 9, r: 6 } }];
    nextQuestion();
  });
  // Solo donde hay teclado (con el dedo no se muestra el número).
  const conNumero = await page.locator("#opciones .btn-option").first().evaluate((b) => getComputedStyle(b, "::before").content !== "none");
  test.skip(!conNumero, "sin teclado no hay número de tecla");
  const huecos = await page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => {
    const r = document.createRange();
    r.selectNodeContents(b);
    const texto = [...r.getClientRects()].map((x) => x.left);
    return Math.min(...texto) - b.getBoundingClientRect().left;
  }));
  // El número va a 8 px de la orilla y mide unos 7: el texto empieza después de 18 px.
  for (const h of huecos) expect(h).toBeGreaterThanOrEqual(18);
});

test("la ayuda de 7 × 1 dice «7 filas de 1 punto»", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { startTable(7); cancelarEspera(); colaRepaso = []; bolsa = [{ a: 7, b: 1 }]; nextQuestion(); });
  await page.click("#btn-help");
  await expect(page.locator("#help-explain")).toContainText("7 filas de 1 punto.");
});

test("teléfono vertical: al abrir la ayuda, se desplaza para que se vea", async ({ page }) => {
  await page.setViewportSize(VERTICAL);
  await alMenu(page);
  await page.evaluate(() => { startTable(7); cancelarEspera(); colaRepaso = []; bolsa = [{ a: 7, b: 4 }]; nextQuestion(); });
  await page.click("#btn-help");
  await expect.poll(() => page.locator("#help-visual-container").evaluate((e) => e.getBoundingClientRect().top)).toBeLessThan(VERTICAL.height - 100);
});

test("Ajustes: el botón no se mueve al abrirlo, y el panel cabe (o se desplaza por dentro) en el teléfono acostado", async ({ page }) => {
  for (const tam of [VERTICAL, ACOSTADO, { width: 800, height: 1280 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    const antes = await caja(page, "#ajustes summary");
    await page.click("#ajustes summary");
    const despues = await caja(page, "#ajustes summary");
    expect(Math.abs(despues.left - antes.left), `${tam.width}`).toBeLessThanOrEqual(1);
    const panel = await caja(page, "#ajustes > div");
    expect(panel.right, `${tam.width}`).toBeLessThanOrEqual(tam.width);
    expect(panel.left, `${tam.width}`).toBeGreaterThanOrEqual(0);
    expect(panel.bottom, `${tam.width}`).toBeLessThanOrEqual(tam.height);
    // «Menos movimiento», el último, se alcanza.
    await page.locator("#ajustes .ajuste").last().scrollIntoViewIfNeeded();
    await expect(page.locator("#ajustes .ajuste").last()).toBeInViewport();
  }
});

test("«Juegos y retos» sin tarjetas sueltas a media anchura", async ({ page }) => {
  await alMenu(page);
  for (const id of ["#btn-residuo", "#btn-fracciones"]) {
    const [boton, rejilla] = await page.locator(id).evaluate((b) => [b.getBoundingClientRect().width, b.parentElement.getBoundingClientRect().width]);
    expect(boton, id).toBeGreaterThan(rejilla * 0.9);
  }
});
