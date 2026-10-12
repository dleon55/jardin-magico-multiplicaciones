// Lo que cambia lo que el niño APRENDE. Se prueban las funciones reales del
// juego, cargado en el navegador, no una copia.
import { test, expect } from "@playwright/test";
import { entrarATabla, preguntaActual, responder, siguiente } from "./ayudas.mjs";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("las opciones son siempre 4, distintas, positivas e incluyen la correcta", async ({ page }) => {
  const fallos = await page.evaluate(() => {
    const malos = [];
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        for (let i = 0; i < 30; i++) {
          const o = generarOpciones(a, b, a * b);
          if (o.length !== 4 || new Set(o).size !== 4 || o.some((v) => v <= 0) || !o.includes(a * b)) {
            malos.push(`${a}x${b}: ${o}`);
          }
        }
      }
    }
    return malos;
  });
  expect(fallos).toEqual([]);
});

test("no se puede acertar sin multiplicar eligiendo el único múltiplo de la tabla", async ({ page }) => {
  // El generador anterior (resultado ±1..3) lo permitía en el 80 % de las
  // preguntas: la correcta era el único múltiplo de la tabla entre las cuatro.
  const proporcion = await page.evaluate(() => {
    let explotables = 0, total = 0;
    for (let a = 2; a <= 12; a++) {
      for (let b = 2; b <= 10; b++) {
        for (let i = 0; i < 40; i++) {
          total++;
          const o = generarOpciones(a, b, a * b);
          if (o.filter((v) => v % a === 0).length === 1) explotables++;
        }
      }
    }
    return explotables / total;
  });
  expect(proporcion).toBe(0);
});

test("las opciones incluyen el error real: un producto vecino de la tabla", async ({ page }) => {
  const conVecino = await page.evaluate(() => {
    let n = 0, total = 0;
    for (let b = 2; b <= 9; b++) {
      for (let i = 0; i < 40; i++) {
        total++;
        const o = generarOpciones(7, b, 7 * b);
        if (o.includes(7 * (b + 1)) || o.includes(7 * (b - 1))) n++;
      }
    }
    return n / total;
  });
  expect(conVecino).toBe(1);
});

test("la respuesta correcta cae en cualquier botón por igual", async ({ page }) => {
  // El barajado anterior la dejaba en el primer o último botón 2 de cada 3
  // veces. Fue lo primero que notó una niña jugando.
  const reparto = await page.evaluate(() => {
    const c = [0, 0, 0, 0];
    const N = 40000;
    for (let i = 0; i < N; i++) c[generarOpciones(7, 8, 56).indexOf(56)]++;
    return c.map((x) => x / N);
  });
  for (const p of reparto) expect(Math.abs(p - 0.25)).toBeLessThan(0.02);
});

test("diez preguntas de una tabla recorren la tabla entera, sin repetir", async ({ page }) => {
  const resultado = await page.evaluate(() => {
    let seguidas = 0, incompletas = 0;
    for (let s = 0; s < 2000; s++) {
      currentTable = 7; bolsa = []; ultimoHecho = "";
      const vistas = [];
      for (let i = 0; i < 10; i++) {
        const h = sacarDeLaBolsa();
        ultimoHecho = `${h.a}x${h.b}`;
        vistas.push(ultimoHecho);
      }
      if (vistas.some((v, i) => i > 0 && v === vistas[i - 1])) seguidas++;
      if (new Set(vistas).size !== 10) incompletas++;
    }
    return { seguidas, incompletas };
  });
  expect(resultado).toEqual({ seguidas: 0, incompletas: 0 });
});

test("lo que se falla vuelve: a los 2 turnos y otra vez más tarde", async ({ page }) => {
  await entrarATabla(page, 7);
  const fallada = (await preguntaActual(page)).texto;
  await responder(page, false);
  await siguiente(page);

  const vistas = [];
  for (let i = 0; i < 9; i++) {
    vistas.push((await preguntaActual(page)).texto);
    await responder(page, true);
    await siguiente(page);
    if (await page.isVisible("#screen-victory")) break;
  }
  const apariciones = vistas.map((v, i) => (v === fallada ? i : -1)).filter((i) => i >= 0);
  expect(apariciones[0], "primera vuelta: en el segundo turno").toBe(1);
  expect(apariciones.length, "dos vueltas de repaso").toBe(2);
});

test("equivocarse no alarga la partida ni hace retroceder el progreso", async ({ page }) => {
  await entrarATabla(page, 3);
  await responder(page, false);
  await expect(page.locator("#target-stars")).toHaveText("10");
  await siguiente(page);
  await responder(page, true);
  await expect(page.locator("#current-stars")).toHaveText("1");
  await expect(page.locator("#target-stars")).toHaveText("10");
});
