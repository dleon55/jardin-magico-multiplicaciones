// Accesibilidad medida con axe-core (las reglas WCAG 2.1 A y AA), pantalla por
// pantalla. Antes del cambio el sitio no tenía ni un solo atributo aria, y
// varios textos no llegaban al contraste mínimo.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { entrarATabla, responder, siguiente } from "./ayudas.mjs";

async function auditar(page, contexto) {
  // Se espera a que acaben las animaciones de entrada: axe mide el contraste
  // de lo que ve, y a mitad de un fundido los colores aún no son los finales.
  await page.waitForTimeout(400);
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const resumen = resultado.violations.map((v) =>
    `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(resumen, `violaciones en ${contexto}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  // Sin movimiento: el confeti y los fundidos no deben interferir en la medida.
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("bienvenida", async ({ page }) => {
  await page.goto("./");
  await auditar(page, "la bienvenida");
});

test("selector de tablas", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await auditar(page, "el selector");
});

test("pregunta, con la ayuda abierta", async ({ page }) => {
  await entrarATabla(page, 7);
  await page.click("#btn-help");
  await auditar(page, "la pregunta");
});

test("tras un acierto y tras un error", async ({ page }) => {
  await entrarATabla(page, 8);
  await responder(page, true);
  await auditar(page, "el acierto");
  await siguiente(page);
  await responder(page, false);
  await auditar(page, "el error");
});

test("victoria", async ({ page }) => {
  await entrarATabla(page, 2);
  for (let i = 0; i < 10; i++) {
    await responder(page, true);
    await siguiente(page);
  }
  await expect(page.locator("#screen-victory")).toBeVisible();
  await auditar(page, "la victoria");
});

test("panel de ajustes abierto", async ({ page }) => {
  await page.goto("./");
  await page.click("#ajustes summary");
  await auditar(page, "los ajustes");
});

test("al cambiar de pantalla, el foco va a su encabezado", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await expect(page.locator("#screen-selector [data-foco]")).toBeFocused();
});

test("la pregunta y el resultado se anuncian solos al lector de pantalla", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#question-text")).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#game-feedback")).toHaveAttribute("aria-live", "polite");
});
