// Paisajes (issue #55): el fondo de cada mundo del jardín y la arena de cada
// mundo de la Aventura son dibujos SVG por capas, no degradados con emojis.
import { test, expect } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";

const EMOJI = /\p{Extended_Pictographic}/u;
const MUNDOS_JARDIN = ["huerto", "bosque", "dinos", "espacio", "mar", "granja", "desierto", "flores"];

test("cada mundo del jardín tiene su paisaje propio, distinto y sin emojis", async ({ page }) => {
  await page.goto("./");
  const dibujos = await page.evaluate((ms) => ["neutro", ...ms].map((m) => svgPaisajeJardin(m)), MUNDOS_JARDIN);
  expect(new Set(dibujos).size).toBe(9);
  for (const d of dibujos) {
    expect(EMOJI.test(d)).toBe(false);
    expect(d).toContain('aria-hidden="true"');
  }
});

for (const mundo of ["bosque", "desierto", "mar"]) {
  test(`al jugar en «${mundo}», el fondo es su paisaje y cubre la pantalla`, async ({ page }) => {
    await page.goto("./");
    await page.click(`#screen-welcome .elegir-mundo label:has(input[value="${mundo}"])`);
    await page.click("#screen-welcome button:has-text('Comenzar')");
    const svg = page.locator("#fondo svg.paisaje");
    await expect(svg).toHaveAttribute("data-paisaje", mundo);
    const [caja, vista] = await Promise.all([svg.boundingBox(), page.evaluate(() => [innerWidth, innerHeight])]);
    expect(caja.width).toBeGreaterThanOrEqual(vista[0] - 1);
    expect(caja.height).toBeGreaterThanOrEqual(vista[1] - 1);
  });
}

test("cambiar de mundo cambia el paisaje", async ({ page }) => {
  await page.goto("./");
  await page.click('#screen-welcome .elegir-mundo label:has(input[value="granja"])');
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#fondo svg.paisaje")).toHaveAttribute("data-paisaje", "granja");
  await page.click("#screen-selector >> text=Mi mundo y mi personaje");
  await page.click('#screen-mundo .elegir-mundo label:has(input[value="flores"])');
  await page.click("#screen-mundo button:has-text('Listo')");
  await expect(page.locator("#fondo svg.paisaje")).toHaveAttribute("data-paisaje", "flores");
});

test("cada arena de la Aventura tiene su paisaje, sin emojis, detrás del héroe y los enemigos", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.click("#screen-selector >> text=La Aventura");
  await page.evaluate(() => { aventura.manual = true; aventuraGuardada.alcanzado = 23; mostrarAventura(); });
  const dibujos = await page.evaluate(() => AVENTURA_MUNDOS.map((_, m) => svgPaisajeArena(m)));
  expect(new Set(dibujos).size).toBe(6);
  for (const m of [0, 2, 5]) {
    await page.click(`.btn-nivel[data-nivel="${m}-0"]`);
    const decor = page.locator("#arena-decor");
    await expect(decor.locator("svg.paisaje-arena")).toHaveAttribute("data-paisaje", String(m));
    expect(EMOJI.test(await decor.innerHTML())).toBe(false);
    // Llena la arena y queda debajo: el héroe sigue siendo lo que se ve encima.
    const [d, a] = await Promise.all([decor.locator("svg").boundingBox(), page.locator("#arena").boundingBox()]);
    expect(Math.abs(d.width - a.width)).toBeLessThan(2);
    expect(Math.abs(d.height - a.height)).toBeLessThan(2);
    const encima = await page.evaluate(() => {
      const h = document.querySelector("#heroe").getBoundingClientRect();
      return document.elementFromPoint(h.left + h.width / 2, h.top + h.height * 0.6).closest("#heroe") !== null;
    });
    expect(encima).toBe(true);
    await page.evaluate(() => { detenerAventura(); mostrarAventura(); });
  }
});

test("los paisajes pesan poco: su código ocupa menos de 30 KB", async () => {
  // Antes se medía la página entera contra un tope fijo, y cualquier cambio
  // ajeno a los paisajes la hacía fallar. Ahora se mide solo su sección.
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const desde = html.indexOf("// --- PAISAJES");
  const hasta = html.indexOf("// --- PRESENTACIÓN: fondo");
  expect(desde).toBeGreaterThan(0);
  expect(hasta).toBeGreaterThan(desde);
  expect(Buffer.byteLength(html.slice(desde, hasta))).toBeLessThan(30000);
});

test("la página entera no pasa de 600 KB", async () => {
  // Una alarma, no una meta: el plan (docs/PLAN.md, riesgos) prevé separar
  // el arte y los datos en archivos si index.html se acerca a 700 KB.
  const { size } = await stat(new URL("../index.html", import.meta.url));
  expect(size).toBeLessThan(600000);
});

test.describe("con movimiento", () => {
  test.use({ reducedMotion: "no-preference" });
  test("en el mar suben burbujas y las algas se mecen; con «Menos movimiento», quietas", async ({ page }) => {
    await page.goto("./");
    await page.click('#screen-welcome .elegir-mundo label:has(input[value="mar"])');
    await page.evaluate(() => saveNameAndGo());
    const anim = (sel) => page.locator(sel).first().evaluate((e) => getComputedStyle(e).animationName);
    expect(await anim("#fondo .burbuja")).toBe("burbuja-sube");
    expect(await anim("#fondo .alga")).toBe("alga-mece");
    await page.evaluate(() => { ajustes.calma = true; aplicarAjustes(); });
    expect(await anim("#fondo .burbuja")).toBe("none");
  });
});
