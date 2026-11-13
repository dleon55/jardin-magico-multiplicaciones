// Lo que ENSEÑA el juego más allá de preguntar: la ayuda como rectángulo, los
// trucos por tabla, las tablas del 1 al 9 y el mapa de lo que ya se sabe.
import { test, expect } from "@playwright/test";
import {
  entrarATabla, preguntaActual, responder, siguiente, instalarDobles, seEscribe,
  ponerIntentos, rapida, lenta, elegida, conAyuda, fallo, pareja, pasarDescubrir,
} from "./ayudas.mjs";

const conTeclado = (testInfo) => testInfo.project.name === "escritorio";

test.describe("ayuda: el rectángulo de filas × columnas", () => {
  test("dibuja exactamente a × b puntos en a filas, del 1 × 1 al 9 × 10", async ({ page }) => {
    await page.goto("./");
    const malos = await page.evaluate(() => {
      const errores = [];
      for (let a = 1; a <= 9; a++) {
        for (let b = 1; b <= 10; b++) {
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
  test("todo hecho del 1 × 1 al 9 × 10 tiene un truco, y el truco no da la respuesta", async ({ page }) => {
    await page.goto("./");
    const malos = await page.evaluate(() => {
      const errores = [];
      for (let a = 1; a <= 9; a++) {
        for (let b = 1; b <= 10; b++) {
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

test.describe("tablas del 1 al 9", () => {
  test("el menú ofrece nueve tablas, del 1 al 9", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(page.locator("#grid-tablas-container button")).toHaveCount(9);
    await expect(page.locator("#grid-tablas-container button").nth(8)).toContainText("Tabla del 9");
    await expect(page.locator("#grid-tablas-container")).not.toContainText("Tabla del 10");
  });

  test("una partida de la tabla del 9 recorre del 9 × 1 al 9 × 10", async ({ page }) => {
    await entrarATabla(page, 9);
    const vistas = new Set();
    for (let i = 0; i < 10; i++) {
      const { a, b } = await preguntaActual(page);
      expect(a).toBe(9);
      vistas.add(b);
      await responder(page, true);
      await siguiente(page);
    }
    expect([...vistas].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    await expect(page.locator("#victory-table-name")).toHaveText("La Tabla del 9");
  });

  test("con teclado, del 1 al 9 abren su tabla y el 0 ya no abre nada", async ({ page }, testInfo) => {
    test.skip(!conTeclado(testInfo), "solo donde hay teclado");
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.keyboard.press("0");
    await expect(page.locator("#screen-selector")).toBeVisible();
    await page.keyboard.press("9");
    await expect(page.locator("#descubrir-tabla")).toHaveText("9");   // la primera vez, se descubre
    await pasarDescubrir(page);
    expect((await preguntaActual(page)).a).toBe(9);
  });
});

test.describe("mapa de lo que ya se sabe", () => {
  const celda = (page, a, b) => page.locator(`[data-hecho="${a}x${b}"]`);
  const estado = (page, a, b) => page.evaluate(([x, y]) => estadoHecho(x, y), [a, b]);

  test("sin jugar, las 90 están en gris y lo dice", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Mi mapa de tablas");
    await expect(page.locator("#screen-mapa [data-foco]")).toBeFocused();
    await expect(page.locator('[data-estado="nuevo"]')).toHaveCount(90);
    await expect(page.locator("#mapa-tabla tbody tr")).toHaveCount(9);
    await expect(page.locator("#mapa-resumen")).toContainText("Juega una tabla");
  });

  test("la primera partida se elige y deja «practicando»; la segunda se escribe y deja «casi»", async ({ page }) => {
    await entrarATabla(page, 2);
    for (let i = 0; i < 10; i++) {
      expect(await seEscribe(page), "lo nuevo se elige").toBe(false);
      await responder(page, true); await siguiente(page);
    }
    await page.click("text=Sigue Cultivando");
    await page.click("text=Mi mapa de tablas");
    for (let b = 1; b <= 10; b++) await expect(celda(page, 2, b)).toHaveAttribute("data-estado", "practica");

    await page.click("#screen-mapa button:has-text('Menú')");
    await page.locator("#grid-tablas-container button").nth(1).click();
    for (let i = 0; i < 10; i++) {
      expect(await seEscribe(page), "lo que ya salió bien se escribe").toBe(true);
      await responder(page, true); await siguiente(page);
    }
    await page.click("text=Sigue Cultivando");
    await page.click("text=Mi mapa de tablas");
    // Escritas rápido, pero el mismo día: florecer exige otro día.
    for (let b = 1; b <= 10; b++) await expect(celda(page, 2, b)).toHaveAttribute("data-estado", "casi");
    // Se cuentan plantas: 2 × 1 y 1 × 2 son una sola. 54 en total.
    await expect(page.locator("#mapa-resumen")).toHaveText("Florecidas: 0 de 54. Casi: 10. Practicando: 0.");
  });

  test("florece al escribirla rápido en dos días distintos, y solo así", async ({ page }) => {
    await page.goto("./");
    const casos = {
      "dos días, rápida y escrita": [[rapida("2026-11-01"), rapida("2026-11-02")], "florecida"],
      "el mismo día, dos veces": [[rapida("2026-11-02"), rapida("2026-11-02")], "casi"],
      "una sola vez rápida": [[rapida("2026-11-02")], "casi"],
      "eligiendo, aunque sea rápido": [[elegida("2026-11-01"), elegida("2026-11-02")], "casi"],
      "escrita pero lenta": [[lenta("2026-11-01"), lenta("2026-11-02")], "casi"],
      "con la ayuda abierta": [[conAyuda("2026-11-01"), conAyuda("2026-11-02")], "casi"],
      "una sola elegida": [[elegida("2026-11-02")], "practica"],
      "falló la última": [[rapida("2026-11-01"), rapida("2026-11-02"), fallo("2026-11-03")], "practica"],
      "un acierto lento no quita lo florecido": [[rapida("2026-11-01"), rapida("2026-11-02"), lenta("2026-11-03")], "florecida"],
      "tras un fallo, la cuenta empieza de nuevo": [[rapida("2026-11-01"), fallo("2026-11-02"), rapida("2026-11-03")], "casi"],
    };
    for (const [caso, [intentos, esperado]] of Object.entries(casos)) {
      await ponerIntentos(page, "7x8", intentos);
      expect(await estado(page, 7, 8), caso).toBe(esperado);
    }
  });

  test("cada casilla dice su estado con símbolo y con texto, no solo con color", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await ponerIntentos(page, "3x4", [rapida("2026-11-01"), rapida("2026-11-02")]);
    await ponerIntentos(page, "5x6", [rapida("2026-11-02")]);
    await page.evaluate(() => registrarIntento(6, 7, false));
    await page.click("text=Mi mapa de tablas");
    await expect(celda(page, 3, 4)).toContainText("🌸");
    await expect(celda(page, 3, 4)).toContainText("3 por 4: florecida, ya te la sabes");
    await expect(celda(page, 5, 6)).toContainText("🌷");
    await expect(celda(page, 5, 6)).toContainText("5 por 6: casi");
    await expect(celda(page, 6, 7)).toContainText("🌱");
    await expect(celda(page, 6, 7)).toContainText("6 por 7: practicando");
    await expect(page.locator("#mapa-resumen")).toHaveText("Florecidas: 1 de 54. Casi: 1. Practicando: 1.");
  });

  test("se conserva al recargar y se borra al borrar el jardín", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => { registrarIntento(5, 5, true); registrarIntento(5, 5, true); });
    await page.reload();
    expect(await estado(page, 5, 5)).toBe("casi");
    await page.evaluate(() => borrarPerfil(perfilActual));
    expect(await page.evaluate(() => [estadoHecho(5, 5), localStorage.getItem("jardin:p1:intentos")])).toEqual(["nuevo", null]);
  });

  test("lo guardado por la versión anterior se conserva: lo sabido queda en «casi»", async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("sembrado")) {
        localStorage.setItem("jardin:hechos", JSON.stringify({ "3x4": "011", "6x7": "110", "12x5": "11", "10x3": "1" }));
        sessionStorage.setItem("sembrado", "1");
      }
    });
    await page.goto("./");
    expect(await estado(page, 3, 4)).toBe("casi");          // antes «ya te la sabes»: falta escribirla
    expect(await estado(page, 6, 7)).toBe("practica");      // la última fue un fallo
    // Las tablas del 10, 11 y 12 ya no existen; la clave antigua se retira.
    expect(await page.evaluate(() => [Object.keys(hechos).sort(), localStorage.getItem("jardin:hechos")]))
      .toEqual([["3x4", "6x7"], null]);
    await page.reload();
    expect(await estado(page, 3, 4)).toBe("casi");
  });

  test("datos guardados dañados no rompen el juego", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("jardin:intentos", "{no es json");
      localStorage.setItem("jardin:hechos", "{tampoco");
    });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Mi mapa de tablas");
    await expect(page.locator('[data-estado="nuevo"]')).toHaveCount(90);
  });

  test("tocar una tabla en el mapa empieza a practicarla", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Mi mapa de tablas");
    await page.locator("#mapa-tabla tbody th button").nth(8).click();
    await expect(page.locator("#screen-game")).toBeVisible();
    expect((await preguntaActual(page)).a).toBe(9);
  });

  test("las respuestas de la mezcla también cuentan en el mapa", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Desafío del Arcoíris");
    const { a, b } = await preguntaActual(page);
    await responder(page, true);
    expect(await estado(page, a, b)).toBe("practica");
  });
});

test.describe("practicar lo que falta", () => {
  const botonFalta = (page) => page.locator("#screen-selector .btn-falta");

  test("sin nada pendiente, el botón no aparece", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(botonFalta(page)).toBeHidden();
  });

  test("cuenta lo que se practica y lo que está casi, no lo florecido; también en el mapa", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => { registrarIntento(7, 8, false); registrarIntento(6, 9, true); registrarIntento(3, 4, true); registrarIntento(3, 4, true); });
    await ponerIntentos(page, "2x5", [rapida("2026-11-01"), rapida("2026-11-02")]);   // florecida
    await page.click("#screen-welcome button");
    await expect(botonFalta(page)).toBeVisible();
    await expect(botonFalta(page)).toContainText("Practicar lo que me falta (3)");
    await page.click("text=Mi mapa de tablas");
    await expect(page.locator("#screen-mapa .btn-falta")).toContainText("(3)");
  });

  test("lo que florece deja de contar como pendiente", async ({ page }) => {
    await page.goto("./");
    const antes = await page.evaluate(() => {
      registrarIntento(7, 8, false); registrarIntento(6, 9, false);
      return hechosQueFaltan().length;
    });
    await ponerIntentos(page, "7x8", [fallo("2026-10-31"), rapida("2026-11-01"), rapida("2026-11-02")]);
    const despues = await page.evaluate(() => hechosQueFaltan().map((h) => `${h.a}x${h.b}`));
    expect([antes, despues]).toEqual([2, ["6x9"]]);
  });

  test("después de lo fallado va lo que se practica, luego lo «casi» de otro día y al final lo de hoy", async ({ page }) => {
    await page.goto("./");
    const hoy = await page.evaluate(() => hoy());
    await ponerIntentos(page, "2x3", [rapida(hoy)]);              // casi, hoy
    await ponerIntentos(page, "4x5", [rapida("2020-01-01")]);     // casi, de otro día: hoy puede florecer
    await ponerIntentos(page, "6x7", [elegida(hoy)]);             // practicando
    await ponerIntentos(page, "8x9", [elegida(hoy), fallo(hoy)]); // falló la última
    const orden = await page.evaluate(() => hechosQueFaltan().map((h) => `${h.a}x${h.b}`));
    expect(orden).toEqual(["8x9", "6x7", "4x5", "2x3"]);
  });

  test("pregunta primero lo que se falló la última vez", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => {
      registrarIntento(6, 9, true);                                   // un acierto
      registrarIntento(4, 7, true); registrarIntento(4, 7, false);   // falló la última
      registrarIntento(8, 3, false);                                  // falló la última
    });
    await page.click("#screen-welcome button");
    await botonFalta(page).click();
    const primeras = [];
    for (let i = 0; i < 3; i++) {
      const { a, b } = await preguntaActual(page);
      primeras.push(pareja(a, b));   // sale en cualquiera de sus dos órdenes
      await responder(page, true);
      await siguiente(page);
    }
    expect(primeras.slice(0, 2).sort()).toEqual(["3x8", "4x7"]);
    expect(primeras[2]).toBe("6x9");
  });

  test("con un solo pendiente: sale primero, nunca dos iguales seguidas, y no se rompe al quedar todo sabido", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => { registrarIntento(7, 8, true); registrarIntento(7, 8, false); });
    await page.click("#screen-welcome button");
    await botonFalta(page).click();
    const vistas = [];
    for (let i = 0; i < 10; i++) {
      const { a, b } = await preguntaActual(page);
      vistas.push(pareja(a, b));
      await responder(page, true);
      await siguiente(page);
    }
    for (let i = 1; i < vistas.length; i++) expect(vistas[i], `pregunta ${i + 1}`).not.toBe(vistas[i - 1]);
    // Antes de este caso, cuando todo lo pendiente pasaba a sabido a mitad de
    // partida, la bolsa quedaba vacía y el juego se rompía en la pregunta 9.
    expect(vistas[0]).toBe("7x8");
    expect(vistas.every((h) => h.split("x").includes("7")), "el relleno es de la misma tabla").toBe(true);
    await expect(page.locator("#victory-table-name")).toHaveText("Lo que te faltaba");
  });
});

test.describe("la victoria dice lo aprendido", () => {
  async function partidaLimpia(page, tabla) {
    await page.locator("#grid-tablas-container button").nth(tabla - 1).click();
    await pasarDescubrir(page);
    for (let i = 0; i < 10; i++) { await responder(page, true); await siguiente(page); }
    await expect(page.locator("#screen-victory")).toBeVisible();
  }

  test("la primera vez, lo que va en camino; la segunda, lo nuevo que ya se sabe", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await partidaLimpia(page, 2);
    await expect(page.locator("#victoria-aprendido")).toHaveText(
      "Llevas 10 multiplicaciones en camino. Sigue practicando y florecerán.");
    await page.click("text=Sigue Cultivando");
    await partidaLimpia(page, 2);
    // Escritas el mismo día: casi. Que florezcan es cosa de otro día.
    await expect(page.locator("#victoria-aprendido")).toHaveText(
      "10 multiplicaciones están casi. Otro día, escríbelas rápido y florecerán.");
  });

  test("lo que florece en la partida se nombra, y la voz lo dice con palabras", async ({ page }) => {
    await instalarDobles(page, [{ lang: "es-MX" }]);
    await page.goto("./");
    // 7 × 8 y 7 × 9 se escribieron rápido otro día: escribirlas hoy las hace florecer.
    await ponerIntentos(page, "7x8", [rapida("2020-01-01")]);
    await ponerIntentos(page, "7x9", [rapida("2020-01-01")]);
    await page.click("#screen-welcome button");
    await page.click("#screen-selector .btn-falta");
    for (let i = 0; i < 10; i++) { await responder(page, true); await siguiente(page); }
    await expect(page.locator("#victoria-aprendido")).toHaveText(/^¡Florecieron 7 × [89] y 7 × [89]! Ya te las sabes de memoria\.$/);
    const dicho = (await page.evaluate(() => window.__dicho)).at(-1).texto;
    expect(dicho).toMatch(/Has repasado lo que te faltaba\. ¡Florecieron 7 por [89] y 7 por [89]!/);
  });

  test("desde la victoria se llega al mapa", async ({ page }) => {
    await entrarATabla(page, 3);
    for (let i = 0; i < 10; i++) { await responder(page, true); await siguiente(page); }
    await page.click("text=Ver mi mapa de tablas");
    await expect(page.locator("#screen-mapa")).toBeVisible();
  });
});
