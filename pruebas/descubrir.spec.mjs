// Descubrir una tabla: antes de practicarla por primera vez se ve cómo se
// forma, fila a fila y contando de N en N, con su truco y cuáles de sus
// multiplicaciones ya se vieron en tablas de antes.
import { test, expect } from "@playwright/test";
import { ponerIntentos, elegida, instalarDobles, preguntaActual } from "./ayudas.mjs";

const conTeclado = (testInfo) => testInfo.project.name === "escritorio";

async function alMenu(page) {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

const tabla = (page, n) => page.locator("#grid-tablas-container button").nth(n - 1);
const saltos = (page) => page.$$eval("#descubrir-saltos li", (ls) => ls.map((l) => l.textContent));

test("la primera vez que se elige una tabla, se descubre antes de practicar", async ({ page }) => {
  await alMenu(page);
  await tabla(page, 7).click();
  await expect(page.locator("#screen-descubrir")).toBeVisible();
  await expect(page.locator("#screen-descubrir [data-foco]")).toBeFocused();
  await expect(page.locator("#screen-descubrir h2")).toHaveText("Descubre la tabla del 7");
  await expect(page.locator("#descubrir-intro")).toHaveText("Cada fila tiene 7 puntos. Toca «Otra fila» y mira cómo crece.");
  await expect(page.locator("#descubrir-rejilla .punto")).toHaveCount(0);
  await expect(page.locator("#descubrir-final")).toBeHidden();
});

test("cada fila suma 7 puntos, cuenta de 7 en 7 y dice la multiplicación", async ({ page }) => {
  await alMenu(page);
  await tabla(page, 7).click();
  for (let i = 0; i < 3; i++) await page.click("#descubrir-otra");
  await expect(page.locator("#descubrir-rejilla .punto")).toHaveCount(21);
  await expect(page.locator("#descubrir-cuenta")).toHaveText("3 filas de 7: 7 × 3 = 21");
  expect(await saltos(page)).toEqual(["7", "14", "21"]);
});

test("al llegar a 10 filas: la tabla entera, su truco y cuáles son nuevas", async ({ page }) => {
  await alMenu(page);
  await tabla(page, 7).click();
  for (let i = 0; i < 10; i++) await page.click("#descubrir-otra");
  await expect(page.locator("#descubrir-otra")).toBeDisabled();
  await expect(page.locator("#descubrir-rejilla .punto")).toHaveCount(70);
  expect(await saltos(page)).toEqual(["7", "14", "21", "28", "35", "42", "49", "56", "63", "70"]);
  await expect(page.locator("#descubrir-final")).toBeVisible();
  await expect(page.locator("#descubrir-truco")).toHaveText(
    "Truco del 7: es por 5 más por 2. Por ejemplo, 7 × 7: 7 × 5 = 35, y súmale 7 × 2 = 14.");
  await expect(page.locator("#descubrir-nuevas")).toHaveText(
    "De 7 × 1 a 7 × 6 son las mismas que 1 × 7 a 6 × 7, de las tablas de antes. Las nuevas son 4: 7 × 7, 7 × 8, 7 × 9 y 7 × 10.");
  await expect(page.locator("#descubrir-practicar")).toBeFocused();
  await page.click("#descubrir-practicar");
  await expect(page.locator("#screen-game")).toBeVisible();
  expect(await page.evaluate(() => currentTable)).toBe(7);
});

test("la tabla del 1 y la del 2 lo dicen a su medida", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => [nuevasDeTabla(1), nuevasDeTabla(2), nuevasDeTabla(9), trucoDeTabla(1), trucoDeTabla(9)]);
  expect(r).toEqual([
    "Todas sus multiplicaciones son nuevas: es la primera tabla de tu jardín.",
    "2 × 1 es lo mismo que 1 × 2, que ya está en la tabla del 1. Las nuevas son 9: 2 × 2, 2 × 3, 2 × 4, 2 × 5, 2 × 6, 2 × 7, 2 × 8, 2 × 9 y 2 × 10.",
    "De 9 × 1 a 9 × 8 son las mismas que 1 × 9 a 8 × 9, de las tablas de antes. Las nuevas son 2: 9 × 9 y 9 × 10.",
    "Truco del 1: por 1, el número se queda igual.",
    "Truco del 9: es por 10 y una vez menos. Por ejemplo, 9 × 9: 9 × 10 = 90, y quítale 9.",
  ]);
});

test("se puede saltar en cualquier momento, y la segunda vez va directo a practicar", async ({ page }) => {
  await alMenu(page);
  await tabla(page, 4).click();
  await page.click("#descubrir-practicar");   // sin armar ninguna fila
  await expect(page.locator("#screen-game")).toBeVisible();
  expect((await preguntaActual(page)).a).toBe(4);

  await page.reload();   // se recuerda en el dispositivo
  await page.click("#screen-welcome button");
  await tabla(page, 4).click();
  await expect(page.locator("#screen-game")).toBeVisible();
  await expect(page.locator("#screen-descubrir")).toBeHidden();
});

test("a quien ya practicaba una tabla no se le interrumpe", async ({ page }) => {
  await page.goto("./");
  await ponerIntentos(page, "3x5", [elegida("2026-11-01")]);
  await page.click("#screen-welcome button");
  await tabla(page, 5).click();   // 5 × 3 es la misma planta que 3 × 5: ya se jugó
  await expect(page.locator("#screen-game")).toBeVisible();
});

test("desde Mi jardín se vuelve a ver cualquier tabla", async ({ page }) => {
  await alMenu(page);
  await page.click("#screen-selector >> text=Mi jardín");
  await page.click("text=Ver la tabla del 6");
  await expect(page.locator("#screen-descubrir h2")).toHaveText("Descubre la tabla del 6");
  await page.click("#descubrir-otra");
  await expect(page.locator("#descubrir-cuenta")).toHaveText("1 fila de 6: 6 × 1 = 6");
  // Volver a entrar empieza de cero.
  await page.click("#screen-descubrir button:has-text('Menú')");
  await page.click("#screen-selector >> text=Mi jardín");
  await page.click("text=Ver la tabla del 6");
  await expect(page.locator("#descubrir-rejilla .punto")).toHaveCount(0);
});

test("con teclado: Espacio arma otra fila y Esc vuelve al menú", async ({ page }, testInfo) => {
  test.skip(!conTeclado(testInfo), "solo donde hay teclado");
  await alMenu(page);
  await page.keyboard.press("8");
  await expect(page.locator("#screen-descubrir")).toBeVisible();
  await page.keyboard.press(" ");
  await page.keyboard.press(" ");
  await expect(page.locator("#descubrir-cuenta")).toHaveText("2 filas de 8: 8 × 2 = 16");
  await page.keyboard.press("Escape");
  await expect(page.locator("#screen-selector")).toBeVisible();
});

test("la voz cuenta cada fila y lee el truco al final", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await tabla(page, 3).click();
  for (let i = 0; i < 10; i++) await page.click("#descubrir-otra");
  const dicho = await page.evaluate(() => window.__dicho.map((d) => d.texto));
  expect(dicho).toContain("Una fila de 3: 3.");
  expect(dicho).toContain("2 filas de 3: 6.");
  expect(dicho).toContain("10 filas de 3: 30.");
  expect(dicho.at(-1)).toMatch(/^¡Ya tienes la tabla entera! Truco del 3: es el doble y una vez más\. Por ejemplo, 3 por 3/);
});

test("borrar un jardín olvida sus tablas descubiertas", async ({ page }) => {
  await alMenu(page);
  await tabla(page, 2).click();
  await page.click("#descubrir-practicar");
  await page.evaluate(() => borrarPerfil(perfilActual));
  await page.evaluate(() => mostrarPantalla("screen-welcome"));
  await page.click("#screen-welcome button");
  await tabla(page, 2).click();
  await expect(page.locator("#screen-descubrir")).toBeVisible();
});

test("lo guardado dañado no rompe nada", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("jardin:descubiertas", "{no es json"));
  await alMenu(page);
  await tabla(page, 2).click();
  await expect(page.locator("#screen-descubrir")).toBeVisible();
});
