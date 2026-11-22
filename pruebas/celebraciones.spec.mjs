// Celebraciones (issue #49): cada logro tiene su momento, corto y sin
// retrasar la siguiente pregunta, y el lector de pantalla lo oye una vez.
import { test, expect } from "@playwright/test";
import { entrarATabla, responder, siguiente, ponerIntentos, rapida } from "./ayudas.mjs";

const globo = (page) => page.locator("#globo-lumi");
const feedback = (page) => page.locator("#game-feedback");

/** Responde y pasa a la siguiente, `n` veces, acertando o no. */
async function responderVarias(page, aciertos) {
  for (const ok of aciertos) {
    await responder(page, ok);
    await siguiente(page);
  }
}

/** Abre la tabla del 2 con todo escrito rápido otro día: hoy, un acierto rápido florece. */
async function tablaQueFlorece(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button");
  for (let b = 1; b <= 10; b++) await ponerIntentos(page, `2x${b}`, [rapida("2026-10-01")]);
  await page.locator("#grid-tablas-container button").nth(1).click();
  await page.waitForSelector("#screen-game:not(.hidden), #screen-descubrir:not(.hidden)");
  if (await page.locator("#screen-descubrir:not(.hidden)").count()) await page.click("#descubrir-practicar");
}

test("tres aciertos seguidos: Lumi lo dice en su globo y el texto lo repite", async ({ page }) => {
  await entrarATabla(page, 3);
  await responderVarias(page, [true, true]);
  expect(await globo(page).isHidden()).toBe(true);   // ahora mismo: el globo se va solo
  await responder(page, true);
  await expect(globo(page)).toBeVisible();
  await expect(globo(page)).toHaveText("¡Tres seguidas! 🔥");
  await expect(feedback(page)).toContainText("¡Tres seguidas!");
});

test("un fallo corta la racha: hacen falta otras tres seguidas", async ({ page }) => {
  await entrarATabla(page, 4);
  await responderVarias(page, [true, true, false]);
  expect(await globo(page).isHidden()).toBe(true);   // ahora mismo: el globo se va solo
  await responderVarias(page, [true, true]);
  expect(await globo(page).isHidden()).toBe(true);   // ahora mismo: el globo se va solo
  await responder(page, true);
  await expect(globo(page)).toHaveText("¡Tres seguidas! 🔥");
});

test("cinco seguidas tiene su propia frase", async ({ page }) => {
  await entrarATabla(page, 5);
  await responderVarias(page, [true, true, true, true]);
  await responder(page, true);
  await expect(globo(page)).toHaveText("¡Cinco seguidas! ¡Imparable!");
  await expect(feedback(page)).toContainText("¡Cinco seguidas!");
});

test("el globo se va solo y no se lo lee al lector de pantalla (lo dice el aviso, una vez)", async ({ page }) => {
  await entrarATabla(page, 6);
  await responderVarias(page, [true, true]);
  await responder(page, true);
  await expect(globo(page)).toHaveAttribute("aria-hidden", "true");
  // Solo una región que el lector anuncia contiene el logro.
  const anunciados = await page.$$eval("[aria-live], [role=status]", (es) =>
    es.filter((e) => !e.closest("[aria-hidden=true]") && e.textContent.includes("Tres seguidas")).length);
  expect(anunciados).toBe(1);
  await page.waitForTimeout(2000);
  await expect(globo(page)).toBeHidden();
});

test("al florecer: el bono sale de las estrellas y la flor del bancal brilla", async ({ page }) => {
  await tablaQueFlorece(page);
  await responder(page, true);
  await expect(feedback(page)).toContainText("floreció");
  await expect(page.locator("#pastilla-estrellas .bono-flota")).toHaveText(/^\+\d+ ⭐$/);
  await expect(page.locator("#pastilla-estrellas .bono-flota")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#garden-plot .flor-florecida")).toHaveCount(1);
});

test("un acierto que no florece no muestra bono ni flor brillante", async ({ page }) => {
  await entrarATabla(page, 7);
  await responder(page, true);
  expect(await page.locator("#pastilla-estrellas .bono-flota").count()).toBe(0);   // ahora mismo: el bono se va solo
  await expect(page.locator("#garden-plot .flor-florecida")).toHaveCount(0);
});

test.describe("con movimiento", () => {
  test.use({ reducedMotion: "no-preference" });

  async function entrar(page, tabla) {
    // «¡Comenzar a jugar!» late: se entra sin movimiento y luego se enciende.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await entrarATabla(page, tabla);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }

  test("al acertar, el botón salta y las estrellas brincan, en 600 ms o menos", async ({ page }) => {
    await entrar(page, 8);
    // Las animaciones duran menos de un segundo: se anotan al empezar, para no
    // depender de leerlas antes de que acaben (en una máquina ocupada, no da tiempo).
    await page.evaluate(() => {
      window.__animaciones = [];
      document.addEventListener("animationstart", (e) => {
        window.__animaciones.push({ id: e.target.id, nombre: e.animationName, dura: parseFloat(getComputedStyle(e.target).animationDuration) });
      });
    });
    const i = await responder(page, true);
    const idBoton = typeof i === "number" ? `opt-${i}` : "escrito";
    const de = (id, nombre) => page.waitForFunction(([id, nombre]) => window.__animaciones.find((a) => a.id === id && a.nombre === nombre), [id, nombre]).then((h) => h.jsonValue());
    const boton = await de(idBoton, "celebra-pop");
    expect(boton.dura).toBeGreaterThan(0);
    expect(boton.dura).toBeLessThanOrEqual(0.6);
    const estrellas = await de("pastilla-estrellas", "celebra-brinca");
    expect(estrellas.dura).toBeGreaterThan(0);
    expect(estrellas.dura).toBeLessThanOrEqual(0.6);
  });

  test("las celebraciones no retrasan la siguiente pregunta", async ({ page }) => {
    await entrar(page, 9);
    await responder(page, true);
    // «Siguiente» se puede tocar enseguida tras acertar.
    await expect(page.locator("#btn-siguiente:not([disabled])")).toBeVisible({ timeout: 300 });
  });

  test("en la victoria, las estrellas salen una a una y cae confeti con formas propias", async ({ page }) => {
    await entrar(page, 2);
    await responderVarias(page, Array(10).fill(true));
    await expect(page.locator("#screen-victory")).toBeVisible();
    const estrellas = await page.$$eval("#estrellas-victoria .estrella-victoria", (es) =>
      es.map((e) => [getComputedStyle(e).animationName, parseFloat(getComputedStyle(e).animationDelay)]));
    expect(estrellas.map(([n]) => n)).toEqual(["estrella-aparece", "estrella-aparece", "estrella-aparece"]);
    expect(estrellas.map(([, d]) => d)).toEqual([0, 0.15, 0.3]);
    await expect(page.locator(".confeti").first()).toBeAttached();
    const confeti = await page.$$eval(".confeti", (cs) => cs.map((c) => ({ forma: c.className, texto: c.textContent })));
    expect(confeti.every((c) => /confeti-(hoja|estrella|semilla)/.test(c.forma) && c.texto === "")).toBe(true);
  });

  test("con «Menos movimiento», nada salta, pero el mensaje sigue", async ({ page }) => {
    await entrar(page, 3);
    await page.evaluate(() => { ajustes.calma = true; aplicarAjustes(); });
    await responderVarias(page, [true, true]);
    await responder(page, true);
    await expect(feedback(page)).toContainText("¡Tres seguidas!");
    const dur = await page.locator("#pastilla-estrellas").evaluate((e) => parseFloat(getComputedStyle(e).animationDuration));
    expect(dur).toBeLessThan(0.01);
  });
});
