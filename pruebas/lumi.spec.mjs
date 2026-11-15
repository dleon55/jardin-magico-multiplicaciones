// Lumi, la mascota (docs/ESTILO.md, issue #52): aparece en la bienvenida, en
// la partida y en la victoria, y cambia de cara según lo que pasa.
import { test, expect } from "@playwright/test";
import { entrarATabla, responder, siguiente, ponerIntentos, rapida } from "./ayudas.mjs";

const cara = (page, caja) => page.locator(`#${caja} > svg.lumi`).getAttribute("data-expresion");

test("la bienvenida tiene a Lumi, decorativa para el lector de pantalla", async ({ page }) => {
  await page.goto("./");
  const svg = page.locator("#lumi-bienvenida > svg.lumi");
  await expect(svg).toBeVisible();
  await expect(svg).toHaveAttribute("aria-hidden", "true");
  await expect(svg).toHaveAttribute("data-expresion", "contenta");
  // Lo que se ve de su cara es la expresión elegida y no otra.
  expect(await svg.locator('[data-e~="contenta"]').first().isVisible()).toBe(true);
  expect(await svg.locator('[data-e="durmiendo"]').first().isVisible()).toBe(false);
});

test("cada copia de Lumi tiene su propio recorte (sin ids repetidos)", async ({ page }) => {
  await page.goto("./");
  const ids = await page.$$eval(".lumi-caja clipPath", (cs) => cs.map((c) => c.id));
  expect(ids.length).toBe(3);
  expect(new Set(ids).size).toBe(3);
  const usados = await page.$$eval(".lumi-caja [clip-path]", (es) => es.map((e) => e.getAttribute("clip-path")));
  expect(usados).toEqual(ids.map((id) => `url(#${id})`));
});

test("si nadie toca la bienvenida, Lumi se duerme; al tocar, despierta", async ({ page }) => {
  await page.clock.install();
  await page.goto("./");
  expect(await cara(page, "lumi-bienvenida")).toBe("contenta");
  await page.clock.runFor(19000);
  expect(await cara(page, "lumi-bienvenida")).toBe("contenta");
  await page.clock.runFor(2000);
  expect(await cara(page, "lumi-bienvenida")).toBe("durmiendo");
  await page.click("#player-name");
  expect(await cara(page, "lumi-bienvenida")).toBe("contenta");
});

test("en la partida, Lumi celebra el acierto y vuelve a estar contenta", async ({ page }) => {
  await entrarATabla(page, 3);
  await expect(page.locator("#lumi-partida > svg.lumi")).toBeVisible();
  expect(await cara(page, "lumi-partida")).toBe("contenta");
  await responder(page, true);
  expect(await cara(page, "lumi-partida")).toBe("celebrando");
  await siguiente(page);
  expect(await cara(page, "lumi-partida")).toBe("contenta");
});

test("tras un fallo, Lumi anima (no se pone triste) hasta la siguiente pregunta", async ({ page }) => {
  await entrarATabla(page, 4);
  await responder(page, false);
  expect(await cara(page, "lumi-partida")).toBe("animando");
  await page.waitForTimeout(1800);
  expect(await cara(page, "lumi-partida")).toBe("animando");
  await siguiente(page);
  expect(await cara(page, "lumi-partida")).toBe("contenta");
});

test("con la ayuda abierta, Lumi piensa; al cerrarla, vuelve", async ({ page }) => {
  await entrarATabla(page, 6);
  await page.click("#btn-help");
  expect(await cara(page, "lumi-partida")).toBe("pensando");
  await responder(page, true);
  await siguiente(page);
  // La ayuda sigue abierta en la pregunta nueva: Lumi sigue pensando.
  expect(await cara(page, "lumi-partida")).toBe("pensando");
  await page.click("#btn-help");
  expect(await cara(page, "lumi-partida")).toBe("contenta");
});

test("al florecer una multiplicación, Lumi se sorprende", async ({ page }) => {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button");
  // Toda la tabla del 2, rápida y escrita otro día: un acierto rápido hoy la hace florecer.
  for (let b = 1; b <= 10; b++) await ponerIntentos(page, `2x${b}`, [rapida("2026-10-01")]);
  await page.locator("#grid-tablas-container button").nth(1).click();
  await page.waitForSelector("#screen-game:not(.hidden), #screen-descubrir:not(.hidden)");
  if (await page.locator("#screen-descubrir:not(.hidden)").count()) await page.click("#descubrir-practicar");
  await responder(page, true);
  const florecio = await page.evaluate(() => document.getElementById("game-feedback").innerText.includes("floreció"));
  expect(florecio, "la respuesta debía hacer florecer la planta").toBe(true);
  expect(await cara(page, "lumi-partida")).toBe("sorprendida");
});

test("en la victoria, Lumi celebra", async ({ page }) => {
  await entrarATabla(page, 2);
  for (let i = 0; i < 10; i++) {
    await responder(page, true);
    await siguiente(page);
  }
  await expect(page.locator("#screen-victory")).toBeVisible();
  await expect(page.locator("#lumi-victoria > svg.lumi")).toBeVisible();
  expect(await cara(page, "lumi-victoria")).toBe("celebrando");
});

test.describe("con movimiento", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Lumi respira y da un saltito al cambiar de cara", async ({ page }) => {
    // Se entra sin movimiento: «¡Comenzar a jugar!» late y Playwright no lo
    // da por quieto. Dentro de la partida se enciende el movimiento.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await entrarATabla(page, 5);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const svg = page.locator("#lumi-partida > svg.lumi");
    expect(await svg.evaluate((e) => getComputedStyle(e).animationName)).toBe("lumi-respira");
    await responder(page, true);
    expect(await svg.evaluate((e) => getComputedStyle(e).animationName)).toBe("lumi-salta");
  });

  test("con «Menos movimiento» en Ajustes, Lumi se queda quieta", async ({ page }) => {
    await page.goto("./");
    await page.click("#ajustes summary");
    await page.click('[data-ajuste="calma"]');
    const duracion = await page.locator("#lumi-bienvenida > svg.lumi").evaluate((e) => parseFloat(getComputedStyle(e).animationDuration));
    expect(duracion).toBeLessThan(0.01);
  });
});
