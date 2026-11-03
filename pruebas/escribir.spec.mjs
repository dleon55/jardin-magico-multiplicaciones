// Responder escribiendo: lo que ya salió bien se escribe, y así se mide si se
// recuerda (no solo si se reconoce entre cuatro opciones) y en cuánto tiempo.
import { test, expect } from "@playwright/test";
import {
  entrarATabla, preguntaActual, responder, siguiente, seEscribe, escribir,
  ponerIntentos, elegida, rapida,
} from "./ayudas.mjs";

const conTeclado = (testInfo) => testInfo.project.name === "escritorio";

/** Abre la tabla del 3 con todas sus multiplicaciones ya acertadas una vez: todas se escriben. */
async function tablaQueSeEscribe(page) {
  await page.goto("./");
  for (let b = 1; b <= 10; b++) await ponerIntentos(page, `3x${b}`, [elegida("2026-11-01")]);
  await entrarATabla(page, 3);
  expect(await seEscribe(page)).toBe(true);
}

const ultimoIntento = (page, a, b) => page.evaluate(([x, y]) => intentosDe(x, y).at(-1), [a, b]);

test("en modo escrito no hay opciones, y «Listo» solo funciona con un número", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await expect(page.locator("#opciones")).toBeHidden();
  await expect(page.locator("#tecla-listo")).toBeDisabled();
  await page.click('#escritura [data-digito="2"]');
  await expect(page.locator("#tecla-listo")).toBeEnabled();
  await expect(page.locator("#escrito")).toHaveText("2");
});

test("dos cifras como máximo, y el borrador quita la última", async ({ page }) => {
  await tablaQueSeEscribe(page);
  for (const d of ["1", "2", "3"]) await page.click(`#escritura [data-digito="${d}"]`);
  await expect(page.locator("#escrito")).toHaveText("12");   // el producto más alto es 90
  await page.click("#tecla-borrar");
  await expect(page.locator("#escrito")).toHaveText("1");
  await page.click("#tecla-borrar");
  await expect(page.locator("#tecla-listo")).toBeDisabled();
});

test("acertar escribiendo guarda el modo, el día y el tiempo", async ({ page }) => {
  await tablaQueSeEscribe(page);
  const { a, b, producto } = await preguntaActual(page);
  await escribir(page, producto);
  await expect(page.locator("#escrito")).toContainText("✓");
  // Verde de verdad: el fondo blanco de base no debe taparlo.
  await expect(page.locator("#escrito")).toHaveCSS("background-color", "rgb(220, 252, 231)");
  await expect(page.locator("#game-feedback")).toContainText(`${a} × ${b} = ${producto}`);
  const intento = await ultimoIntento(page, a, b);
  const hoy = await page.evaluate(() => hoy());
  expect(intento).toMatchObject({ d: hoy, m: "e", ok: 1 });
  expect(intento.ms).toBeGreaterThanOrEqual(0);
  expect(intento.ms).toBeLessThan(6000);
});

test("escrita mal: dice lo que se escribió y la correcta, y vuelve más tarde con opciones", async ({ page }) => {
  await tablaQueSeEscribe(page);
  const { a, b, producto } = await preguntaActual(page);
  await escribir(page, producto + 1);
  await expect(page.locator("#escrito")).toContainText("✗");
  await expect(page.locator("#escrito")).toHaveCSS("background-color", "rgb(254, 226, 226)");
  await expect(page.locator("#game-feedback")).toContainText(`Escribiste ${producto + 1}. ${a} × ${b} = ${producto}`);
  // Vuelve a los 2 turnos, y como la última fue un fallo, con opciones: primero se reaprende.
  for (let i = 0; i < 2; i++) { await siguiente(page); if (i === 0) await responder(page, true); }
  expect(await preguntaActual(page)).toMatchObject({ a, b });
  expect(await seEscribe(page)).toBe(false);
});

test("con la ayuda abierta, el tiempo no cuenta", async ({ page }) => {
  await tablaQueSeEscribe(page);
  const { a, b, producto } = await preguntaActual(page);
  await page.click("#btn-help");
  await escribir(page, producto);
  expect((await ultimoIntento(page, a, b)).ms).toBeNull();
});

test("escrita pero lenta: es un acierto y dice, sin regañar, qué falta para florecer", async ({ page }) => {
  await tablaQueSeEscribe(page);
  const { a, b, producto } = await preguntaActual(page);
  await page.evaluate(() => { inicioPregunta -= 20000; });
  await escribir(page, producto);
  await expect(page.locator("#game-feedback")).toContainText("Cuando te salga sin pensar, florecerá.");
  expect((await ultimoIntento(page, a, b)).ok).toBe(1);
  await expect(page.locator("#current-stars")).toHaveText("1");
});

test("al florecer, se celebra con su nombre", async ({ page }) => {
  await page.goto("./");
  await ponerIntentos(page, "7x8", [rapida("2020-01-01")]);
  await page.click("#screen-welcome button");
  await page.click("#screen-selector .btn-falta");
  for (let i = 0; i < 4; i++) {
    const { a, b } = await preguntaActual(page);
    await responder(page, true);
    if (a === 7 && b === 8) {
      await expect(page.locator("#game-feedback")).toContainText("🌸 ¡7 × 8 floreció!");
      return;
    }
    await siguiente(page);
  }
  throw new Error("7 × 8 no salió entre las primeras preguntas");
});

test("con el teclado físico: cifras, Retroceso y Enter", async ({ page }, testInfo) => {
  test.skip(!conTeclado(testInfo), "solo donde hay teclado");
  await tablaQueSeEscribe(page);
  const { a, b, producto } = await preguntaActual(page);
  await page.keyboard.press("9");
  await page.keyboard.press("Backspace");
  for (const d of String(producto)) await page.keyboard.press(d);
  await page.keyboard.press("Enter");
  await expect(page.locator("#escrito")).toContainText("✓");
  expect((await ultimoIntento(page, a, b)).m).toBe("e");
  // Tras responder, Enter sigue a la próxima, como con las opciones.
  await page.keyboard.press("Enter");
  await expect(page.locator("#question-text")).not.toHaveText(`${a} × ${b}`);
});
