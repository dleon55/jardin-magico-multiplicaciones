// Revisión de los Hitos 4 a 6: detalles que salieron al recorrer el juego como
// quien juega, en teléfono, tableta y acostado, y en los tres tonos.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

const MUNDO = { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] };

async function entrar(page, { tono, voces = [{ lang: "es-MX" }] } = {}) {
  await instalarDobles(page, voces);
  await page.goto("./");
  if (tono) await page.click(`#screen-welcome .elegir-tono label:has(input[value="${tono}"])`);
  await page.fill("#player-name", "Ana");
  await page.evaluate(() => almacen.guardar("diagnostico", "saltado"));
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

test("en el teléfono más angosto, cada personaje de la bienvenida y de «Mi mundo y mi personaje» mide al menos 44 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("./");
  const chicas = (raiz) => page.locator(`${raiz} label.ficha`).evaluateAll((fs) =>
    fs.map((f) => f.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).length + (fs.length ? 0 : 99));
  expect(await chicas("#screen-welcome .elegir-personaje")).toBe(0);
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.click("button:has-text('Mi mundo y mi personaje')");
  await expect(page.locator('[data-nombre="personaje-cambio"]')).toBeVisible();
  expect(await chicas('[data-nombre="personaje-cambio"]')).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("retos: la explicación se ve al elegir, y se quita al jugar y al terminar", async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => mostrarRetos());
  await expect(page.locator("#reto-intro")).toBeVisible();
  await page.evaluate(() => empezarRetoNuevo());
  await expect(page.locator("#reto-juego")).toBeVisible();
  await expect(page.locator("#reto-intro")).toBeHidden();
  await page.evaluate(() => { retoEnJuego.n = 10; terminarReto(); });
  await expect(page.locator("#reto-fin")).toBeVisible();
  await expect(page.locator("#reto-intro")).toBeHidden();
  await page.evaluate(() => mostrarRetos());
  await expect(page.locator("#reto-intro")).toBeVisible();
});

test("con el teléfono acostado, un reto se responde sin desplazarse", async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await entrar(page);
  await page.evaluate(() => { mostrarRetos(); empezarRetoNuevo(); scrollTo(0, 0); });
  const abajo = await page.locator(".reto-opcion").evaluateAll((bs) => Math.max(...bs.map((b) => b.getBoundingClientRect().bottom)));
  expect(abajo).toBeLessThanOrEqual(360);
});

test.describe("con el mundo a la vista", () => {
  test.use({ storageState: MUNDO });

  test("el botón de la expedición dice «Empezar la expedición»: «salir» se leía como irse", async ({ page }) => {
    await entrar(page);
    await expect(page.locator("#btn-expedicion")).toHaveText("Empezar la expedición");
  });

  test("en Brote sin voz, la flecha señala la expedición de hoy y deja de insistir cuando ya está hecha", async ({ page }) => {
    await entrar(page, { tono: "brote", voces: [{ lang: "en-US" }] });
    await expect(page.locator("#expedicion-senal")).toBeVisible();
    await page.evaluate(() => { almacen.guardar("expediciones", JSON.stringify([hoy()])); pintarExpedicion(); });
    await expect(page.locator("#btn-expedicion")).toHaveText("Repetir la expedición");
    await expect(page.locator("#expedicion-senal")).toBeHidden();
  });
});

test.describe("Antes de multiplicar, con el teléfono acostado", () => {
  test.use({ viewport: { width: 740, height: 360 } });
  const ronda = (page, fijas) => page.evaluate((fijas) => {
    mostrarSemillero();
    semillero.preguntas = fijas.map(([clase, a, b]) => preguntaDeSemillero(clase, a, b));
    semillero.n = 0;
    siguienteDeSemillero();
    scrollTo(0, 0);
  }, fijas);
  const medidas = (page) => page.evaluate(() => {
    const caja = (s) => document.querySelector(s).getBoundingClientRect();
    const ops = [...document.querySelectorAll("#semillero-opciones button")].map((b) => b.getBoundingClientRect());
    return { abajo: Math.max(...ops.map((r) => r.bottom)), chico: Math.min(...ops.map((r) => Math.min(r.width, r.height))),
      izquierdaOps: Math.min(...ops.map((r) => r.left)), dibujo: document.querySelector(".dibujo-semillero") ? caja(".dibujo-semillero") : null,
      ancho: caja("#semillero-opciones").width, cuerpo: caja("#semillero-cuerpo").width, desborda: document.documentElement.scrollWidth > innerWidth };
  });

  test("el dibujo más alto queda a la izquierda y las respuestas a la derecha, a la vista y de 44 px", async ({ page }) => {
    await entrar(page, { tono: "brote" });
    await ronda(page, [["grupos", 4, 5]]);
    const m = await medidas(page);
    expect(m.abajo).toBeLessThanOrEqual(360);
    expect(m.chico).toBeGreaterThanOrEqual(44);
    expect(m.dibujo.right).toBeLessThanOrEqual(m.izquierdaOps);
    expect(m.dibujo.bottom).toBeLessThanOrEqual(360);
    expect(m.dibujo.height).toBeGreaterThanOrEqual(100);
    expect(m.desborda).toBe(false);
  });

  test("sin dibujo (contar a saltos), las respuestas ocupan todo el ancho", async ({ page }) => {
    await entrar(page, { tono: "brote" });
    await ronda(page, [["contar", 2, 3]]);
    const m = await medidas(page);
    expect(m.dibujo).toBeNull();
    expect(m.ancho).toBeGreaterThan(m.cuerpo * 0.9);
    expect(m.abajo).toBeLessThanOrEqual(360);
  });
});
