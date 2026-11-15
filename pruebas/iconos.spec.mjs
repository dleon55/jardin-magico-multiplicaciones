// Iconos propios de la interfaz (issue #56): un solo juego de símbolos SVG en
// lugar de emojis, decorativos, con el texto del botón como su nombre.
import { test, expect } from "@playwright/test";

const EMOJI = /\p{Extended_Pictographic}/u;

async function alMenu(page) {
  await page.goto("./");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Lo que se ve de un elemento, sin el texto oculto para lectores de pantalla. */
const textoVisible = (loc) => loc.evaluate((e) => {
  const c = e.cloneNode(true);
  c.querySelectorAll(".sr-only").forEach((s) => s.remove());
  return c.textContent;
});

test("cada icono que se usa existe en el juego de símbolos (ninguno sale en blanco)", async ({ page }) => {
  await alMenu(page);
  // Se recorren pantallas que pintan iconos desde el código.
  await page.evaluate(() => { aventuraGuardada.alcanzado = 5; guardarAventura(); mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); cambiarModoAventura("teclear"); });
  const r = await page.evaluate(() => {
    const simbolos = new Set([...document.querySelectorAll("symbol[id^='i-']")].map((s) => s.id));
    const usados = [...document.querySelectorAll("use")].map((u) => u.getAttribute("href").slice(1));
    const delCodigo = [...document.documentElement.innerHTML.matchAll(/icono\("([\w-]+)"\)/g)].map((m) => `i-${m[1]}`);
    return { faltan: [...new Set([...usados, ...delCodigo])].filter((u) => u.startsWith("i-") && !simbolos.has(u)), simbolos: simbolos.size, usados: usados.length };
  });
  expect(r.faltan).toEqual([]);
  expect(r.simbolos).toBeGreaterThanOrEqual(25);
  expect(r.usados).toBeGreaterThan(20);
});

test("los iconos son decorativos: aria-hidden y sin foco, también los que pinta el código", async ({ page }) => {
  await alMenu(page);
  await page.click("#screen-selector >> text=La Aventura");   // candados y coronas del mapa salen del código
  expect(await page.locator("#aventura-mundos svg.icono").count()).toBeGreaterThan(0);
  const malos = await page.$$eval("svg.icono", (is) => is.filter((i) => i.getAttribute("aria-hidden") !== "true" || i.getAttribute("focusable") !== "false").length);
  expect(malos).toBe(0);
});

test("los controles ya no llevan emojis: volver, ajustes, ayuda y teclado", async ({ page }) => {
  await alMenu(page);
  await expect(page.locator("#ajustes summary svg.icono")).toHaveCount(1);
  expect(EMOJI.test(await textoVisible(page.locator("#ajustes")))).toBe(false);
  await page.evaluate(() => { for (let b = 1; b <= 10; b++) registrarIntento(3, b, true); });
  await page.locator("#grid-tablas-container button").nth(2).click();
  if (await page.locator("#screen-descubrir:not(.hidden)").count()) await page.click("#descubrir-practicar");
  for (const sel of ["#screen-game .btn-volver", "#btn-help", "#tecla-borrar", "#btn-letra", "#pastilla-estrellas"]) {
    const el = page.locator(sel).first();
    await expect(el.locator("svg.icono"), sel).toHaveCount(1);
    expect(EMOJI.test(await textoVisible(el)), `${sel} aún tiene un emoji`).toBe(false);
  }
});

test("los botones conservan su nombre para el lector de pantalla", async ({ page }) => {
  await alMenu(page);
  await page.locator("#grid-tablas-container button").nth(2).click();
  if (await page.locator("#screen-descubrir:not(.hidden)").count()) await page.click("#descubrir-practicar");
  await expect(page.locator("#btn-help")).toHaveAccessibleName("¿Necesitas ayuda mágica?");
  await page.click("#btn-help");
  await expect(page.locator("#btn-help")).toHaveAccessibleName("Ocultar ayuda");
  await expect(page.locator("#btn-help svg.icono")).toHaveCount(1);   // el icono sigue al cambiar el texto
  await page.click("#btn-help");
  await expect(page.locator("#btn-help")).toHaveAccessibleName("¿Necesitas ayuda mágica?");
  await expect(page.locator("#screen-game .btn-volver")).toHaveAccessibleName(/Menú/);
});

test("en la Aventura: corazones, modos, borrar y lanzar con iconos; en el mapa, candado y corona", async ({ page }) => {
  await alMenu(page);
  await page.click("#screen-selector >> text=La Aventura");
  // El mapa: el jefe con corona y lo cerrado con candado, sin emojis.
  await expect(page.locator('.btn-nivel[data-nivel="0-3"] svg.icono use[href="#i-corona"]')).toHaveCount(1);
  await expect(page.locator('.btn-nivel[data-nivel="1-0"] svg.icono use[href="#i-candado"]')).toHaveCount(1);
  await expect(page.locator('#aventura-mundos svg.icono use[href="#i-candado"]').first()).toBeAttached();
  await page.evaluate(() => { aventura.manual = true; });
  await page.click('.btn-nivel[data-nivel="0-0"]');
  const corazones = page.locator("#nivel-corazones");
  await expect(corazones.locator('use[href="#i-corazon"]')).toHaveCount(3);
  await page.evaluate(() => { aventura.corazones = 2; pintarMarcador(); });
  await expect(corazones.locator('use[href="#i-corazon"]')).toHaveCount(2);
  await expect(corazones.locator('use[href="#i-corazon-vacio"]')).toHaveCount(1);
  await expect(corazones).toHaveAttribute("aria-label", "2 de 3 corazones");
  for (const sel of ["#modos-aventura", "#aventura-borrar", "#aventura-lanzar"]) {
    expect(EMOJI.test(await textoVisible(page.locator(sel))), `${sel} aún tiene un emoji`).toBe(false);
  }
  await expect(page.locator("#aventura-borrar")).toHaveAccessibleName("Borrar");
  await expect(page.locator('#modos-aventura [data-modo="elegir"]')).toHaveAccessibleName(/Elegir/);
});
