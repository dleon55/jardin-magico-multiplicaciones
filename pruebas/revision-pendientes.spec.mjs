// Lo que quedó de la revisión visual (#114): personajes, contraste de la
// Aventura y la vista para adultos.
import { test, expect } from "@playwright/test";

async function alMenu(page, nombre = "Ana") {
  await page.goto("./");
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

test("«Mi mundo y mi personaje»: quien no eligió ve marcado al jardinero", async ({ page }) => {
  await alMenu(page);
  await page.click("#screen-selector >> text=Mi mundo y mi personaje");
  await expect(page.locator("#screen-mundo .elegir-personaje input")).toHaveCount(13);
  await expect(page.locator("#screen-mundo .elegir-personaje input:checked")).toHaveCount(1);
  await expect(page.locator("#screen-mundo .elegir-personaje input:checked")).toHaveValue("🧑‍🌾");
  await expect(page.locator("#screen-mundo .elegir-personaje label:has(input:checked)")).toContainText("jardinero");
});

test("en equipo, a quien se suma le toca un personaje que nadie usa", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarEquipo());
  for (const nombre of ["Leo", "Mia"]) {
    await page.fill("#equipo-nombre", nombre);
    await page.press("#equipo-nombre", "Enter");
  }
  const emojis = await page.evaluate(() => perfiles.filter((p) => p.iniciado).map((p) => p.emoji));
  expect(emojis.length).toBe(3);
  expect(new Set(emojis).size).toBe(3);
});

test("Aventura: lo cerrado se lee (sin desvanecer, borde punteado) y las estrellas se ven", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarAventura());
  const cerrado = page.locator('.btn-nivel[data-nivel="1-0"]');
  await expect(cerrado).toBeDisabled();
  const estilo = await cerrado.evaluate((b) => { const c = getComputedStyle(b); return { opacidad: c.opacity, borde: c.borderTopStyle }; });
  expect(estilo).toEqual({ opacidad: "1", borde: "dashed" });
  const tam = await page.locator('.btn-nivel[data-nivel="0-0"] .estrellas-nivel').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(tam).toBeGreaterThanOrEqual(16);
});

test("Aventura: «Compartir mi puntaje» aparece solo con puntaje", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarAventura());
  await expect(page.locator("#btn-compartir")).toBeHidden();
  await page.evaluate(() => { aventuraGuardada.mejores = { "0-0": 500 }; aventuraGuardada.estrellas = { "0-0": 2 }; aventuraGuardada.alcanzado = 1; guardarAventura(); mostrarAventura(); });
  await expect(page.locator("#btn-compartir")).toBeVisible();
});

test("vista para adultos: un tema por tarjeta, con una pastilla por clase, y los 14 días en dos semanas de 7", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await alMenu(page);
  await page.evaluate(() => {
    for (const clave of ["tiempo:leer", "tiempo:duracion"]) for (let i = 0; i < 4; i++) registrarOtro(clave, clave === "tiempo:leer" || i === 0);
    registrarIntento(3, 4, true);
    mostrarAdultos();
  });
  const tarjeta = page.locator(".adulto-tiempo");
  await expect(tarjeta).toHaveClass(/adulto-tema/);
  await expect(tarjeta.locator(".adulto-clase")).toHaveCount(2);
  await expect(tarjeta.locator(".adulto-clase").first()).toHaveText("leer el reloj 4 de 4");
  await expect(tarjeta.locator(".adulto-clase").first()).toHaveClass(/bg-green-100/);
  await expect(tarjeta.locator(".adulto-clase").last()).toHaveClass(/bg-rose-50/);
  // El texto que se lee sigue siendo una frase completa.
  await expect(tarjeta).toContainText("Medidas de tiempo (sus últimas respuestas): leer el reloj 4 de 4, cuánto dura 1 de 4.");
  await expect(tarjeta.locator(".adulto-cuesta")).toContainText("Le cuesta más: cuánto dura.");
  // Dos semanas: 7 y 7.
  const filas = await page.locator(".adulto-semanas").first().evaluate((ol) => {
    const tops = [...ol.children].map((li) => Math.round(li.getBoundingClientRect().top));
    return [...new Set(tops)].map((t) => tops.filter((x) => x === t).length);
  });
  expect(filas).toEqual([7, 7]);
  // «Todo se guarda solo en este dispositivo» una sola vez en la pantalla.
  const veces = await page.locator("#screen-adultos").evaluate((s) => (s.innerText.match(/Todo se guarda solo en este dispositivo/g) || []).length);
  expect(veces).toBe(1);
});

test("vivero: sin estrellas se dice solo el precio; con algunas, cuánto falta; y los botones son de dedo", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarVivero());
  const primero = page.locator("#screen-vivero li button").first();
  await expect(primero).toBeVisible();
  expect(await primero.locator("span[aria-hidden]").textContent()).not.toContain("faltan");
  expect((await primero.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.evaluate(() => { ganarEstrellas(3); mostrarVivero(); });
  expect(await page.locator("#screen-vivero li button").first().locator("span[aria-hidden]").textContent()).toContain("faltan");
});
