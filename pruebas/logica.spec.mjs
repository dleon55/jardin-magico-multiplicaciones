// Retos de lógica: las mismas tablas, pidiendo pensar y no solo recordar.
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida, instalarDobles } from "./ayudas.mjs";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00"));
});

const reto = (page, r) => page.evaluate((x) => {
  const p = armarReto(x);
  return { ...p, valores: p.opciones.map((o) => o.valor), etiquetas: p.opciones.map((o) => o.etiqueta) };
}, r);

test("¿cuál da más?: cuatro multiplicaciones, la respuesta es la mayor", async ({ page }) => {
  await page.goto("./");
  const p = await reto(page, { clase: "mayor", pares: [[6, 7], [5, 8], [4, 9], [7, 5]] });
  expect(p.texto).toBe("¿Cuál da más?");
  expect(p.respuesta).toBe(42);
  expect(p.etiquetas.sort()).toEqual(["4 × 9", "5 × 8", "6 × 7", "7 × 5"]);
  expect(p.explicacion).toBe("6 × 7 = 42 es la que da más. Las otras: 5 × 8 = 40, 4 × 9 = 36 y 7 × 5 = 35.");
  expect(p.voz).toMatch(/^¿Cuál da más: .* o .*\?$/);
});

test("el número misterioso es el más pequeño que está en las dos tablas", async ({ page }) => {
  await page.goto("./");
  const p = await reto(page, { clase: "misterio", m: 4, n: 6 });
  expect(p.texto).toBe("Soy el número más pequeño que está en la tabla del 4 y también en la del 6. ¿Quién soy?");
  expect(p.respuesta).toBe(12);
  expect(p.valores).toContain(24);   // común, pero no el más pequeño
  expect(new Set(p.valores).size).toBe(4);
  expect(p.explicacion).toBe("Es 12: la tabla del 4 va 4, 8, 12, y la del 6, 6, 12. El 12 es el primero que está en las dos.");
});

test("¿qué número falta? en una serie de la tabla", async ({ page }) => {
  await page.goto("./");
  const p = await reto(page, { clase: "sigue", n: 7, k: 1, hueco: 3 });
  expect(p.texto).toBe("¿Qué número falta? 7, 14, 21, __");
  expect(p.respuesta).toBe(28);
  expect(p.valores).not.toContain(21);   // ninguna opción falsa está ya en la serie
  const medio = await reto(page, { clase: "sigue", n: 6, k: 2, hueco: 1 });
  expect([medio.texto, medio.respuesta]).toEqual(["¿Qué número falta? 12, __, 24, 30", 18]);
});

test("partir una multiplicación difícil en dos fáciles", async ({ page }) => {
  await page.goto("./");
  const p = await reto(page, { clase: "partir", a: 7, b: 8 });
  expect(p.texto).toBe("Completa: 7 × 8 = 7 × 5 + 7 × __");
  expect(p.respuesta).toBe(3);
  expect(p.explicacion).toBe("8 es 5 + 3, así que 7 × 8 = 7 × 5 + 7 × 3 = 35 + 21 = 56.");
});

test("el intruso no está en la tabla, y la explicación dice entre cuáles cae", async ({ page }) => {
  await page.goto("./");
  const p = await reto(page, { clase: "intruso", n: 4, dentro: [12, 20, 32], intruso: 26 });
  expect(p.texto).toBe("¿Cuál NO está en la tabla del 4?");
  expect(p.respuesta).toBe(26);
  expect(p.valores.sort((x, y) => x - y)).toEqual([12, 20, 26, 32]);
  expect(p.explicacion).toBe("26 no está: 4 × 6 = 24 y 4 × 7 = 28. Los demás sí: 12 = 4 × 3, 20 = 4 × 5 y 32 = 4 × 8.");
});

test("cien retos al azar: siempre 4 opciones distintas, la respuesta entre ellas y bien calculada", async ({ page }) => {
  await page.goto("./");
  const malos = await page.evaluate(() => {
    const fallos = [];
    for (let i = 0; i < 100; i++) {
      for (const clase of CLASES_RETO) {
        const r = crearReto(clase, 2, i % 2 ? 9 : 5);
        const p = armarReto(r);
        const v = p.opciones.map((o) => o.valor);
        const bien = v.length === 4 && new Set(v).size === 4 && v.includes(p.respuesta) && v.every((x) => Number.isInteger(x) && x > 0);
        let correcta = true;
        if (clase === "mayor") correcta = p.respuesta === Math.max(...r.pares.map(([x, y]) => x * y));
        if (clase === "misterio") correcta = p.respuesta % r.m === 0 && p.respuesta % r.n === 0 &&
          ![...Array(p.respuesta - 1).keys()].some((k) => k > 0 && k % r.m === 0 && k % r.n === 0);
        if (clase === "intruso") correcta = p.respuesta % r.n !== 0 && r.dentro.every((x) => x % r.n === 0);
        if (clase === "partir") correcta = r.a * 5 + r.a * p.respuesta === r.a * r.b;
        if (!bien || !correcta) fallos.push(JSON.stringify(r));
      }
    }
    return fallos;
  });
  expect(malos).toEqual([]);
});

test("una partida: diez retos, dos de cada clase, y con pocas tablas sabidas solo del 2 al 5", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => {
    currentTable = "logica";
    const b = bolsaDeRetos();
    const clases = b.map((h) => h.reto.clase).sort();
    const numeros = b.flatMap((h) => h.reto.clase === "intruso" || h.reto.clase === "sigue" ? [h.reto.n]
      : h.reto.clase === "partir" ? [h.reto.a] : h.reto.clase === "misterio" ? [h.reto.m] : h.reto.pares.map((p) => p[0]));
    return { n: b.length, clases, max: Math.max(...numeros) };
  });
  expect(r.n).toBe(10);
  expect(r.clases).toEqual(["intruso", "intruso", "mayor", "mayor", "misterio", "misterio", "partir", "partir", "sigue", "sigue"]);
  expect(r.max).toBeLessThanOrEqual(5);
});

test("se juega desde el menú: el reto se lee encima, siempre se elige, y no toca el jardín", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("text=Retos de lógica");
  await expect(page.locator("#screen-game")).toBeVisible();
  await expect(page.locator("#problema-texto")).toBeVisible();
  await expect(page.locator("#opciones")).toBeVisible();
  await expect(page.locator("#escritura")).toBeHidden();
  const correcta = await page.evaluate(() => correctAnswer);
  await page.click(`.btn-option[data-valor="${correcta}"]`);
  await expect(page.locator("#game-feedback")).toContainText(await page.evaluate(() => pregunta.explicacion));
  expect(await page.evaluate(() => [Object.keys(hechos).length, globalStars])).toEqual([0, 1]);
});

test("un reto fallado vuelve igual (con las opciones en otro orden)", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("text=Retos de lógica");
  const antes = await page.evaluate(() => JSON.stringify(pregunta.reto));
  const mala = await page.evaluate(() => [...document.querySelectorAll(".btn-option")].find((b) => Number(b.dataset.valor) !== correctAnswer).id);
  await page.click(`#${mala}`);
  await expect(page.locator("#game-feedback")).toContainText("Te la vuelvo a preguntar");
  const vistos = [];
  for (let i = 0; i < 3; i++) {
    await page.locator("#btn-siguiente:not([disabled])").click();
    vistos.push(await page.evaluate(() => JSON.stringify(pregunta.reto)));
    if (i < 2) await page.click(`.btn-option[data-valor="${await page.evaluate(() => correctAnswer)}"]`);
  }
  expect(vistos).toContain(antes);
});

test("en «¿cuál da más?» el botón dice la multiplicación, también al lector de pantalla", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => {
    startTable("logica");
    bolsa = [{ a: 6, b: 7, reto: { clase: "mayor", pares: [[6, 7], [5, 8], [4, 9], [7, 5]] } }];
    colaRepaso = [];
    nextQuestion();
  });
  await page.click('.btn-option[data-valor="42"]');
  await expect(page.locator('.btn-option[data-valor="42"]')).toHaveAttribute("aria-label", "6 × 7, correcta");
});

test("la ayuda da el camino, no la respuesta; el rectángulo, solo para partir", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  await page.click("#screen-welcome button");
  const abrir = async (r) => {
    await page.evaluate((x) => {
      startTable("logica"); colaRepaso = []; bolsa = [{ a: 1, b: 1, reto: x }];
      document.getElementById("help-panel").classList.add("hidden");
      nextQuestion();
    }, r);
    await page.click("#btn-help");
  };
  await abrir({ clase: "misterio", m: 4, n: 6 });
  await expect(page.locator("#help-truco")).toHaveText("Di la tabla del 6 (6, 12, 18…) y busca el primero que también esté en la del 4.");
  await expect(page.locator("#help-visual-container .punto")).toHaveCount(0);
  await expect(page.locator("#btn-girar")).toBeHidden();
  await abrir({ clase: "partir", a: 7, b: 8 });
  await expect(page.locator("#help-truco")).toContainText("Parte el 8 en 5");
  await expect(page.locator("#help-visual-container .punto")).toHaveCount(56);
  await expect(page.locator("#help-explain")).toHaveText("7 × 8: 7 filas de 8. A la izquierda del hueco hay 7 × 5; cuenta cuántas columnas quedan a la derecha.");
});

test("diez aciertos: la victoria dice cuántos retos se resolvieron y cuenta para la misión", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("text=Retos de lógica");
  for (let i = 0; i < 10; i++) {
    await page.click(`.btn-option[data-valor="${await page.evaluate(() => correctAnswer)}"]`);
    await page.locator("#btn-siguiente:not([disabled])").click();
  }
  await expect(page.locator("#screen-victory")).toBeVisible();
  await expect(page.locator("#victory-table-name")).toHaveText("Los Retos de Lógica");
  await expect(page.locator("#victoria-aprendido")).toHaveText(
    "Resolviste 10 retos de lógica. Pensar con las tablas, y no solo recordarlas, es saberlas de verdad.");
});

test("con 6 o más sabidas, los retos usan todas las tablas", async ({ page }) => {
  await page.goto("./");
  for (const k of ["2x3", "2x4", "3x4", "3x5", "4x5", "5x5"]) await ponerIntentos(page, k, [rapida("2026-11-02")]);
  const max = await page.evaluate(() => {
    let m = 0;
    for (let i = 0; i < 30; i++) for (const h of bolsaDeRetos()) if (h.reto.clase === "partir") m = Math.max(m, h.reto.a);
    return m;
  });
  expect(max).toBeGreaterThan(5);
});
