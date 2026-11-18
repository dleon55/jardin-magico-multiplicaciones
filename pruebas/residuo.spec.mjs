// Dividir con lo que sobra (issue #71): 17 ÷ 5 = 3 y sobran 2. Ayuda visual,
// errores típicos como opciones falsas (cada uno explicado), repaso de lo
// fallado y registro en la vista para adultos y el informe.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Abre la partida y pone en pantalla D ÷ d (con cociente q y residuo r). */
async function pregunta(page, D, d) {
  if (await page.locator("#btn-residuo").isVisible()) await page.click("#btn-residuo");
  else await page.evaluate(() => startTable("residuo"));
  await page.evaluate(([D, d]) => {
    cancelarEspera();
    colaRepaso = [];
    bolsa = [{ a: d, b: Math.floor(D / d), reto: { D, d, q: Math.floor(D / d), r: D % d } }];
    nextQuestion();
  }, [D, d]);
}

const etiquetas = (page) => page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.dataset.etiqueta).sort());

test("el menú abre la partida: 10 divisiones distintas, todas con residuo menor que el divisor", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-residuo");
  await expect(page.locator("#screen-game")).toBeVisible();
  const bolsa = await page.evaluate(() => [...bolsa, { reto: pregunta.reto }].map((h) => h.reto));
  expect(bolsa.length).toBeGreaterThanOrEqual(10);
  for (const { D, d, q, r } of bolsa) {
    expect(D).toBe(d * q + r);
    expect(r).toBeGreaterThanOrEqual(1);
    expect(r).toBeLessThan(d);
  }
  expect(new Set(bolsa.map((x) => `${x.D}/${x.d}`)).size).toBe(bolsa.length);
  // Con divisores del 2 al 5 hay pocas combinaciones: sin cuidado, se repetirían.
  const repetidas = await page.evaluate(() => Array.from({ length: 60 }, () => bolsaDeResiduos())
    .filter((b) => new Set(b.map((h) => `${h.reto.D}/${h.reto.d}`)).size !== b.length).length);
  expect(repetidas).toBe(0);
});

test("con pocas tablas sabidas, divisores del 2 al 5; con muchas, del 2 al 9", async ({ page }) => {
  await alMenu(page);
  const divisores = () => page.evaluate(() => Array.from({ length: 30 }, () => bolsaDeResiduos()).flat().map((h) => h.reto.d));
  expect(Math.max(...(await divisores()))).toBeLessThanOrEqual(5);
  await page.evaluate(() => {
    for (let a = 2; a <= 9; a++) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
  });
  expect(Math.max(...(await divisores()))).toBeGreaterThan(5);
});

test("17 ÷ 5: la pregunta, la voz y las opciones con los errores típicos", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await pregunta(page, 17, 5);
  await expect(page.locator("#question-text")).toHaveText("17 ÷ 5");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("¿Cuánto es 17 entre 5, y cuánto sobra?");
  // La buena; una fila menos (sobran 7, no cabe); al revés (2 y sobran 3); olvidar lo que sobra.
  expect(await etiquetas(page)).toEqual(["2, sobran 3", "2, sobran 7", "3, sobran 0", "3, sobran 2"].sort());
  await expect(page.locator("#opciones")).toHaveClass(/opciones-largas/);
  await expect(page.locator("#escritura")).toBeHidden();   // siempre se elige
  // Aunque 5 × 3 ya esté florecida (al dividir, eso pediría escribir): la respuesta son dos números.
  await page.evaluate(() => { hechos[claveHecho(5, 3)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }]; });
  await pregunta(page, 17, 5);
  await expect(page.locator("#escritura")).toBeHidden();
  await expect(page.locator("#opciones")).toBeVisible();
});

test("trescientas al azar: 4 opciones distintas, una sola buena y ninguna negativa", async ({ page }) => {
  await alMenu(page);
  const malos = await page.evaluate(() => {
    const errores = [];
    for (let i = 0; i < 300; i++) {
      const [h] = bolsaDeResiduos();
      const p = armarResiduo(h.reto);
      const valores = p.opciones.map((o) => o.valor);
      if (new Set(valores).size !== 4) errores.push(`${p.texto}: repetidas`);
      if (valores.filter((v) => v === p.respuesta).length !== 1) errores.push(`${p.texto}: sin buena`);
      if (p.opciones.some((o) => /-/.test(o.etiqueta))) errores.push(`${p.texto}: negativa`);
      for (const o of p.opciones) if (o.valor !== p.respuesta && !p.porQue[o.valor]) errores.push(`${p.texto}: ${o.etiqueta} sin explicación`);
    }
    return errores;
  });
  expect(malos).toEqual([]);
});

test("al acertar dice por qué; al fallar, cuál fue el error y vuelve más tarde", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, 17, 5);
  await page.locator("#opciones .btn-option", { hasText: "2, sobran 7" }).click();
  const aviso = await page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; });
  expect(aviso).toContain("Con 2 sobrarían 7, y en 7 cabe otro 5: lo que sobra siempre es menos que 5.");
  expect(aviso).toContain("17 ÷ 5 = 3 y sobran 2, porque 5 × 3 = 15 y de 15 a 17 faltan 2.");
  // Vuelve, con el mismo reto.
  expect(await page.evaluate(() => colaRepaso.map((r) => r.reto?.D))).toContain(17);
  // Otro error típico, con su explicación.
  await pregunta(page, 17, 5);
  await page.locator("#opciones .btn-option", { hasText: "3, sobran 0" }).click();
  expect(await page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; }))
    .toContain("Sí sobra algo: 5 × 3 = 15, y de 15 a 17 faltan 2.");
  // Y acertar.
  await pregunta(page, 17, 5);
  await page.locator("#opciones .btn-option", { hasText: "3, sobran 2" }).click();
  expect(await page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; }))
    .toContain("17 ÷ 5 = 3 y sobran 2");
});

test("con residuo 1 dice «sobra 1», en singular", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, 13, 4);
  expect(await etiquetas(page)).toContain("3, sobra 1");
  expect(await page.evaluate(() => pregunta.explicacion)).toBe("13 ÷ 4 = 3 y sobra 1, porque 4 × 3 = 12 y de 12 a 13 falta 1.");
});

test("la ayuda: los puntos en filas del divisor, y lo que sobra aparte y en otro color", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, 17, 5);
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .punto")).toHaveCount(17);
  await expect(page.locator("#help-visual-container .punto-sobra")).toHaveCount(2);
  expect(await page.evaluate(() => document.querySelector("#help-visual-container > div").style.gridTemplateColumns)).toContain("repeat(5");
  await expect(page.locator("#help-explain")).toContainText("17 puntos en filas de 5");
  await expect(page.locator("#help-truco")).toContainText("Busca en la tabla del 5 el número más grande que no se pase de 17.");
  // No se toca ni se gira: es para mirar.
  await expect(page.locator("#btn-girar")).toBeHidden();
  await expect(page.locator("#btn-quitar-fila")).toBeHidden();
});

test("no cuenta para el mapa ni el jardín, y queda en la vista para adultos y en el informe", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, 17, 5);
  await page.locator("#opciones .btn-option", { hasText: "3, sobran 2" }).click();
  await page.evaluate(() => cancelarEspera());
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);
  expect(await page.evaluate(() => otros["residuo:dividir"].map((i) => i.ok))).toEqual([1]);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-residuo")).toContainText("División con residuo (sus últimas respuestas): dividir con lo que sobra 1 de 1.");
  await page.evaluate(() => { window.print = () => {}; imprimirInforme(perfilActual); });
  await expect(page.locator("#informe")).toContainText("División con residuo: 1 de 1 bien.");
});

test("diez aciertos: la victoria lo dice con la idea que hay que llevarse", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-residuo");
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); });
  }
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victory-table-name")).toHaveText("Dividir con lo que Sobra");
  await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 divisiones con residuo. Lo que sobra siempre es menos que el número entre el que divides: si no, cabría otra vez.");
});

test("las opciones caben en el teléfono, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await pregunta(page, 87, 9);   // «9, sobran 6», de las más largas
    const anchos = await page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => [b.scrollWidth, b.clientWidth]));
    for (const [scroll, cliente] of anchos) expect(scroll, `${tam.width}×${tam.height}`).toBeLessThanOrEqual(cliente);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(tam.width);
  }
});
