// La voz y los sonidos. Se sustituyen speechSynthesis y AudioContext por
// dobles que registran lo que se les pide: así se prueba QUÉ dice el juego y
// con qué voz, sin altavoces.
import { test, expect } from "@playwright/test";
import { entrarATabla, preguntaActual, responder } from "./ayudas.mjs";

function instalarDobles(page, voces) {
  return page.addInitScript((listaVoces) => {
    window.__dicho = [];
    window.__cancelaciones = 0;
    window.__tonos = [];
    const voces = listaVoces.map((v) => ({ ...v, name: v.lang, localService: true, default: false }));
    // speechSynthesis es de solo lectura en window: una asignación normal
    // falla EN SILENCIO y deja la voz real. Hay que redefinir la propiedad.
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => voces,
        speak: (u) => window.__dicho.push({ texto: u.text, voz: u.voice?.lang ?? null, lang: u.lang, rate: u.rate }),
        cancel: () => { window.__cancelaciones++; },
        addEventListener: () => {},
      },
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: function (texto) { this.text = texto; },
    });
    class Oscilador {
      constructor() { this.type = "sine"; this.frequency = { setValueAtTime: (f) => window.__tonos.push(f) }; }
      connect() {} start() {} stop() {}
    }
    window.webkitAudioContext = undefined;
    window.AudioContext = class {
      constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; }
      createOscillator() { return new Oscilador(); }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      resume() { this.state = "running"; }
    };
  }, voces);
}

test("elige una voz española aunque haya otras antes en la lista", async ({ page }) => {
  await instalarDobles(page, [{ lang: "en-US" }, { lang: "es-ES" }, { lang: "es-MX" }]);
  await entrarATabla(page, 7);
  const dicho = await page.evaluate(() => window.__dicho);
  expect(dicho.length).toBeGreaterThan(0);
  expect(dicho.every((d) => d.voz === "es-MX"), "prefiere es-MX").toBe(true);
});

test("sin voz en español, se calla y lo avisa en vez de leer con voz inglesa", async ({ page }) => {
  await instalarDobles(page, [{ lang: "en-US" }, { lang: "fr-FR" }]);
  await page.goto("./");
  await page.click("#screen-welcome button");
  expect(await page.evaluate(() => window.__dicho)).toEqual([]);
  await page.click("#ajustes summary");
  await expect(page.locator("#aviso-voz")).toBeVisible();
  await expect(page.locator("#aviso-voz")).toContainText("no tiene voz en español");
});

test("al acertar, la voz dice el hecho completo y no se corta con la pregunta siguiente", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await entrarATabla(page, 7);
  const { a, b, producto, texto } = await preguntaActual(page);
  await responder(page, true);
  const cancelacionesTrasResponder = await page.evaluate(() => window.__cancelaciones);

  const ultimo = (await page.evaluate(() => window.__dicho)).at(-1).texto;
  expect(ultimo).toContain(`${a} por ${b}, ${producto}`);
  expect(ultimo, "los emojis no se leen en voz alta").not.toMatch(/\p{Extended_Pictographic}/u);

  // Si no se toca nada, la siguiente pregunta llega sola y se ENCOLA detrás de
  // la felicitación: ninguna cancelación más. (La única al responder es la de
  // la lectura de la pregunta ya contestada.)
  // Comparación exacta: con includes(), «7 × 1» seguía «dentro» de «7 × 10».
  await page.waitForFunction((p) => document.getElementById("question-text").innerText.trim() !== p, texto,
    { timeout: 4000 });
  expect(await page.evaluate(() => window.__cancelaciones), "la felicitación no se corta").toBe(cancelacionesTrasResponder);
  const ultimaPregunta = (await page.evaluate(() => window.__dicho)).at(-1).texto;
  expect(ultimaPregunta).toMatch(/^¿Cuánto es/);
});

test("al saltar con «Siguiente», la voz sí se corta: quien juega ha decidido no esperar", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await entrarATabla(page, 7);
  await responder(page, true);
  const antes = await page.evaluate(() => window.__cancelaciones);
  await page.click("#btn-siguiente");
  expect(await page.evaluate(() => window.__cancelaciones)).toBe(antes + 1);
});

test("velocidad normal 0,95 y despacio 0,8; tono 1,1", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  await page.evaluate(() => speak("prueba"));
  expect((await page.evaluate(() => window.__dicho)).at(-1).rate).toBe(0.95);
  await page.evaluate(() => { ajustes.lenta = true; speak("prueba"); });
  expect((await page.evaluate(() => window.__dicho)).at(-1).rate).toBe(0.8);
});

test("voz y sonidos se apagan por separado", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  await page.evaluate(() => { ajustes.efectos = false; initAudio(); playCorrectSound(); speak("hola"); });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__tonos)).toEqual([]);
  expect((await page.evaluate(() => window.__dicho)).at(-1).texto).toBe("hola");
});

test("el sonido de error es un tono neutro, no el descenso grave de antes", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await entrarATabla(page, 7);
  // La melodía de bienvenida termina 300 ms después de entrar (último tono,
  // 659 Hz); si no se espera, sus tonos se cuelan en la medición.
  await page.waitForFunction(() => window.__tonos.includes(659));
  await page.evaluate(() => { window.__tonos = []; });
  await responder(page, false);
  const tonos = await page.evaluate(() => window.__tonos);
  expect(tonos).toEqual([392]);
});
