// Lo que salió de jugarlo en un teléfono de verdad: el teclado de la Aventura
// no era el de un teléfono, la pantalla se movía al tocar rápido y faltaba
// música de fondo.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-15T12:00:00"));
});

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Leo");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

async function alNivel(page) {
  await alMenu(page);
  await page.evaluate(() => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); });
}

test("el teclado de la Aventura es el de un teléfono: 1 2 3 / 4 5 6 / 7 8 9 / ⌫ 0 ✨", async ({ page }) => {
  await alNivel(page);
  const filas = await page.evaluate(() => {
    const botones = [...document.querySelectorAll("#aventura-teclado button")];
    const porFila = new Map();
    for (const b of botones) {
      const y = Math.round(b.getBoundingClientRect().top);
      const nombre = b.dataset.digito ?? (b.id === "aventura-borrar" ? "⌫" : "✨");
      porFila.set(y, [...(porFila.get(y) || []), nombre]);
    }
    return [...porFila.values()];
  });
  expect(filas).toEqual([["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["⌫", "0", "✨"]]);
});

test("el teclado del juego tiene la misma distribución", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { for (let b = 1; b <= 10; b++) registrarIntento(3, b, true); startTable(3); });
  const filas = await page.evaluate(() => {
    const porFila = new Map();
    for (const b of document.querySelectorAll("#teclado-juego button")) {
      const y = Math.round(b.getBoundingClientRect().top);
      const nombre = b.dataset.digito ?? (b.id === "tecla-borrar" ? "⌫" : "✓");
      porFila.set(y, [...(porFila.get(y) || []), nombre]);
    }
    return [...porFila.values()];
  });
  expect(filas).toEqual([["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["⌫", "0", "✓"]]);
});

test("tocar no mueve la pantalla: sin zoom por doble toque, y teclados, opciones y arena no desplazan", async ({ page }) => {
  await alNivel(page);
  const r = await page.evaluate(() => {
    const ta = (sel) => getComputedStyle(document.querySelector(sel)).touchAction;
    return {
      pagina: ta("html"),
      boton: ta("#nivel-cabecera button"),
      tecla: ta("#aventura-teclado button"),
      arena: ta("#arena"),
      opcion: ta("#opciones .btn-option"),
      teclaJuego: ta("#teclado-juego button"),
      rebote: getComputedStyle(document.documentElement).overscrollBehaviorY,
    };
  });
  expect(r).toEqual({ pagina: "manipulation", boton: "manipulation", tecla: "none", arena: "none", opcion: "none", teclaJuego: "none", rebote: "none" });
  // El zoom con dos dedos no se bloquea: hace falta para quien ve poco.
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", "width=device-width, initial-scale=1.0");
});

test("hay música: tranquila en el jardín y con ritmo en la Aventura", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable(2));   // un toque ya creó el audio
  await expect.poll(() => page.evaluate(() => [musica.pieza, musica.temporizador !== null])).toEqual(["jardin", true]);
  await page.evaluate(() => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); });
  expect(await page.evaluate(() => musica.pieza)).toBe("aventura");
  expect(await page.evaluate(() => PIEZAS.aventura.tempo > PIEZAS.jardin.tempo)).toBe(true);
  await page.evaluate(() => salirDeNivel());
  expect(await page.evaluate(() => musica.pieza)).toBe("jardin");
});

test("la música se apaga en Ajustes, se recuerda, y se calla al cambiar de app", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable(2));
  await expect.poll(() => page.evaluate(() => musica.temporizador !== null)).toBe(true);
  await page.evaluate(() => backToSelector());
  await page.click("#ajustes summary");
  const boton = page.locator('[data-ajuste="musica"]');
  await expect(boton).toHaveAttribute("aria-pressed", "true");
  await boton.click();
  await expect(boton).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => [musica.temporizador, JSON.parse(almacen.leer("ajustes")).musica])).toEqual([null, false]);
  await page.evaluate(() => startTable(3));
  expect(await page.evaluate(() => musica.temporizador)).toBeNull();          // sigue apagada
  await page.evaluate(() => cambiarAjuste("musica"));                         // se vuelve a encender
  expect(await page.evaluate(() => musica.temporizador !== null)).toBe(true);
  const r = await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    const oculta = musica.temporizador;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
    return [oculta, musica.temporizador !== null];
  });
  expect(r).toEqual([null, true]);
});

test("mientras habla la voz, la música baja", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable(2));
  await expect.poll(() => page.evaluate(() => musica.salida !== null)).toBe(true);
  const r = await page.evaluate(() => {
    Object.defineProperty(window.speechSynthesis, "speaking", { configurable: true, get: () => true });
    programarMusica();
    const conVoz = musica.salida.gain.value;
    Object.defineProperty(window.speechSynthesis, "speaking", { configurable: true, get: () => false });
    programarMusica();
    return [conVoz, musica.salida.gain.value];
  });
  expect(r[0]).toBeCloseTo(0.015, 3);
  expect(r[1]).toBeCloseTo(0.05, 3);
});

test("la música está escrita en su escala: cada nota de la melodía cae en la pentatónica", async ({ page }) => {
  await page.goto("./");
  const fuera = await page.evaluate(() => Object.entries(PIEZAS).flatMap(([nombre, p]) =>
    p.melodia.flat().filter((g) => g !== null).map((g) => notaPentatonica(p.base, g) - p.base)
      .filter((d) => !PENTATONICA.includes(((d % 12) + 12) % 12)).map((d) => `${nombre}:${d}`)));
  expect(fuera).toEqual([]);
});

test.describe("en el teléfono", () => {
  test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });

  test("con el teclado de teléfono, el nivel sigue cabiendo entero", async ({ page }) => {
    await alNivel(page);
    const r = await page.evaluate(() => ({ alto: innerHeight, fondo: document.getElementById("aventura-lanzar").getBoundingClientRect().bottom }));
    expect(r.fondo).toBeLessThanOrEqual(r.alto);
  });
});
