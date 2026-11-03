// Fase 2: el jardín que crece con lo aprendido. 7 × 8 y 8 × 7 son la misma
// planta; cada planta crece según se domina; y lo que no se repasa se marchita.
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida, elegida, pareja } from "./ayudas.mjs";

test.describe("7 × 8 y 8 × 7 son la misma planta", () => {
  test("lo que se responde en un orden cuenta para el otro", async ({ page }) => {
    await page.goto("./");
    const r = await page.evaluate(() => {
      registrarIntento(8, 7, true);
      return [estadoHecho(7, 8), estadoHecho(8, 7), seEscribe(7, 8), Object.keys(hechos)];
    });
    expect(r).toEqual(["practica", "practica", true, ["7x8"]]);
  });

  test("en el mapa, las dos casillas dicen lo mismo", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await ponerIntentos(page, "7x8", [rapida("2026-11-01"), rapida("2026-11-02")]);
    await page.click("text=Mi mapa de tablas");
    await expect(page.locator('[data-hecho="7x8"]')).toHaveAttribute("data-estado", "florecida");
    await expect(page.locator('[data-hecho="8x7"]')).toHaveAttribute("data-estado", "florecida");
  });

  test("el ×10 no tiene pareja: 7 × 10 es su propia planta", async ({ page }) => {
    await page.goto("./");
    expect(await page.evaluate(() => [claveHecho(7, 10), claveHecho(9, 9), claveHecho(9, 2)])).toEqual(["7x10", "9x9", "2x9"]);
  });

  test("lo guardado por separado se junta en orden, y puede florecer entre los dos órdenes", async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("sembrado")) {
        localStorage.setItem("jardin:intentos", JSON.stringify({
          "8x7": [{ d: "2026-11-02", t: 2, m: "e", ok: 1, ms: 2000 }],
          "7x8": [{ d: "2026-11-01", t: 1, m: "e", ok: 1, ms: 2000 }],
        }));
        sessionStorage.setItem("sembrado", "1");
      }
    });
    await page.goto("./");
    const r = await page.evaluate(() => [Object.keys(hechos), hechos["7x8"].map((i) => i.d), estadoHecho(8, 7)]);
    expect(r).toEqual([["7x8"], ["2026-11-01", "2026-11-02"], "florecida"]);
  });

  test("el Desafío del Arcoíris pregunta cada pareja del 2 al 9 una vez: 36", async ({ page }) => {
    await page.goto("./");
    const r = await page.evaluate(() => {
      currentTable = "mix"; ultimoHecho = ""; llenarBolsa();
      return bolsa.map((h) => claveHecho(h.a, h.b));
    });
    expect(r).toHaveLength(36);
    expect(new Set(r).size).toBe(36);
  });

  test("al repasar lo pendiente, una pareja sale en los dos órdenes", async ({ page }) => {
    await page.goto("./");
    await ponerIntentos(page, "7x8", [elegida("2026-11-01")]);
    const ordenes = new Set();
    for (let i = 0; i < 40 && ordenes.size < 2; i++) {
      ordenes.add(await page.evaluate(() => {
        currentTable = "falta"; colaRepaso = []; bolsa = []; ultimoHecho = "";
        hechosDeLaPartida = new Set();
        nextQuestion();
        return `${numA}x${numB}`;
      }));
    }
    expect([...ordenes].sort()).toEqual(["7x8", "8x7"]);
    expect([...ordenes].map((o) => pareja(...o.split("x").map(Number)))).toEqual(["7x8", "7x8"]);
  });
});

test.describe("Mi jardín", () => {
  async function abrirJardin(page) {
    await page.click("#screen-welcome button");
    await page.click("#screen-selector >> text=Mi jardín");
    await expect(page.locator("#screen-jardin")).toBeVisible();
  }

  test("54 plantas en nueve bancales en escalera: cada tabla trae menos nuevas", async ({ page }) => {
    await page.goto("./");
    await abrirJardin(page);
    await expect(page.locator("#screen-jardin [data-foco]")).toBeFocused();
    await expect(page.locator("[data-planta]")).toHaveCount(54);
    const porBancal = await page.$$eval("#jardin-bancales section", (ss) => ss.map((s) => s.querySelectorAll("li").length));
    expect(porBancal).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2]);
    await expect(page.locator("#jardin-resumen")).toHaveText("0 de 54 flores");
    await expect(page.locator("#jardin-consejo")).toContainText("Juega una tabla");
  });

  test("cada planta crece según se domina, y lo dice con texto, no solo con el dibujo", async ({ page }) => {
    await page.goto("./");
    await ponerIntentos(page, "7x8", [rapida("2026-01-01"), rapida(await page.evaluate(() => hoy()))]);   // flor
    await ponerIntentos(page, "6x9", [rapida(await page.evaluate(() => hoy()))]);                        // capullo
    await ponerIntentos(page, "3x4", [elegida(await page.evaluate(() => hoy()))]);                       // brote
    await abrirJardin(page);
    const planta = (k) => page.locator(`[data-planta="${k}"]`);
    await expect(planta("7x8")).toHaveAttribute("data-estado", "florecida");
    await expect(planta("7x8")).toContainText("7 por 8 y 8 por 7: flor, te la sabes");
    await expect(planta("6x9")).toHaveAttribute("data-estado", "casi");
    await expect(planta("6x9")).toContainText("🌷");
    await expect(planta("3x4")).toHaveAttribute("data-estado", "practica");
    await expect(planta("3x4")).toContainText("🌱");
    await expect(planta("9x10")).toHaveAttribute("data-estado", "nuevo");
    await expect(planta("9x10")).toContainText("9 por 10: por sembrar");   // el ×10 no tiene pareja
    await expect(page.locator("#jardin-resumen")).toHaveText("1 de 54 flores");
  });

  test("el menú dice cuántas flores hay", async ({ page }) => {
    await page.goto("./");
    await ponerIntentos(page, "2x3", [rapida("2026-01-01"), rapida("2026-01-02")]);
    await page.click("#screen-welcome button");
    await expect(page.locator("#screen-selector")).toContainText("Mi jardín (1 de 54 flores)");
  });

  test("tocar un bancal empieza a practicar esa tabla, y Esc vuelve al menú", async ({ page }, testInfo) => {
    await page.goto("./");
    await abrirJardin(page);
    if (testInfo.project.name === "escritorio") {
      await page.keyboard.press("Escape");
      await expect(page.locator("#screen-selector")).toBeVisible();
      await page.click("#screen-selector >> text=Mi jardín");
    }
    await page.click("text=Bancal del 6");
    await expect(page.locator("#screen-game")).toBeVisible();
    expect(await page.evaluate(() => currentTable)).toBe(6);
  });

  test("desde la victoria se llega al jardín", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => { currentTable = 2; endGameSuccess(); });
    await page.click("text=Ver mi jardín");
    await expect(page.locator("#screen-jardin")).toBeVisible();
  });
});

test.describe("regar: lo que no se repasa se marchita", () => {
  /** Fecha AAAA-MM-DD de hace `dias` días, según el reloj de la página. */
  const haceDias = (page, dias) => page.evaluate((n) => {
    const d = new Date(Date.parse(hoy()) - n * 86400000);
    return d.toISOString().slice(0, 10);
  }, dias);

  test("una flor sin repasar 14 días se marchita; con 13, todavía no", async ({ page }) => {
    await page.goto("./");
    await ponerIntentos(page, "3x3", [rapida(await haceDias(page, 20)), rapida(await haceDias(page, 14))]);
    await ponerIntentos(page, "4x4", [rapida(await haceDias(page, 20)), rapida(await haceDias(page, 13))]);
    expect(await page.evaluate(() => [estaMarchita(3, 3), estaMarchita(4, 4), estadoHecho(3, 3)]))
      .toEqual([true, false, "florecida"]);   // marchita no es olvidada: sigue florecida
  });

  test("la marchita se ve en el jardín y en el mapa, y pide riego en «lo que me falta»", async ({ page }) => {
    await page.goto("./");
    await ponerIntentos(page, "3x3", [rapida(await haceDias(page, 30)), rapida(await haceDias(page, 20))]);
    await page.click("#screen-welcome button");
    await expect(page.locator("#screen-selector .btn-falta")).toContainText("(1)");
    await page.click("#screen-selector >> text=Mi jardín");
    await expect(page.locator('[data-planta="3x3"]')).toHaveAttribute("data-estado", "marchita");
    await expect(page.locator('[data-planta="3x3"]')).toContainText("🥀");
    await expect(page.locator("#jardin-consejo")).toContainText("Una flor se está marchitando");
    await page.click("#screen-jardin button:has-text('Menú')");
    await page.click("text=Mi mapa de tablas");
    await expect(page.locator('[data-hecho="3x3"]')).toHaveAttribute("data-estado", "marchita");
  });

  test("al repasarla revive, y la victoria lo celebra", async ({ page }) => {
    await page.goto("./");
    await ponerIntentos(page, "3x3", [rapida(await haceDias(page, 30)), rapida(await haceDias(page, 20))]);
    await page.click("#screen-welcome button");
    await page.click("#screen-selector .btn-falta");
    const { escribir: _e, responder, siguiente } = await import("./ayudas.mjs");
    for (let i = 0; i < 10; i++) { await responder(page, true); await siguiente(page); }
    await expect(page.locator("#victoria-aprendido")).toHaveText("¡Regaste 1 flor que se estaba marchitando! Sigue fresca en tu jardín.");
    expect(await page.evaluate(() => [estaMarchita(3, 3), estadoHecho(3, 3)])).toEqual([false, "florecida"]);
  });
});
