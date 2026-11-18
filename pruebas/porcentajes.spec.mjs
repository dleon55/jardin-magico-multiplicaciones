// Porcentajes sencillos (issue #71): el tanto por ciento de un número, los
// descuentos y fracción ↔ porcentaje, con 10, 20, 25, 50 y 75 %. Errores
// típicos como falsas, cada uno explicado; la ayuda pinta 100 cuadritos.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

const DE = { clase: "de", p: 25, n: 40 };
const DESCUENTO = { clase: "descuento", p: 25, n: 80, cosa: 0 };
const FRACCION = { clase: "fraccion", p: 25 };

async function pregunta(page, reto) {
  if (await page.locator("#btn-porcentajes").isVisible()) await page.click("#btn-porcentajes");
  else await page.evaluate(() => startTable("porcentajes"));
  await page.evaluate((r) => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: numerosDePorcentaje(r)[0], b: 1, reto: r }]; nextQuestion(); }, reto);
}
const etiquetas = (page) => page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.dataset.etiqueta)
  .sort((x, y) => parseInt(x.replace("$", ""), 10) - parseInt(y.replace("$", ""), 10)));
const elegir = async (page, valor) => {
  await page.locator(`#opciones .btn-option[data-valor="${valor}"]`).click();
  return page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; });
};

test("el menú abre la partida: diez preguntas de las tres clases, sin repetir", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-porcentajes");
  await expect(page.locator("#screen-game")).toBeVisible();
  const r = await page.evaluate(() => Array.from({ length: 40 }, () => bolsaDePorcentajes()).map((b) => {
    const c = { de: 0, descuento: 0, fraccion: 0 };
    b.forEach((h) => c[h.reto.clase]++);
    return [b.length, c.de, c.descuento, c.fraccion];
  }));
  for (const x of r) expect(x).toEqual([10, 4, 3, 3]);
});

test("el 25% de 40: la pregunta, la voz y las falsas", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await pregunta(page, DE);
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuánto es el 25% de 40?");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("¿Cuánto es el 25 por ciento de 40?");
  expect(await etiquetas(page)).toEqual(["10", "15", "20", "25"]);
  expect(await elegir(page, 25)).toContain("25 es el porcentaje, no la respuesta: el 25% de 40 es la cuarta parte de 40.");
  await pregunta(page, DE);
  expect(await elegir(page, 15)).toContain("Restaste 25: el 25% no es quitar 25, es tomar 25 de cada 100, o sea la cuarta parte.");
  await pregunta(page, DE);
  expect(await elegir(page, 20)).toContain("Eso es el 50% (la mitad). El 25% es la cuarta parte.");
  await pregunta(page, DE);
  expect(await elegir(page, 10)).toContain("El 25% de 40 es 10: 40 ÷ 4 = 10.");
});

test("el 75%: tres cuartas partes", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "de", p: 75, n: 40 });
  expect(await etiquetas(page)).toEqual(["10", "30", "40", "75"]);
  expect(await elegir(page, 30)).toContain("El 75% de 40 es 30: 40 ÷ 4 = 10, y tres partes son 30.");
});

test("descuento: se paga el precio menos el descuento, no el descuento", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, DESCUENTO);
  await expect(page.locator("#problema-texto")).toHaveText("Un juguete cuesta $80 y tiene 25% de descuento. ¿Cuánto pagas?");
  expect(await etiquetas(page)).toEqual(["$20", "$55", "$60", "$100"]);
  expect(await elegir(page, 20)).toContain("$20 es lo que te descuentan, no lo que pagas: $80 − $20.");
  await pregunta(page, DESCUENTO);
  expect(await elegir(page, 55)).toContain("Restaste 25 pesos, pero el 25% de $80 son $20.");
  await pregunta(page, DESCUENTO);
  expect(await elegir(page, 100)).toContain("Sumaste el descuento: con descuento se paga menos, no más.");
  await pregunta(page, DESCUENTO);
  expect(await elegir(page, 60)).toContain("El descuento es el 25% de $80 = $20, y pagas $80 − $20 = $60.");
  // En plural: «unos tenis cuestan… y tienen».
  await pregunta(page, { ...DESCUENTO, cosa: 1 });
  await expect(page.locator("#problema-texto")).toHaveText("Unos tenis cuestan $80 y tienen 25% de descuento. ¿Cuánto pagas?");
});

test("fracción y porcentaje: la cuarta parte no es el 4%", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, FRACCION);
  await expect(page.locator("#problema-texto")).toHaveText("¿Qué porcentaje es la cuarta parte?");
  expect(await etiquetas(page)).toEqual(["4%", "10%", "20%", "25%"]);
  expect(await elegir(page, 4)).toContain("La cuarta parte es 1 de cada 4, no 4 de cada 100: son 25 de cada 100.");
  await pregunta(page, FRACCION);
  expect(await elegir(page, 10)).toContain("El 10% es la décima parte.");
  await pregunta(page, FRACCION);
  expect(await elegir(page, 25)).toContain("La cuarta parte es el 25%: 100 ÷ 4 = 25.");
  await pregunta(page, { clase: "fraccion", p: 75 });
  expect(await elegir(page, 3)).toContain("Tres cuartas partes son 3 de cada 4, no 3 de cada 100: son 75 de cada 100.");
});

test("trescientas al azar: 4 opciones distintas, una sola buena, enteras y cada falsa explicada", async ({ page }) => {
  await alMenu(page);
  const malos = await page.evaluate(() => {
    const errores = [];
    for (const pocas of [true, false]) {
      for (let i = 0; i < 15; i++) {
        for (const h of bolsaDePorcentajes()) {
          const r = { ...h.reto };
          if (!pocas && r.clase !== "fraccion") Object.assign(r, crearRetoPorcentaje(r.clase, false));
          const p = armarPorcentaje(r);
          const v = p.opciones.map((o) => o.valor);
          const buena = r.clase === "de" ? (r.p * r.n) / 100 : r.clase === "descuento" ? r.n - (r.p * r.n) / 100 : r.p;
          if (new Set(v).size !== 4 || p.respuesta !== buena || v.filter((x) => x === buena).length !== 1) errores.push(`${p.texto}: ${v}`);
          if (v.some((x) => !Number.isInteger(x) || x < 1)) errores.push(`${p.texto}: ${v}`);
          for (const x of v) if (x !== buena && !p.porQue[x]) errores.push(`${p.texto}: ${x} sin explicación`);
        }
      }
    }
    return errores;
  });
  expect(malos).toEqual([]);
});

test("con pocas tablas sabidas, solo la mitad, la cuarta y la décima parte, y números chicos", async ({ page }) => {
  await alMenu(page);
  const usados = () => page.evaluate(() => {
    const b = Array.from({ length: 30 }, () => bolsaDePorcentajes()).flat().map((h) => h.reto);
    return { ps: [...new Set(b.map((r) => r.p))].sort((x, y) => x - y), max: Math.max(...b.map((r) => r.n || 0)) };
  });
  const pocas = await usados();
  expect(pocas.ps).toEqual([10, 25, 50]);
  expect(pocas.max).toBeLessThanOrEqual(40);
  await page.evaluate(() => {
    for (let a = 2; a <= 9; a++) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
  });
  const muchas = await usados();
  expect(muchas.ps).toEqual([10, 20, 25, 50, 75]);
  expect(muchas.max).toBeGreaterThan(40);
});

test("la ayuda: 100 cuadritos; el porcentaje pintado, o el 100 partido en sus partes", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, DE);
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .cuadro-porcentaje")).toHaveCount(100);
  await expect(page.locator("#help-visual-container .cuadro-pintado")).toHaveCount(25);
  await expect(page.locator("#help-truco")).toContainText("El 25% es la cuarta parte: divide 40 entre 4.");
  await expect(page.locator("#btn-girar")).toBeHidden();
  await pregunta(page, FRACCION);
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .cuadro-pintado")).toHaveCount(0);   // no pinta la respuesta
  const grupos = await page.locator("#help-visual-container .cuadro-porcentaje").evaluateAll((cs) => new Set(cs.map((c) => [...c.classList].find((k) => k.startsWith("bg-")))).size);
  expect(grupos).toBe(4);
  await expect(page.locator("#help-explain")).toHaveText("100 cuadritos partidos en 4 partes iguales, cada una de otro color.");
});

test("siempre se elige, lo fallado vuelve y no cuenta para el jardín", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { hechos[claveHecho(4, 1)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }]; });
  await pregunta(page, DE);
  await expect(page.locator("#escritura")).toBeHidden();
  await elegir(page, 15);
  expect(await page.evaluate(() => colaRepaso.map((r) => r.reto?.n))).toContain(40);
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(1);   // solo la sembrada
});

test("queda en la vista para adultos y en el informe, por clase", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, DE);
  await elegir(page, 10);
  await pregunta(page, DESCUENTO);
  await elegir(page, 20);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-porcentajes")).toContainText("Porcentajes (sus últimas respuestas): el tanto por ciento de un número 1 de 1, descuentos 0 de 1.");
  await page.evaluate(() => { window.print = () => {}; imprimirInforme(perfilActual); });
  await expect(page.locator("#informe")).toContainText("Porcentajes: 1 de 2 bien.");
});

test("diez aciertos: la victoria deja la idea clave", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-porcentajes");
  for (let i = 0; i < 10; i++) await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); });
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victory-table-name")).toHaveText("Porcentajes");
  await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 preguntas de porcentajes. Un porcentaje es «tantos de cada 100»: el 50% es la mitad, el 25% la cuarta parte y el 10% la décima parte.");
});

test("cabe en el teléfono con la ayuda abierta, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await pregunta(page, { clase: "descuento", p: 75, n: 200, cosa: 2 });
    await page.click("#btn-help");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${tam.width}×${tam.height}`).toBeLessThanOrEqual(tam.width);
    const caben = await page.locator("#opciones .btn-option").evaluateAll((bs) => bs.every((b) => b.scrollWidth <= b.clientWidth));
    expect(caben).toBe(true);
  }
});
