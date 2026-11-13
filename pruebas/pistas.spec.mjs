// Pistas desde lo que ya se sabe: si quien juega domina una vecina (7 × 7),
// la ayuda parte de ahí para llegar a la que le cuesta (7 × 8).
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida, fallo, preguntaActual, responder, instalarDobles } from "./ayudas.mjs";

// Reloj fijo: con el real, las flores de estos días se marchitarían y
// entrarían en «lo que me falta».
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00"));
});

const flor = [rapida("2026-11-01"), rapida("2026-11-02")];
const casi = [rapida("2026-11-02")];
const puente = (page, a, b, r = false) => page.evaluate(([x, y, z]) => puenteDesdeLoSabido(x, y, z)?.texto ?? null, [a, b, r]);

test("parte de la vecina que ya florece: una vez más", async ({ page }) => {
  await page.goto("./");
  await ponerIntentos(page, "7x7", flor);
  expect(await puente(page, 7, 8)).toBe("Desde lo que ya sabes: 7 × 7 = 49. Entonces 7 × 8 es 7 × 7 y una vez más 7: 49 + 7.");
  expect(await puente(page, 8, 7)).toBe("Desde lo que ya sabes: 7 × 7 = 49. Entonces 8 × 7 es 7 × 7 y una vez más 7: 49 + 7.");
});

test("una vez menos, y el doble, cuando es lo que hay", async ({ page }) => {
  await page.goto("./");
  await ponerIntentos(page, "7x9", flor);
  expect(await puente(page, 7, 8)).toBe("Desde lo que ya sabes: 7 × 9 = 63. Entonces 7 × 8 es 7 × 9 y una vez menos 7: 63 − 7.");
  await ponerIntentos(page, "4x4", flor);
  expect(await puente(page, 4, 8)).toBe("Desde lo que ya sabes: 4 × 4 = 16. Entonces 4 × 8 es el doble de 4 × 4: 16 + 16.");
});

test("prefiere lo florecido a lo «casi», y sumar a restar", async ({ page }) => {
  await page.goto("./");
  await ponerIntentos(page, "6x7", casi);   // vecina de 7 × 7… pero solo «casi»
  await ponerIntentos(page, "7x8", flor);   // florecida, aunque sea para restar
  expect(await puente(page, 7, 7)).toContain("7 × 8 = 56");
  await ponerIntentos(page, "6x7", flor);   // ahora las dos florecen: gana sumar
  expect(await puente(page, 7, 7)).toContain("7 × 6 = 42. Entonces 7 × 7 es 7 × 6 y una vez más 7");
});

test("sin vecina sabida, o si ya se la sabe, no hay puente; el ×1 no cuenta", async ({ page }) => {
  await page.goto("./");
  expect(await puente(page, 7, 8)).toBeNull();
  await ponerIntentos(page, "1x7", flor);   // 7 × 1 → 7 × 2 sería contar
  expect(await puente(page, 7, 2)).toBeNull();
  await ponerIntentos(page, "7x7", flor);
  await ponerIntentos(page, "7x8", flor);
  expect(await puente(page, 7, 8)).toBeNull();   // florecida: no hace falta
});

test("la ayuda lo dice antes que el truco, sin dar la respuesta, y la voz lo lee", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  await ponerIntentos(page, "7x7", flor);
  await ponerIntentos(page, "7x8", [fallo("2026-11-02")]);
  await page.click("#screen-welcome button");
  await page.click("#screen-selector .btn-falta");   // lo único pendiente: 7 × 8
  const { a, b } = await preguntaActual(page);
  expect(a * b).toBe(56);
  await page.click("#btn-help");
  const pista = page.locator("#help-truco");
  await expect(pista).toContainText(`Desde lo que ya sabes: 7 × 7 = 49. Entonces ${a} × ${b} es 7 × 7 y una vez más 7: 49 + 7.`);
  await expect(pista).toContainText("Otro camino: Truco del");
  await expect(pista).not.toContainText("56");
  const dicho = await page.evaluate(() => window.__dicho.at(-1).texto);
  expect(dicho).toBe(`Desde lo que ya sabes: 7 por 7 es 49. Entonces ${a} por ${b} es 7 por 7 y una vez más 7: 49 más 7.`);
});

test("al fallar, el puente con el resultado, para recordarla", async ({ page }) => {
  await page.goto("./");
  await ponerIntentos(page, "7x7", flor);
  await ponerIntentos(page, "7x8", [fallo("2026-11-02")]);
  await page.click("#screen-welcome button");
  await page.click("#screen-selector .btn-falta");
  const { a, b } = await preguntaActual(page);
  await responder(page, false);
  await expect(page.locator("#game-feedback")).toContainText(
    `${a} × ${b} = 56. Para recordarla: 7 × 7 = 49. Entonces ${a} × ${b} es 7 × 7 y una vez más 7: 49 + 7 = 56.`);
});

test("la voz dice «menos» con el signo de restar", async ({ page }) => {
  await page.goto("./");
  expect(await page.evaluate(() => textoParaVoz("63 − 7"))).toBe("63 menos 7");
});
