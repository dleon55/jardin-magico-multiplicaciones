// Accesibilidad medida con axe-core (las reglas WCAG 2.1 A y AA), pantalla por
// pantalla. Antes del cambio el sitio no tenía ni un solo atributo aria, y
// varios textos no llegaban al contraste mínimo.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { entrarATabla, responder, siguiente } from "./ayudas.mjs";

async function auditar(page, contexto) {
  // Se congela el avance automático: axe tarda, y con el equipo cargado la
  // pregunta seguía sola a mitad de la auditoría. Se audita lo que se ve
  // mientras se espera, que es lo que tiene que ser accesible.
  await page.evaluate(() => { if (espera) clearTimeout(espera.temporizador); });
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

test("ayuda girada", async ({ page }) => {
  await entrarATabla(page, 9);
  await page.click("#btn-help");
  await page.click("#btn-girar");
  await auditar(page, "la ayuda girada");
});

test("mapa de tablas, con hechos en los cuatro estados", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => {
    hechos["3x4"] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];   // florecida
    registrarIntento(5, 6, true); registrarIntento(5, 6, true);   // casi
    registrarIntento(7, 8, false);                               // practicando
  });
  await page.click("text=Mi mapa de tablas");
  await auditar(page, "el mapa");
});

test("pregunta que se responde escribiendo, con un número a medias", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => { for (let b = 1; b <= 10; b++) registrarIntento(3, b, true); });
  await page.click("#screen-welcome button");
  await page.locator("#grid-tablas-container button").nth(2).click();
  await page.click('#escritura [data-digito="1"]');
  await auditar(page, "el teclado de números");
});

test("mi jardín, con plantas en todos los estados", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => {
    const r = (d) => ({ d, t: 1, m: "e", ok: 1, ms: 2000 });
    hechos["2x3"] = [r("2026-01-01"), r(hoy())];       // flor
    hechos["3x3"] = [r("2020-01-01"), r("2020-01-02")]; // marchita
    hechos["4x5"] = [r(hoy())];                         // capullo
    registrarIntento(6, 7, true);                       // brote
  });
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=Mi jardín");
  await auditar(page, "el jardín");
});

test("selector con «Practicar lo que me falta»", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => registrarIntento(7, 8, false));
  await page.click("#screen-welcome button");
  await auditar(page, "el selector con el botón de lo que falta");
});

test("descubrir una tabla, a medias y entera", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.locator("#grid-tablas-container button").nth(6).click();
  await page.click("#descubrir-otra");
  await auditar(page, "descubrir la tabla, con una fila");
  for (let i = 0; i < 9; i++) await page.click("#descubrir-otra");
  await auditar(page, "descubrir la tabla, entera");
});

test("«¿Quién juega?» y la vista para las personas adultas", async ({ page }) => {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { registrarIntento(7, 8, false); registrarIntento(5, 5, true); });
  await page.click("#screen-selector >> text=Cambiar de jugador");
  await auditar(page, "la bienvenida con un jardín");
  await page.click("#screen-welcome >> text=Para las personas adultas");
  await page.click(".btn-borrar");
  await auditar(page, "la vista para adultos, pidiendo confirmar el borrado");
});

test("elegir mundo y personaje, en la bienvenida y en el menú", async ({ page }) => {
  await page.goto("./");
  await page.click('#screen-welcome .elegir-mundo label:has(input[value="dinos"])');
  await auditar(page, "la bienvenida con las fichas de mundo y personaje");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await auditar(page, "el menú en la selva de dinosaurios");
  await page.click("#screen-selector >> text=Mi mundo y mi personaje");
  await auditar(page, "cambiar de mundo");
});

for (const mundo of ["huerto", "bosque", "dinos", "espacio", "mar", "granja", "desierto", "flores"]) {
  test(`el menú y el jardín se leen bien en el mundo «${mundo}»`, async ({ page }) => {
    await page.goto("./");
    await page.click(`#screen-welcome .elegir-mundo label:has(input[value="${mundo}"])`);
    await page.click("#screen-welcome button:has-text('Comenzar')");
    await page.evaluate(() => { registrarIntento(7, 8, false); registrarIntento(5, 5, true); });
    await auditar(page, `el menú en ${mundo}`);
    await page.click("#screen-selector >> text=Mi jardín");
    await auditar(page, `el jardín en ${mundo}`);
  });
}

test("un reto de lógica, con la ayuda abierta y uno fallado", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("text=Retos de lógica");
  await page.click("#btn-help");
  await auditar(page, "un reto de lógica con la ayuda");
  const mala = await page.evaluate(() => [...document.querySelectorAll(".btn-option")].find((b) => Number(b.dataset.valor) !== correctAnswer).id);
  await page.click(`#${mala}`);
  await auditar(page, "un reto de lógica fallado");
});

test("una fracción con la ayuda abierta", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=Fracciones");
  await page.click("#btn-help");
  await auditar(page, "una fracción con el rectángulo repartido");
});

test("comparar fracciones con las tiras de la ayuda", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 4, b: 4, reto: { clase: "comparar", variante: "mismoNum", fracs: [[1, 5], [1, 3], [1, 8], [1, 4]] } }]; nextQuestion(); });
  await page.click("#btn-help");
  await auditar(page, "comparar fracciones con tiras");
});
