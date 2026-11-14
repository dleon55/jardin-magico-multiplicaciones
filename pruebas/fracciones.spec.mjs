// Fracciones de un número (4.º a 6.º): «¾ de 24» es dividir entre 4 y
// multiplicar por 3, con las tablas que ya se saben.
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida, instalarDobles } from "./ayudas.mjs";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00"));
});

const fraccion = (page, r) => page.evaluate((x) => {
  const p = armarFraccion(x);
  return { ...p, valores: p.opciones.map((o) => o.valor) };
}, r);

test("¾ de 24: respuesta, voz, explicación y las opciones falsas de los errores típicos", async ({ page }) => {
  await page.goto("./");
  const p = await fraccion(page, { m: 3, d: 4, k: 6 });
  expect(p.texto).toBe("¿Cuánto es 3/4 de 24?");
  expect(p.voz).toBe("¿Cuánto es tres cuartos de 24?");
  expect(p.respuesta).toBe(18);
  // Quedarse con una parte (6), calcular lo que sobra (¼ = 6, ya está) y dividir entre el de arriba (24 ÷ 3 = 8).
  expect(p.valores).toEqual(expect.arrayContaining([6, 8, 18]));
  expect(new Set(p.valores).size).toBe(4);
  expect(p.explicacion).toBe("3/4 de 24 = 18: un cuarto es 24 ÷ 4 = 6, y tres cuartos son 3 × 6 = 18.");
  expect(p.pista).toBe("Primero busca un cuarto: reparte 24 en 4 partes iguales. Luego toma 3 de esas partes.");
});

test("una fracción unitaria es repartir en partes iguales", async ({ page }) => {
  await page.goto("./");
  const p = await fraccion(page, { m: 1, d: 3, k: 7 });
  expect([p.texto, p.voz, p.respuesta]).toEqual(["¿Cuánto es 1/3 de 21?", "¿Cuánto es un tercio de 21?", 7]);
  expect(p.explicacion).toBe("1/3 de 21 = 7: es repartir 21 en 3 partes iguales, 21 ÷ 3 = 7.");
});

test("lo que sobra es una opción falsa: 2/5 de 30 ofrece 18 (los 3/5 restantes)", async ({ page }) => {
  await page.goto("./");
  const p = await fraccion(page, { m: 2, d: 5, k: 6 });
  expect(p.respuesta).toBe(12);
  expect(p.valores).toEqual(expect.arrayContaining([6, 18, 15]));   // una parte, lo que sobra, 30 ÷ 2
});

test("los nombres de las partes, en la voz", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => [nombreFraccion(1, 2), nombreFraccion(2, 3), nombreFraccion(5, 8), nombreFraccion(7, 9),
    textoParaVoz("3/4 de 24 = 18: un cuarto es 24 ÷ 4 = 6.")]);
  expect(r).toEqual(["un medio", "dos tercios", "cinco octavos", "siete novenos", "tres cuartos de 24 es 18: un cuarto es 24 entre 4 es 6."]);
});

test("una partida: 4 «de» (2 de una parte, 2 de varias), 3 equivalentes y 3 para comparar", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => {
    const b = bolsaDeFracciones();
    const de = b.filter((h) => h.reto.clase === "de");
    return { n: b.length, de: de.length, unitarias: de.filter((h) => h.reto.m === 1).length,
      propias: de.every((h) => h.reto.m < h.reto.d), maxD: Math.max(...de.map((h) => h.reto.d)),
      equivalentes: b.filter((h) => h.reto.clase === "equivalente").length,
      comparar: b.filter((h) => h.reto.clase === "comparar").map((h) => h.reto.variante).sort() };
  });
  expect(r).toEqual({ n: 10, de: 4, unitarias: 2, propias: true, maxD: expect.any(Number), equivalentes: 3,
    comparar: ["distintos", "mismoDen", "mismoNum"] });
  expect(r.maxD).toBeLessThanOrEqual(5);
});

test("doscientas al azar: 4 opciones distintas y positivas, con la respuesta bien calculada", async ({ page }) => {
  await page.goto("./");
  for (const k of ["2x3", "2x4", "3x4", "3x5", "4x5", "5x5"]) await ponerIntentos(page, k, [rapida("2026-11-02")]);
  const malos = await page.evaluate(() => {
    const f = [];
    for (let i = 0; i < 20; i++) for (const h of bolsaDeFracciones().filter((x) => x.reto.clase === "de")) {
      const p = armarFraccion(h.reto);
      const v = p.opciones.map((o) => o.valor);
      const { m, d, k } = h.reto;
      if (p.respuesta !== (d * k * m) / d || v.length !== 4 || new Set(v).size !== 4 || !v.includes(p.respuesta) || v.some((x) => x <= 0)) f.push(JSON.stringify(h.reto));
    }
    return f;
  });
  expect(malos).toEqual([]);
});

test("se juega desde el menú y no toca el jardín; un fallo vuelve igual", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=Fracciones");
  await expect(page.locator("#problema-texto")).toHaveText(/fracción|¿Cuánto es \d\/\d de \d+\?/);
  const antes = await page.evaluate(() => JSON.stringify(pregunta.reto));
  const mala = await page.evaluate(() => [...document.querySelectorAll(".btn-option")].find((b) => Number(b.dataset.valor) !== correctAnswer).id);
  await page.click(`#${mala}`);
  await expect(page.locator("#game-feedback")).toContainText(await page.evaluate(() => pregunta.explicacion));
  const vistos = [];
  for (let i = 0; i < 3; i++) {
    await page.locator("#btn-siguiente:not([disabled])").click();
    vistos.push(await page.evaluate(() => JSON.stringify(pregunta.reto)));
    if (i < 2) await page.click(`.btn-option[data-valor="${await page.evaluate(() => correctAnswer)}"]`);
  }
  expect(vistos).toContain(antes);
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);
});

test("la ayuda reparte el rectángulo en filas iguales y pinta de verde las que se toman", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 4, b: 6, reto: { clase: "de", m: 3, d: 4, k: 6 } }]; nextQuestion(); });
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .punto")).toHaveCount(24);
  await expect(page.locator("#help-visual-container .punto-tomado")).toHaveCount(18);
  await expect(page.locator("#help-explain")).toHaveText("24 puntos en 4 filas iguales: cada fila es un cuarto. Cuenta los puntos de las 3 filas verdes.");
  await expect(page.locator("#btn-girar")).toBeHidden();
  const dicho = await page.evaluate(() => window.__dicho.at(-1).texto);
  expect(dicho).toBe("Primero busca un cuarto: reparte 24 en 4 partes iguales. Luego toma 3 de esas partes.");
});

test("se escribe solo si la multiplicación de debajo ya floreció", async ({ page }) => {
  await page.goto("./");
  await ponerIntentos(page, "4x6", [rapida("2026-11-01"), rapida("2026-11-02")]);
  await page.click("#screen-welcome button");
  await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 3, b: 7, reto: { m: 2, d: 3, k: 7 } }, { a: 4, b: 6, reto: { m: 3, d: 4, k: 6 } }]; nextQuestion(); });
  await expect(page.locator("#escritura")).toBeVisible();   // 4 × 6 floreció
});

test("diez aciertos: la victoria dice cuántas se resolvieron y cómo se saca", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=Fracciones");
  for (let i = 0; i < 10; i++) {
    const c = await page.evaluate(() => correctAnswer);
    if (await page.locator("#escritura:not(.hidden)").count()) {
      for (const dg of String(c)) await page.click(`#escritura [data-digito="${dg}"]`);
      await page.click("#tecla-listo");
    } else await page.click(`.btn-option[data-valor="${c}"]`);
    await page.locator("#btn-siguiente:not([disabled])").click();
  }
  await expect(page.locator("#victory-table-name")).toHaveText("Las Fracciones del Jardín");
  await expect(page.locator("#victoria-aprendido")).toHaveText(
    "Resolviste 10 fracciones. Para sacar 3/4 de un número, se divide entre 4 y se multiplica por 3; y una fracción no cambia si multiplicas arriba y abajo por lo mismo.");
});

test.describe("equivalentes y comparar", () => {
  test("¿cuál es igual a 1/2?: la buena multiplica arriba y abajo; las falsas, los errores típicos", async ({ page }) => {
    await page.goto("./");
    const p = await page.evaluate(() => armarFraccion({ clase: "equivalente", a: 1, b: 2, k: 2 }));
    expect(p.texto).toBe("¿Cuál fracción es igual a 1/2?");
    expect(p.voz).toBe("¿Cuál fracción es igual a un medio?");
    const etiquetas = p.opciones.map((o) => o.etiqueta);
    expect(etiquetas).toContain("2/4");
    expect(etiquetas).toContain("3/4");   // sumar 2 arriba y abajo: el error más común
    expect(etiquetas).toContain("1/4");   // multiplicar solo el de abajo
    expect(p.opciones.find((o) => o.etiqueta === "2/4").valor).toBe(p.respuesta);
    expect(p.explicacion).toBe("2/4 = 1/2: arriba y abajo se multiplicaron por 2 (1 × 2 = 2 y 2 × 2 = 4). Sumar lo mismo arriba y abajo no da una igual.");
  });

  test("comparar con el mismo número de arriba: la de partes más grandes gana (1/3 > 1/5)", async ({ page }) => {
    await page.goto("./");
    const p = await page.evaluate(() => armarFraccion({ clase: "comparar", variante: "mismoNum", fracs: [[1, 5], [1, 3], [1, 8], [1, 4]] }));
    expect(p.texto).toBe("¿Cuál fracción es la más grande?");
    expect(p.opciones.find((o) => o.valor === p.respuesta).etiqueta).toBe("1/3");
    expect(p.explicacion).toBe("1/3 es la más grande: entre más partes se reparte, más chica es cada una. Por eso 1/8 es la más chica.");
    expect(p.voz).toBe("¿Cuál fracción es la más grande: un quinto, un tercio, un octavo o un cuarto?");
  });

  test("comparar con distinto número de abajo: se pasan a uno común", async ({ page }) => {
    await page.goto("./");
    const p = await page.evaluate(() => armarFraccion({ clase: "comparar", variante: "distintos", fracs: [[3, 4], [2, 3], [1, 2], [5, 6]] }));
    expect(p.opciones.find((o) => o.valor === p.respuesta).etiqueta).toBe("5/6");
    expect(p.explicacion).toBe("Con 12 abajo: 3/4 = 9/12, 2/3 = 8/12, 1/2 = 6/12, 5/6 = 10/12. La más grande es 5/6.");
    const mismo = await page.evaluate(() => armarFraccion({ clase: "comparar", variante: "mismoDen", fracs: [[3, 8], [5, 8], [1, 8], [7, 8]] }));
    expect(mismo.explicacion).toBe("Todas están partidas en octavos: 7/8 es la que toma más partes.");
  });

  test("trescientas al azar: 4 opciones distintas, propias, la buena es de verdad igual o la más grande", async ({ page }) => {
    await page.goto("./");
    const malos = await page.evaluate(() => {
      const f = [];
      const val = (c) => Math.floor(c / 100) / (c % 100);
      for (let i = 0; i < 100; i++) {
        const e = crearEquivalente();
        const p = armarFraccion(e);
        const v = p.opciones.map((o) => o.valor);
        const iguales = v.filter((c) => Math.abs(val(c) - e.a / e.b) < 1e-9);
        if (v.length !== 4 || new Set(v).size !== 4 || iguales.length !== 1 || iguales[0] !== p.respuesta || v.some((c) => val(c) >= 1)) f.push(JSON.stringify(e));
        for (const variante of ["mismoDen", "mismoNum", "distintos"]) {
          const c = crearComparacion(variante);
          const q = armarFraccion(c);
          const w = q.opciones.map((o) => o.valor);
          if (w.length !== 4 || new Set(w.map(val)).size !== 4 || val(q.respuesta) !== Math.max(...w.map(val))) f.push(JSON.stringify(c));
        }
      }
      return f;
    });
    expect(malos).toEqual([]);
  });

  test("la ayuda dibuja tiras del mismo largo con lo tomado en verde, y siempre se elige", async ({ page }) => {
    await page.goto("./");
    await page.evaluate(() => registrarIntento(2, 2, true));
    await page.click("#screen-welcome button");
    await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 2, b: 2, reto: { clase: "equivalente", a: 1, b: 2, k: 2 } }]; nextQuestion(); });
    await expect(page.locator("#opciones")).toBeVisible();
    await page.click("#btn-help");
    // La de la pregunta y una por opción, en el orden de los botones: no regala la respuesta.
    await expect(page.locator("#help-visual-container .tira")).toHaveCount(5);
    await expect(page.locator("#help-visual-container .tira").nth(0).locator(".parte-tomada")).toHaveCount(1);
    const nombres = await page.$$eval("#help-visual-container .tira span.w-12", (ss) => ss.map((x) => x.textContent));
    const botones = await page.$$eval(".btn-option", (bs) => bs.map((x) => x.dataset.etiqueta));
    expect(nombres).toEqual(["1/2", ...botones]);
    await expect(page.locator("#help-explain")).toHaveText("Todas las tiras miden lo mismo. ¿Cuál tiene tanto verde como 1/2?");
    const anchos = await page.$$eval("#help-visual-container .tira > div", (bs) => bs.map((b) => Math.round(b.getBoundingClientRect().width)));
    expect(new Set(anchos).size).toBe(1);
  });

  test("en comparar, el botón dice la fracción y un fallo explica con el denominador común", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 4, b: 4, reto: { clase: "comparar", variante: "distintos", fracs: [[3, 4], [2, 3], [1, 2], [5, 6]] } }]; nextQuestion(); });
    await page.click(`.btn-option[data-etiqueta="3/4"]`);
    await expect(page.locator(`.btn-option[data-etiqueta="3/4"]`)).toHaveAttribute("aria-label", "3/4, incorrecta");
    await expect(page.locator("#game-feedback")).toContainText("Con 12 abajo: 3/4 = 9/12");
  });
});
