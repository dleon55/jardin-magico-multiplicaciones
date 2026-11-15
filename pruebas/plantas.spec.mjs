// Plantas del jardín ilustradas (issue #57): un dibujo por estado y por mundo,
// el estado se distingue por la forma, y lo que cambió desde la última visita
// se anima (crece, se marchita o revive).
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida, elegida, entrarATabla, responder } from "./ayudas.mjs";

const EMOJI = /\p{Extended_Pictographic}/u;
const MUNDOS = ["huerto", "bosque", "dinos", "espacio", "mar", "granja", "desierto", "flores"];

async function alMenu(page) {
  await page.goto("./");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}
const abrirJardin = (page) => page.click("#screen-selector >> text=Mi jardín");

test("cada estado tiene su forma: por sembrar, brote, casi y marchita son dibujos distintos", async ({ page }) => {
  await alMenu(page);
  const r = await page.evaluate(() => {
    // Sin color: solo la forma. Si dos estados solo cambiaran de color, aquí serían iguales.
    const sinColor = (s) => s.replace(/fill="[^"]*"/g, "").replace(/data-estado="[^"]*"/, "");
    const estados = ["nuevo", "practica", "casi", "marchita", "florecida"].map((e) => sinColor(svgPlanta(e, "flores", 1)));
    return new Set(estados).size;
  });
  expect(r).toBe(5);
});

test("lo florecido es propio de cada mundo y cambia de color con la tabla", async ({ page }) => {
  await alMenu(page);
  const r = await page.evaluate((ms) => ({
    mundos: new Set(ms.map((m) => svgPlanta("florecida", m, 1))).size,
    // Sin el número de tabla escrito: lo que cambia tiene que ser el dibujo (su color).
    tablas: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => svgPlanta("florecida", "huerto", t).replace(/data-tabla="\d+"/, ""))).size,
    emojis: ms.some((m) => /\p{Extended_Pictographic}/u.test(svgPlanta("florecida", m, 3))),
  }), MUNDOS);
  expect(r).toEqual({ mundos: 8, tablas: 9, emojis: false });
});

test("las 54 plantas de «Mi jardín» son dibujos, sin emojis, y dicen su estado en texto", async ({ page }) => {
  await alMenu(page);
  const [ayer, hoyMismo] = await page.evaluate(() => [fechaMenos(hoy(), 1), hoy()]);
  await ponerIntentos(page, "7x8", [rapida(ayer), rapida(hoyMismo)]);   // reciente: florecida, no marchita
  await abrirJardin(page);
  await expect(page.locator("[data-planta] .dibujo svg.planta-arte")).toHaveCount(54);
  const visibles = await page.$$eval("[data-planta] .dibujo", (ds) => ds.map((d) => d.textContent).join(""));
  expect(EMOJI.test(visibles)).toBe(false);
  await expect(page.locator('[data-planta="7x8"] svg')).toHaveAttribute("data-estado", "florecida");
  await expect(page.locator('[data-planta="7x8"] svg')).toHaveAttribute("data-tabla", "7");
  await expect(page.locator('[data-planta="7x8"] .sr-only')).toContainText("te la sabes");
});

test("la primera vez nada se anima; después, lo que creció desde la última visita crece", async ({ page }) => {
  await alMenu(page);
  await ponerIntentos(page, "3x4", [elegida("2026-11-01")]);
  await abrirJardin(page);
  await expect(page.locator("[class*='cambia-']")).toHaveCount(0);
  // Ahora 3 × 4 pasa de brote a florecida.
  await page.click("#screen-jardin button:has-text('Menú')");
  await ponerIntentos(page, "3x4", [rapida("2026-11-01"), rapida("2026-11-02")]);
  await abrirJardin(page);
  await expect(page.locator('[data-planta="3x4"]')).toHaveClass(/cambia-crece/);
  await expect(page.locator("[class*='cambia-']")).toHaveCount(1);
  // Volver sin cambios: ya no se anima.
  await page.click("#screen-jardin button:has-text('Menú')");
  await abrirJardin(page);
  await expect(page.locator("[class*='cambia-']")).toHaveCount(0);
});

test("se anima al marchitarse y al revivir regándola", async ({ page }) => {
  await alMenu(page);
  const r = await page.evaluate(() => [
    cambioDePlanta("florecida", "marchita"), cambioDePlanta("marchita", "florecida"), cambioDePlanta("marchita", "casi"),
    cambioDePlanta("casi", "practica"), cambioDePlanta(undefined, "casi"), cambioDePlanta("nuevo", "practica"),
  ]);
  expect(r).toEqual(["marchita", "revive", "revive", null, null, "crece"]);
});

test("lo visto es de cada jugador: viaja en la copia de seguridad y se borra con su jardín", async ({ page }) => {
  await alMenu(page);
  await abrirJardin(page);
  expect(await page.evaluate(() => Object.values(armarCopia().datos).some((d) => typeof d.vistos === "string"))).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).some((k) => /^jardin:p\d+:vistos$/.test(k)))).toBe(true);
  await page.evaluate(() => borrarPerfil(perfilActual));
  expect(await page.evaluate(() => Object.keys(localStorage).some((k) => /^jardin:p\d+:vistos$/.test(k)))).toBe(false);
});

test("en la partida, cada acierto deja un capullo dibujado del color de la tabla", async ({ page }) => {
  await entrarATabla(page, 6);
  await responder(page, true);
  const capullo = page.locator("#garden-plot svg.planta-arte").last();
  await expect(capullo).toHaveAttribute("data-estado", "casi");
  await expect(capullo).toHaveAttribute("data-tabla", "6");
  expect(EMOJI.test(await page.locator("#garden-plot").evaluate((p) => [...p.children].filter((c) => c.id !== "garden-amigos").map((c) => c.textContent).join("")))).toBe(false);
});

test.describe("con movimiento", () => {
  test.use({ reducedMotion: "no-preference" });
  test("la que creció crece en 600 ms; con «Menos movimiento», quieta", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => saveNameAndGo());
    await ponerIntentos(page, "2x5", [elegida("2026-11-01")]);
    await page.evaluate(() => mostrarJardin());
    await page.evaluate(() => backToSelector());
    await ponerIntentos(page, "2x5", [rapida("2026-11-01"), rapida("2026-11-02")]);
    await page.evaluate(() => mostrarJardin());
    const svg = page.locator('[data-planta="2x5"] .dibujo svg');
    expect(await svg.evaluate((s) => [getComputedStyle(s).animationName, parseFloat(getComputedStyle(s).animationDuration)])).toEqual(["planta-crece", 0.6]);
    await page.evaluate(() => { ajustes.calma = true; aplicarAjustes(); });
    expect(await svg.evaluate((s) => parseFloat(getComputedStyle(s).animationDuration))).toBeLessThan(0.01);
  });
});
