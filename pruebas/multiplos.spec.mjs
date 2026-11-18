// Múltiplos y divisores (issue #71): «¿Cuál es múltiplo de 6?», «¿Cuál es
// divisor de 24?» y «¿Qué número está en la tabla del 4 y en la del 6?».
// Errores típicos como opciones falsas, cada uno explicado; la ayuda muestra
// las tablas; queda en la vista para adultos y el informe.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Pone en pantalla un reto dado. */
async function pregunta(page, reto) {
  if (await page.locator("#btn-multiplos").isVisible()) await page.click("#btn-multiplos");
  else await page.evaluate(() => startTable("multiplos"));
  await page.evaluate((r) => {
    cancelarEspera();
    colaRepaso = [];
    const [a, b] = numerosDeMultiplos(r);
    bolsa = [{ a, b, reto: r }];
    nextQuestion();
  }, reto);
}

const etiquetas = (page) => page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.dataset.etiqueta).sort((x, y) => x - y));
const elegir = async (page, valor) => {
  await page.locator(`#opciones .btn-option[data-valor="${valor}"]`).click();
  return page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; });
};

test("el menú abre la partida: diez preguntas de las tres clases, sin repetir", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-multiplos");
  await expect(page.locator("#screen-game")).toBeVisible();
  const clases = await page.evaluate(() => Array.from({ length: 40 }, () => bolsaDeMultiplos()).map((b) => {
    const cuenta = { multiplo: 0, divisor: 0, comun: 0 };
    b.forEach((h) => cuenta[h.reto.clase]++);
    return [b.length, cuenta.multiplo, cuenta.divisor, cuenta.comun, new Set(b.map((h) => JSON.stringify(h.reto))).size];
  }));
  for (const c of clases) expect(c).toEqual([10, 4, 3, 3, 10]);
});

test("múltiplo de 6: la pregunta, la voz y las falsas con los errores típicos", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await pregunta(page, { clase: "multiplo", n: 6, k: 4 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuál es múltiplo de 6?");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("¿Cuál es múltiplo de 6?");
  // 24 la buena; 2 (divisor, no múltiplo); 25 (a uno de la tabla); 27 (de la tabla del 3, no del 6).
  expect(await etiquetas(page)).toEqual(["2", "24", "25", "27"]);
  expect(await elegir(page, 2)).toContain("2 es divisor de 6 (cabe en 6), no múltiplo: los múltiplos de 6 son 6, 12, 18…");
  await pregunta(page, { clase: "multiplo", n: 6, k: 4 });
  expect(await elegir(page, 25)).toContain("25 no está en la tabla del 6: 6 × 4 = 24 y 6 × 5 = 30.");
  await pregunta(page, { clase: "multiplo", n: 6, k: 4 });
  expect(await elegir(page, 27)).toContain("27 está en la tabla del 3 (3 × 9), pero no en la del 6.");
  await pregunta(page, { clase: "multiplo", n: 6, k: 4 });
  const bien = await elegir(page, 24);
  expect(bien).toContain("24 = 6 × 4: está en la tabla del 6.");
});

test("para un número primo, el divisor que confunde es el 1", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "multiplo", n: 7, k: 3 });
  expect(await etiquetas(page)).toContain("1");
  expect(await elegir(page, 1)).toContain("1 es divisor de 7");
});

test("divisor de 24: un múltiplo como trampa y los que no dan exacto", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "divisor", d: 4, q: 6 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuál es divisor de 24?");
  expect(await etiquetas(page)).toEqual(["4", "5", "7", "48"]);
  expect(await elegir(page, 48)).toContain("48 es múltiplo de 24, no divisor");
  await pregunta(page, { clase: "divisor", d: 4, q: 6 });
  expect(await elegir(page, 5)).toContain("24 ÷ 5 no da exacto: 5 × 4 = 20 y sobran 4.");
  await pregunta(page, { clase: "divisor", d: 4, q: 6 });
  expect(await elegir(page, 4)).toContain("24 ÷ 4 = 6, exacto: 4 × 6 = 24.");
});

test("en dos tablas: el más pequeño común, y las falsas de una sola tabla o la suma", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "comun", a: 4, b: 6 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Qué número está en la tabla del 4 y en la del 6?");
  // 12 la buena; 8 solo en la del 4; 6 solo en la del 6; 10, la suma.
  expect(await etiquetas(page)).toEqual(["6", "8", "10", "12"]);
  expect(await elegir(page, 8)).toContain("8 está en la tabla del 4 (4 × 2), pero no en la del 6.");
  await pregunta(page, { clase: "comun", a: 4, b: 6 });
  expect(await elegir(page, 10)).toContain("Sumaste: 4 + 6 = 10.");
  await pregunta(page, { clase: "comun", a: 4, b: 6 });
  expect(await elegir(page, 12)).toContain("12 = 4 × 3 = 6 × 2: está en las dos tablas.");
});

test("trescientas al azar: 4 opciones distintas, una sola buena de verdad y cada falsa explicada", async ({ page }) => {
  await alMenu(page);
  const malos = await page.evaluate(() => {
    const errores = [];
    for (let i = 0; i < 100; i++) {
      for (const h of bolsaDeMultiplos()) {
        const p = armarMultiplos(h.reto);
        const r = h.reto;
        const vale = (x) => r.clase === "multiplo" ? x % r.n === 0 : r.clase === "divisor" ? (r.d * r.q) % x === 0 : x % r.a === 0 && x % r.b === 0;
        const v = p.opciones.map((o) => o.valor);
        if (new Set(v).size !== 4) errores.push(`${p.texto}: ${v}`);
        if (v.filter(vale).length !== 1 || !vale(p.respuesta)) errores.push(`${p.texto}: ${v} no tiene una sola buena`);
        for (const x of v) if (x !== p.respuesta && !p.porQue[x]) errores.push(`${p.texto}: ${x} sin explicación`);
        if (v.some((x) => x < 1)) errores.push(`${p.texto}: ${v}`);
      }
    }
    return errores;
  });
  expect(malos).toEqual([]);
});

test("con pocas tablas sabidas, números del 2 al 5; con muchas, del 2 al 9", async ({ page }) => {
  await alMenu(page);
  const maximos = () => page.evaluate(() => Math.max(...Array.from({ length: 30 }, () => bolsaDeMultiplos()).flat()
    .filter((h) => h.reto.clase !== "comun").map((h) => h.reto.n || h.reto.d)));
  expect(await maximos()).toBeLessThanOrEqual(5);
  await page.evaluate(() => {
    for (let a = 2; a <= 9; a++) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
  });
  expect(await maximos()).toBeGreaterThan(5);
});

test("la ayuda muestra las tablas como filas de números, sin marcar la respuesta", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "comun", a: 4, b: 6 });
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .fila-multiplos")).toHaveCount(2);
  await expect(page.locator("#help-visual-container .fila-multiplos").nth(0)).toContainText("Tabla del 4");
  await expect(page.locator("#help-visual-container .fila-multiplos").nth(1).locator(".chip-multiplo")).toHaveCount(10);
  await expect(page.locator("#help-truco")).toContainText("Cuenta de 4 en 4 y de 6 en 6");
  await expect(page.locator("#btn-girar")).toBeHidden();
  // Divisor: una fila por opción, contando hasta pasar o llegar al número.
  await pregunta(page, { clase: "divisor", d: 4, q: 6 });
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");   // empezar otra la cierra
  await expect(page.locator("#help-visual-container .fila-multiplos")).toHaveCount(4);
  await expect(page.locator("#help-visual-container .fila-multiplos").first()).toContainText("De 4 en 4");
  expect(await page.locator("#help-visual-container .fila-multiplos").first().locator(".chip-multiplo").allTextContents()).toEqual(["4", "8", "12", "16", "20", "24"]);
});

test("siempre se elige, lo fallado vuelve y no cuenta para el jardín", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { hechos[claveHecho(6, 1)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }]; });
  await pregunta(page, { clase: "multiplo", n: 6, k: 4 });
  await expect(page.locator("#escritura")).toBeHidden();
  await elegir(page, 25);
  expect(await page.evaluate(() => colaRepaso.map((r) => r.reto?.k))).toContain(4);
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(1);
});

test("queda en la vista para adultos y en el informe, por clase", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "divisor", d: 4, q: 6 });
  await elegir(page, 4);
  await pregunta(page, { clase: "multiplo", n: 6, k: 4 });
  await elegir(page, 25);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-multiplos")).toContainText("Múltiplos y divisores (sus últimas respuestas): múltiplos de un número 0 de 1, divisores 1 de 1.");
  await page.evaluate(() => { window.print = () => {}; imprimirInforme(perfilActual); });
  await expect(page.locator("#informe")).toContainText("Múltiplos y divisores: 1 de 2 bien.");
});

test("diez aciertos: la victoria deja la idea clave", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-multiplos");
  for (let i = 0; i < 10; i++) await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); });
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victory-table-name")).toHaveText("Múltiplos y Divisores");
  await expect(page.locator("#victoria-aprendido")).toContainText("Resolviste 10 preguntas de múltiplos y divisores.");
});

test("cabe en el teléfono, con la ayuda abierta, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await pregunta(page, { clase: "divisor", d: 2, q: 9 });
    await page.click("#btn-help");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${tam.width}×${tam.height}`).toBeLessThanOrEqual(tam.width);
  }
});
