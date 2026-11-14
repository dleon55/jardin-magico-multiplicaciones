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

test("una partida: 3 «de», 2 equivalentes, 1 para comparar, 2 de sumar o restar con el mismo denominador y 2 con distinto", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => {
    const b = bolsaDeFracciones();
    const de = b.filter((h) => h.reto.clase === "de");
    return { n: b.length, de: de.length, unitarias: de.filter((h) => h.reto.m === 1).length,
      propias: de.every((h) => h.reto.m < h.reto.d), maxD: Math.max(...de.map((h) => h.reto.d)),
      equivalentes: b.filter((h) => h.reto.clase === "equivalente").length,
      comparar: b.filter((h) => h.reto.clase === "comparar").map((h) => h.reto.variante),
      ops: b.filter((h) => h.reto.clase === "sumar").map((h) => h.reto.op).sort(),
      distintas: b.filter((h) => h.reto.clase === "sumarDistinto").map((h) => (h.reto.b % h.reto.d === 0 || h.reto.d % h.reto.b === 0)).sort() };
  });
  expect(r).toEqual({ n: 10, de: 3, unitarias: 1, propias: true, maxD: expect.any(Number), equivalentes: 2,
    comparar: [expect.any(String)], ops: ["+", "−"], distintas: [false, true] });
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
  await page.click('#clases-fracciones button[data-clase="mezcla"]');
  await expect(page.locator("#problema-texto")).toHaveText(/fracción|¿Cuánto es \d+\/\d+ (de \d+|[+−] \d+\/\d+)\?/);   // cualquiera de las clases
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
  await page.click('#clases-fracciones button[data-clase="mezcla"]');
  for (let i = 0; i < 10; i++) {
    const c = await page.evaluate(() => correctAnswer);
    if (await page.locator("#escritura:not(.hidden)").count()) {
      for (const dg of String(c)) await page.click(`#escritura [data-digito="${dg}"]`);
      await page.click("#tecla-listo");
    } else await page.click(`.btn-option[data-valor="${c}"]`);
    await page.locator("#btn-siguiente:not([disabled])").click();
  }
  await expect(page.locator("#victory-table-name")).toHaveText("Las Fracciones del Jardín");
  // La idea que se lleva depende de la última pregunta.
  await expect(page.locator("#victoria-aprendido")).toHaveText(/^Resolviste 10 fracciones\. (Con el mismo número de abajo|Con distinto número de abajo|Una fracción no cambia|Para comparar|Para sacar 3\/4)/);
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

test.describe("sumar y restar con el mismo denominador", () => {
  test("2/7 + 3/7: se suman las de arriba; la opción falsa clásica suma también las de abajo", async ({ page }) => {
    await page.goto("./");
    const p = await page.evaluate(() => armarFraccion({ clase: "sumar", op: "+", a: 2, b: 3, d: 7 }));
    expect(p.texto).toBe("¿Cuánto es 2/7 + 3/7?");
    expect(p.voz).toBe("¿Cuánto es dos séptimos más tres séptimos?");
    const et = p.opciones.map((o) => o.etiqueta);
    expect(et).toEqual(expect.arrayContaining(["5/7", "5/14"]));
    expect(p.opciones.find((o) => o.etiqueta === "5/7").valor).toBe(p.respuesta);
    expect(p.explicacion).toBe("2/7 + 3/7 = 5/7: son séptimos las dos, así que se suman las partes (2 + 3 = 5) y siguen siendo séptimos. Los de abajo no se suman.");
  });

  test("5/8 − 2/8: se restan las de arriba; sumar en lugar de restar es una opción falsa", async ({ page }) => {
    await page.goto("./");
    const p = await page.evaluate(() => armarFraccion({ clase: "sumar", op: "−", a: 5, b: 2, d: 8 }));
    expect(p.texto).toBe("¿Cuánto es 5/8 − 2/8?");
    expect(p.voz).toBe("¿Cuánto es cinco octavos menos dos octavos?");
    expect(p.opciones.map((o) => o.etiqueta)).toEqual(expect.arrayContaining(["3/8", "7/8"]));
    expect(p.explicacion).toBe("5/8 − 2/8 = 3/8: se quitan partes (5 − 2 = 3) y siguen siendo octavos. Los de abajo no se restan.");
  });

  test("trescientas al azar: resultado propio, 4 opciones distintas y una sola con el valor correcto", async ({ page }) => {
    await page.goto("./");
    const malos = await page.evaluate(() => {
      const f = [];
      const val = (c) => Math.floor(c / 100) / (c % 100);
      for (let i = 0; i < 150; i++) for (const op of ["+", "−"]) {
        const r = crearSuma(op);
        const p = armarFraccion(r);
        const v = p.opciones.map((o) => o.valor);
        const bien = op === "+" ? (r.a + r.b) / r.d : (r.a - r.b) / r.d;
        const iguales = v.filter((c) => Math.abs(val(c) - bien) < 1e-9);
        if (bien <= 0 || bien >= 1 || v.length !== 4 || new Set(v).size !== 4 || iguales.length !== 1 || iguales[0] !== p.respuesta) f.push(JSON.stringify(r));
      }
      return f;
    });
    expect(malos).toEqual([]);
  });

  test("la ayuda: al sumar, dos tiras para juntar lo verde; al restar, una para quitar partes", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    const abrir = async (r) => {
      await page.evaluate((x) => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 2, b: 2, reto: x }]; document.getElementById("help-panel").classList.add("hidden"); nextQuestion(); }, r);
      await page.click("#btn-help");
    };
    await abrir({ clase: "sumar", op: "+", a: 2, b: 3, d: 7 });
    await expect(page.locator("#help-visual-container .tira")).toHaveCount(2);
    await expect(page.locator("#help-visual-container .parte-tomada")).toHaveCount(5);
    await expect(page.locator("#help-explain")).toHaveText("Las dos tiras están partidas igual. Junta lo verde de las dos: ¿cuántas partes son?");
    await expect(page.locator("#help-truco")).toContainText("El número de abajo dice el tamaño de las partes y no cambia.");
    await abrir({ clase: "sumar", op: "−", a: 5, b: 2, d: 8 });
    await expect(page.locator("#help-visual-container .tira")).toHaveCount(1);
    await expect(page.locator("#help-explain")).toHaveText("Quita 2 de las partes verdes: ¿cuántas quedan?");
    await expect(page.locator("#opciones")).toBeVisible();
  });

  test("al ganar con una suma al final, la idea es la de sumar", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.evaluate(() => {
      startTable("fracciones");
      pregunta = armarFraccion({ clase: "sumar", op: "+", a: 1, b: 2, d: 5 });
      aciertosPorOp.F = 10;
      endGameSuccess();
    });
    await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 fracciones. Con el mismo número de abajo, se suman o se restan solo los de arriba.");
  });
});

test.describe("sumar con distinto denominador", () => {
  test("1/2 + 1/4: se pasa a cuartos; las falsas suman arriba y abajo (2/6) o dejan el de abajo mayor (2/4)", async ({ page }) => {
    await page.goto("./");
    const p = await page.evaluate(() => armarFraccion({ clase: "sumarDistinto", a: 1, b: 2, c: 1, d: 4 }));
    expect(p.texto).toBe("¿Cuánto es 1/2 + 1/4?");
    expect(p.voz).toBe("¿Cuánto es un medio más un cuarto?");
    expect(p.opciones.map((o) => o.etiqueta)).toEqual(expect.arrayContaining(["3/4", "2/6", "2/4"]));
    expect(p.opciones.find((o) => o.etiqueta === "3/4").valor).toBe(p.respuesta);
    expect(p.explicacion).toBe("1/2 + 1/4 = 3/4: con 4 abajo, 1/2 = 2/4 y 1/4 ya está en 4; 2 + 1 = 3. Sumar arriba y abajo (2/6) no sirve: las partes no son del mismo tamaño.");
  });

  test("1/2 + 1/3: ninguno es múltiplo del otro, el común es 6", async ({ page }) => {
    await page.goto("./");
    const p = await page.evaluate(() => armarFraccion({ clase: "sumarDistinto", a: 1, b: 2, c: 1, d: 3 }));
    expect(p.opciones.find((o) => o.valor === p.respuesta).etiqueta).toBe("5/6");
    expect(p.explicacion).toBe("1/2 + 1/3 = 5/6: con 6 abajo, 1/2 = 3/6 y 1/3 = 2/6; 3 + 2 = 5. Sumar arriba y abajo (2/5) no sirve: las partes no son del mismo tamaño.");
  });

  test("trescientas al azar: denominadores distintos, común hasta 12, suma propia y una sola opción con su valor", async ({ page }) => {
    await page.goto("./");
    const malos = await page.evaluate(() => {
      const f = [];
      const val = (c) => Math.floor(c / 100) / (c % 100);
      for (let i = 0; i < 150; i++) for (const multiplo of [true, false]) {
        const r = crearSumaDistinta(multiplo);
        const p = armarFraccion(r);
        const v = p.opciones.map((o) => o.valor);
        const bien = r.a / r.b + r.c / r.d;
        const L = (r.b * r.d) / mcd(r.b, r.d);
        const esMultiplo = r.b % r.d === 0 || r.d % r.b === 0;
        const iguales = v.filter((c) => Math.abs(val(c) - bien) < 1e-9);
        if (r.b === r.d || L > 12 || esMultiplo !== multiplo || bien >= 1 || v.length !== 4 || new Set(v.map(val)).size !== 4 ||
          iguales.length !== 1 || iguales[0] !== p.respuesta || p.respuesta % 100 !== L) f.push(JSON.stringify(r));
      }
      return f;
    });
    expect(malos).toEqual([]);
  });

  test("la ayuda: las dos tiras y una vacía partida en el común, para contar", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 2, b: 4, reto: { clase: "sumarDistinto", a: 1, b: 2, c: 1, d: 4 } }]; nextQuestion(); });
    await page.click("#btn-help");
    await expect(page.locator("#help-visual-container .tira")).toHaveCount(3);
    await expect(page.locator("#help-visual-container .tira").nth(2)).toContainText("?/4");
    await expect(page.locator("#help-visual-container .tira").nth(2).locator(".parte-tomada")).toHaveCount(0);
    await expect(page.locator("#help-explain")).toHaveText("Las partes de las dos primeras tiras son de distinto tamaño. La de abajo está partida en 4: ¿cuántas de esas partes cubre lo verde de las dos juntas?");
    await expect(page.locator("#help-truco")).toHaveText("Las partes son de distinto tamaño: primero pásalas al mismo número de abajo, 4, multiplicando arriba y abajo. Después suma las de arriba.");
  });
});

test.describe("partidas por clase", () => {
  test("«Fracciones» abre la elección: todo mezclado y cinco clases; Esc vuelve al menú", async ({ page }, testInfo) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("#screen-selector >> text=Fracciones");
    await expect(page.locator("#screen-fracciones")).toBeVisible();
    await expect(page.locator("#screen-fracciones [data-foco]")).toBeFocused();
    await expect(page.locator("#clases-fracciones button")).toHaveCount(6);
    if (testInfo.project.name === "escritorio") {
      await page.keyboard.press("Escape");
      await expect(page.locator("#screen-selector")).toBeVisible();
    }
  });

  for (const [clase, boton] of [["de", "De un número"], ["equivalente", "Equivalentes"], ["comparar", "Comparar"],
    ["sumar", "Sumar y restar"], ["sumarDistinto", "Sumar con distinto número de abajo"]]) {
    test(`«${boton}»: las diez preguntas son de esa clase`, async ({ page }) => {
      await page.goto("./");
      await page.click("#screen-welcome button");
      await page.click("#screen-selector >> text=Fracciones");
      await page.click(`#clases-fracciones button[data-clase="${clase}"]`);
      await expect(page.locator("#screen-game")).toBeVisible();
      const r = await page.evaluate(() => {
        const todas = [pregunta.reto, ...bolsa.map((h) => h.reto)];
        return { clases: [...new Set(todas.map((x) => x.clase || "de"))], n: todas.length };
      });
      expect(r).toEqual({ clases: [clase], n: 10 });
    });
  }

  test("cada clase sola trae su mezcla interna: unitarias y no, las tres comparaciones, sumas y restas, múltiplos y no", async ({ page }) => {
    await page.goto("./");
    const r = await page.evaluate(() => {
      const de = bolsaDeUnaClase("de", 9);
      const comp = bolsaDeUnaClase("comparar", 9);
      const sum = bolsaDeUnaClase("sumar", 9);
      const dist = bolsaDeUnaClase("sumarDistinto", 9);
      return {
        unitarias: de.filter((x) => x.m === 1).length,
        variantes: [...new Set(comp.map((x) => x.variante))].sort(),
        ops: sum.map((x) => x.op).filter((o) => o === "+").length,
        multiplos: dist.filter((x) => x.b % x.d === 0 || x.d % x.b === 0).length,
      };
    });
    expect(r).toEqual({ unitarias: 4, variantes: ["distintos", "mismoDen", "mismoNum"], ops: 5, multiplos: 5 });
  });

  test("al ganar una clase sola, la victoria dice cuál fue", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("#screen-selector >> text=Fracciones");
    await page.click('#clases-fracciones button[data-clase="equivalente"]');
    await page.evaluate(() => { aciertosPorOp.F = 10; endGameSuccess(); });
    await expect(page.locator("#victory-table-name")).toHaveText("Fracciones: Equivalentes");
    await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 fracciones. Una fracción no cambia si multiplicas arriba y abajo por lo mismo.");
  });
});
