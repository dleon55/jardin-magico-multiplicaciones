// Experiencia de uso: teclado, esperas, lenguaje, almacenamiento, movimiento.
import { test, expect } from "@playwright/test";
import { entrarATabla, preguntaActual, opciones, responder, siguiente } from "./ayudas.mjs";

const conTeclado = (testInfo) => testInfo.project.name === "escritorio";

test("una partida completa termina en victoria con 10 aciertos", async ({ page }) => {
  await entrarATabla(page, 2);
  for (let i = 0; i < 10; i++) {
    await responder(page, true);
    await siguiente(page);
  }
  await expect(page.locator("#screen-victory")).toBeVisible();
  await expect(page.locator("#screen-victory h2")).toHaveText("¡Lo lograste, Ana!");
});

test("se juega entera con el teclado", async ({ page }, testInfo) => {
  test.skip(!conTeclado(testInfo), "solo donde hay teclado");
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.keyboard.press("Enter");
  await expect(page.locator("#screen-selector")).toBeVisible();

  await page.keyboard.press("7");
  await expect(page.locator("#screen-game")).toBeVisible();

  const { producto } = await preguntaActual(page);
  const i = (await opciones(page)).indexOf(producto);
  await page.keyboard.press(String(i + 1));
  await expect(page.locator("#current-stars")).toHaveText("1");

  const antes = (await preguntaActual(page)).texto;
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await preguntaActual(page)).texto).not.toBe(antes);

  await page.keyboard.press("h");
  await expect(page.locator("#help-panel")).toBeVisible();
  await expect(page.locator("#btn-help")).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(page.locator("#screen-selector")).toBeVisible();
});

test("tras acertar se sigue al instante; tras fallar hay un mínimo", async ({ page }) => {
  await entrarATabla(page, 6);

  await responder(page, false);
  await expect(page.locator("#btn-siguiente")).toBeVisible();
  await expect(page.locator("#btn-siguiente"), "bloqueado durante el mínimo").toBeDisabled();
  await expect(page.locator("#btn-siguiente")).toBeEnabled({ timeout: 2000 });
  await siguiente(page);

  await responder(page, true);
  const t0 = Date.now();
  await siguiente(page);
  expect(Date.now() - t0, "antes eran 1600 ms fijos").toBeLessThan(800);
});

test("acierto y error se marcan con símbolo, no solo con color", async ({ page }) => {
  await entrarATabla(page, 4);
  const i = await responder(page, false);
  await expect(page.locator(`#opt-${i}`)).toContainText("✗");
  await expect(page.locator(`#opt-${i}`)).toHaveAttribute("aria-label", /incorrecta/);
  await expect(page.locator(".btn-option", { hasText: "✓" })).toHaveCount(1);
});

test("ningún texto, mostrado o dicho, tiene género", async ({ page }) => {
  const GENERO = /jardinera|campeona|invitada|pequeña|👩‍🌾/i;
  await page.goto("./");
  const visible = await page.evaluate(() => document.querySelector("main").textContent);
  expect(visible).not.toMatch(GENERO);

  // Lo que se dice o se muestra desde el código: las cadenas del script, sin
  // los comentarios (que citan los textos antiguos para explicar el cambio) ni
  // las claves antiguas que solo existen para migrarlas.
  const codigo = (await page.evaluate(() => [...document.scripts].map((s) => s.textContent).join("\n")))
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/jardinera_(nombre|estrellas)/g, "");
  expect(codigo).not.toMatch(GENERO);
});

test("sin nombre, el juego habla del jardín", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await expect(page.locator("#display-name")).toHaveText("Tu jardín");
});

test("las estrellas de la versión anterior se conservan al actualizar", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("sembrado")) {
      localStorage.setItem("jardinera_nombre", "Ana");
      localStorage.setItem("jardinera_estrellas", "37");
      sessionStorage.setItem("sembrado", "1");
    }
  });
  await page.goto("./");
  const guardado = await page.evaluate(() => ({ ...localStorage }));
  expect(guardado["jardin:estrellas"]).toBe("37");
  expect(guardado["jardin:nombre"]).toBe("Ana");
  expect(guardado).not.toHaveProperty("jardinera_estrellas");
  await expect(page.locator("#global-stars")).toHaveText("37");
});

test("salir borra solo lo del juego, no lo de otras páginas del sitio", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => localStorage.setItem("otra-app:dato", "no-tocar"));
  await page.click("#screen-welcome button");
  await page.evaluate(() => resetGame());
  const guardado = await page.evaluate(() => ({ ...localStorage }));
  expect(guardado["otra-app:dato"]).toBe("no-tocar");
  expect(Object.keys(guardado).some((k) => k.startsWith("jardin:"))).toBe(false);
});

test("el lienzo de partículas no gasta batería en reposo", async ({ browser }) => {
  // Con animaciones: aquí se mide justo el lienzo animado.
  const contexto = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await contexto.newPage();
  await page.goto("http://localhost:4173/jardin-magico-multiplicaciones/");
  await page.evaluate(() => saveNameAndGo());   // el botón de inicio late: se entra sin él
  await page.locator("#grid-tablas-container button").nth(4).click();
  await responder(page, true);
  expect(await page.evaluate(() => particles.length), "el acierto sí lanza partículas").toBeGreaterThan(0);
  // Las partículas se desvanecen un poco en cada cuadro: en un equipo que
  // dibuja a 25 cuadros por segundo en lugar de 60 tardan más del doble. Lo que
  // se mide es lo de después, el reposo, así que aquí hay margen de sobra.
  await page.waitForFunction(() => particles.length === 0, null, { timeout: 15000 });
  const cuadros = await page.evaluate(() => new Promise((listo) => {
    let n = 0;
    const original = window.requestAnimationFrame;
    window.requestAnimationFrame = (f) => { n++; return original(f); };
    setTimeout(() => { window.requestAnimationFrame = original; listo(n); }, 2000);
  }));
  expect(cuadros, "antes: ~120 cuadros en 2 s sin nada que dibujar").toBe(0);
  await contexto.close();
});

test("sin preferencia del sistema, el modo calma arranca apagado", async ({ browser }) => {
  const contexto = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await contexto.newPage();
  await page.goto("http://localhost:4173/jardin-magico-multiplicaciones/");
  await expect(page.locator("html")).not.toHaveClass(/calma/);
  await contexto.close();
});

test.describe("menos movimiento", () => {
  test("respeta la preferencia del sistema", async ({ browser }) => {
    const contexto = await browser.newContext({ reducedMotion: "reduce" });
    const page = await contexto.newPage();
    await page.goto("http://localhost:4173/jardin-magico-multiplicaciones/");
    await expect(page.locator("html")).toHaveClass(/calma/);
    await contexto.close();
  });

  test("se puede cambiar en Ajustes, y se recuerda", async ({ page }) => {
    // Este contexto pide movimiento reducido: arranca encendido y se apaga.
    await page.goto("./");
    await page.click("#ajustes summary");
    const boton = page.locator('[data-ajuste="calma"]');
    await expect(boton).toHaveAttribute("aria-pressed", "true");
    await boton.click();
    await expect(page.locator("html")).not.toHaveClass(/calma/);
    await expect(boton).toHaveAttribute("aria-pressed", "false");
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/calma/);
  });

  test("cambiar otro ajuste no congela el que sigue al sistema", async ({ browser }) => {
    const contexto = await browser.newContext({ reducedMotion: "no-preference" });
    const page = await contexto.newPage();
    await page.goto("http://localhost:4173/jardin-magico-multiplicaciones/");
    await page.click("#ajustes summary");
    await page.click('[data-ajuste="efectos"]');
    // Antes: se guardaba calma=false junto con los efectos y ya no cambiaba.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("html")).toHaveClass(/calma/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/calma/);
    await contexto.close();
  });

  test("sin confeti ni partículas", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => { ajustes.calma = true; aplicarAjustes(); });
    await page.click("#screen-welcome button");
    await page.locator("#grid-tablas-container button").nth(1).click();
    await responder(page, true);
    expect(await page.evaluate(() => particles.length)).toBe(0);
  });
});

test("los atajos de teclado solo se anuncian donde hay teclado", async ({ page }, testInfo) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  const atajo = page.locator("#screen-selector .solo-teclado").first();
  if (conTeclado(testInfo)) {
    await expect(atajo).toBeVisible();
  } else {
    await expect(atajo).toBeHidden();
  }
});
