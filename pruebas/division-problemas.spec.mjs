// Fase 4: dividir como multiplicar al revés, y problemas cortos del jardín.
// Dividir sale de lo que ya se sabe multiplicar; los problemas piden decidir
// qué operación hace falta. Ninguno de los dos toca el mapa ni el jardín.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { escribir, ponerIntentos, rapida, elegida, siguiente, instalarDobles } from "./ayudas.mjs";

const HOY = "2026-11-08";
const AYER = "2026-11-07";
const florecida = [rapida(AYER), rapida(HOY)];

/** Fija el día y deja una misión «partida» ya elegida, para que no dependa del calendario. */
async function preparar(page) {
  await page.clock.setFixedTime(new Date(`${HOY}T12:00:00`));
  await page.addInitScript((hoy) => {
    if (sessionStorage.getItem("sembrado")) return;
    localStorage.setItem("jardin:misiones", JSON.stringify({ hoy: { d: hoy, tipo: "partida", cuenta: 0, cumplida: false }, dias: [] }));
    sessionStorage.setItem("sembrado", "1");
  }, HOY);
}

async function alSelector(page) {
  await page.goto("./");
  await page.click("#screen-welcome button");
}

async function abrir(page, modo) {
  await page.click(`[onclick="startTable('${modo}')"]`);
  await page.waitForSelector("#screen-game:not(.hidden)");
}

/** Responde la pregunta en curso, bien o mal, eligiendo o escribiendo según toque. */
async function contestar(page, acertar) {
  const { valor, escrita } = await page.evaluate(() => ({ valor: correctAnswer, escrita: modoEscrito }));
  if (escrita) {
    await escribir(page, acertar ? valor : valor + 1);
    return;
  }
  const ops = await page.$$eval(".btn-option", (bs) => bs.map((b) => Number(b.dataset.valor)));
  await page.click(`#opt-${acertar ? ops.indexOf(valor) : ops.findIndex((o) => o !== valor)}`);
}

test.describe("dividir: la multiplicación al revés", () => {
  test("pregunta «producto ÷ divisor», la respuesta es el otro factor y no cuenta para el mapa", async ({ page }) => {
    await preparar(page);
    await alSelector(page);
    await abrir(page, "div");
    const p = await page.evaluate(() => ({ a: numA, b: numB, respuesta: correctAnswer, texto: document.getElementById("question-text").innerText }));
    expect(p.texto).toBe(`${p.a * p.b} ÷ ${p.a}`);
    expect(p.respuesta).toBe(p.b);
    await expect(page.locator("#problema-texto")).toBeHidden();
    const ops = await page.$$eval(".btn-option", (bs) => bs.map((b) => Number(b.dataset.valor)));
    expect(ops).toContain(p.b);

    await contestar(page, true);
    await expect(page.locator("#game-feedback")).toContainText(`${p.a * p.b} ÷ ${p.a} = ${p.b}, porque ${p.a} × ${p.b} = ${p.a * p.b}.`);
    // Ni florece ni se registra: el mapa mide la multiplicación de memoria.
    expect(await page.evaluate(() => Object.keys(hechos))).toEqual([]);
  });

  test("con pocas multiplicaciones sabidas, divide entre 2, 3, 4 y 5", async ({ page }) => {
    await preparar(page);
    await page.goto("./");
    const bolsa = await page.evaluate(() => bolsaDeDivisiones());
    expect(bolsa).toHaveLength(40);
    expect(new Set(bolsa.map((d) => d.a))).toEqual(new Set([2, 3, 4, 5]));
    expect(bolsa.every((d) => d.b >= 1 && d.b <= 10)).toBe(true);
  });

  test("con 6 o más sabidas, divide solo con esas, en los dos sentidos y entre 2 y 9", async ({ page }) => {
    await preparar(page);
    await page.goto("./");
    for (const k of ["7x8", "6x9", "3x4", "2x5", "1x7", "4x10"]) await ponerIntentos(page, k, florecida);
    const bolsa = await page.evaluate(() => bolsaDeDivisiones().map((d) => `${d.a * d.b}÷${d.a}`).sort());
    // 7 × 8 da 56 ÷ 7 y 56 ÷ 8; 1 × 7 solo 7 ÷ 7; 4 × 10 solo 40 ÷ 4.
    expect(bolsa).toEqual(["10÷2", "10÷5", "12÷3", "12÷4", "40÷4", "54÷6", "54÷9", "56÷7", "56÷8", "7÷7"].sort());
  });

  test("las opciones falsas son errores de verdad: un grupo de más, uno de menos y el divisor", async ({ page }) => {
    await page.goto("./");
    const ordenar = (l) => [...l].sort((x, y) => x - y);
    expect(ordenar(await page.evaluate(() => generarOpcionesDivision(6, 3)))).toEqual([2, 3, 4, 6]);
    // 5 ÷ 5 = 1: el 0 no vale como opción, se completa con 3.
    expect(ordenar(await page.evaluate(() => generarOpcionesDivision(5, 1)))).toEqual([1, 2, 3, 5]);
    for (let i = 0; i < 20; i++) {
      const ops = await page.evaluate(() => generarOpcionesDivision(8, 7));
      expect(new Set(ops).size).toBe(4);
      expect(ops).toContain(7);
      expect(ops.every((o) => o > 0)).toBe(true);
    }
  });

  test("al fallar explica con la multiplicación, lo dice en voz y la vuelve a preguntar", async ({ page }) => {
    await instalarDobles(page, [{ lang: "es-MX" }]);
    await preparar(page);
    await alSelector(page);
    await abrir(page, "div");
    const { a, b } = await page.evaluate(() => ({ a: numA, b: numB }));
    await contestar(page, false);
    await expect(page.locator("#game-feedback")).toHaveText(`¡Casi! ${a * b} ÷ ${a} = ${b}, porque ${a} × ${b} = ${a * b}. Te la vuelvo a preguntar en un ratito 🌱`);
    const dicho = await page.evaluate(() => window.__dicho.map((d) => d.texto));
    expect(dicho).toContain(`${a * b} entre ${a} es ${b}, porque ${a} por ${b} es ${a * b}.`);
    expect(await page.evaluate(() => colaRepaso.map((r) => `${r.a}x${r.b}`))).toEqual([`${a}x${b}`]);
    expect(await page.evaluate(() => Object.keys(hechos))).toEqual([]);
  });

  test("se escribe si la multiplicación de debajo ya floreció; si no, se elige", async ({ page }) => {
    await preparar(page);
    await page.goto("./");
    await ponerIntentos(page, "7x8", florecida);
    // «Casi» y acertada la última vez: al multiplicar ya se escribiría, pero
    // dividirla aún es nuevo.
    await ponerIntentos(page, "3x4", [elegida(AYER), elegida(HOY)]);
    const modos = await page.evaluate(() => {
      startTable("div");
      const r = [];
      for (const [a, b] of [[8, 7], [7, 8], [6, 7], [4, 3]]) {
        cancelarEspera(); colaRepaso = []; bolsa = [{ a, b }];
        nextQuestion();
        r.push([document.getElementById("question-text").innerText, modoEscrito]);
      }
      return r;
    });
    expect(modos).toEqual([["56 ÷ 8", true], ["56 ÷ 7", true], ["42 ÷ 6", false], ["12 ÷ 4", false]]);
    await expect(page.locator("#escritura-aviso")).toHaveText("Esta multiplicación ya te la sabes: escribe la respuesta.");
  });

  test("la ayuda reparte en filas y da el camino, no la respuesta", async ({ page }) => {
    await instalarDobles(page, [{ lang: "es-MX" }]);
    await preparar(page);
    await alSelector(page);
    await abrir(page, "div");
    await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 8, b: 7 }]; nextQuestion(); });
    await page.click("#btn-help");
    await expect(page.locator("#help-truco")).toHaveText("Dividir es multiplicar al revés: piensa en la multiplicación: 8 × ? = 56. Cuenta de 8 en 8 (8, 16, 24…) hasta llegar a 56.");
    await expect(page.locator("#help-explain")).toHaveText("56 puntos repartidos en 8 filas iguales. ¿Cuántos hay en cada fila?");
    await expect(page.locator("#help-visual-container .punto")).toHaveCount(56);
    const dicho = await page.evaluate(() => window.__dicho.at(-1).texto);
    expect(dicho).toContain("8 por cuánto es 56");
    expect(dicho).not.toMatch(/[×÷?…]/);
  });

  test("una partida completa de dividir termina con lo que se resolvió y cumple la misión", async ({ page }) => {
    await preparar(page);
    await alSelector(page);
    await abrir(page, "div");
    for (let i = 0; i < 10; i++) {
      await contestar(page, true);
      await siguiente(page);
    }
    await expect(page.locator("#victory-table-name")).toHaveText("La División del Jardín");
    await expect(page.locator("#victoria-aprendido")).toContainText("Resolviste 10 divisiones. Dividir es multiplicar al revés");
    await expect(page.locator("#victoria-mision")).toBeVisible();
    expect(await page.evaluate(() => Object.keys(hechos))).toEqual([]);
  });
});

test.describe("problemas cortos del jardín", () => {
  test("la bolsa es mitad de multiplicar y mitad de dividir, con factores del 2 al 9", async ({ page }) => {
    await page.goto("./");
    const bolsa = await page.evaluate(() => bolsaDeProblemas());
    const por = (op) => bolsa.filter((p) => p.op === op).length;
    expect(Math.abs(por("×") - por("÷"))).toBeLessThanOrEqual(1);
    expect(por("×") + por("÷")).toBe(bolsa.length);
    expect(bolsa.every((p) => p.a >= 2 && p.a <= 9 && p.b >= 2 && p.b <= 9)).toBe(true);
  });

  test("todas las historias usan sus números, y la respuesta sale de la operación correcta", async ({ page }) => {
    await page.goto("./");
    const malos = await page.evaluate(() => {
      const errores = [];
      currentTable = "problemas";
      for (const op of ["×", "÷"]) {
        PROBLEMAS[op].forEach((_, t) => {
          for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) {
            const p = armarPregunta({ a, b, op, t });
            const esperada = op === "×" ? a * b : b;
            const numeros = op === "×" ? [a, b] : [a * b, a];
            const faltan = numeros.filter((n) => !new RegExp(`\\b${n}\\b`).test(p.texto));
            if (p.respuesta !== esperada || faltan.length || !p.explicacion.includes(`= ${esperada}`)) errores.push(`${op}${t} ${a},${b}`);
          }
        });
      }
      return errores;
    });
    expect(malos).toEqual([]);
  });

  test("el problema se lee arriba, el girasol pregunta, y el lector de pantalla lo oye una vez", async ({ page }) => {
    await instalarDobles(page, [{ lang: "es-MX" }]);
    await preparar(page);
    await alSelector(page);
    await abrir(page, "problemas");
    await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 4, b: 6, op: "÷", t: 0 }]; nextQuestion(); });
    const texto = "Tienes 24 semillas y las repartes en 4 macetas, las mismas en cada una. ¿Cuántas semillas van en cada maceta?";
    await expect(page.locator("#problema-texto")).toHaveText(texto);
    await expect(page.locator("#problema-texto")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator('#question-text [aria-hidden="true"]')).toHaveText("¿?");
    await expect(page.locator("#question-text .sr-only")).toHaveText(texto);
    expect(await page.evaluate(() => [correctAnswer, window.__dicho.at(-1).texto])).toEqual([6, texto]);

    await contestar(page, true);
    await expect(page.locator("#game-feedback")).toContainText("Es una división: 24 ÷ 4 = 6. Van 6 semillas en cada maceta.");
    expect(await page.evaluate(() => Object.keys(hechos))).toEqual([]);
  });

  test("la pista dice qué operación pide la historia", async ({ page }) => {
    await preparar(page);
    await alSelector(page);
    await abrir(page, "problemas");
    await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 3, b: 5, op: "×", t: 0 }]; nextQuestion(); });
    await page.click("#btn-help");
    await expect(page.locator("#help-truco")).toHaveText("Pista: hay 3 grupos iguales, y en cada uno hay 5. Para juntar grupos iguales, se multiplica.");
    await expect(page.locator("#help-truco")).not.toContainText("15");
    await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 3, b: 5, op: "÷", t: 2 }]; nextQuestion(); });
    await expect(page.locator("#help-truco")).toContainText("Para repartir, se divide: piensa en la multiplicación: 3 × ? = 15.");
  });

  test("un problema fallado vuelve con la misma historia", async ({ page }) => {
    await preparar(page);
    await alSelector(page);
    await abrir(page, "problemas");
    await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 7, b: 3, op: "÷", t: 1 }]; nextQuestion(); });
    const historia = await page.textContent("#problema-texto");
    await contestar(page, false);
    await expect(page.locator("#game-feedback")).toContainText("¡Casi! Es una división: 21 ÷ 7 = 3. Llenas 3 canastas.");
    const vuelve = await page.evaluate(() => {
      cancelarEspera();
      bolsa = [{ a: 2, b: 2, op: "×", t: 0 }, { a: 2, b: 3, op: "×", t: 0 }];
      nextQuestion(); nextQuestion();
      return document.getElementById("problema-texto").innerText;
    });
    expect(vuelve).toBe(historia);
  });

  test("una partida completa de problemas cuenta cuántos de cada operación", async ({ page }) => {
    await preparar(page);
    await alSelector(page);
    await abrir(page, "problemas");
    for (let i = 0; i < 10; i++) {
      await contestar(page, true);
      await siguiente(page);
    }
    await expect(page.locator("#victory-table-name")).toHaveText("Los Problemas del Jardín");
    const frase = await page.textContent("#victoria-aprendido");
    const [, m, d] = frase.match(/Resolviste (\d+) problemas? de multiplicar y (\d+) problemas? de dividir/);
    expect(Number(m) + Number(d)).toBe(10);
    await expect(page.locator("#victoria-mision")).toBeVisible();
  });
});

test.describe("accesibilidad de lo nuevo", () => {
  async function auditar(page, contexto) {
    await page.evaluate(() => { if (espera) clearTimeout(espera.temporizador); });
    await page.waitForTimeout(400);
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const resumen = resultado.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    expect(resumen, `violaciones en ${contexto}`).toEqual([]);
  }

  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: "reduce" }); });

  test("división con la ayuda abierta, y un problema tras fallarlo", async ({ page }) => {
    await preparar(page);
    await alSelector(page);
    await auditar(page, "el selector con los botones nuevos");
    await abrir(page, "div");
    await page.click("#btn-help");
    await auditar(page, "la división");
    await page.locator("#screen-game").getByRole("button", { name: /Menú/ }).click();
    await abrir(page, "problemas");
    await auditar(page, "el problema");
    await contestar(page, false);
    await auditar(page, "el problema fallado");
  });
});
