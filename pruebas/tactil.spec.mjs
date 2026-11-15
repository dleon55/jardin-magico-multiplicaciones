// En el teléfono, con los dedos: todo lo que se toca mide al menos 44 × 44 px
// y lo que hace falta para jugar se ve sin desplazarse, hasta en un Android
// pequeño de 360 × 640.
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-15T12:00:00"));
  await page.goto("./");
  await page.fill("#player-name", "Leo");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
});

/** Lo tocable visible que mide menos de 44 px de alto o de ancho. */
const pequenos = (page) => page.evaluate(() => {
  const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && !e.closest(".hidden"); };
  return [...document.querySelectorAll("main button, main summary, main input:not([type=radio]):not([type=file])")]
    .filter(visible)
    .map((e) => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.width < 43.5 || r.height < 43.5)
    .map(({ e, r }) => `${(e.getAttribute("aria-label") || e.textContent || e.id).trim().replace(/\s+/g, " ").slice(0, 30)} ${Math.round(r.width)}×${Math.round(r.height)}`);
});

const pantallas = {
  "menú": () => backToSelector(),
  "ajustes": () => { backToSelector(); document.getElementById("ajustes").open = true; },
  "descubrir": () => mostrarDescubrir(4),
  "partida con ayuda": () => { document.getElementById("ajustes").open = false; startTable(3); toggleHelp(); },
  "partida escribiendo": () => { for (let x = 1; x <= 10; x++) registrarIntento(5, x, true); startTable(5); },
  "mapa": () => mostrarMapa(),
  "jardín": () => mostrarJardin(),
  "vivero": () => mostrarVivero(),
  "fracciones": () => mostrarFracciones(),
  "mapa de la aventura": () => mostrarAventura(),
  "nivel de la aventura": () => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); },
  "mi mundo": () => mostrarMiMundo(),
  "adultos": () => { registrarIntento(2, 3, true); mostrarAdultos(); },
};

for (const [nombre, abrir] of Object.entries(pantallas)) {
  test(`${nombre}: todo lo que se toca mide al menos 44 × 44 px`, async ({ page }) => {
    await page.evaluate(abrir);
    expect(await pequenos(page)).toEqual([]);
  });
}

const fondo = (page, sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().bottom, sel);

test("la partida se juega sin desplazarse: opciones, retos y el teclado de escribir", async ({ page }) => {
  await page.evaluate(() => startTable(3));
  expect(await fondo(page, "#opciones")).toBeLessThanOrEqual(640);           // con el aviso de la primera pregunta
  await page.evaluate(() => startTable("logica"));
  expect(await fondo(page, "#opciones")).toBeLessThanOrEqual(640);
  await page.evaluate(() => { for (let x = 1; x <= 10; x++) registrarIntento(5, x, true); startTable(5); evaluar(-1, null); cancelarEspera(); nextQuestion(); });
  expect(await page.evaluate(() => modoEscrito)).toBe(true);
  expect(await fondo(page, "#teclado-juego")).toBeLessThanOrEqual(640);
});

test("la multiplicación cabe dentro del círculo del girasol, también la más larga", async ({ page }) => {
  const r = await page.evaluate(() => {
    startTable(9);
    const q = document.getElementById("question-text");
    q.textContent = "9 × 10";
    return { texto: q.getBoundingClientRect().width, circulo: document.getElementById("girasol").getBoundingClientRect().width * 0.52 };
  });
  expect(r.texto).toBeLessThanOrEqual(r.circulo);
});

test("un nivel de la aventura cabe en los tres modos", async ({ page }) => {
  for (const [modo, boton] of [["teclear", "#aventura-lanzar"], ["elegir", "#aventura-opciones button"], ["dedo", "#pizarra-lanzar"]]) {
    await page.evaluate((m) => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); cambiarModoAventura(m); }, modo);
    const abajo = await page.evaluate((s) => Math.max(...[...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect().bottom)), boton);
    expect(abajo, modo).toBeLessThanOrEqual(640);
  }
});

test("los modos de la aventura son botones de icono, pero el lector de pantalla oye su nombre", async ({ page }) => {
  await page.evaluate(() => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); });
  await expect(page.locator('#modos-aventura [data-modo="dedo"]')).toHaveAccessibleName("Con el dedo");
  await expect(page.locator('#modos-aventura [data-modo="dedo"] .texto-modo')).toHaveCSS("position", "absolute");
});
