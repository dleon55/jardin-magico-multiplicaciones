// Lumi crece contigo (Hito 4.2): de semilla a árbol en flor según las tablas
// (del 2 al 9) que se saben. Se guarda la etapa más alta: nunca encoge.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page, nombre = "Ana") {
  await page.goto("./");
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

/** Se saben esas tablas, y se vuelve al inicio. */
const saber = (page, tablas) => page.evaluate((tablas) => {
  const dia = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
  for (const a of tablas) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: dia(1), m: "e", ok: 1, ms: 2000 }, { d: dia(0), m: "e", ok: 1, ms: 2000 }];
  guardarHechos();
  mostrarPantalla("screen-selector");
}, tablas);
const etapaDe = (page, sel) => page.locator(`${sel} > svg.lumi`).getAttribute("data-etapa");
/** Qué adornos de etapa se ven en esa Lumi (los grupos data-etapas visibles). */
const adornos = (page, sel) => page.locator(`${sel} > svg.lumi [data-etapas]`).evaluateAll((gs) => gs.filter((g) => getComputedStyle(g).display !== "none").length);

test("las etapas: semilla, brote con 2 tablas, plantita con 4, arbolito con 6 y árbol en flor con 8", async ({ page }) => {
  await alMenu(page);
  expect(await page.evaluate(() => [0, 1, 2, 3, 4, 5, 6, 7, 8].map(etapaLumiPorTablas))).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4]);
  expect(await page.evaluate(() => ETAPAS_LUMI.map((e) => e.nombre))).toEqual(["una semilla", "un brote", "una plantita", "un arbolito", "un árbol en flor"]);
});

test("al empezar es semilla, sin adornos y sin aviso", async ({ page }) => {
  await alMenu(page);
  expect(await etapaDe(page, "#lumi-seguir")).toBe("0");
  expect(await adornos(page, "#lumi-seguir")).toBe(0);
  await expect(page.locator("#lumi-crecio")).toBeHidden();
});

test("con dos tablas sabidas, Lumi crece: lo dice una vez, en texto y en voz, y todas las Lumi lo muestran", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await saber(page, [2, 5]);
  expect(await page.evaluate(() => window.__dicho.map((d) => d.texto))).toContain("¡Lumi creció! Ahora es un brote: ya sabes 2 tablas.");
  await expect(page.locator("#lumi-crecio")).toBeVisible();
  await expect(page.locator("#lumi-crecio")).toHaveText("¡Lumi creció! Ahora es un brote: ya sabes 2 tablas.");
  expect(await etapaDe(page, "#lumi-seguir")).toBe("1");
  expect(await adornos(page, "#lumi-seguir")).toBe(1);
  // También la de la partida y la de la victoria.
  expect(await etapaDe(page, "#lumi-partida")).toBe("1");
  expect(await etapaDe(page, "#lumi-victoria")).toBe("1");
  // Al volver al inicio sin haber crecido, el aviso ya no está.
  await page.evaluate(() => mostrarPantalla("screen-selector"));
  await expect(page.locator("#lumi-crecio")).toBeHidden();
  expect(await etapaDe(page, "#lumi-seguir")).toBe("1");
});

test("cada etapa suma un adorno: hojitas, hojas grandes, frutos y la flor", async ({ page }) => {
  await alMenu(page);
  const vistos = [];
  for (const tablas of [[2, 5], [3, 4], [9, 6], [7, 8]]) {
    await saber(page, tablas);
    vistos.push([await etapaDe(page, "#lumi-seguir"), await adornos(page, "#lumi-seguir")]);
  }
  expect(vistos).toEqual([["1", 1], ["2", 2], ["3", 3], ["4", 4]]);
  await expect(page.locator("#lumi-crecio")).toHaveText("¡Lumi creció! Ahora es un árbol en flor: ya sabes 8 tablas.");
});

test("la tabla del 1 no cuenta: Lumi crece con las del 2 al 9", async ({ page }) => {
  await alMenu(page);
  await saber(page, [1, 2]);
  expect(await etapaDe(page, "#lumi-seguir")).toBe("0");
});

test("Lumi no encoge: si una tabla se marchita o se falla, conserva su etapa", async ({ page }) => {
  await alMenu(page);
  await saber(page, [2, 5, 3, 4]);
  expect(await etapaDe(page, "#lumi-seguir")).toBe("2");
  // Se borra lo aprendido de dos tablas (y con ello, hechos que comparten con otras).
  await page.evaluate(() => {
    for (const a of [3, 4]) for (let b = 1; b <= 10; b++) delete hechos[claveHecho(a, b)];
    guardarHechos();
    mostrarPantalla("screen-selector");
  });
  expect(await page.evaluate(() => tablasSabidasLumi())).toBeLessThan(4);   // ya no alcanza para plantita
  expect(await etapaDe(page, "#lumi-seguir")).toBe("2");
  await expect(page.locator("#lumi-crecio")).toBeHidden();
});

test("cada quien tiene su Lumi: se guarda por jardín, y en la bienvenida es semilla", async ({ page }) => {
  await alMenu(page, "Ana");
  await saber(page, [2, 5, 3, 4]);
  expect(await page.evaluate(() => almacen.leer("lumi"))).toBe("2");
  await page.click("#screen-selector >> text=Cambiar de jugador");
  expect(await etapaDe(page, "#lumi-bienvenida")).toBe("0");
  await page.fill("#player-name", "Leo");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  expect(await etapaDe(page, "#lumi-seguir")).toBe("0");
  await page.click("#screen-selector >> text=Cambiar de jugador");
  await page.locator(".btn-perfil", { hasText: "Ana" }).click();
  expect(await etapaDe(page, "#lumi-seguir")).toBe("2");
  // Y va en la copia de seguridad.
  expect(await page.evaluate(() => Object.values(armarCopia().datos).map((d) => d.lumi).filter(Boolean))).toEqual(["2"]);
});

test("lo guardado dañado no rompe nada: Lumi vuelve a semilla y crece de nuevo", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { almacen.guardar("lumi", "banana"); mostrarPantalla("screen-selector"); });
  expect(await etapaDe(page, "#lumi-seguir")).toBe("0");
  await page.evaluate(() => { almacen.guardar("lumi", "99"); });
  expect(await page.evaluate(() => etapaGuardadaLumi())).toBe(0);
});

test.describe("en el mundo vivo", () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] } });

  test("el mundo dice en qué etapa va y qué falta para la siguiente; Lumi se ve más grande", async ({ page }) => {
    await alMenu(page);
    await expect(page.locator("#mundo-etapa")).toHaveText("Lumi es una semilla. Con 2 tablas más será un brote.");
    const ancho0 = (await page.locator(".lumi-mundo").boundingBox()).width;
    await saber(page, [2, 5, 3]);
    await expect(page.locator("#mundo-etapa")).toHaveText("Lumi es un brote. Con 1 tabla más será una plantita.");
    expect(await page.locator(".lumi-mundo > svg.lumi").getAttribute("data-etapa")).toBe("1");
    // Al redibujar el mundo (ir a la lista y volver), la Lumi nueva nace con su etapa.
    await page.evaluate(() => { cambiarAjuste("lista"); cambiarAjuste("lista"); });
    expect(await page.locator(".lumi-mundo > svg.lumi").getAttribute("data-etapa")).toBe("1");
    await saber(page, [4, 9, 6, 7, 8]);
    await expect(page.locator("#mundo-etapa")).toHaveText("Lumi es un árbol en flor: ¡sabes las ocho tablas!");
    await expect.poll(async () => (await page.locator(".lumi-mundo").boundingBox()).width).toBeGreaterThan(ancho0 * 1.3);
  });
});
