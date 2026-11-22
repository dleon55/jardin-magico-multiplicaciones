// Enséñale a Lumi (Hito 4.4): Lumi da su respuesta, con los errores típicos
// que el juego ya conoce, y quien juega dice si está bien y le enseña la buena.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}
/** Abre la ronda con dudas fijas: cada una, [código que arma la pregunta, azar]. azar < 0.25: Lumi acierta. */
async function ronda(page, dudas) {
  await page.evaluate((dudas) => {
    const original = nuevaDuda;
    let i = 0;
    window.nuevaDuda = () => { const [codigo, azar] = dudas[Math.min(i++, dudas.length - 1)]; return original(eval(codigo), azar); };
    mostrarEnsenar();
  }, dudas);
}
const RELOJ = 'armarTiempo({ clase: "sumar", h: 3, m: 50, d: 20 })';   // buena 4:10; falsas 3:70, 3:10, 4:20
const estrellas = (page) => page.evaluate(() => globalStars);

test("se abre desde la lista y la ronda tiene cinco dudas", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-ensenar");
  await expect(page.locator("#screen-ensenar")).toBeVisible();
  await expect(page.locator("#ensenar-cuenta")).toHaveText("Duda 1 de 5");
  await expect(page.locator("#ensenar-botones button")).toHaveCount(2);
  await expect(page.locator("#ensenar-dice")).toHaveText(/^Yo digo que es .+\. ¿Está bien\?$/);
});

test("Lumi se equivoca: decirle que no, enseñarle la buena, y ella lo entiende (una estrella)", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await ronda(page, [[RELOJ, 0.9]]);
  await expect(page.locator("#ensenar-pregunta")).toHaveText("Son las 3:50. ¿Qué hora será en 20 minutos?");
  const dicha = await page.evaluate(() => ensenar.duda.dicha.etiqueta);
  expect(["3:70", "3:10", "4:20"]).toContain(dicha);
  await expect(page.locator("#ensenar-dice")).toHaveText(`Yo digo que es ${dicha}. ¿Está bien?`);
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toContain("Yo digo que es");
  const antes = await estrellas(page);
  await page.click(".ensenar-no");
  await expect(page.locator("#ensenar-dice")).toHaveText("¡Ay! Entonces, ¿cuál es la buena?");
  // Las opciones: todas menos la que dijo Lumi.
  const opciones = await page.locator(".ensenar-opcion").allTextContents();
  expect(opciones).toHaveLength(3);
  expect(opciones).not.toContain(dicha);
  expect(opciones).toContain("4:10");
  await page.click('.ensenar-opcion[data-valor="410"]');
  await expect(page.locator("#ensenar-dice")).toHaveText("¡Ah, ya entendí! Gracias por enseñarme.");
  await expect(page.locator("#ensenar-nota")).toContainText("Dile a Lumi: «");
  await expect(page.locator("#ensenar-nota")).toContainText(await page.evaluate(() => ensenar.duda.error));
  await expect(page.locator("#ensenar-nota")).toContainText("+1 estrella");
  await expect(page.locator("#lumi-ensenar > svg")).toHaveAttribute("data-expresion", "celebrando");
  expect(await estrellas(page)).toBe(antes + 1);
  await expect(page.locator("#ensenar-sigue")).toHaveText("Otra duda");
  await expect(page.locator("#ensenar-sigue")).toBeFocused();
});

test("al enseñar la buena, fallar una vez deja seguir probando pero ya no da estrella", async ({ page }) => {
  await alMenu(page);
  await ronda(page, [[RELOJ, 0.9]]);
  const antes = await estrellas(page);
  await page.click(".ensenar-no");
  const mala = page.locator('.ensenar-opcion:not([data-valor="410"])').first();
  await mala.click();
  await expect(mala).toBeDisabled();
  await expect(page.locator("#ensenar-nota")).toContainText("Esa tampoco.");
  await expect(page.locator("#ensenar-sigue")).toBeHidden();
  await page.click('.ensenar-opcion[data-valor="410"]');
  await expect(page.locator("#ensenar-nota")).not.toContainText("+1 estrella");
  expect(await estrellas(page)).toBe(antes);
  expect(await page.evaluate(() => ensenar.bien)).toBe(0);
});

test("Lumi se equivoca y le dicen que sí: se revisa, sin estrella y sin regaño", async ({ page }) => {
  await alMenu(page);
  await ronda(page, [[RELOJ, 0.9]]);
  const antes = await estrellas(page);
  await page.click(".ensenar-si");
  await expect(page.locator("#ensenar-nota")).toContainText("No estaba bien. Dile a Lumi: «");
  await expect(page.locator("#lumi-ensenar > svg")).toHaveAttribute("data-expresion", "animando");
  expect(await estrellas(page)).toBe(antes);
  await expect(page.locator("#ensenar-botones button").first()).toBeDisabled();
});

test("a veces Lumi acierta: decir que sí es lo correcto, y decir que no, no", async ({ page }) => {
  await alMenu(page);
  await ronda(page, [[RELOJ, 0.1], [RELOJ, 0.1]]);
  await expect(page.locator("#ensenar-dice")).toHaveText("Yo digo que es 4:10. ¿Está bien?");
  const antes = await estrellas(page);
  await page.click(".ensenar-si");
  await expect(page.locator("#ensenar-nota")).toContainText("¡Bien visto! En 20 minutos serán las 4:10.");
  expect(await estrellas(page)).toBe(antes + 1);
  await page.click("#ensenar-sigue");
  await page.click(".ensenar-no");
  await expect(page.locator("#ensenar-nota")).toContainText("Esta vez Lumi tenía razón.");
  expect(await estrellas(page)).toBe(antes + 1);
});

test("la ronda acaba a las cinco dudas, con el resumen, y vuelve al inicio", async ({ page }) => {
  await alMenu(page);
  await ronda(page, [[RELOJ, 0.1]]);   // Lumi siempre acierta: cinco «sí»
  for (let i = 1; i <= 5; i++) {
    await expect(page.locator("#ensenar-cuenta")).toHaveText(`Duda ${i} de 5`);
    await page.click(".ensenar-si");
    await expect(page.locator("#ensenar-sigue")).toHaveText(i === 5 ? "Terminar" : "Otra duda");
    await page.click("#ensenar-sigue");
  }
  await expect(page.locator("#ensenar-cuenta")).toHaveText("5 de 5");
  await expect(page.locator("#ensenar-pregunta")).toHaveText("¡Lumi aprendió todo contigo!");
  await expect(page.locator("#ensenar-dice")).toHaveText("Resolvimos 5 dudas de 5. ¡Qué bien enseñas!");
  await expect(page.locator("#ensenar-nota")).toHaveText("Ganaste 5 estrellas.");
  await expect(page.locator("#ensenar-sigue")).toHaveText("Volver al inicio");
  await page.click("#ensenar-sigue");
  await expect(page.locator("#screen-selector")).toBeVisible();
});

test("cuenta para la meta del día, y no toca el jardín ni el mapa", async ({ page }) => {
  await alMenu(page);
  await ronda(page, [[RELOJ, 0.1]]);
  await page.click(".ensenar-si");
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);
  await page.evaluate(() => backToSelector());
  await expect(page.locator("#mision-texto")).toContainText("1 de 10");
});

test("las dudas salen de lo que se tiene a la mano: al empezar, solo tablas; con lugares despiertos, también sus temas", async ({ page }) => {
  await alMenu(page);
  const textos = () => page.evaluate(() => Array.from({ length: 120 }, () => preguntaParaLumi().texto));
  expect((await textos()).every((t) => /^\d × \d$/.test(t))).toBe(true);
  await page.evaluate(() => {
    const dia = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    for (const a of [2, 5, 3, 4, 9, 6, 7]) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: dia(1), m: "e", ok: 1, ms: 2000 }, { d: dia(0), m: "e", ok: 1, ms: 2000 }];
  });
  const variados = await textos();
  expect(variados.some((t) => !/^\d × \d$/.test(t))).toBe(true);
  expect(variados.some((t) => /^\d × \d$/.test(t))).toBe(true);
});

test("trescientas dudas al azar: lo que dice Lumi es una opción, y si se equivoca hay explicación", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => {
    const dia = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    for (const a of [2, 5, 3, 4, 9, 6, 7, 8]) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: dia(1), m: "e", ok: 1, ms: 2000 }, { d: dia(0), m: "e", ok: 1, ms: 2000 }];
  });
  const r = await page.evaluate(() => {
    const errores = []; let aciertos = 0;
    for (let i = 0; i < 300; i++) {
      const d = nuevaDuda();
      const valores = d.pregunta.opciones.map((o) => o.valor);
      if (!valores.includes(d.dicha.valor)) errores.push(`${d.pregunta.texto}: Lumi dice algo que no es opción`);
      if (d.buena.valor !== d.pregunta.respuesta) errores.push(`${d.pregunta.texto}: la buena no es la respuesta`);
      if (d.acierta !== (d.dicha.valor === d.pregunta.respuesta)) errores.push(`${d.pregunta.texto}: acierta mal marcado`);
      if (!d.acierta && !d.error) errores.push(`${d.pregunta.texto}: error sin explicación`);
      if (d.acierta) aciertos++;
    }
    return { errores, aciertos };
  });
  expect(r.errores).toEqual([]);
  // Lumi acierta más o menos una de cada cuatro (entre el 12 % y el 40 % de 300).
  expect(r.aciertos).toBeGreaterThan(36);
  expect(r.aciertos).toBeLessThan(120);
});

test("una tabla: los errores de Lumi son sumar o una fila de más o de menos, cada uno explicado", async ({ page }) => {
  await alMenu(page);
  const d = await page.evaluate(() => { registrarIntento(7, 8, true); const p = dudaDeTabla(); return { texto: p.texto, r: p.respuesta, porQue: p.porQue, n: p.opciones.length }; });
  const [a, b] = d.texto.split(" × ").map(Number);
  expect([7, 8]).toContain(a);   // las únicas tablas empezadas (7 × 8 es de las dos)
  expect(d.r).toBe(a * b);
  expect(d.n).toBeGreaterThanOrEqual(3);
  expect(d.porQue[a + b]).toBe(`${a} + ${b} es sumar. ${a} × ${b} son ${a} filas de ${b}: ${a * b}.`);
  expect(d.porQue[(a - 1) * b]).toContain(`falta una fila de ${b}`);
});

test("Lumi solo usa las tablas ya empezadas, y nunca dice un error que no se pueda explicar", async ({ page }) => {
  await alMenu(page);
  const tablas = await page.evaluate(() => { registrarIntento(7, 8, true); return [...new Set(Array.from({ length: 80 }, () => Number(dudaDeTabla().texto.split(" × ")[0])))].sort(); });
  expect(tablas).toEqual([7, 8]);
  // Una pregunta con una falsa sin explicación: Lumi no la elige, ni una vez.
  const dichas = await page.evaluate(() => {
    const pregunta = { texto: "2 + 2", respuesta: 4, explicacion: "2 + 2 = 4.", porQue: { 5: "5 es uno de más." }, opciones: [4, 5, 22].map((v) => ({ valor: v, etiqueta: String(v) })) };
    return [...new Set(Array.from({ length: 60 }, (_, i) => nuevaDuda(pregunta, 0.3 + (i / 60) * 0.69).dicha.valor))];
  });
  expect(dichas).toEqual([5]);
  // Y si ninguna falsa tiene explicación, Lumi acierta.
  expect(await page.evaluate(() => nuevaDuda({ texto: "x", respuesta: 4, explicacion: "", porQue: {}, opciones: [4, 9].map((v) => ({ valor: v, etiqueta: String(v) })) }, 0.9).acierta)).toBe(true);
});

test("la pregunta con dibujo (el reloj) lo muestra", async ({ page }) => {
  await alMenu(page);
  await ronda(page, [['armarTiempo({ clase: "leer", h: 2, m: 50 })', 0.9]]);
  await expect(page.locator("#ensenar-pregunta svg.reloj")).toHaveCount(1);
});

test("Escape vuelve al inicio", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "teclado");
  await alMenu(page);
  await ronda(page, [[RELOJ, 0.9]]);
  await page.keyboard.press("Escape");
  await expect(page.locator("#screen-selector")).toBeVisible();
});

test.describe("en el mundo vivo", () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] } });
  test("está bajo el mundo, a un toque; cabe en el teléfono y es accesible", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await alMenu(page);
    await page.click("#btn-ensenar-mundo");
    await expect(page.locator("#screen-ensenar")).toBeVisible();
    await page.evaluate(() => { const o = nuevaDuda; window.nuevaDuda = () => o(armarTiempo({ clase: "sumar", h: 3, m: 50, d: 20 }), 0.9); ensenar.n = 0; siguienteDuda(); });
    const auditar = async (contexto) => {
      await page.waitForTimeout(400);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`), contexto).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), contexto).toBeLessThanOrEqual(360);
    };
    await auditar("la duda");
    await page.click(".ensenar-no");
    await auditar("las opciones");
    await page.click('.ensenar-opcion[data-valor="410"]');
    await auditar("resuelta");
    for (const alto of await page.locator(".btn-ensenar").evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().height))) expect(alto).toBeGreaterThanOrEqual(44);
  });
});

// --- Hito 6.2: Lumi se equivoca como quien juega ---
/** Deja guardados unos fallos: [a, b, lo que se respondió]. */
const fallar = (page, fallos) => page.evaluate((fallos) => { for (const [a, b, dada] of fallos) registrarIntento(a, b, false, { dada }); }, fallos);

test("los errores propios: de las tablas, contados y del más repetido al menos; sin lo que ya floreció ni respuestas raras", async ({ page }) => {
  await alMenu(page);
  expect(await page.evaluate(() => erroresPropios())).toEqual([]);
  await fallar(page, [[6, 8, 42], [7, 9, 16], [6, 8, 42], [8, 6, 42], [7, 9, 16], [3, 4, 13], [3, 4, 0], [5, 5, 25]]);
  await page.evaluate(() => {
    registrarIntento(2, 9, false, {});                       // falló sin respuesta guardada (por tiempo): no cuenta
    registrarIntento(9, 9, false, { dada: 80 });             // 9 × 9 florece después: su error ya no se repasa
    const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    hechos[claveHecho(9, 9)] = [...hechos[claveHecho(9, 9)], { d: d(1), m: "e", ok: 1, ms: 2000 }, { d: d(0), m: "e", ok: 1, ms: 2000 }];
  });
  expect(await page.evaluate(() => estadoHecho(9, 9))).toBe("florecida");
  expect(await page.evaluate(() => erroresPropios())).toEqual([
    { a: 6, b: 8, r: 42, veces: 3 },   // 6 × 8 y 8 × 6 son la misma planta
    { a: 7, b: 9, r: 16, veces: 2 },
    { a: 3, b: 4, r: 13, veces: 1 },
  ]);
});

test("una duda propia: Lumi dice justo lo que se respondió, con su explicación según la confusión", async ({ page }) => {
  await alMenu(page);
  await fallar(page, [[6, 8, 42], [6, 8, 42], [7, 9, 16], [7, 9, 36], [6, 8, 30], [4, 7, 31]]);
  const dudas = await page.evaluate(() => erroresPropios().map((e) => { const p = dudaPropia([e], 0); return { texto: p.texto, lumiDice: p.lumiDice, porQue: p.porQue[p.lumiDice], respuesta: p.respuesta, propia: p.propia, opciones: p.opciones.map((o) => o.valor).sort((x, y) => x - y), explicadas: Object.keys(p.porQue).length }; }));
  const de = (r) => dudas.find((d) => d.lumiDice === r);
  expect(de(42)).toMatchObject({ texto: "6 × 8", respuesta: 48, propia: true, porQue: "42 es 6 × 7, la de al lado. 6 × 8 = 48." });
  expect(de(16).porQue).toBe("7 + 9 es sumar. 7 × 9 son 7 filas de 9: 63.");
  expect(de(36).porQue).toBe("36 tiene las mismas cifras, pero al revés. 7 × 9 = 63.");
  expect(de(30).porQue).toBe("30 es 6 × 5, otra de la misma tabla. 6 × 8 = 48.");
  expect(de(31).porQue).toBe("31 no es. 4 × 7 son 4 filas de 7: 28.");
  for (const d of dudas) {
    expect(d.opciones).toContain(d.respuesta);
    expect(d.opciones).toContain(d.lumiDice);
    expect(new Set(d.opciones).size).toBe(d.opciones.length);
    expect(d.opciones.length).toBe(4);            // la buena, la propia y dos más, todas explicadas
    expect(d.explicadas).toBe(3);
    expect(d.opciones.every((o) => o > 0)).toBe(true);
  }
  // Con la tabla del 1, «una fila menos» daría cero: no se ofrece.
  expect(await page.evaluate(() => dudaPropia([{ a: 1, b: 7, r: 8, veces: 1 }], 0).opciones.map((o) => o.valor).sort((x, y) => x - y))).toEqual([7, 8, 14]);
  // Lumi se equivoca con ese error, no con otra falsa: con cualquier azar por encima de su acierto.
  const dichas = await page.evaluate(() => { const p = dudaPropia([{ a: 6, b: 8, r: 42, veces: 2 }], 0); return [0.25, 0.4, 0.7, 0.999].map((azar) => nuevaDuda(p, azar).dicha.valor); });
  expect(dichas).toEqual([42, 42, 42, 42]);
  // Y a veces acierta, como siempre.
  expect(await page.evaluate(() => { const d = nuevaDuda(dudaPropia([{ a: 6, b: 8, r: 42, veces: 2 }], 0), 0.1); return [d.acierta, d.dicha.valor]; })).toEqual([true, 48]);
});

test("se elige entre los tres errores más repetidos, y entran en la ronda tanto como las tablas", async ({ page }) => {
  await alMenu(page);
  await fallar(page, [[6, 8, 42], [6, 8, 42], [6, 8, 42], [7, 9, 16], [7, 9, 16], [3, 4, 13], [3, 4, 13], [2, 6, 14]]);
  const vistos = await page.evaluate(() => [0, 0.2, 0.34, 0.5, 0.67, 0.9, 0.999].map((azar) => dudaPropia(erroresPropios(), azar).lumiDice));
  expect(vistos).toEqual([42, 42, 13, 13, 16, 16, 16]);   // en el empate a dos veces, primero la más chica (3 × 4); nunca el cuarto (14)
  // En muchas dudas de un jardín que solo tiene tablas: cerca de la mitad son propias.
  const propias = await page.evaluate(() => { let n = 0; for (let i = 0; i < 400; i++) if (preguntaParaLumi().propia) n++; return n; });
  expect(propias).toBeGreaterThan(140);
  expect(propias).toBeLessThan(260);
  // Sin errores guardados, ninguna.
  await page.evaluate(() => { hechos = {}; });
  expect(await page.evaluate(() => { let n = 0; for (let i = 0; i < 200; i++) if (preguntaParaLumi().propia) n++; return n; })).toBe(0);
});

test("en la pantalla: Lumi repite el error propio y, al corregirla, se le explica sin decir de quién era", async ({ page }) => {
  await alMenu(page);
  await fallar(page, [[6, 8, 42], [6, 8, 42]]);
  await ronda(page, [["dudaPropia()", 0.9]]);
  await expect(page.locator("#ensenar-pregunta")).toHaveText("6 × 8");
  await expect(page.locator("#ensenar-dice")).toHaveText("Yo digo que es 42. ¿Está bien?");
  await page.click(".ensenar-no");
  await page.click('.ensenar-opcion[data-valor="48"]');
  await expect(page.locator("#ensenar-nota")).toHaveText("Dile a Lumi: «42 es 6 × 7, la de al lado. 6 × 8 = 48.» Le enseñaste: +1 estrella.");
  const pantalla = await page.locator("#screen-ensenar").innerText();
  expect(pantalla).not.toMatch(/tu error|te equivocaste tú|respondiste/i);
  // Corregir a Lumi no cambia lo guardado de esa multiplicación.
  expect(await page.evaluate(() => intentosDe(6, 8).length)).toBe(2);
});
