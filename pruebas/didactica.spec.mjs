// Lo que ENSEÑA el juego más allá de preguntar: la ayuda como rectángulo, los
// trucos por tabla, las tablas hasta el 12 y el mapa de lo que ya se sabe.
import { test, expect } from "@playwright/test";
import { entrarATabla, preguntaActual, responder, siguiente, instalarDobles } from "./ayudas.mjs";

const conTeclado = (testInfo) => testInfo.project.name === "escritorio";

test.describe("ayuda: el rectángulo de filas × columnas", () => {
  test("dibuja exactamente a × b puntos en a filas, para todas las tablas hasta 12 × 12", async ({ page }) => {
    await page.goto("./");
    const malos = await page.evaluate(() => {
      const errores = [];
      for (let a = 1; a <= 12; a++) {
        for (let b = 1; b <= 12; b++) {
          numA = a; numB = b; ayudaGirada = false;
          generateHelpVisual();
          const rejilla = document.querySelector("#help-visual-container > div");
          const puntos = rejilla.querySelectorAll(".punto").length;
          const columnas = rejilla.style.gridTemplateColumns.match(/repeat\((\d+)/)[1];
          if (puntos !== a * b || Number(columnas) !== b) errores.push(`${a}x${b}: ${puntos} puntos, ${columnas} columnas`);
        }
      }
      return errores;
    });
    // Antes: 9 × 10 eran 90 emojis sueltos en una rejilla de 3, sin filas.
    expect(malos).toEqual([]);
  });

  test("al girarlo se ven los mismos puntos y se explica que el orden no importa", async ({ page }) => {
    await entrarATabla(page, 9);
    await page.evaluate(() => { numA = 9; numB = 7; });
    await page.click("#btn-help");
    const columnas = () => page.evaluate(() =>
      document.querySelector("#help-visual-container > div").style.gridTemplateColumns);
    expect(await columnas()).toContain("repeat(7");
    await page.click("#btn-girar");
    expect(await columnas()).toContain("repeat(9");
    await expect(page.locator("#help-visual-container .punto")).toHaveCount(63);
    await expect(page.locator("#help-explain")).toContainText("9 × 7 da lo mismo que 7 × 9");
  });

  test("la pregunta siguiente vuelve a salir sin girar", async ({ page }) => {
    await entrarATabla(page, 6);
    await page.click("#btn-help");
    await page.click("#btn-girar");
    await responder(page, true);
    await siguiente(page);
    const { a } = await preguntaActual(page);
    expect(await page.evaluate(() => ayudaGirada)).toBe(false);
    await expect(page.locator("#help-explain")).toContainText(`${a} filas`);
  });
});

test.describe("trucos por tabla", () => {
  test("todo hecho hasta 12 × 12 tiene un truco, y el truco no da la respuesta", async ({ page }) => {
    await page.goto("./");
    const malos = await page.evaluate(() => {
      const errores = [];
      for (let a = 1; a <= 12; a++) {
        for (let b = 1; b <= 12; b++) {
          const { texto, voz } = trucoPara(a, b);
          const p = a * b;
          if (!/^Truco del \d+:/.test(texto)) errores.push(`${a}x${b} sin truco: ${texto}`);
          // La ayuda guía hasta el último paso, pero ese lo da quien juega.
          if (new RegExp(`(=|→) ${p}\\b`).test(texto)) errores.push(`${a}x${b} da la respuesta: ${texto}`);
          if (/[×→+]/.test(voz)) errores.push(`${a}x${b} la voz leería signos: ${voz}`);
        }
      }
      return errores;
    });
    expect(malos).toEqual([]);
  });

  test("usa el factor con el truco más fácil, en cualquier orden", async ({ page }) => {
    await page.goto("./");
    const t = await page.evaluate(() => [trucoPara(9, 3).texto, trucoPara(3, 9).texto, trucoPara(7, 5).texto]);
    expect(t[0]).toBe(t[1]);                     // 9 × 3 y 3 × 9: el mismo truco
    expect(t[0]).toMatch(/^Truco del 9: .*3 × 10 = 30, y quítale 3/);
    expect(t[2]).toMatch(/^Truco del 5: .*7 × 10 = 70/);
  });

  test("al abrir la ayuda, la voz dice el truco con palabras", async ({ page }) => {
    await instalarDobles(page, [{ lang: "es-MX" }]);
    await entrarATabla(page, 9);
    await page.evaluate(() => { numA = 9; numB = 7; });   // con 9 × 5 tocaría el truco del 5
    await page.click("#btn-help");
    const dicho = (await page.evaluate(() => window.__dicho)).at(-1).texto;
    expect(dicho).toMatch(/^Truco del 9: es por 10 y una vez menos\. 7 por 10 es 70, y quítale 7\.$/);
  });
});

test.describe("tablas del 1 al 12", () => {
  test("el menú ofrece las doce tablas", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(page.locator("#grid-tablas-container button")).toHaveCount(12);
    await expect(page.locator("#grid-tablas-container button").nth(11)).toContainText("Tabla del 12");
  });

  test("una partida de la tabla del 12 recorre del 12 × 1 al 12 × 10", async ({ page }) => {
    await entrarATabla(page, 12);
    const vistas = new Set();
    for (let i = 0; i < 10; i++) {
      const { a, b } = await preguntaActual(page);
      expect(a).toBe(12);
      vistas.add(b);
      await responder(page, true);
      await siguiente(page);
    }
    expect([...vistas].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    await expect(page.locator("#victory-table-name")).toHaveText("La Tabla del 12");
  });

  test("con teclado, el 0 abre la tabla del 10", async ({ page }, testInfo) => {
    test.skip(!conTeclado(testInfo), "solo donde hay teclado");
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.keyboard.press("0");
    await expect(page.locator("#screen-game")).toBeVisible();
    expect((await preguntaActual(page)).a).toBe(10);
  });
});

test.describe("mapa de lo que ya se sabe", () => {
  const celda = (page, a, b) => page.locator(`[data-hecho="${a}x${b}"]`);

  test("sin jugar, todo está en gris y lo dice", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Mi mapa de tablas");
    await expect(page.locator("#screen-mapa [data-foco]")).toBeFocused();
    await expect(page.locator('[data-estado="nuevo"]')).toHaveCount(120);
    await expect(page.locator("#mapa-resumen")).toContainText("Juega una tabla");
  });

  test("un acierto es «practicando»; dos seguidos, «ya te la sabes»", async ({ page }) => {
    await entrarATabla(page, 2);
    for (let i = 0; i < 10; i++) { await responder(page, true); await siguiente(page); }
    await page.click("text=Sigue Cultivando");
    await page.click("text=Mi mapa de tablas");
    for (let b = 1; b <= 10; b++) await expect(celda(page, 2, b)).toHaveAttribute("data-estado", "practica");

    await page.click("#screen-mapa button:has-text('Menú')");
    await page.locator("#grid-tablas-container button").nth(1).click();
    for (let i = 0; i < 10; i++) { await responder(page, true); await siguiente(page); }
    await page.click("text=Sigue Cultivando");
    await page.click("text=Mi mapa de tablas");
    for (let b = 1; b <= 10; b++) await expect(celda(page, 2, b)).toHaveAttribute("data-estado", "dominado");
    await expect(page.locator("#mapa-resumen")).toHaveText("Ya te sabes 10 de 120 multiplicaciones.");
  });

  test("un fallo devuelve a «practicando» lo que ya se sabía", async ({ page }) => {
    await page.goto("./");
    const estados = await page.evaluate(() => {
      registrarIntento(7, 8, true); registrarIntento(7, 8, true);
      const antes = estadoHecho(7, 8);
      registrarIntento(7, 8, false);
      return [antes, estadoHecho(7, 8)];
    });
    expect(estados).toEqual(["dominado", "practica"]);
  });

  test("cada casilla dice su estado con símbolo y con texto, no solo con color", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.evaluate(() => { registrarIntento(3, 4, true); registrarIntento(3, 4, true); registrarIntento(6, 7, false); });
    await page.click("text=Mi mapa de tablas");
    await expect(celda(page, 3, 4)).toContainText("✓");
    await expect(celda(page, 3, 4)).toContainText("3 por 4: ya te la sabes");
    await expect(celda(page, 6, 7)).toContainText("•");
    await expect(celda(page, 6, 7)).toContainText("6 por 7: practicando");
  });

  test("se conserva al recargar y se borra al salir", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => { registrarIntento(5, 5, true); registrarIntento(5, 5, true); });
    await page.reload();
    expect(await page.evaluate(() => estadoHecho(5, 5))).toBe("dominado");
    await page.evaluate(() => resetGame());
    expect(await page.evaluate(() => [estadoHecho(5, 5), localStorage.getItem("jardin:hechos")])).toEqual(["nuevo", null]);
  });

  test("datos guardados dañados no rompen el juego", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("jardin:hechos", "{no es json"));
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Mi mapa de tablas");
    await expect(page.locator('[data-estado="nuevo"]')).toHaveCount(120);
  });

  test("tocar una tabla en el mapa empieza a practicarla", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Mi mapa de tablas");
    await page.locator("#mapa-tabla tbody th button").nth(10).click();
    await expect(page.locator("#screen-game")).toBeVisible();
    expect((await preguntaActual(page)).a).toBe(11);
  });

  test("las respuestas de la mezcla también cuentan en el mapa", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Desafío del Arcoíris");
    const { a, b } = await preguntaActual(page);
    await responder(page, true);
    expect(await page.evaluate(([x, y]) => estadoHecho(x, y), [a, b])).toBe("practica");
  });
});
