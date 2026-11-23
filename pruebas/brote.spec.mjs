// Brote sin leer (Hito 5.2): para quien aún no lee. Brote dice en voz lo que
// toca hoy y el progreso, acorta las partidas (5 en vez de 10) y las
// rondas de «Enséñale a Lumi» (3 dudas), y no ofrece los retos con código.
import { test, expect } from "@playwright/test";
import { instalarDobles, pasarDescubrir } from "./ayudas.mjs";

const MUNDO = { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] };

async function entrar(page, tono) {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  if (tono) await page.click(`#screen-welcome .elegir-tono label:has(input[value="${tono}"])`);
  await page.fill("#player-name", "Ana");
  await page.evaluate(() => almacen.guardar("diagnostico", "saltado"));
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}
const dicho = (page) => page.evaluate(() => window.__dicho.map((d) => d.texto));
const ultimo = async (page) => (await dicho(page)).at(-1);
const olvidarLoDicho = (page) => page.evaluate(() => { window.__dicho.length = 0; });
/** Acierta hasta la victoria y devuelve cuántas preguntas hicieron falta. */
const ganar = (page) => page.evaluate(() => {
  let n = 0;
  while (score < targetScore && n < 30) { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); n++; if (score < targetScore) nextQuestion(); }
  endGameSuccess();
  return n;
});

test.describe("con el mundo a la vista", () => {
  test.use({ storageState: MUNDO });

  test("al entrar, el saludo dice también lo que toca hoy y qué botón tocar", async ({ page }) => {
    await entrar(page, "brote");
    expect(await ultimo(page)).toBe("¡Hola, Ana! Vamos a jugar con las matemáticas. Hoy: Tabla del 2. Después, enséñale a Lumi. Toca el botón grande.");
    // Y al volver al inicio se repite la propuesta (sin el saludo).
    await page.evaluate(() => { mostrarJardin(); backToSelector(); });
    expect(await ultimo(page)).toBe("Hoy: Tabla del 2. Después, enséñale a Lumi. Toca el botón grande.");
  });

  for (const tono of ["explora", "pro"]) {
    test(`en ${tono} el saludo queda como siempre, y ni volver al inicio ni «Mi progreso» dicen nada`, async ({ page }) => {
      await entrar(page, tono);
      expect(await ultimo(page)).toBe("¡Hola, Ana! Vamos a jugar con las matemáticas.");
      await olvidarLoDicho(page);
      await page.evaluate(() => { mostrarJardin(); backToSelector(); });
      expect(await dicho(page)).toEqual([]);
      await page.evaluate(() => mostrarProgreso());
      expect(await dicho(page)).toEqual([]);
    });
  }

  test("sin expedición a la vista (jardín sin nada jugado), Brote no inventa una propuesta", async ({ page }) => {
    await instalarDobles(page, [{ lang: "es-MX" }]);
    await page.goto("./");
    await page.click('#screen-welcome .elegir-tono label:has(input[value="brote"])');
    await page.fill("#player-name", "Ana");
    await page.click("#screen-welcome button:has-text('Comenzar')");
    await expect(page.locator("#seguir")).toBeVisible();
    expect(await ultimo(page)).toBe("¡Hola, Ana! Vamos a jugar con las matemáticas.");
  });

  test("las partidas duran la mitad: cinco aciertos, también dentro de la expedición", async ({ page }) => {
    await entrar(page, "brote");
    await page.click("#btn-expedicion");
    await pasarDescubrir(page);
    expect(await page.evaluate(() => targetScore)).toBe(5);
    await expect(page.locator("#target-stars")).toHaveText("5");
    expect(await ganar(page)).toBe(5);
    await expect(page.locator("#screen-victory")).toBeVisible();
    await expect(page.locator("#btn-expedicion-sigue")).toBeVisible();
  });

  test("en Explora la partida sigue siendo de diez, y en equipo también aunque sea Brote", async ({ page }) => {
    await entrar(page, "explora");
    await page.evaluate(() => startTable(2));
    expect(await page.evaluate(() => targetScore)).toBe(10);
    expect(await ganar(page)).toBe(10);
    await page.evaluate(() => { perfilEnUso().tono = "brote"; equipo = { ids: [perfilActual, perfilActual], turno: -1, original: perfilActual }; startTable(2); });
    expect(await page.evaluate(() => targetScore)).toBe(10);
  });

  test("«Enséñale a Lumi» trae tres dudas, y así lo cuenta al terminar y para las personas adultas", async ({ page }) => {
    await entrar(page, "brote");
    await page.click("#btn-ensenar-mundo");
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator("#ensenar-cuenta")).toHaveText(`Duda ${i} de 3`);
      await page.evaluate(() => { ensenar.duda = nuevaDuda(dudaDeTabla(), 0.1); });   // Lumi acierta
      await page.click(".ensenar-si");
      await expect(page.locator("#ensenar-sigue")).toHaveText(i === 3 ? "Terminar" : "Otra duda");
      await page.click("#ensenar-sigue");
    }
    await expect(page.locator("#ensenar-cuenta")).toHaveText("3 de 3");
    await expect(page.locator("#ensenar-pregunta")).toHaveText("¡Lumi aprendió todo contigo!");
    await expect(page.locator("#ensenar-dice")).toHaveText("Resolvimos 3 dudas de 3. ¡Qué bien enseñas!");
    expect(await page.evaluate(() => actividadDePerfil(perfilActual).ensenar)).toMatchObject({ rondas: 1, dudas: 3, bien: 3 });
    // Cambiar de tono a media ronda no la alarga: la ronda recuerda cuántas dudas trae.
    await page.evaluate(() => { mostrarEnsenar(); perfilEnUso().tono = "explora"; });
    expect(await page.evaluate(() => ensenar.total)).toBe(3);
    await page.evaluate(() => { backToSelector(); mostrarEnsenar(); });
    expect(await page.evaluate(() => ensenar.total)).toBe(5);
  });

  test("no se ofrecen los retos con código: en su lugar va «Antes de multiplicar» (Hito 6.7)", async ({ page }) => {
    await entrar(page, "brote");
    await expect(page.locator("#mundo-extras button")).toHaveCount(4);
    await expect(page.locator("#btn-reto-mundo")).toHaveCount(0);
    expect(await page.locator("#mundo-extras button").allTextContents()).toEqual(["La Aventura", "En equipo", "Enséñale a Lumi", "Antes de multiplicar"]);
    // En Explora siguen los cuatro.
    await page.evaluate(() => { perfilEnUso().tono = "explora"; mostrarPantalla("screen-selector"); });
    await expect(page.locator("#mundo-extras button")).toHaveCount(4);
    await expect(page.locator("#btn-reto-mundo")).toBeVisible();
  });

  test("«Mi progreso» se dice en voz (abrir un lugar ya se decía en todos los tonos)", async ({ page }) => {
    await entrar(page, "brote");
    await page.click('.lugar-mundo[data-lugar="huerto"]');
    expect(await ultimo(page)).toMatch(/^Huerto de las tablas\. /);
    await page.evaluate(() => { cerrarLugar(false); ganarEstrellas(1); });
    await page.click("#btn-progreso");
    expect(await ultimo(page)).toBe("Tu progreso. Llevas 0 cosechas. Sabes 0 tablas. Tienes 1 estrella.");
  });
});

test("con el menú en lista: el botón de retos no se ve en Brote, y volver al inicio no habla de la expedición", async ({ page }) => {
  await entrar(page, "brote");
  await expect(page.locator("#btn-ensenar")).toBeVisible();
  await expect(page.locator("#btn-reto")).toBeHidden();
  expect(await ultimo(page)).toBe("¡Hola, Ana! Vamos a jugar con las matemáticas.");
  await olvidarLoDicho(page);
  await page.evaluate(() => { mostrarJardin(); backToSelector(); });
  expect(await dicho(page)).toEqual([]);
  await page.evaluate(() => { perfilEnUso().tono = "explora"; document.body.dataset.tono = "explora"; });
  await expect(page.locator("#btn-reto")).toBeVisible();
});

// --- Hito 6.4: Brote sin voz ---
test.describe("sin voz", () => {
  test.use({ storageState: MUNDO });
  /** Entra en un tono, en un aparato cuyas voces son las dadas ([] = ninguna en español). */
  async function entrarConVoces(page, tono, voces) {
    await instalarDobles(page, voces);
    await page.goto("./");
    await page.click(`#screen-welcome .elegir-tono label:has(input[value="${tono}"])`);
    await page.fill("#player-name", "Ana");
    await page.evaluate(() => almacen.guardar("diagnostico", "saltado"));
    await page.click("#screen-welcome button:has-text('Comenzar')");
    await expect(page.locator("#expedicion")).toBeVisible();
  }
  const senal = (page) => page.locator("#expedicion-senal");

  test("en Brote, en un aparato sin voz en español, una flecha señala el botón de la expedición", async ({ page }) => {
    await entrarConVoces(page, "brote", [{ lang: "en-US" }]);
    expect(await page.evaluate(() => hayVozEspanol)).toBe(false);
    await expect(senal(page)).toBeVisible();
    await expect(senal(page)).toHaveAttribute("aria-hidden", "true");
    // Justo encima del botón, y apuntando hacia él (la punta de la flecha, abajo).
    const r = await page.evaluate(() => {
      const [s, b] = [document.querySelector("#expedicion-senal svg"), document.getElementById("btn-expedicion")].map((e) => e.getBoundingClientRect());
      return { encima: s.bottom <= b.top + 1 && b.top - s.bottom < 24, centrada: Math.abs((s.left + s.right) / 2 - (b.left + b.right) / 2) < 4, alto: s.height };
    });
    expect(r.encima).toBe(true);
    expect(r.centrada).toBe(true);
    expect(r.alto).toBeGreaterThanOrEqual(32);
    expect(await page.evaluate(() => window.__dicho.length)).toBe(0);   // y no se intentó hablar
  });

  test("con voz en español no hay flecha; al apagar la voz en Ajustes sale, y al encenderla se va", async ({ page }) => {
    await entrarConVoces(page, "brote", [{ lang: "es-MX" }]);
    await expect(senal(page)).toBeHidden();
    await page.evaluate(() => cambiarAjuste("voz"));
    await expect(senal(page)).toBeVisible();
    await page.evaluate(() => cambiarAjuste("voz"));
    await expect(senal(page)).toBeHidden();
  });

  test("en Explora y en Pro no hay flecha aunque no haya voz", async ({ page }) => {
    await entrarConVoces(page, "explora", [{ lang: "en-US" }]);
    await expect(senal(page)).toBeHidden();
    await page.evaluate(() => { perfilEnUso().tono = "pro"; mostrarPantalla("screen-selector"); });
    await expect(senal(page)).toBeHidden();
    await page.evaluate(() => { perfilEnUso().tono = "brote"; mostrarPantalla("screen-selector"); });
    await expect(senal(page)).toBeVisible();
  });

  test("si se sabe tarde que no hay voz, la flecha sale sin esperar a volver al inicio", async ({ page }) => {
    await entrarConVoces(page, "brote", [{ lang: "es-MX" }]);
    await expect(senal(page)).toBeHidden();
    await page.evaluate(() => marcarSinVoz("Este dispositivo no tiene voces para leer en voz alta."));
    await expect(senal(page)).toBeVisible();
    // Fuera del inicio no se repinta nada (no hay error ni cambio de pantalla).
    await page.evaluate(() => { mostrarJardin(); hayVozEspanol = true; marcarSinVoz("Sin voz."); });
    await expect(page.locator("#screen-jardin")).toBeVisible();
  });

  test("sin expedición a la vista no hay flecha, y con «Menos movimiento» se queda quieta", async ({ page }) => {
    await entrarConVoces(page, "brote", [{ lang: "en-US" }]);
    await page.evaluate(() => { ajustes.lista = true; aplicarAjustes(); mostrarPantalla("screen-selector"); });
    await expect(senal(page)).toBeHidden();
    await page.evaluate(() => { ajustes.lista = false; aplicarAjustes(); mostrarPantalla("screen-selector"); });
    await expect(senal(page)).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    expect(await senal(page).evaluate((e) => getComputedStyle(e).animationName)).toBe("senal-brote");
    await page.evaluate(() => { ajustes.calma = true; aplicarAjustes(); });
    expect(await senal(page).evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  });
});
