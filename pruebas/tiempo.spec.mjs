// Medidas de tiempo (issue #105): leer el reloj de manecillas, qué hora
// será, cuánto dura y horas a minutos. Una hora tiene 60 minutos, no 100:
// los errores típicos son las opciones falsas, cada uno explicado.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Abre la partida y pone en pantalla el reto dado. */
async function pregunta(page, reto) {
  if (await page.locator("#btn-tiempo").isVisible()) await page.click("#btn-tiempo");
  else await page.evaluate(() => startTable("tiempo"));
  await page.evaluate((reto) => {
    cancelarEspera();
    colaRepaso = [];
    bolsa = [{ a: numerosDeTiempo(reto)[0], b: 1, reto }];
    nextQuestion();
  }, reto);
}

const etiquetas = (page) => page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => b.dataset.etiqueta).sort());
const elegir = async (page, etiqueta) => {
  await page.locator(`#opciones .btn-option[data-etiqueta="${etiqueta}"]`).click();
  return page.evaluate(() => { cancelarEspera(); return document.getElementById("game-feedback").innerText; });
};
const sabeMuchas = (page) => page.evaluate(() => {
  for (let a = 2; a <= 9; a++) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];
});

test("el menú abre la partida: diez retos distintos de las cuatro clases", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-tiempo");
  await expect(page.locator("#screen-game")).toBeVisible();
  const bolsas = await page.evaluate(() => Array.from({ length: 40 }, () => bolsaDeTiempo()).map((b) => {
    const cuenta = {};
    for (const h of b) cuenta[h.reto.clase] = (cuenta[h.reto.clase] || 0) + 1;
    return [cuenta, new Set(b.map((h) => JSON.stringify(h.reto))).size];
  }));
  for (const [cuenta, distintos] of bolsas) {
    expect(cuenta).toEqual({ leer: 3, sumar: 3, duracion: 2, convertir: 2 });
    expect(distintos).toBe(10);
  }
});

test("con pocas tablas sabidas, solo en punto, y cuarto, y media y menos cuarto; con muchas, de 5 en 5", async ({ page }) => {
  await alMenu(page);
  const minutos = () => page.evaluate(() => Array.from({ length: 40 }, () => bolsaDeTiempo()).flat()
    .filter((h) => h.reto.clase === "leer").map((h) => h.reto.m));
  expect(new Set(await minutos())).toEqual(new Set([0, 15, 30, 45]));
  await sabeMuchas(page);
  const muchas = await minutos();
  expect(muchas.some((m) => m % 15 !== 0)).toBe(true);
  expect(muchas.every((m) => m % 5 === 0 && m < 60)).toBe(true);
});

test("escribe y dice las horas como se dicen", async ({ page }) => {
  await alMenu(page);
  expect(await page.evaluate(() => [[2, 5], [12, 0], [3, 30]].map(([h, m]) => escribirHora(h, m)))).toEqual(["2:05", "12:00", "3:30"]);
  expect(await page.evaluate(() => [[1, 0], [3, 15], [4, 30], [4, 50]].map(([h, m]) => horaEnVoz(h, m))))
    .toEqual(["la 1 en punto", "las 3 y cuarto", "las 4 y media", "las 4 y 50"]);
});

test("el reloj: las manecillas apuntan donde deben", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "leer", h: 2, m: 50 });
  const angulo = (sel) => page.locator(`#problema-texto ${sel}`).evaluate((l) => {
    const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((k) => Number(l.getAttribute(k)));
    return (Math.round((Math.atan2(x2 - x1, y1 - y2) * 180) / Math.PI) + 360) % 360;
  });
  expect(await angulo(".manecilla-minuto")).toBe(300);   // en el 10
  expect(await angulo(".manecilla-hora")).toBe(85);      // casi en el 3: 2 y 50/60 de hora
  // La larga es más larga que la corta.
  const largo = (sel) => page.locator(`#problema-texto ${sel}`).evaluate((l) => Math.hypot(l.getAttribute("x2") - l.getAttribute("x1"), l.getAttribute("y2") - l.getAttribute("y1")));
  expect(await largo(".manecilla-minuto")).toBeGreaterThan(await largo(".manecilla-hora"));
  await expect(page.locator("#problema-texto .marca-hora")).toHaveCount(12);
  await expect(page.locator("#problema-texto .marca-minuto")).toHaveCount(48);
});

test("leer las 2:50: la pregunta, lo que oye el lector de pantalla y las trampas", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await pregunta(page, { clase: "leer", h: 2, m: 50 });
  await expect(page.locator("#problema-texto .dibujo-pregunta > span")).toHaveText("¿Qué hora marca el reloj?");
  // El lector de pantalla oye dónde están las manecillas, no la hora.
  const leido = await page.locator("#question-text .sr-only").textContent();
  expect(leido).toBe("¿Qué hora marca el reloj? Un reloj de manecillas: la manecilla corta está entre el 2 y el 3, y la larga, en el 10.");
  expect(leido).not.toContain("2:50");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("¿Qué hora marca el reloj?");
  // El número y no los minutos (2:10), las manecillas cambiadas (10:10), la hora redondeada (3:50).
  expect(await etiquetas(page)).toEqual(["10:10", "2:10", "2:50", "3:50"]);
  await expect(page.locator("#escritura")).toBeHidden();   // siempre se elige
  expect(await elegir(page, "2:10")).toContain("La larga en el 10 marca 50 minutos: 10 × 5 = 50. Cada número son 5 minutos.");
  await pregunta(page, { clase: "leer", h: 2, m: 50 });
  expect(await elegir(page, "3:50")).toContain("La corta ya casi llega al 3, pero todavía no: son las 2 y 50.");
  expect(await page.evaluate(() => colaRepaso.map((r) => r.reto?.clase))).toContain("leer");
});

test("leer: en punto y cuando las manecillas cambiadas darían la misma hora", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "leer", h: 2, m: 0 });
  expect(await etiquetas(page)).toEqual(["12:10", "1:00", "2:00", "2:12"]);
  expect(await page.locator("#question-text .sr-only").textContent()).toContain("la manecilla corta está en el 2, y la larga, en el 12.");
  expect(await elegir(page, "2:12")).toContain("La larga en el 12 marca 0 minutos: es la hora en punto.");
  // A las y media la corta está a la mitad: la trampa es la hora siguiente, a la que ya va llegando.
  await pregunta(page, { clase: "leer", h: 4, m: 30 });
  expect(await etiquetas(page)).toContain("5:30");
  await pregunta(page, { clase: "leer", h: 2, m: 0 });
  expect(await elegir(page, "1:00")).toContain("La corta está justo en el 2: son las 2 en punto.");
  // A las 3:15, cambiar las manecillas da 3:15 otra vez: entra otra trampa.
  await pregunta(page, { clase: "leer", h: 3, m: 15 });
  expect(await etiquetas(page)).toEqual(["2:15", "3:03", "3:15", "3:45"]);
  // Aunque la planta que lo representa ya esté florecida, la hora se elige.
  await page.evaluate(() => { hechos[claveHecho(3, 1)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }]; });
  await pregunta(page, { clase: "leer", h: 3, m: 15 });
  await expect(page.locator("#escritura")).toBeHidden();
  await expect(page.locator("#opciones")).toBeVisible();
});

test("qué hora será: 3:50 y 20 minutos son las 4:10, no las 3:70 ni las 3:10", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await pregunta(page, { clase: "sumar", h: 3, m: 50, d: 20 });
  await expect(page.locator("#problema-texto")).toHaveText("Son las 3:50. ¿Qué hora será en 20 minutos?");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("Son las 3 y 50. ¿Qué hora será en 20 minutos?");
  expect(await etiquetas(page)).toEqual(["3:10", "3:70", "4:10", "4:20"]);
  expect(await elegir(page, "3:70")).toContain("Una hora tiene 60 minutos, no 100: 50 + 20 = 70 minutos es 1 hora y 10. De 3:50 a 4:00 son 10 minutos, y faltan 10 más: 4:10.");
  await pregunta(page, { clase: "sumar", h: 3, m: 50, d: 20 });
  expect(await elegir(page, "3:10")).toContain("Te faltó pasar a la hora siguiente.");
  await pregunta(page, { clase: "sumar", h: 3, m: 50, d: 20 });
  expect(await elegir(page, "4:10")).toContain("En 20 minutos serán las 4:10.");
});

test("cuánto dura: de 3:40 a 4:15 son 35 minutos, no 75", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "duracion", h: 3, m: 40, d: 35 });
  await expect(page.locator("#problema-texto")).toHaveText("Sale a las 3:40 y llega a las 4:15. ¿Cuántos minutos tardó?");
  expect(await etiquetas(page)).toEqual(["15 min", "20 min", "35 min", "75 min"]);
  expect(await elegir(page, "75 min")).toContain("Restaste 415 − 340, como si la hora tuviera 100 minutos. Tiene 60. De 3:40 a 4:00 son 20 minutos, y de ahí a 4:15, 15 más: 20 + 15 = 35.");
  await pregunta(page, { clase: "duracion", h: 3, m: 40, d: 35 });
  expect(await elegir(page, "20 min")).toContain("Eso es solo hasta las 4:00.");
});

test("horas a minutos: 2 horas y 15 son 135, no 215; un cuarto de hora son 15, no 25", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "convertir", H: 2, M: 15 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuántos minutos son 2 horas y 15 minutos?");
  expect(await etiquetas(page)).toEqual(["120 min", "135 min", "215 min", "75 min"]);
  expect(await elegir(page, "215 min")).toContain("Una hora tiene 60 minutos, no 100: 2 × 60 = 120, y 120 + 15 = 135.");
  await pregunta(page, { clase: "convertir", f: 1 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuántos minutos son un cuarto de hora?");
  expect(await etiquetas(page)).toEqual(["15 min", "25 min", "30 min", "45 min"]);
  expect(await elegir(page, "25 min")).toContain("25 sería un cuarto de hora si la hora tuviera 100 minutos. Tiene 60: 60 ÷ 4 = 15.");
  await pregunta(page, { clase: "convertir", f: 2 });
  expect(await etiquetas(page)).toEqual(["15 min", "30 min", "45 min", "50 min"]);
});

test("trescientas al azar: 4 opciones distintas, una buena que es cierta, cada falsa explicada y ninguna hora imposible", async ({ page }) => {
  await alMenu(page);
  for (const muchas of [false, true]) {
    if (muchas) await sabeMuchas(page);
    const malos = await page.evaluate(() => {
      const errores = [];
      const aMin = (e) => { const [h, m] = e.split(":").map(Number); return h * 60 + m; };
      for (let i = 0; i < 300; i++) {
        const [h] = bolsaDeTiempo();
        const r = h.reto;
        const p = armarTiempo(r);
        const nombre = `${p.texto} ${JSON.stringify(r)}`;
        const valores = p.opciones.map((o) => o.valor);
        if (new Set(valores).size !== 4) errores.push(`${nombre}: repetidas`);
        if (new Set(p.opciones.map((o) => o.etiqueta)).size !== 4) errores.push(`${nombre}: etiquetas repetidas`);
        if (valores.filter((v) => v === p.respuesta).length !== 1) errores.push(`${nombre}: sin buena`);
        const buena = p.opciones.find((o) => o.valor === p.respuesta).etiqueta;
        for (const o of p.opciones) {
          if (o.valor !== p.respuesta && !p.porQue[o.valor]) errores.push(`${nombre}: ${o.etiqueta} sin explicación`);
          if (o.etiqueta.includes(":")) {
            const [hh, mm] = o.etiqueta.split(":").map(Number);
            if (hh < 1 || hh > 12 || !/^\d{1,2}:\d\d$/.test(o.etiqueta)) errores.push(`${nombre}: ${o.etiqueta} no es una hora`);
            if (mm >= 60 && o.etiqueta === buena) errores.push(`${nombre}: la buena tiene ${mm} minutos`);
          } else if (!/^\d+ min$/.test(o.etiqueta) || parseInt(o.etiqueta) < 1) errores.push(`${nombre}: ${o.etiqueta} mal escrito`);
        }
        // La buena es cierta.
        if (r.clase === "leer" && buena !== escribirHora(r.h, r.m)) errores.push(`${nombre}: no es la hora del reloj`);
        if (r.clase === "sumar" && aMin(buena) - (r.h * 60 + r.m) !== r.d) errores.push(`${nombre}: la suma no da`);
        if (r.clase === "sumar" && Number(buena.split(":")[0]) !== r.h + 1) errores.push(`${nombre}: no pasa a la hora siguiente`);
        if (r.clase === "duracion" && buena !== `${r.d} min`) errores.push(`${nombre}: no es lo que dura`);
        if (r.clase === "duracion" && r.m + r.d <= 60) errores.push(`${nombre}: no cruza la hora`);
        if (r.clase === "convertir" && buena !== `${r.f ? r.f * 15 : r.H * 60 + r.M} min`) errores.push(`${nombre}: la conversión no da`);
      }
      return errores;
    });
    expect(malos, muchas ? "con muchas tablas" : "con pocas").toEqual([]);
  }
});

test("la ayuda al leer: el reloj grande con los minutos junto a cada número", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "leer", h: 2, m: 50 });
  await page.click("#btn-help");
  const minutos = await page.locator("#help-visual-container .minutos-reloj").allTextContents();
  expect(minutos).toEqual(["5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "0"]);
  await expect(page.locator("#help-explain")).toContainText("como la tabla del 5");
  await expect(page.locator("#help-truco")).toContainText("La manecilla corta marca la hora.");
  await expect(page.locator("#btn-girar")).toBeHidden();
});

test("la ayuda al sumar y en cuánto dura: bloques de 5 minutos partidos en la hora en punto", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "duracion", h: 3, m: 40, d: 35 });
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .bloque-antes")).toHaveCount(4);
  await expect(page.locator("#help-visual-container .bloque-despues")).toHaveCount(3);
  await expect(page.locator("#help-visual-container .linea-tiempo")).toContainText("3:40");
  await expect(page.locator("#help-visual-container .linea-tiempo")).toContainText("4:00");
  await expect(page.locator("#help-visual-container .linea-tiempo")).toContainText("4:15");
  // Al sumar, el final es lo que se pregunta: no se dice.
  await pregunta(page, { clase: "sumar", h: 3, m: 50, d: 20 });
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .bloque-antes")).toHaveCount(2);
  await expect(page.locator("#help-visual-container .bloque-despues")).toHaveCount(2);
  await expect(page.locator("#help-visual-container .linea-tiempo")).not.toContainText("4:10");
});

test("la ayuda al convertir: cada hora son 12 bloques de 5 minutos", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "convertir", H: 2, M: 15 });
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .bloque-hora")).toHaveCount(24);
  await expect(page.locator("#help-visual-container .bloque-minutos")).toHaveCount(3);
  await pregunta(page, { clase: "convertir", f: 3 });
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .bloque-cinco")).toHaveCount(12);
});

test("no cuenta para el mapa ni el jardín, y queda en la vista para adultos y en el informe", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, { clase: "leer", h: 2, m: 50 });
  await elegir(page, "2:50");
  await pregunta(page, { clase: "duracion", h: 3, m: 40, d: 35 });
  await elegir(page, "75 min");
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);
  expect(await page.evaluate(() => otros["tiempo:leer"].map((i) => i.ok))).toEqual([1]);
  expect(await page.evaluate(() => otros["tiempo:duracion"].map((i) => i.ok))).toEqual([0]);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-tiempo")).toContainText("Medidas de tiempo (sus últimas respuestas):");
  await expect(page.locator(".adulto-tiempo")).toContainText("leer el reloj 1 de 1");
  await expect(page.locator(".adulto-tiempo")).toContainText("cuánto dura 0 de 1");
  await page.evaluate(() => { window.print = () => {}; imprimirInforme(perfilActual); });
  await expect(page.locator("#informe")).toContainText("Medidas de tiempo: 1 de 2 bien.");
});

test("diez aciertos: la victoria lo dice con la idea que hay que llevarse", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-tiempo");
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); });
  }
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victory-table-name")).toHaveText("Medidas de Tiempo");
  await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 preguntas de tiempo. Una hora tiene 60 minutos, no 100: por eso 3:50 y 20 minutos más son las 4:10. Cada número del reloj son 5 minutos, como la tabla del 5.");
});

test("cabe en el teléfono: el reloj, las opciones a la vista y la ayuda, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await pregunta(page, { clase: "leer", h: 10, m: 10 });   // «10:10», de las más largas
    const nombre = `${tam.width}×${tam.height}`;
    const anchos = await page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => [b.scrollWidth, b.clientWidth]));
    for (const [scroll, cliente] of anchos) expect(scroll, nombre).toBeLessThanOrEqual(cliente);
    // El reloj se ve entero, y en vertical las cuatro opciones caben sin desplazarse.
    const reloj = await page.locator("#problema-texto svg.reloj").boundingBox();
    expect(reloj.width, nombre).toBeGreaterThanOrEqual(96);
    expect(reloj.x + reloj.width, nombre).toBeLessThanOrEqual(tam.width);
    if (tam.height > tam.width) {
      const abajo = await page.locator("#opciones .btn-option").evaluateAll((bs) => Math.max(...bs.map((b) => b.getBoundingClientRect().bottom)));
      expect(abajo, nombre).toBeLessThanOrEqual(tam.height);
    }
    // Las etiquetas de minutos, en un renglón: las teclas no crecen más que con una hora.
    const altura = () => page.locator("#opciones .btn-option").evaluateAll((bs) => Math.max(...bs.map((b) => b.getBoundingClientRect().height)));
    const conHora = await altura();
    await pregunta(page, { clase: "convertir", H: 3, M: 55 });
    expect(await altura(), nombre).toBeLessThanOrEqual(conHora + 1);
    // La ayuda, sin desbordar, y la línea de tiempo en una sola fila.
    await pregunta(page, { clase: "duracion", h: 3, m: 15, d: 55 });
    if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), nombre).toBeLessThanOrEqual(tam.width);
    const filas = await page.locator("#help-visual-container .bloque-cinco").evaluateAll((bs) => new Set(bs.map((b) => Math.round(b.getBoundingClientRect().top))).size);
    expect(filas, nombre).toBe(1);
  }
});
