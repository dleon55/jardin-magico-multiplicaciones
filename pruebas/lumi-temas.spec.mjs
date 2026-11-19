// Lumi en los temas nuevos: lleva en la mano un objeto del tema, lo
// presenta con una frase al empezar y, si se fallan dos seguidas, da un
// truco corto. Lo que dice va también escrito, para el lector de pantalla.
import { test, expect } from "@playwright/test";

const TEMAS = ["residuo", "multiplos", "area", "dinero", "porcentajes", "decimales", "tiempo", "calendario"];

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Responde la pregunta en pantalla, bien o mal, sin esperar la siguiente. */
const responder = (page, bien) => page.evaluate((bien) => {
  cancelarEspera();
  const valor = bien ? correctAnswer : (pregunta.opciones?.find((o) => o.valor !== correctAnswer).valor ?? correctAnswer + 1);
  evaluar(valor, null);
  cancelarEspera();
  return document.getElementById("game-feedback").innerText;
}, bien);
const siguiente = (page) => page.evaluate(() => { cancelarEspera(); nextQuestion(); });

test("cada tema nuevo: Lumi lleva su objeto en la partida y en la victoria, y lo presenta con una frase escrita", async ({ page }) => {
  await alMenu(page);
  const frases = await page.evaluate(() => LUMI_TEMAS);
  expect(Object.keys(frases).sort()).toEqual([...TEMAS].sort());
  for (const tema of TEMAS) {
    if (await page.locator("#screen-selector").isHidden()) await page.evaluate(() => backToSelector());
    await page.click(`#btn-${tema}`);
    await expect(page.locator("#lumi-partida .accesorio-lumi")).toHaveAttribute("data-tema", tema);
    await expect(page.locator("#lumi-partida .accesorio-lumi")).toHaveCount(1);
    await expect(page.locator("#lumi-victoria .accesorio-lumi")).toHaveAttribute("data-tema", tema);
    await expect(page.locator("#globo-lumi")).toBeVisible();
    await expect(page.locator("#globo-lumi")).toHaveText(frases[tema].hola);
    await expect(page.locator("#game-feedback")).toHaveText(`Lumi: «${frases[tema].hola}»`);
  }
});

test("en las tablas, Lumi va sin objeto y sin frase; volver a un tema se lo pone otra vez", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable("tiempo"));
  await expect(page.locator("#lumi-partida .accesorio-lumi")).toHaveCount(1);
  await page.evaluate(() => { backToSelector(); startTable(3); });
  await expect(page.locator("#lumi-partida .accesorio-lumi")).toHaveCount(0);
  await expect(page.locator("#lumi-victoria .accesorio-lumi")).toHaveCount(0);
  await expect(page.locator("#globo-lumi")).toBeHidden();
  await expect(page.locator("#game-feedback")).not.toContainText("Lumi:");
  await page.evaluate(() => { backToSelector(); startTable("calendario"); });
  await expect(page.locator("#lumi-partida .accesorio-lumi")).toHaveAttribute("data-tema", "calendario");
});

test("el objeto sigue en la mano aunque Lumi cambie de cara", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable("dinero"));
  await responder(page, true);
  await expect(page.locator("#lumi-partida > .lumi")).toHaveAttribute("data-expresion", "celebrando");
  await expect(page.locator("#lumi-partida .accesorio-lumi")).toHaveCount(1);
  await siguiente(page);
  await responder(page, false);
  await expect(page.locator("#lumi-partida > .lumi")).toHaveAttribute("data-expresion", "animando");
  await expect(page.locator("#lumi-partida .accesorio-lumi")).toHaveCount(1);
});

test("al segundo fallo seguido, Lumi da el truco del tema (en el globo y escrito); al primero, no", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable("tiempo"));
  const truco = await page.evaluate(() => LUMI_TEMAS.tiempo.truco);
  expect(await responder(page, false)).not.toContain(truco);
  await siguiente(page);
  const segundo = await responder(page, false);
  expect(segundo).toContain(`Lumi: «${truco}»`);
  await expect(page.locator("#globo-lumi")).toHaveText(truco);
  // El tercero ya no lo repite.
  await siguiente(page);
  expect(await responder(page, false)).not.toContain(truco);
  // Un acierto en medio vuelve a empezar la cuenta.
  await siguiente(page);
  await responder(page, true);
  await siguiente(page);
  expect(await responder(page, false)).not.toContain(truco);
  await siguiente(page);
  expect(await responder(page, false)).toContain(truco);
});

test("en las tablas, dos fallos seguidos no traen truco de tema", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable(6));
  await responder(page, false);
  await siguiente(page);
  expect(await responder(page, false)).not.toContain("Lumi:");
});

test("empezar otra partida reinicia la cuenta de fallos", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable("calendario"));
  await responder(page, false);
  await page.evaluate(() => { backToSelector(); startTable("calendario"); });
  const truco = await page.evaluate(() => LUMI_TEMAS.calendario.truco);
  expect(await responder(page, false)).not.toContain(truco);
});

test("las frases caben en el globo del teléfono, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await page.evaluate(() => startTable("tiempo"));
    const frases = await page.evaluate(() => Object.values(LUMI_TEMAS).flatMap((t) => [t.hola, t.truco]));
    for (const frase of frases) {
      const caja = await page.evaluate((f) => { decirLumi(f, 5000); return document.getElementById("globo-lumi").getBoundingClientRect().toJSON(); }, frase);
      expect(caja.left, `${frase} ${tam.width}`).toBeGreaterThanOrEqual(0);
      expect(caja.right, `${frase} ${tam.width}`).toBeLessThanOrEqual(tam.width);
    }
  }
});

test("los objetos son dibujos propios: sin emojis ni imágenes, y decorativos", async ({ page }) => {
  await alMenu(page);
  const arte = await page.evaluate(() => Object.entries(ACCESORIOS_LUMI));
  expect(arte.length).toBe(8);
  for (const [tema, svg] of arte) {
    expect(svg, tema).not.toMatch(/<image|href=|\p{Extended_Pictographic}/u);
    expect(svg, tema).toContain('stroke="var(--contorno)"');
  }
  await page.evaluate(() => startTable("area"));
  await expect(page.locator("#lumi-partida > .lumi")).toHaveAttribute("aria-hidden", "true");
});

test("la frase del tema se queda más que la de una racha, para leerla con calma, y luego se va", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable("porcentajes"));
  await expect(page.locator("#globo-lumi")).toBeVisible();
  const [racha, tema] = await page.evaluate(() => [GLOBO_LUMI_MS, GLOBO_TEMA_MS]);
  expect(tema).toBeGreaterThan(racha);
  await page.waitForTimeout(racha + 400);
  await expect(page.locator("#globo-lumi")).toBeVisible();
  await page.waitForTimeout(tema - racha);
  await expect(page.locator("#globo-lumi")).toBeHidden();
});
