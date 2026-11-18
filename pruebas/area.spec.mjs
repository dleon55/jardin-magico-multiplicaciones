// Perímetro y área (issue #71): el área son los cuadritos de adentro (largo ×
// ancho), el perímetro la orilla (los cuatro lados), y un lado sale de
// dividir el área. Errores típicos como falsas, cada uno explicado; la ayuda
// dibuja el rectángulo en cuadritos, como el de las tablas.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

const HUERTO = (clase) => ({ clase, a: 7, b: 4, lugar: "un huerto" });

async function pregunta(page, reto) {
  if (await page.locator("#btn-area").isVisible()) await page.click("#btn-area");
  else await page.evaluate(() => startTable("area"));
  await page.evaluate((r) => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: r.a, b: r.b, reto: r }]; nextQuestion(); }, reto);
}

const etiquetas = (page) => page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.dataset.etiqueta)
  .sort((x, y) => parseInt(x, 10) - parseInt(y, 10)));
const elegir = async (page, valor) => {
  await page.locator(`#opciones .btn-option[data-valor="${valor}"]`).click();
  return page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; });
};

test("el menú abre la partida: diez preguntas de las tres clases, sin repetir ni rectángulos tramposos", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-area");
  await expect(page.locator("#screen-game")).toBeVisible();
  const r = await page.evaluate(() => Array.from({ length: 40 }, () => bolsaDeArea()).map((b) => {
    const c = { area: 0, perimetro: 0, lado: 0 };
    b.forEach((h) => c[h.reto.clase]++);
    const tramposos = b.filter((h) => h.reto.a * h.reto.b === 2 * (h.reto.a + h.reto.b) || h.reto.a === h.reto.b).length;
    return [b.length, c.area, c.perimetro, c.lado, new Set(b.map((h) => `${h.reto.clase}${h.reto.a}x${h.reto.b}`)).size, tramposos];
  }));
  for (const x of r) expect(x).toEqual([10, 4, 3, 3, 10, 0]);
});

test("área de un huerto de 7 × 4: la pregunta, la voz y las falsas", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await pregunta(page, HUERTO("area"));
  await expect(page.locator("#problema-texto")).toHaveText("Un huerto mide 7 m de largo y 4 m de ancho. ¿Cuál es su área?");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("Un huerto mide 7 metros de largo y 4 metros de ancho. ¿Cuál es su área?");
  expect(await etiquetas(page)).toEqual(["11 m²", "22 m²", "28 m²", "35 m²"]);
  expect(await elegir(page, 22)).toContain("22 es la orilla (el perímetro: 7 + 4 + 7 + 4). El área son los cuadritos de adentro.");
  await pregunta(page, HUERTO("area"));
  expect(await elegir(page, 11)).toContain("Sumaste los lados: 7 + 4 = 11. El área se multiplica: 7 filas de 4 cuadritos.");
  await pregunta(page, HUERTO("area"));
  expect(await elegir(page, 28)).toContain("El área es 7 × 4 = 28 m²: 28 cuadritos de un metro.");
});

test("perímetro: el área como trampa, dos lados solos y un lado olvidado", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, HUERTO("perimetro"));
  await expect(page.locator("#problema-texto")).toContainText("¿Cuánto mide su orilla (el perímetro)?");
  expect(await etiquetas(page)).toEqual(["11 m", "18 m", "22 m", "28 m"]);
  expect(await elegir(page, 28)).toContain("28 son los cuadritos de adentro (el área). El perímetro es la orilla: 7 + 4 + 7 + 4.");
  await pregunta(page, HUERTO("perimetro"));
  expect(await elegir(page, 11)).toContain("Sumaste solo dos lados: 7 + 4 = 11. La orilla da la vuelta completa: son cuatro lados.");
  await pregunta(page, HUERTO("perimetro"));
  expect(await elegir(page, 18)).toContain("Te faltó un lado: 7 + 4 + 7 = 18. Falta otro de 4.");
  await pregunta(page, HUERTO("perimetro"));
  expect(await elegir(page, 22)).toContain("El perímetro es 7 + 4 + 7 + 4 = 22 m.");
});

test("un lado desde el área: se divide, no se resta", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, HUERTO("lado"));
  await expect(page.locator("#problema-texto")).toHaveText("Un huerto tiene 28 m² de área y un lado de 7 m. ¿Cuánto mide el otro lado?");
  expect(await etiquetas(page)).toEqual(["4 m", "5 m", "7 m", "21 m"]);
  expect(await elegir(page, 21)).toContain("Restaste: 28 − 7 = 21. El área es lado × lado, así que se divide: 28 ÷ 7.");
  await pregunta(page, HUERTO("lado"));
  expect(await elegir(page, 7)).toContain("7 m es el lado que ya sabías.");
  await pregunta(page, HUERTO("lado"));
  expect(await elegir(page, 4)).toContain("El otro lado mide 28 ÷ 7 = 4 m, porque 7 × 4 = 28.");
});

test("trescientas al azar: 4 opciones distintas, una sola buena y cada falsa explicada", async ({ page }) => {
  await alMenu(page);
  const malos = await page.evaluate(() => {
    const errores = [];
    for (let i = 0; i < 30; i++) {
      for (const h of bolsaDeArea()) {
        const p = armarArea(h.reto);
        const { a, b, clase } = h.reto;
        const buena = clase === "area" ? a * b : clase === "perimetro" ? 2 * (a + b) : b;
        const v = p.opciones.map((o) => o.valor);
        if (new Set(v).size !== 4 || p.respuesta !== buena || v.filter((x) => x === buena).length !== 1) errores.push(`${p.texto}: ${v}`);
        for (const x of v) if (x !== buena && !p.porQue[x]) errores.push(`${p.texto}: ${x} sin explicación`);
        if (v.some((x) => x < 1)) errores.push(`${p.texto}: ${v}`);
      }
    }
    return errores;
  });
  expect(malos).toEqual([]);
});

test("con pocas tablas sabidas, lados del 2 al 5; con muchas, hasta el 9", async ({ page }) => {
  await alMenu(page);
  const maximo = () => page.evaluate(() => Math.max(...Array.from({ length: 30 }, () => bolsaDeArea()).flat().flatMap((h) => [h.reto.a, h.reto.b])));
  expect(await maximo()).toBeLessThanOrEqual(5);
  await page.evaluate(() => {
    for (let a = 2; a <= 9; a++) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
  });
  expect(await maximo()).toBeGreaterThan(5);
});

test("la ayuda dibuja el rectángulo en cuadritos; en el perímetro, la orilla resaltada; en un lado, el «?»", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, HUERTO("area"));
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .cuadrito-area")).toHaveCount(28);
  await expect(page.locator("#help-truco")).toContainText("7 filas de 4, como el rectángulo de la ayuda de las tablas");
  await expect(page.locator("#help-visual-container svg text")).toHaveText(["7 m", "4 m"]);
  await expect(page.locator("#btn-girar")).toBeHidden();
  await pregunta(page, HUERTO("perimetro"));
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .orilla-area")).toHaveAttribute("stroke-width", "5");
  await expect(page.locator("#help-visual-container svg text")).toHaveText(["7 m", "4 m", "7 m", "4 m"]);
  await expect(page.locator("#help-explain")).toHaveText("La orilla, en naranja: suma los cuatro lados.");
  await pregunta(page, HUERTO("lado"));
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  await expect(page.locator("#help-visual-container svg text")).toHaveText(["7 m", "?"]);
  await expect(page.locator("#help-explain")).toHaveText("28 cuadritos en filas de 7: ¿cuántas filas hay?");
});

test("siempre se elige, lo fallado vuelve y no cuenta para el jardín", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { hechos[claveHecho(7, 4)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }]; });
  await pregunta(page, HUERTO("area"));
  await expect(page.locator("#escritura")).toBeHidden();
  await elegir(page, 22);
  expect(await page.evaluate(() => colaRepaso.map((r) => r.reto?.clase))).toContain("area");
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(1);
});

test("queda en la vista para adultos y en el informe, por clase", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, HUERTO("area"));
  await elegir(page, 28);
  await pregunta(page, HUERTO("perimetro"));
  await elegir(page, 28);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-area")).toContainText("Perímetro y área (sus últimas respuestas): área 1 de 1, perímetro 0 de 1.");
  await page.evaluate(() => { window.print = () => {}; imprimirInforme(perfilActual); });
  await expect(page.locator("#informe")).toContainText("Perímetro y área: 1 de 2 bien.");
});

test("diez aciertos: la victoria deja la idea clave", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-area");
  for (let i = 0; i < 10; i++) await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); });
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victory-table-name")).toHaveText("Perímetro y Área");
  await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 preguntas de perímetro y área. El área son los cuadritos de adentro (largo × ancho); el perímetro, la orilla (los cuatro lados sumados).");
});

test("cabe en el teléfono con la ayuda abierta y el rectángulo más grande, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await pregunta(page, { clase: "perimetro", a: 9, b: 8, lugar: "un patio" });
    await page.click("#btn-help");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${tam.width}×${tam.height}`).toBeLessThanOrEqual(tam.width);
    const caja = await page.locator("#help-visual-container svg").boundingBox();
    expect(caja.x + caja.width).toBeLessThanOrEqual(tam.width);
    // Las medidas de los lados, enteras dentro del dibujo (antes «9 m» se cortaba).
    const fuera = await page.locator("#help-visual-container svg").evaluate((svg) => {
      const vb = svg.viewBox.baseVal;
      return [...svg.querySelectorAll("text")].map((t) => t.getBBox())
        .filter((b) => b.x < 0 || b.y < 0 || b.x + b.width > vb.width || b.y + b.height > vb.height).length;
    });
    expect(fuera, `${tam.width}×${tam.height}: medidas cortadas`).toBe(0);
  }
});
