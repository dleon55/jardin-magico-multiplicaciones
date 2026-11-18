// Fracciones decimales (issue #102): 3/10 = 0.3, 25/100 = 0.25, comparar
// decimales con fracciones y sumar décimos llevando al entero. Errores
// típicos como opciones falsas (cada uno explicado), ayuda con tiras y 100
// cuadritos, y registro en la vista para adultos y el informe.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Abre la partida y pone en pantalla el reto dado. */
async function pregunta(page, reto) {
  if (await page.locator("#btn-decimales").isVisible()) await page.click("#btn-decimales");
  else await page.evaluate(() => startTable("decimales"));
  await page.evaluate((reto) => {
    cancelarEspera();
    colaRepaso = [];
    bolsa = [{ a: numerosDeDecimales(reto)[0], b: 1, reto }];
    nextQuestion();
  }, reto);
}

const etiquetas = (page) => page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.dataset.etiqueta).sort());
const elegir = async (page, etiqueta) => {
  await page.locator(`#opciones .btn-option[data-etiqueta="${etiqueta}"]`).click();
  return page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; });
};

test("el menú abre la partida: diez retos distintos de las cuatro clases", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-decimales");
  await expect(page.locator("#screen-game")).toBeVisible();
  const clases = await page.evaluate(() => Array.from({ length: 40 }, () => bolsaDeDecimales()).map((b) => {
    const cuenta = {};
    for (const h of b) cuenta[h.reto.clase] = (cuenta[h.reto.clase] || 0) + 1;
    return [cuenta, new Set(b.map((h) => JSON.stringify(h.reto))).size];
  }));
  for (const [cuenta, distintos] of clases) {
    expect(cuenta).toEqual({ aDecimal: 3, aFraccion: 3, comparar: 2, sumar: 2 });
    expect(distintos).toBe(10);
  }
});

test("con pocas tablas sabidas, solo décimos; con muchas, también centésimos", async ({ page }) => {
  await alMenu(page);
  const abajos = () => page.evaluate(() => Array.from({ length: 30 }, () => bolsaDeDecimales()).flat().filter((h) => h.reto.abajo).map((h) => h.reto.abajo));
  expect(new Set(await abajos())).toEqual(new Set([10]));
  await page.evaluate(() => {
    for (let a = 2; a <= 9; a++) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
  });
  expect(new Set(await abajos())).toEqual(new Set([10, 100]));
});

test("escribe los decimales sin ceros de más", async ({ page }) => {
  await alMenu(page);
  expect(await page.evaluate(() => [300, 250, 25, 1100, 2000, 70, 1].map(escribirDecimal)))
    .toEqual(["0.3", "0.25", "0.025", "1.1", "2", "0.07", "0.001"]);
});

test("3/10: la pregunta, la voz y las falsas de siempre (0.03, 3 y 0.003)", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await pregunta(page, { clase: "aDecimal", arriba: 3, abajo: 10 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Cómo se escribe 3/10 con punto decimal?");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("¿Cómo se escribe 3 décimos con punto decimal?");
  expect(await etiquetas(page)).toEqual(["0.003", "0.03", "0.3", "3"]);
  await expect(page.locator("#escritura")).toBeHidden();   // siempre se elige
  // Aunque la planta que lo representa (3 × 1) ya esté florecida: un decimal no se escribe.
  await page.evaluate(() => { hechos[claveHecho(3, 1)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }]; });
  await pregunta(page, { clase: "aDecimal", arriba: 3, abajo: 10 });
  await expect(page.locator("#escritura")).toBeHidden();
  await expect(page.locator("#opciones")).toBeVisible();
  expect(await elegir(page, "0.03")).toContain("0.03 son 3 centésimos. 3/10 son 3 décimos: 0.3.");
  expect(await page.evaluate(() => colaRepaso.map((r) => r.reto?.clase))).toContain("aDecimal");
});

test("25/100: 2.5, 25 y 0.025 son las trampas", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "aDecimal", arriba: 25, abajo: 100 });
  expect(await etiquetas(page)).toEqual(["0.025", "0.25", "2.5", "25"]);
  expect(await elegir(page, "2.5")).toContain("2.5 serían 25 décimos. 25/100 son 25 centésimos: 0.25.");
  // 7/100 no es 0.7.
  await pregunta(page, { clase: "aDecimal", arriba: 7, abajo: 100 });
  expect(await etiquetas(page)).toEqual(["0.007", "0.07", "0.7", "7"]);
});

test("¿qué fracción es 0.25?: 25/10 y 1/25 son errores, explicados", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "aFraccion", arriba: 25, abajo: 100 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Qué fracción es 0.25?");
  expect(await etiquetas(page)).toEqual(["1/25", "25/1", "25/10", "25/100"]);
  expect(await elegir(page, "25/10")).toContain("25/10 es 2.5. 0.25 son 25 centésimos: 25/100.");
  await pregunta(page, { clase: "aFraccion", arriba: 25, abajo: 100 });
  expect(await elegir(page, "25/100")).toContain("0.25 = 25/100");
  // Con 0.1, 1/1 sería dos veces la misma falsa: se cambia por otra.
  await pregunta(page, { clase: "aFraccion", arriba: 1, abajo: 10 });
  expect(await etiquetas(page)).toEqual(["1/1", "1/10", "1/100", "1/1000"]);
});

test("comparar: 0.7 contra 0.65, 6/10 y 69/100", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "comparar", t: 7, x: 5 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuál es el número más grande?");
  expect(await etiquetas(page)).toEqual(["0.65", "0.7", "6/10", "69/100"]);
  expect(await elegir(page, "0.65")).toContain("Más cifras no es más grande: 0.7 es 0.70, y 70 centésimos son más que 65.");
  await pregunta(page, { clase: "comparar", t: 7, x: 5 });
  expect(await elegir(page, "69/100")).toContain("69/100 es 0.69: le falta un centésimo para 0.7.");
});

test("sumar: 0.6 + 0.5 es 1.1, no 0.11 ni 0.1", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "sumar", a: 6, b: 5 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuánto es 0.6 + 0.5?");
  expect(await etiquetas(page)).toEqual(["0.1", "0.11", "1.1", "11"]);
  expect(await elegir(page, "0.11")).toContain("Sumaste las cifras: 6 + 5 = 11, pero son décimos. 11 décimos son 1 entero y 1 décimo: 1.1.");
  await pregunta(page, { clase: "sumar", a: 6, b: 5 });
  expect(await elegir(page, "0.1")).toContain("Te faltó el entero: 10 décimos hacen 1.");
});

test("trescientas al azar: 4 opciones distintas, una buena, con su explicación y bien escritas", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => {
    for (let a = 2; a <= 9; a++) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
  });
  const malos = await page.evaluate(() => {
    const errores = [];
    const vale = (e) => (e.includes("/") ? e.split("/").map(Number).reduce((x, y) => x / y) : Number(e));
    for (let i = 0; i < 300; i++) {
      const [h] = bolsaDeDecimales();
      const p = armarDecimales(h.reto);
      const valores = p.opciones.map((o) => o.valor);
      const nombre = `${p.texto} ${JSON.stringify(h.reto)}`;
      if (new Set(valores).size !== 4) errores.push(`${nombre}: repetidas`);
      if (new Set(p.opciones.map((o) => o.etiqueta)).size !== 4) errores.push(`${nombre}: etiquetas repetidas`);
      if (valores.filter((v) => v === p.respuesta).length !== 1) errores.push(`${nombre}: sin buena`);
      for (const o of p.opciones) {
        if (o.valor !== p.respuesta && !p.porQue[o.valor]) errores.push(`${nombre}: ${o.etiqueta} sin explicación`);
        if (!/^(\d+\/\d+|\d+(\.\d*[1-9])?)$/.test(o.etiqueta)) errores.push(`${nombre}: ${o.etiqueta} mal escrito`);
      }
      const buena = p.opciones.find((o) => o.valor === p.respuesta).etiqueta;
      // 30/100 es 3/10 disfrazado: los centésimos de la pregunta nunca terminan en 0.
      if (h.reto.abajo === 100 && h.reto.arriba % 10 === 0) errores.push(`${nombre}: centésimos que son décimos`);
      // La buena vale de verdad lo que pide la pregunta.
      if (h.reto.clase === "aDecimal" && Math.abs(vale(buena) - h.reto.arriba / h.reto.abajo) > 1e-9) errores.push(`${nombre}: la buena no vale`);
      if (h.reto.clase === "aFraccion" && buena !== `${h.reto.arriba}/${h.reto.abajo}`) errores.push(`${nombre}: la buena no es`);
      if (h.reto.clase === "sumar" && Math.abs(vale(buena) - (h.reto.a + h.reto.b) / 10) > 1e-9) errores.push(`${nombre}: la suma no da`);
      if (h.reto.clase === "comparar" && p.opciones.some((o) => o.etiqueta !== buena && vale(o.etiqueta) >= vale(buena))) errores.push(`${nombre}: hay otra más grande`);
      // Ninguna falsa vale lo mismo que la buena (3/10 y 30/100 serían las dos buenas).
      if (h.reto.clase !== "comparar" && p.opciones.some((o) => o.etiqueta !== buena && Math.abs(vale(o.etiqueta) - vale(buena)) < 1e-9)) errores.push(`${nombre}: dos que valen igual`);
    }
    return errores;
  });
  expect(malos).toEqual([]);
});

test("la ayuda: una tira de 10 para décimos y 100 cuadritos para centésimos", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "aDecimal", arriba: 3, abajo: 10 });
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .decimo")).toHaveCount(10);
  await expect(page.locator("#help-visual-container .decimo-pintado")).toHaveCount(3);
  await expect(page.locator("#help-explain")).toContainText("cada parte es un décimo");
  await expect(page.locator("#help-truco")).toContainText("3/10 son 3 décimos.");
  await expect(page.locator("#btn-girar")).toBeHidden();
  await pregunta(page, { clase: "aFraccion", arriba: 25, abajo: 100 });
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .cuadro-decimal")).toHaveCount(100);
  await expect(page.locator("#help-visual-container .centesimo-pintado")).toHaveCount(25);
});

test("la ayuda de comparar: una tira por opción, llena según lo que vale", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "comparar", t: 7, x: 5 });
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .tira-comparar")).toHaveCount(4);
  const anchos = await page.locator("#help-visual-container .tira-comparar").evaluateAll((ts) => Object.fromEntries(ts.map((t) => [t.firstChild.textContent, t.querySelector("span.block").style.width])));
  expect(anchos).toEqual({ "0.7": "70%", "0.65": "65%", "6/10": "60%", "69/100": "69%" });
});

test("la ayuda de sumar: dos tiras, cada una con sus décimos", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "sumar", a: 6, b: 5 });
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .tira-decimos")).toHaveCount(2);
  await expect(page.locator("#help-visual-container .decimo-pintado")).toHaveCount(11);
  await expect(page.locator("#help-explain")).toContainText("cada 10 hacen un entero");
});

test("no cuenta para el mapa ni el jardín, y queda en la vista para adultos y en el informe", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "aDecimal", arriba: 3, abajo: 10 });
  await elegir(page, "0.3");
  await pregunta(page, { clase: "sumar", a: 6, b: 5 });
  await elegir(page, "0.11");
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);
  expect(await page.evaluate(() => otros["decimales:aDecimal"].map((i) => i.ok))).toEqual([1]);
  expect(await page.evaluate(() => otros["decimales:sumar"].map((i) => i.ok))).toEqual([0]);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-decimales")).toContainText("Fracciones decimales (sus últimas respuestas):");
  await expect(page.locator(".adulto-decimales")).toContainText("de fracción a decimal 1 de 1");
  await expect(page.locator(".adulto-decimales")).toContainText("sumar décimos 0 de 1");
  await page.evaluate(() => { window.print = () => {}; imprimirInforme(perfilActual); });
  await expect(page.locator("#informe")).toContainText("Fracciones decimales: 1 de 2 bien.");
});

test("diez aciertos: la victoria lo dice con la idea que hay que llevarse", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-decimales");
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); });
  }
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victory-table-name")).toHaveText("Fracciones Decimales");
  await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 preguntas de fracciones decimales. 3/10 es 0.3 y 25/100 es 0.25: los décimos van en la primera cifra después del punto, y los centésimos en las dos primeras.");
});

test("las opciones y la ayuda caben en el teléfono, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await pregunta(page, { clase: "aFraccion", arriba: 87, abajo: 100 });   // «87/1000», de las más largas
    const anchos = await page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => [b.scrollWidth, b.clientWidth]));
    for (const [scroll, cliente] of anchos) expect(scroll, `${tam.width}×${tam.height}`).toBeLessThanOrEqual(cliente);
    if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(tam.width);
    // Las tiras no se encogen hasta desaparecer (acostado, la ayuda va al lado del texto).
    for (const reto of [{ clase: "sumar", a: 6, b: 5 }, { clase: "comparar", t: 7, x: 5 }]) {
      await pregunta(page, reto);
      if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
      const ancho = await page.locator("#help-visual-container > div").evaluate((c) => c.getBoundingClientRect().width);
      expect(ancho, `${reto.clase} ${tam.width}×${tam.height}`).toBeGreaterThan(200);
    }
  }
});
