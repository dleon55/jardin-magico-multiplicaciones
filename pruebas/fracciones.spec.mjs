// Fracciones de un número (4.º a 6.º): «¾ de 24» es dividir entre 4 y
// multiplicar por 3, con las tablas que ya se saben.
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida, instalarDobles } from "./ayudas.mjs";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00"));
});

const fraccion = (page, r) => page.evaluate((x) => {
  const p = armarFraccion(x);
  return { ...p, valores: p.opciones.map((o) => o.valor) };
}, r);

test("¾ de 24: respuesta, voz, explicación y las opciones falsas de los errores típicos", async ({ page }) => {
  await page.goto("./");
  const p = await fraccion(page, { m: 3, d: 4, k: 6 });
  expect(p.texto).toBe("¿Cuánto es 3/4 de 24?");
  expect(p.voz).toBe("¿Cuánto es tres cuartos de 24?");
  expect(p.respuesta).toBe(18);
  // Quedarse con una parte (6), calcular lo que sobra (¼ = 6, ya está) y dividir entre el de arriba (24 ÷ 3 = 8).
  expect(p.valores).toEqual(expect.arrayContaining([6, 8, 18]));
  expect(new Set(p.valores).size).toBe(4);
  expect(p.explicacion).toBe("3/4 de 24 = 18: un cuarto es 24 ÷ 4 = 6, y tres cuartos son 3 × 6 = 18.");
  expect(p.pista).toBe("Primero busca un cuarto: reparte 24 en 4 partes iguales. Luego toma 3 de esas partes.");
});

test("una fracción unitaria es repartir en partes iguales", async ({ page }) => {
  await page.goto("./");
  const p = await fraccion(page, { m: 1, d: 3, k: 7 });
  expect([p.texto, p.voz, p.respuesta]).toEqual(["¿Cuánto es 1/3 de 21?", "¿Cuánto es un tercio de 21?", 7]);
  expect(p.explicacion).toBe("1/3 de 21 = 7: es repartir 21 en 3 partes iguales, 21 ÷ 3 = 7.");
});

test("lo que sobra es una opción falsa: 2/5 de 30 ofrece 18 (los 3/5 restantes)", async ({ page }) => {
  await page.goto("./");
  const p = await fraccion(page, { m: 2, d: 5, k: 6 });
  expect(p.respuesta).toBe(12);
  expect(p.valores).toEqual(expect.arrayContaining([6, 18, 15]));   // una parte, lo que sobra, 30 ÷ 2
});

test("los nombres de las partes, en la voz", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => [nombreFraccion(1, 2), nombreFraccion(2, 3), nombreFraccion(5, 8), nombreFraccion(7, 9),
    textoParaVoz("3/4 de 24 = 18: un cuarto es 24 ÷ 4 = 6.")]);
  expect(r).toEqual(["un medio", "dos tercios", "cinco octavos", "siete novenos", "tres cuartos de 24 es 18: un cuarto es 24 entre 4 es 6."]);
});

test("una partida: 4 de una parte y 6 de varias; con pocas sabidas, partes del 2 al 5", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => {
    const b = bolsaDeFracciones();
    return { n: b.length, unitarias: b.filter((h) => h.reto.m === 1).length, propias: b.every((h) => h.reto.m < h.reto.d),
      maxD: Math.max(...b.map((h) => h.reto.d)) };
  });
  expect(r).toEqual({ n: 10, unitarias: 4, propias: true, maxD: expect.any(Number) });
  expect(r.maxD).toBeLessThanOrEqual(5);
});

test("doscientas al azar: 4 opciones distintas y positivas, con la respuesta bien calculada", async ({ page }) => {
  await page.goto("./");
  for (const k of ["2x3", "2x4", "3x4", "3x5", "4x5", "5x5"]) await ponerIntentos(page, k, [rapida("2026-11-02")]);
  const malos = await page.evaluate(() => {
    const f = [];
    for (let i = 0; i < 20; i++) for (const h of bolsaDeFracciones()) {
      const p = armarFraccion(h.reto);
      const v = p.opciones.map((o) => o.valor);
      const { m, d, k } = h.reto;
      if (p.respuesta !== (d * k * m) / d || v.length !== 4 || new Set(v).size !== 4 || !v.includes(p.respuesta) || v.some((x) => x <= 0)) f.push(JSON.stringify(h.reto));
    }
    return f;
  });
  expect(malos).toEqual([]);
});

test("se juega desde el menú y no toca el jardín; un fallo vuelve igual", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=Fracciones");
  await expect(page.locator("#problema-texto")).toHaveText(/^¿Cuánto es \d\/\d de \d+\?$/);
  const antes = await page.evaluate(() => JSON.stringify(pregunta.reto));
  const mala = await page.evaluate(() => [...document.querySelectorAll(".btn-option")].find((b) => Number(b.dataset.valor) !== correctAnswer).id);
  await page.click(`#${mala}`);
  await expect(page.locator("#game-feedback")).toContainText(await page.evaluate(() => pregunta.explicacion));
  const vistos = [];
  for (let i = 0; i < 3; i++) {
    await page.locator("#btn-siguiente:not([disabled])").click();
    vistos.push(await page.evaluate(() => JSON.stringify(pregunta.reto)));
    if (i < 2) await page.click(`.btn-option[data-valor="${await page.evaluate(() => correctAnswer)}"]`);
  }
  expect(vistos).toContain(antes);
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);
});

test("la ayuda reparte el rectángulo en filas iguales y pinta de verde las que se toman", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 4, b: 6, reto: { m: 3, d: 4, k: 6 } }]; nextQuestion(); });
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .punto")).toHaveCount(24);
  await expect(page.locator("#help-visual-container .punto-tomado")).toHaveCount(18);
  await expect(page.locator("#help-explain")).toHaveText("24 puntos en 4 filas iguales: cada fila es un cuarto. Cuenta los puntos de las 3 filas verdes.");
  await expect(page.locator("#btn-girar")).toBeHidden();
  const dicho = await page.evaluate(() => window.__dicho.at(-1).texto);
  expect(dicho).toBe("Primero busca un cuarto: reparte 24 en 4 partes iguales. Luego toma 3 de esas partes.");
});

test("se escribe solo si la multiplicación de debajo ya floreció", async ({ page }) => {
  await page.goto("./");
  await ponerIntentos(page, "4x6", [rapida("2026-11-01"), rapida("2026-11-02")]);
  await page.click("#screen-welcome button");
  await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 3, b: 7, reto: { m: 2, d: 3, k: 7 } }, { a: 4, b: 6, reto: { m: 3, d: 4, k: 6 } }]; nextQuestion(); });
  await expect(page.locator("#escritura")).toBeVisible();   // 4 × 6 floreció
});

test("diez aciertos: la victoria dice cuántas se resolvieron y cómo se saca", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=Fracciones");
  for (let i = 0; i < 10; i++) {
    const c = await page.evaluate(() => correctAnswer);
    if (await page.locator("#escritura:not(.hidden)").count()) {
      for (const dg of String(c)) await page.click(`#escritura [data-digito="${dg}"]`);
      await page.click("#tecla-listo");
    } else await page.click(`.btn-option[data-valor="${c}"]`);
    await page.locator("#btn-siguiente:not([disabled])").click();
  }
  await expect(page.locator("#victory-table-name")).toHaveText("Las Fracciones del Jardín");
  await expect(page.locator("#victoria-aprendido")).toHaveText(
    "Resolviste 10 fracciones. Para sacar 3/4 de un número, se divide entre 4 y se multiplica por 3.");
});
