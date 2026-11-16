// Una sola moneda y una meta diaria (issue #60): la estrella es solo para lo
// que se gasta en el vivero, se gana en todos los juegos, y la meta de hoy es
// siempre la misma: acertar 10.
import { test, expect } from "@playwright/test";
import { entrarATabla, responder, siguiente } from "./ayudas.mjs";

async function alMenu(page, nombre = "Ana") {
  await page.goto("./");
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
}
const usaIcono = (loc, nombre) => loc.locator(`svg.icono use[href="#i-${nombre}"]`).count();

test("la estrella es solo la moneda: los aciertos de la partida y los puntos de la Aventura llevan otro icono", async ({ page }) => {
  await alMenu(page);
  expect(await usaIcono(page.locator("#cabecera-menu"), "estrella")).toBe(1);   // «Tus estrellas»
  await page.locator("#grid-tablas-container button").nth(1).click();
  if (await page.locator("#screen-descubrir:not(.hidden)").count()) await page.click("#descubrir-practicar");
  const aciertos = page.locator("#pastilla-estrellas");
  expect(await usaIcono(aciertos, "estrella")).toBe(0);
  expect(await usaIcono(aciertos, "listo")).toBe(1);
  await page.evaluate(() => { backToSelector(); mostrarAventura(); aventura.manual = true; });
  await page.click('.btn-nivel[data-nivel="0-0"]');
  const puntos = page.locator("#nivel-puntos").locator("..");
  expect(await usaIcono(puntos, "estrella")).toBe(0);
  expect(await usaIcono(puntos, "lanzar")).toBe(1);
});

test("las estrellas de un nivel de la Aventura van a la misma moneda del vivero", async ({ page }) => {
  await alMenu(page);
  await page.click("#screen-selector >> text=La Aventura");
  await expect(page.locator("#aventura-resumen")).toContainText("Cada estrella que ganas va a tus estrellas del vivero.");
  await page.evaluate(() => { aventura.manual = true; });
  await page.click('.btn-nivel[data-nivel="0-0"]');
  const antes = await page.evaluate(() => globalStars);
  await page.evaluate(() => {
    for (let i = 0; i < 200 && !aventura.terminado; i++) {
      const e = enemigoObjetivo();
      if (e) responderAventura(e.op.respuesta); else aventuraPaso(aventura.config.cruce * 1000);
    }
  });
  const ganadas = await page.evaluate(() => aventuraGuardada.estrellas["0-0"]);
  // Las del nivel, más lo que dé la meta de hoy si se cumplió venciendo.
  const meta = await page.evaluate(() => (misiones.hoy.cumplida ? BONO_MISION : 0));
  expect(await page.evaluate(() => globalStars)).toBe(antes + ganadas + meta);
  await expect(page.locator("#fin-texto")).toContainText("para el vivero");
});

test("al cumplir la meta en una partida, Lumi lo dice y el aviso lo repite", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => { misiones.hoy = { d: hoy(), tipo: "meta", cuenta: 9, cumplida: false }; guardarMisiones(); });
  await entrarATabla(page, 5);
  await page.evaluate(() => { misiones.hoy.cuenta = 9; misiones.hoy.cumplida = false; });
  await responder(page, true);
  await expect(page.locator("#game-feedback")).toContainText("¡Meta de hoy cumplida! +10 estrellas.");
  await expect(page.locator("#globo-lumi")).toHaveText("¡Meta de hoy!");
  await siguiente(page);
  // Ya cumplida: los aciertos siguientes no la vuelven a anunciar ni a premiar.
  const estrellas = await page.evaluate(() => globalStars);
  await responder(page, true);
  expect(await page.locator("#game-feedback").innerText()).not.toContain("Meta de hoy");   // ahora mismo: el aviso se borra solo
  expect(await page.evaluate(() => globalStars)).toBe(estrellas + 1);
});

test("la vista para adultos explica la moneda y la meta, con las metas cumplidas", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => {
    ganarEstrellas(12);
    misiones.dias = [fechaMenos(hoy(), 2), fechaMenos(hoy(), 1)];
    guardarMisiones();
  });
  await page.click("#screen-selector >> text=Para las personas adultas");
  const p = page.locator(".tarjeta-adulto").filter({ hasText: "Ana" }).locator(".adulto-estrellas");
  await expect(p).toContainText("Estrellas: 12.");
  await expect(p).toContainText("10 por la meta de hoy (acertar 10 en un día)");
  await expect(p).toContainText("se gastan en el vivero");
  await expect(p).toContainText("Metas cumplidas: 2 días.");
});
