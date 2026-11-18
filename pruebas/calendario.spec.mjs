// El calendario (issue #108): días y semanas, qué día será, los meses y
// los días entre dos fechas. Nada cuenta de 10 en 10: la semana tiene 7
// días y los meses 28, 30 o 31. Los errores típicos son las falsas.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Abre la partida y pone en pantalla el reto dado. */
async function pregunta(page, reto) {
  if (await page.locator("#btn-calendario").isVisible()) await page.click("#btn-calendario");
  else await page.evaluate(() => startTable("calendario"));
  await page.evaluate((reto) => {
    cancelarEspera();
    colaRepaso = [];
    bolsa = [{ a: numerosDeCalendario(reto)[0], b: 1, reto }];
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
const SEMANAS = { clase: "semanas", s: 2, d: 3 };
const HOY = { clase: "diaSemana", forma: "hoy", i: 1, n: 10 };          // martes, en 10 días
const MES = { clase: "diaSemana", forma: "mes", mes: 2, i: 3, k: 15 };  // el 1 de marzo es jueves
const ABRIL = { clase: "meses", forma: "dias", mes: 3 };
const DESPUES = { clase: "meses", forma: "despues", mes: 8, n: 5 };     // 5 meses después de septiembre
const ENTRE = { clase: "cuantosDias", mes: 4, a: 25, b: 3 };            // del 25 de mayo al 3 de junio

test("el menú abre la partida: diez retos distintos de las cuatro clases", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-calendario");
  await expect(page.locator("#screen-game")).toBeVisible();
  const bolsas = await page.evaluate(() => Array.from({ length: 40 }, () => bolsaDeCalendario()).map((b) => {
    const cuenta = {};
    for (const h of b) cuenta[h.reto.clase] = (cuenta[h.reto.clase] || 0) + 1;
    return [cuenta, new Set(b.map((h) => JSON.stringify(h.reto))).size];
  }));
  for (const [cuenta, distintos] of bolsas) {
    expect(cuenta).toEqual({ semanas: 3, diaSemana: 3, meses: 2, cuantosDias: 2 });
    expect(distintos).toBe(10);
  }
});

test("con pocas tablas sabidas: semanas enteras, hasta 7 días y sin cruzar de mes; con muchas, todo", async ({ page }) => {
  await alMenu(page);
  const retos = () => page.evaluate(() => Array.from({ length: 60 }, () => bolsaDeCalendario()).flat().map((h) => h.reto));
  let r = await retos();
  expect(r.filter((x) => x.clase === "semanas").every((x) => x.d === 0 && x.s <= 4)).toBe(true);
  expect(r.filter((x) => x.forma === "hoy").every((x) => x.n <= 7)).toBe(true);
  expect(r.filter((x) => x.clase === "cuantosDias").every((x) => x.b > x.a)).toBe(true);
  expect(r.filter((x) => x.forma === "despues").every((x) => x.mes + x.n <= 11)).toBe(true);
  await sabeMuchas(page);
  r = await retos();
  expect(r.some((x) => x.clase === "semanas" && x.d > 0)).toBe(true);
  expect(r.filter((x) => x.forma === "hoy").every((x) => x.n > 7)).toBe(true);
  expect(r.filter((x) => x.clase === "cuantosDias").every((x) => x.b < x.a)).toBe(true);   // cruzan de mes
  expect(r.filter((x) => x.forma === "despues").every((x) => x.mes + x.n > 11)).toBe(true); // dan la vuelta al año
});

test("2 semanas y 3 días: 17, no 23 (semanas de 10), 13 (de 5) ni 12 (sumar)", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await pregunta(page, SEMANAS);
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuántos días son 2 semanas y 3 días?");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("¿Cuántos días son 2 semanas y 3 días?");
  expect(await etiquetas(page)).toEqual(["12 días", "13 días", "17 días", "23 días"]);
  await expect(page.locator("#escritura")).toBeHidden();   // siempre se elige
  expect(await elegir(page, "23 días")).toContain("Una semana tiene 7 días, no 10: 2 × 7 = 14, y 14 + 3 = 17.");
  await pregunta(page, SEMANAS);
  expect(await elegir(page, "12 días")).toContain("Sumaste 2 + 7, pero son 2 semanas de 7 días: se multiplica.");
  expect(await page.evaluate(() => colaRepaso.map((r) => r.reto?.clase))).toContain("semanas");
  // Aunque la planta que lo representa ya esté florecida, se elige.
  await page.evaluate(() => { hechos[claveHecho(2, 1)] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }]; });
  await pregunta(page, SEMANAS);
  await expect(page.locator("#escritura")).toBeHidden();
  await expect(page.locator("#opciones")).toBeVisible();
});

test("hoy es martes: en 10 días será viernes, no jueves (contar hoy) ni miércoles (solo la semana)", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, HOY);
  await expect(page.locator("#problema-texto")).toHaveText("Hoy es martes. ¿Qué día será en 10 días?");
  expect(await etiquetas(page)).toEqual(["jueves", "miércoles", "sábado", "viernes"]);
  await expect(page.locator("#opciones")).toHaveClass(/opciones-largas/);
  expect(await elegir(page, "jueves")).toContain("Contaste el martes como el primer día, pero hoy no cuenta: se empieza mañana. 10 días son 1 semana y 3 días: cada semana se vuelve al martes, y luego 3 más. Es viernes.");
  await pregunta(page, HOY);
  expect(await elegir(page, "miércoles")).toContain("Contaste las semanas (1) y no los días que sobran.");
  await pregunta(page, HOY);
  expect(await elegir(page, "sábado")).toContain("Fuiste hacia atrás");
});

test("el calendario dibujado: solo la primera semana con números, y el 15 se cuenta de 7 en 7", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, MES);
  await expect(page.locator("#problema-texto .dibujo-pregunta > span")).toHaveText("El 1 de marzo es jueves. ¿Qué día de la semana es el 15?");
  const dibujo = page.locator("#problema-texto svg.calendario-dibujo");
  await expect(dibujo.locator("rect")).toHaveCount(31);
  await expect(dibujo.locator(".dia-con-numero")).toHaveCount(4);   // del jueves al domingo
  expect(await dibujo.locator("text").allTextContents()).not.toContain("15");
  // El 1 está en la columna del jueves (la cuarta).
  const x1 = await dibujo.locator(".dia-con-numero").first().getAttribute("x");
  expect(Number(x1)).toBe(2 + 3 * 18);
  // El lector de pantalla oye dónde cae el 1, no la respuesta.
  expect(await page.locator("#question-text .sr-only").textContent())
    .toBe("El 1 de marzo es jueves. ¿Qué día de la semana es el 15? Un calendario de marzo con los números de la primera semana: el 1 cae en jueves.");
  expect(await etiquetas(page)).toEqual(["jueves", "lunes", "miércoles", "viernes"]);
  expect(await elegir(page, "viernes")).toContain("Contaste el 1 dos veces: del 1 al 15 hay 14 días, no 15.");
  await pregunta(page, MES);
  expect(await elegir(page, "lunes")).toContain("Eso sería si el 1 fuera lunes, pero es jueves.");
  await pregunta(page, MES);
  expect(await elegir(page, "jueves")).toContain("Del 1 al 15 hay 14 días: 2 semanas justas, así que el 15 cae igual que el 1: jueves.");
  // Con días que sobran: del 1 al 18, 2 semanas y 3 días.
  expect(await page.evaluate(() => armarCalendario({ clase: "diaSemana", forma: "mes", mes: 2, i: 3, k: 18 }).explicacion))
    .toBe("El 18 de marzo es domingo. Del 1 al 18 hay 17 días: 2 semanas y 3 días. El 15 también es jueves, y el 18 es domingo.");
});

test("los meses: abril tiene 30; 5 meses después de septiembre es febrero, no diciembre", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, ABRIL);
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuántos días tiene abril?");
  expect(await etiquetas(page)).toEqual(["28 días", "29 días", "30 días", "31 días"]);
  expect(await elegir(page, "31 días")).toContain("Abril no tiene 31.");
  await pregunta(page, { clase: "meses", forma: "dias", mes: 1 });
  await expect(page.locator("#problema-texto")).toHaveText("¿Cuántos días tiene febrero (en un año que no es bisiesto)?");
  await pregunta(page, DESPUES);
  await expect(page.locator("#problema-texto")).toHaveText("¿Qué mes es 5 meses después de septiembre?");
  expect(await etiquetas(page)).toEqual(["abril", "diciembre", "enero", "febrero"]);
  expect(await elegir(page, "diciembre")).toContain("El año no se acaba en diciembre: después viene enero. De septiembre a diciembre son 3 meses; después de diciembre sigue enero, y falta 1 más: febrero.");
  await pregunta(page, DESPUES);
  expect(await elegir(page, "enero")).toContain("Contaste septiembre como el primero");
});

test("días entre dos fechas: del 25 de mayo al 3 de junio son 9, no 22, 8 ni 10", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, ENTRE);
  await expect(page.locator("#problema-texto")).toHaveText("Del 25 de mayo al 3 de junio, ¿cuántos días pasan?");
  expect(await etiquetas(page)).toEqual(["10 días", "22 días", "8 días", "9 días"]);
  expect(await elegir(page, "22 días")).toContain("Restaste 25 − 3, pero son de meses distintos. Mayo tiene 31 días: del 25 al 31 son 6, y luego 3 de junio: 6 + 3 = 9.");
  await pregunta(page, ENTRE);
  expect(await elegir(page, "8 días")).toContain("Eso sería si mayo tuviera 30 días.");
  // Dentro de un mes: se resta, y contar los dos días es el error.
  await pregunta(page, { clase: "cuantosDias", mes: 4, a: 5, b: 17 });
  await expect(page.locator("#problema-texto")).toHaveText("Del 5 al 17 de mayo, ¿cuántos días pasan?");
  expect(await etiquetas(page)).toEqual(["11 días", "12 días", "13 días", "22 días"]);
  expect(await elegir(page, "13 días")).toContain("Contaste los dos días, el 5 y el 17");
});

test("trescientas al azar: 4 opciones distintas, una buena que es cierta, cada falsa explicada y ninguna fecha imposible", async ({ page }) => {
  await alMenu(page);
  for (const muchas of [false, true]) {
    if (muchas) await sabeMuchas(page);
    const malos = await page.evaluate(() => {
      const errores = [];
      for (let i = 0; i < 300; i++) {
        const [h] = bolsaDeCalendario();
        const r = h.reto;
        const p = armarCalendario(r);
        const nombre = `${p.texto} ${JSON.stringify(r)}`;
        const valores = p.opciones.map((o) => o.valor);
        if (new Set(valores).size !== 4) errores.push(`${nombre}: repetidas`);
        if (new Set(p.opciones.map((o) => o.etiqueta)).size !== 4) errores.push(`${nombre}: etiquetas repetidas`);
        if (valores.filter((v) => v === p.respuesta).length !== 1) errores.push(`${nombre}: sin buena`);
        const buena = p.opciones.find((o) => o.valor === p.respuesta).etiqueta;
        for (const o of p.opciones) {
          if (o.valor !== p.respuesta && !p.porQue[o.valor]) errores.push(`${nombre}: ${o.etiqueta} sin explicación`);
          if (!(DIAS_SEMANA.includes(o.etiqueta) || MESES.includes(o.etiqueta) || /^([2-9]|[1-9]\d+) días$|^1 día$/.test(o.etiqueta))) errores.push(`${nombre}: ${o.etiqueta} mal escrito`);
        }
        let esperada;
        if (r.clase === "semanas") esperada = `${7 * r.s + r.d} días`;
        else if (r.forma === "hoy") esperada = DIAS_SEMANA[(r.i + r.n) % 7];
        else if (r.forma === "mes") esperada = DIAS_SEMANA[(r.i + r.k - 1) % 7];
        else if (r.forma === "dias") esperada = `${DIAS_MES[r.mes]} días`;
        else if (r.forma === "despues") esperada = MESES[(r.mes + r.n) % 12];
        else {
          esperada = `${r.b > r.a ? r.b - r.a : DIAS_MES[r.mes] - r.a + r.b} días`;
          // Las fechas existen: el día de salida en su mes, y la llegada en el suyo.
          if (r.a > DIAS_MES[r.mes]) errores.push(`${nombre}: el ${r.a} no existe`);
          if (r.b > DIAS_MES[r.b > r.a ? r.mes : (r.mes + 1) % 12]) errores.push(`${nombre}: el ${r.b} no existe`);
        }
        if (r.forma === "mes" && r.k > DIAS_MES[r.mes]) errores.push(`${nombre}: el ${r.k} no existe`);
        if (buena !== esperada) errores.push(`${nombre}: la buena es ${buena}, y debía ser ${esperada}`);
      }
      return errores;
    });
    expect(malos, muchas ? "con muchas tablas" : "con pocas").toEqual([]);
  }
});

test("la ayuda de semanas: una fila de 7 por semana y los días sueltos aparte", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, SEMANAS);
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .fila-semana")).toHaveCount(2);
  await expect(page.locator("#help-visual-container .dia-semana")).toHaveCount(14);
  await expect(page.locator("#help-visual-container .dia-suelto")).toHaveCount(3);
  await expect(page.locator("#help-truco")).toContainText("es la tabla del 7");
  await expect(page.locator("#btn-girar")).toBeHidden();
});

test("la ayuda de qué día será: los 7 días con hoy marcado; la del calendario, la columna del 1", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, HOY);
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .dia-chip, #help-visual-container .dia-hoy")).toHaveCount(7);
  await expect(page.locator("#help-visual-container .dia-hoy")).toHaveText("mar");
  await pregunta(page, MES);
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  expect(await page.locator("#help-visual-container .dia-columna").allTextContents()).toEqual(["1", "8", "15", "22", "29"]);
  await expect(page.locator("#help-explain")).toContainText("Todos los de la columna azul son jueves");
});

test("la ayuda de los meses: los nudillos de los dos puños; y la fila de los 12", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, ABRIL);
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .punio")).toHaveCount(2);
  await expect(page.locator("#help-visual-container .nudillo")).toHaveCount(7);   // los 7 meses de 31 días
  await expect(page.locator("#help-visual-container .hueco")).toHaveCount(5);
  await pregunta(page, DESPUES);
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .mes-inicio")).toHaveText("sep");
  await expect(page.locator("#help-visual-container .mes-chip")).toHaveCount(11);
});

test("la ayuda de días entre fechas: el camino pintado, un cuadrito por día que pasa", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, ENTRE);
  await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .dia-inicio")).toHaveText("25");
  await expect(page.locator("#help-visual-container .dia-camino")).toHaveCount(9);
  await pregunta(page, { clase: "cuantosDias", mes: 4, a: 5, b: 17 });
  if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
  await expect(page.locator("#help-visual-container .dia-camino")).toHaveCount(12);
});

test("no cuenta para el mapa ni el jardín, y queda en la vista para adultos y en el informe", async ({ page }) => {
  await alMenu(page);
  await pregunta(page, SEMANAS);
  await elegir(page, "17 días");
  await pregunta(page, ENTRE);
  await elegir(page, "22 días");
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);
  expect(await page.evaluate(() => otros["calendario:semanas"].map((i) => i.ok))).toEqual([1]);
  expect(await page.evaluate(() => otros["calendario:cuantosDias"].map((i) => i.ok))).toEqual([0]);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-calendario")).toContainText("El calendario (sus últimas respuestas):");
  await expect(page.locator(".adulto-calendario")).toContainText("días y semanas 1 de 1");
  await expect(page.locator(".adulto-calendario")).toContainText("días entre dos fechas 0 de 1");
  await page.evaluate(() => { window.print = () => {}; imprimirInforme(perfilActual); });
  await expect(page.locator("#informe")).toContainText("El calendario: 1 de 2 bien.");
});

test("diez aciertos: la victoria lo dice con la idea que hay que llevarse", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-calendario");
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); });
  }
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victory-table-name")).toHaveText("El Calendario");
  await expect(page.locator("#victoria-aprendido")).toHaveText("Resolviste 10 preguntas del calendario. Una semana tiene 7 días: por eso 3 semanas son 21 días, y en 10 días se avanza 1 semana y 3 días más.");
});

test("cabe en el teléfono: el calendario, las opciones a la vista y la ayuda, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    const nombre = `${tam.width}×${tam.height}`;
    // Mes con seis filas (empieza en domingo) y las opciones más largas.
    await pregunta(page, { clase: "diaSemana", forma: "mes", mes: 2, i: 6, k: 23 });
    const dibujo = await page.locator("#problema-texto svg.calendario-dibujo").boundingBox();
    expect(dibujo.width, nombre).toBeGreaterThanOrEqual(120);
    expect(dibujo.x + dibujo.width, nombre).toBeLessThanOrEqual(tam.width);
    if (tam.height > tam.width) {
      const abajo = await page.locator("#opciones .btn-option").evaluateAll((bs) => Math.max(...bs.map((b) => b.getBoundingClientRect().bottom)));
      expect(abajo, nombre).toBeLessThanOrEqual(tam.height);
    }
    for (const reto of [MES, { clase: "meses", forma: "despues", mes: 6, n: 2 }, { clase: "cuantosDias", mes: 4, a: 27, b: 9 }]) {
      await pregunta(page, reto);   // «miércoles», «septiembre», «días»
      const anchos = await page.locator("#opciones .btn-option").evaluateAll((bs) => bs.map((b) => [b.scrollWidth, b.clientWidth]));
      for (const [scroll, cliente] of anchos) expect(scroll, `${nombre} ${JSON.stringify(reto)}`).toBeLessThanOrEqual(cliente);
      if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
      expect(await page.evaluate(() => document.documentElement.scrollWidth), nombre).toBeLessThanOrEqual(tam.width);
    }
    // Los nudillos, cada puño en una fila.
    await pregunta(page, ABRIL);
    if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
    const filas = await page.locator("#help-visual-container .punio").evaluateAll((ps) => ps.map((p) => new Set([...p.children].map((c) => Math.round(c.getBoundingClientRect().bottom))).size));
    expect(filas, nombre).toEqual([1, 1]);   // una fila por puño, con los meses apoyados abajo
  }
});
