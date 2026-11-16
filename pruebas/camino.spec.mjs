// El camino (issue #46): un solo camino une las tablas del jardín y los
// mundos de la Aventura; cada mundo se abre al saberse sus tablas. «Seguir»
// lo recorre, y nadie pierde lo que ya tenía.
import { test, expect } from "@playwright/test";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Deja las tablas dadas en «arbolito» (sabidas): dos aciertos eligiendo. */
function saber(page, tablas) {
  return page.evaluate((ts) => {
    for (const n of ts) for (let b = 1; b <= 10; b++) hechos[claveHecho(n, b)] = [{ d: "", m: "o", ok: 1, ms: null }, { d: "", m: "o", ok: 1, ms: null }];
    guardarHechos();
  }, tablas);
}

const tramo = (page, id) => page.locator(`#camino-tramos [data-tramo="${id}"]`);

test("el menú lleva al camino: 15 tramos, tablas y mundos, en el orden en que se aprenden", async ({ page }) => {
  await alMenu(page);
  await expect(page.locator("#camino-menu-resumen")).toHaveText("0 de 15 tramos · Ahora: Tabla del 2");
  await page.click("#btn-camino");
  await expect(page.locator("#screen-camino")).toBeVisible();
  const orden = await page.locator("#camino-tramos li").evaluateAll((ls) => ls.map((l) => l.dataset.tramo));
  expect(orden).toEqual(["tabla-2", "tabla-5", "mundo-0", "tabla-3", "tabla-4", "tabla-9", "tabla-6", "mundo-1",
    "tabla-7", "tabla-8", "mundo-2", "tabla-1", "mundo-3", "mundo-4", "mundo-5"]);
  await expect(page.locator("#camino-resumen")).toHaveText("Llevas 0 de 15 tramos.");
  await expect(tramo(page, "tabla-2")).toHaveClass(/tramo-actual/);
  await expect(tramo(page, "tabla-2")).toContainText("Te toca. Nueva: descúbrela");
  // El primer mundo está abierto desde el principio; los demás, cerrados con su motivo.
  await expect(tramo(page, "mundo-0")).toHaveAttribute("data-estado", "abierto");
  await expect(tramo(page, "mundo-1")).toHaveAttribute("data-estado", "cerrado");
  await expect(tramo(page, "mundo-1")).toContainText("Se abre cuando sepas la del 3, la del 4 y la del 6");
  await expect(tramo(page, "mundo-4")).toContainText("Se abre cuando sepas la del 2, la del 3");
});

test("una tabla sabida queda hecha; el mundo se abre cuando se saben todas las suyas", async ({ page }) => {
  await alMenu(page);
  await saber(page, [2, 5, 3, 4]);
  await page.evaluate(() => mostrarCamino());
  await expect(tramo(page, "tabla-2")).toHaveAttribute("data-estado", "hecho");
  await expect(tramo(page, "tabla-2")).toContainText("¡Te la sabes!");
  await expect(tramo(page, "mundo-1")).toContainText("Se abre cuando sepas la del 6");   // solo lo que falta
  await saber(page, [6]);
  // Sabidas sus tablas, aún pide vencer al jefe del mundo anterior.
  await page.evaluate(() => mostrarCamino());
  await expect(tramo(page, "mundo-1")).toContainText("Se abre al vencer al jefe del mundo 1");
  await page.evaluate(() => { aventuraGuardada.alcanzado = NIVELES_POR_MUNDO; aventuraGuardada.estrellas["0-3"] = 2; guardarAventura(); mostrarCamino(); });
  await expect(tramo(page, "mundo-0")).toHaveAttribute("data-estado", "hecho");
  await expect(tramo(page, "mundo-1")).toHaveAttribute("data-estado", "abierto");
  await expect(page.locator("#camino-resumen")).toHaveText("Llevas 6 de 15 tramos.");
});

test("en la Aventura, un mundo alcanzado sin saber sus tablas espera, y dice qué falta", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { aventuraGuardada.alcanzado = NIVELES_POR_MUNDO; guardarAventura(); mostrarAventura(); });
  const mundo1 = page.locator('.mundo-aventura[data-mundo="1"]');
  await expect(mundo1).toContainText("Se abre cuando sepas la del 3, la del 4 y la del 6 en el jardín");
  await expect(mundo1.locator('.btn-nivel[data-nivel="1-0"]')).toBeDisabled();
  // Ni a mano.
  await page.evaluate(() => empezarNivel(1, 0));
  await expect(page.locator("#screen-aventura")).toBeVisible();
  await saber(page, [3, 4, 6]);
  await page.evaluate(() => pintarAventura());
  await expect(mundo1.locator('.btn-nivel[data-nivel="1-0"]')).toBeEnabled();
});

test("lo ya jugado de un mundo nunca se cierra: nadie pierde su avance", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => {
    aventuraGuardada.alcanzado = 2 * NIVELES_POR_MUNDO + 1;
    aventuraGuardada.estrellas = { "0-3": 3, "1-0": 2, "2-0": 1 };
    guardarAventura();
    mostrarAventura();
  });
  for (const nivel of ["1-0", "2-0", "2-1"]) await expect(page.locator(`.btn-nivel[data-nivel="${nivel}"]`)).toBeEnabled();
});

test("el primer mundo está abierto desde el primer día, para probar la Aventura", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarAventura());
  await expect(page.locator('.btn-nivel[data-nivel="0-0"]')).toBeEnabled();
});

test("«Seguir» recorre el camino: tras la del 2 y la del 5, propone el primer mundo; jugado una vez, vuelve a las tablas", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => almacen.guardar("diagnostico", "saltado"));
  await saber(page, [2, 5]);
  await page.evaluate(() => pintarSeguir());
  await expect(page.locator("#seguir-que")).toHaveText("La Aventura: El huerto de los brócolis");
  await expect(page.locator("#seguir-detalle")).toHaveText("¡A vencer a los brócolis con lo que sabes!");
  await page.click("#btn-seguir");
  await expect(page.locator("#screen-aventura")).toBeVisible();
  // Jugado una vez (aunque no venza al jefe), «Seguir» no se atora ahí.
  await page.evaluate(() => { aventuraGuardada.estrellas["0-0"] = 1; guardarAventura(); pintarSeguir(); });
  await expect(page.locator("#seguir-que")).toHaveText("Tabla del 3");
});

test("«Seguir» avisa cuando lo aprendido abre un mundo nuevo", async ({ page }) => {
  await alMenu(page);
  await saber(page, [2, 5, 3, 4, 9, 6]);
  await page.evaluate(() => { aventuraGuardada.alcanzado = NIVELES_POR_MUNDO; aventuraGuardada.estrellas = { "0-3": 3 }; guardarAventura(); pintarSeguir(); });
  await expect(page.locator("#seguir-que")).toHaveText("La Aventura: El bosque de los monstruos");
  await expect(page.locator("#seguir-detalle")).toHaveText("¡Ya sabes sus tablas! Se abrió el mundo de los monstruos.");
});

test("tocar un tramo lleva a su tabla o a la Aventura; uno cerrado no es un botón", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarCamino());
  await expect(tramo(page, "mundo-1").locator("button")).toHaveCount(0);
  await tramo(page, "mundo-0").locator("button").click();
  await expect(page.locator("#screen-aventura")).toBeVisible();
  await page.evaluate(() => mostrarCamino());
  await tramo(page, "tabla-5").locator("button").click();
  await page.waitForSelector("#screen-game:not(.hidden), #screen-descubrir:not(.hidden)");
  expect(await page.evaluate(() => currentTable === 5 || pantallaActual === "screen-descubrir")).toBe(true);
});

test("con todo hecho, el camino lo celebra", async ({ page }) => {
  await alMenu(page);
  await saber(page, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  await page.evaluate(() => {
    aventuraGuardada.alcanzado = AVENTURA_MUNDOS.length * NIVELES_POR_MUNDO - 1;
    AVENTURA_MUNDOS.forEach((_, m) => { aventuraGuardada.estrellas[`${m}-3`] = 1; });
    guardarAventura();
    mostrarCamino();
  });
  await expect(page.locator("#camino-resumen")).toHaveText("¡Recorriste el camino entero: 15 de 15 tramos!");
  await expect(page.locator("#camino-tramos .tramo-actual")).toHaveCount(0);
});

test("Esc vuelve al menú, y cabe en el teléfono sin desplazarse de lado", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await alMenu(page);
  await page.click("#btn-camino");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const cajas = await page.locator("#camino-tramos .tramo-caja").evaluateAll((cs) => cs.map((c) => c.getBoundingClientRect().right));
  expect(Math.max(...cajas)).toBeLessThanOrEqual(360);
  await page.keyboard.press("Escape");
  await expect(page.locator("#screen-selector")).toBeVisible();
});
