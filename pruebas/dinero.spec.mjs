// Decimales y dinero (issue #71): sumar precios (llevando el peso), el
// cambio (pidiendo prestado), varias cosas iguales y comparar decimales.
// Errores típicos como falsas, cada uno explicado; todo en centavos enteros.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

const SUMAR = { clase: "sumar", a: 1250, b: 875, cosas: 0 };
const CAMBIO = { clase: "cambio", billete: 50, precio: 3740 };
const POR = { clase: "por", n: 3, precio: 1250, cosa: 0 };
const DECIMAL = { clase: "decimal", a: 50, b: 45 };

async function pregunta(page, reto) {
  if (await page.locator("#btn-dinero").isVisible()) await page.click("#btn-dinero");
  else await page.evaluate(() => startTable("dinero"));
  await page.evaluate((r) => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: numerosDeDinero(r)[0], b: 1, reto: r }]; nextQuestion(); }, reto);
}
const etiquetas = (page) => page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.dataset.etiqueta)
  .sort((x, y) => parseFloat(x.replace("$", "")) - parseFloat(y.replace("$", ""))));
const elegir = async (page, valor) => {
  await page.locator(`#opciones .btn-option[data-valor="${valor}"]`).click();
  return page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; });
};

test("el menú abre la partida: diez preguntas de las cuatro clases, sin repetir", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-dinero");
  await expect(page.locator("#screen-game")).toBeVisible();
  const r = await page.evaluate(() => Array.from({ length: 40 }, () => bolsaDeDinero()).map((b) => {
    const c = { sumar: 0, cambio: 0, por: 0, decimal: 0 };
    b.forEach((h) => c[h.reto.clase]++);
    return [b.length, c.sumar, c.cambio, c.por, c.decimal, new Set(b.map((h) => JSON.stringify(h.reto))).size];
  }));
  for (const x of r) expect(x).toEqual([10, 3, 3, 2, 2, 10]);
});

test("sumar: los centavos siempre pasan de un peso, y la trampa es no llevarlo", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  const llevan = await page.evaluate(() => Array.from({ length: 200 }, () => crearRetoDinero("sumar", false)).every((r) => (r.a % 100) + (r.b % 100) >= 100));
  expect(llevan).toBe(true);
  await pregunta(page, SUMAR);
  await expect(page.locator("#problema-texto")).toHaveText("Compras una paleta de $12.50 y un jugo de $8.75. ¿Cuánto pagas?");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("Compras una paleta de 12 pesos con 50 centavos y un jugo de 8 pesos con 75 centavos. ¿Cuánto pagas?");
  expect(await etiquetas(page)).toEqual(["$20.00", "$20.25", "$21.25", "$22.25"]);
  expect(await elegir(page, 2025)).toContain("50 + 75 = 125 centavos, que son 1 peso y 25 centavos: te faltó llevar ese peso.");
  await pregunta(page, SUMAR);
  expect(await elegir(page, 2000)).toContain("Sumaste solo los pesos: faltan los centavos.");
  await pregunta(page, SUMAR);
  expect(await elegir(page, 2125)).toContain("$12.50 + $8.75 = $21.25: los centavos dan 125, que son 1 peso y 25 centavos.");
});

test("el cambio: pedir prestado el peso, contando hacia arriba", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, CAMBIO);
  await expect(page.locator("#problema-texto")).toHaveText("Pagas con un billete de $50 algo que cuesta $37.40. ¿Cuánto te dan de cambio?");
  expect(await etiquetas(page)).toEqual(["$12.40", "$12.60", "$13.40", "$13.60"]);
  expect(await elegir(page, 1340)).toContain("Copiaste los 40 centavos: 50 − 37 = 13, pero de $37.40 a $38.00 faltan 60 centavos.");
  await pregunta(page, CAMBIO);
  expect(await elegir(page, 1360)).toContain("Los centavos están bien, pero para darlos hubo que cambiar un peso: son 12 pesos, no 13.");
  await pregunta(page, CAMBIO);
  expect(await elegir(page, 1260)).toContain("$50 − $37.40 = $12.60: de $37.40 a $38.00 son 60 centavos, y de ahí a $50, 12 pesos.");
  // Nunca 50 centavos: ahí pedir prestado o no daría lo mismo.
  expect(await page.evaluate(() => Array.from({ length: 300 }, () => crearRetoDinero("cambio", false)).some((r) => r.precio % 100 === 50))).toBe(false);
});

test("varias cosas iguales: multiplicar también los centavos", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, POR);
  await expect(page.locator("#problema-texto")).toHaveText("Compras 3 cuadernos de $12.50 cada cuaderno. ¿Cuánto pagas?");
  expect(await etiquetas(page)).toEqual(["$15.50", "$25.00", "$36.50", "$37.50"]);
  expect(await elegir(page, 3650)).toContain("Multiplicaste los pesos (3 × 12 = 36), pero no los centavos: también son 3 veces 50 centavos.");
  await pregunta(page, POR);
  expect(await elegir(page, 1550)).toContain("Sumaste 3: son 3 veces $12.50, no $12.50 y 3 pesos más.");
  await pregunta(page, POR);
  expect(await elegir(page, 3750)).toContain("3 × $12.50 = $37.50: 3 × 12 pesos y 3 × 50 = 150 centavos.");
});

test("comparar decimales: más cifras no es más grande", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, DECIMAL);
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuál es el número más grande?");
  expect(await etiquetas(page)).toEqual(["0.09", "0.4", "0.45", "0.5"]);
  expect(await elegir(page, 45)).toContain("Más cifras no es más grande: 0.5 es lo mismo que 0.50, y 50 centésimos son más que 45.");
  await pregunta(page, DECIMAL);
  expect(await elegir(page, 9)).toContain("0.09 son 9 centésimos, como 9 centavos");
  await pregunta(page, DECIMAL);
  expect(await elegir(page, 50)).toContain("0.5 es el más grande: es 0.50, 50 centésimos.");
});

test("trescientas al azar: 4 opciones distintas, una sola buena de verdad y cada falsa explicada", async ({ page }) => {
  await alMenu(page);
  const malos = await page.evaluate(() => {
    const errores = [];
    for (let i = 0; i < 30; i++) {
      for (const h of bolsaDeDinero()) {
        const p = armarDinero(h.reto);
        const r = h.reto;
        const v = p.opciones.map((o) => o.valor);
        const buena = r.clase === "sumar" ? r.a + r.b : r.clase === "cambio" ? r.billete * 100 - r.precio : r.clase === "por" ? r.n * r.precio : Math.max(...v);
        if (new Set(v).size !== 4 || p.respuesta !== buena || v.filter((x) => x === buena).length !== 1) errores.push(`${p.texto}: ${v}`);
        if (r.clase === "decimal" && p.respuesta !== r.a) errores.push(`decimal ${v}`);
        for (const x of v) if (x !== buena && !p.porQue[x]) errores.push(`${p.texto}: ${x} sin explicación`);
        if (v.some((x) => x < 1 || !Number.isInteger(x))) errores.push(`${p.texto}: ${v}`);
        if (p.opciones.some((o) => /\.\d{3}|NaN|undefined/.test(o.etiqueta))) errores.push(`${p.texto}: ${p.opciones.map((o) => o.etiqueta)}`);
      }
    }
    return errores;
  });
  expect(malos).toEqual([]);
});

test("con pocas tablas sabidas, precios y billetes más chicos", async ({ page }) => {
  await alMenu(page);
  const maximo = () => page.evaluate(() => Math.max(...Array.from({ length: 30 }, () => bolsaDeDinero()).flat()
    .map((h) => h.reto.clase === "cambio" ? h.reto.billete * 100 : h.reto.clase === "por" ? h.reto.n * 1000 : 0)));
  expect(await maximo()).toBeLessThanOrEqual(5000);
  await page.evaluate(() => {
    for (let a = 2; a <= 9; a++) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
  });
  expect(await maximo()).toBeGreaterThan(5000);
});

test("la ayuda de cada clase, sin dar la respuesta", async ({ page }) => {
  await alMenu(page);
  const abrir = async (reto) => { await pregunta(page, reto); if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help"); };
  await abrir(SUMAR);
  await expect(page.locator("#help-visual-container .cuenta-dinero")).toContainText("12");
  await expect(page.locator("#help-visual-container .cuenta-dinero tbody tr").last()).toContainText("?");
  await expect(page.locator("#help-truco")).toContainText("Suma primero los centavos: 50 + 75.");
  await abrir(CAMBIO);
  expect(await page.locator("#help-visual-container .chip-dinero").allTextContents()).toEqual(["$37.40", "$38.00", "$40.00", "$50.00"]);
  await abrir(POR);
  await expect(page.locator("#help-visual-container .chip-dinero")).toHaveCount(3);
  await abrir(DECIMAL);
  await expect(page.locator("#help-truco")).toContainText("Piensa en dinero: 0.5 es $0.50 (50 centavos) y 0.45 es $0.45.");
  await expect(page.locator("#help-visual-container .tira-decimal")).toHaveCount(4);
  const anchos = await page.locator("#help-visual-container .tira-decimal span span").evaluateAll((s) => s.map((x) => x.style.width).sort());
  expect(anchos).toEqual(["40%", "45%", "50%", "9%"].sort());
  await abrir({ clase: "decimal", a: 70, b: 65 });   // la pista usa los números de la pregunta
  await expect(page.locator("#help-truco")).toContainText("0.7 es $0.70 (70 centavos) y 0.65 es $0.65.");
  await expect(page.locator("#btn-girar")).toBeHidden();
});

test("siempre se elige, lo fallado vuelve y no cuenta para el jardín", async ({ page }) => {
  await alMenu(page);
  // 5 × 1 ya florecida: al dividir, eso pediría escribir; aquí la respuesta tiene pesos y centavos.
  await page.evaluate(() => { hechos[claveHecho(5, 1)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }]; });
  await pregunta(page, CAMBIO);
  await expect(page.locator("#escritura")).toBeHidden();
  await elegir(page, 1340);
  expect(await page.evaluate(() => colaRepaso.map((r) => r.reto?.precio))).toContain(3740);
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(1);   // solo la sembrada
});

test("queda en la vista para adultos y en el informe, por clase", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, SUMAR);
  await elegir(page, 2125);
  await pregunta(page, CAMBIO);
  await elegir(page, 1340);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-dinero")).toContainText("Decimales y dinero (sus últimas respuestas): sumar precios 1 de 1, el cambio 0 de 1.");
  await page.evaluate(() => { window.print = () => {}; imprimirInforme(perfilActual); });
  await expect(page.locator("#informe")).toContainText("Decimales y dinero: 1 de 2 bien.");
});

test("diez aciertos: la victoria deja la idea clave", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-dinero");
  for (let i = 0; i < 10; i++) await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); });
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victory-table-name")).toHaveText("Decimales y Dinero");
  await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 preguntas de decimales y dinero. 100 centavos son un peso: al sumar se lleva y al restar se pide prestado, como con los números de siempre.");
});

test("cabe en el teléfono con la ayuda abierta, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await pregunta(page, { clase: "por", n: 9, precio: 2075, cosa: 0 });
    await page.click("#btn-help");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${tam.width}×${tam.height}`).toBeLessThanOrEqual(tam.width);
    const anchos = await page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.scrollWidth <= b.clientWidth));
    expect(anchos.every(Boolean)).toBe(true);
  }
});
