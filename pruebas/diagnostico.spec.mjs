// Diagnóstico inicial (issue #61): unas preguntas cortas y opcionales para no
// empezar por la del 2 a quien ya se la sabe. Lo sabido se siembra como
// «casi» y «Seguir» sigue desde la primera tabla que falta.
import { test, expect } from "@playwright/test";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Responde el diagnóstico entero: `sabe(a)` dice si conoce la tabla a. Devuelve cuántas preguntas hubo. */
async function responderComo(page, sabe) {
  let preguntas = 0;
  while (await page.locator("#diag-pregunta:not(.hidden)").count()) {
    const [a, b] = (await page.textContent("#diag-op")).split("×").map((x) => parseInt(x, 10));
    if (sabe(a)) await page.click(`#diag-opciones [data-valor="${a * b}"]`);
    else await page.click("#diag-nose");
    preguntas++;
    if (preguntas > 30) throw new Error("el diagnóstico no termina");
  }
  return preguntas;
}

test("en un jardín nuevo, «Seguir» propone primero averiguar qué tablas ya sabe", async ({ page }) => {
  await alMenu(page);
  await expect(page.locator("#seguir-que")).toHaveText("¿Qué tablas ya sabes?");
  await page.click("#btn-seguir");
  await expect(page.locator("#screen-diagnostico")).toBeVisible();
  await expect(page.locator("#diag-op")).toHaveText(/^[2-9] × [3-9]$/);
  await expect(page.locator("#diag-opciones button")).toHaveCount(4);
  await expect(page.locator("#diag-progreso")).toHaveText("Pregunta 1");
});

test("las opciones traen la respuesta y errores típicos, sin repetir", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => Array.from({ length: 30 }, () => {
    const [a, b] = [2 + Math.floor(Math.random() * 8), 3 + Math.floor(Math.random() * 7)];
    const o = opcionesDiagnostico(a, b);
    return { ok: o.includes(a * b), distintas: new Set(o).size === 4, positivas: o.every((x) => x > 0) };
  }));
  expect(r.every((x) => x.ok && x.distintas && x.positivas)).toBe(true);
});

test("quien sabe todas: 16 preguntas, todo sembrado como «casi», y sigue con lo que falta", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-seguir");
  expect(await responderComo(page, () => true)).toBe(16);
  await expect(page.locator("#diag-resumen")).toHaveText("¡Ya sabes la del 2, la del 3, la del 4, la del 5, la del 6, la del 7, la del 8 y la del 9!");
  await expect(page.locator("#diag-detalle")).toContainText("como «casi»");
  const estados = await page.evaluate(() => [1, 2, 9].map((a) => [1, 5, 10].map((b) => estadoHecho(a, b))).flat());
  expect(new Set(estados)).toEqual(new Set(["casi"]));   // nada florecido: eso pide escribir rápido otro día
  await page.click("#diag-seguir");
  await expect(page.locator("#seguir-que")).toHaveText("Que florezca lo que falta");
});

test("quien no sabe ninguna: se para tras dos tablas, no siembra nada y empieza por la del 2", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-seguir");
  expect(await responderComo(page, () => false)).toBe(4);
  await expect(page.locator("#diag-resumen")).toHaveText("¡Empezamos desde el principio!");
  await expect(page.locator("#diag-saltar")).toBeHidden();   // ya terminó
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);
  await page.click("#diag-seguir");
  await expect(page.locator("#seguir-que")).toHaveText("Tabla del 2");
  await expect(page.locator("#seguir-detalle")).toContainText("Nueva");   // se descubre desde el principio
  await page.click("#btn-seguir");
  await expect(page.locator("#screen-descubrir")).toBeVisible();
});

test("quien sabe la mitad (2, 5 y 3): se para al fallar la del 4 y la del 9, y sigue por la del 4", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-seguir");
  expect(await responderComo(page, (a) => [2, 5, 3].includes(a))).toBe(10);
  await expect(page.locator("#diag-resumen")).toHaveText("¡Ya sabes la del 2, la del 3 y la del 5!");
  // Sembradas como «casi»: las de las tablas que sabe (y la del 1). 4 × 2 también,
  // porque es la misma planta que 2 × 4; las propias del 4 y del 9, no.
  expect(await page.evaluate(() => [estadoHecho(1, 7), estadoHecho(5, 7), estadoHecho(4, 2), estadoHecho(4, 4), estadoHecho(9, 9)]))
    .toEqual(["casi", "casi", "casi", "nuevo", "nuevo"]);
  await page.click("#diag-seguir");
  await expect(page.locator("#seguir-que")).toHaveText("Tabla del 4");
});

test("una tabla con una bien y una mal no cuenta como sabida", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-seguir");
  let primera = true;
  const preguntas = await responderComo(page, (a) => {
    if (a !== 2) return false;
    const r = primera; primera = false; return r;   // de la del 2, solo la primera
  });
  expect(preguntas).toBe(4);
  await expect(page.locator("#diag-resumen")).toHaveText("¡Empezamos desde el principio!");
});

test("se puede saltar: vuelve al menú y no lo vuelve a proponer", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-seguir");
  await page.click("#diag-saltar");
  await expect(page.locator("#screen-selector")).toBeVisible();
  await expect(page.locator("#seguir-que")).toHaveText("Tabla del 2");
  await page.reload();
  await page.click(".btn-perfil:has-text('Ana')");
  await expect(page.locator("#seguir-que")).toHaveText("Tabla del 2");
});

test("hecho una vez, no se repite; y quien ya jugó nunca lo ve", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-seguir");
  await responderComo(page, () => false);
  await page.click("#diag-seguir");
  expect(await page.evaluate(() => siguientePaso().tipo)).not.toBe("diagnostico");
  await page.evaluate(() => { almacen.borrar("diagnostico"); registrarIntento(2, 3, true); mostrarPantalla("screen-selector"); });
  expect(await page.evaluate(() => siguientePaso().tipo)).not.toBe("diagnostico");
});

test("cabe en el teléfono, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    await page.evaluate(() => empezarDiagnostico());
    const abajo = await page.locator("#diag-nose").boundingBox();
    expect(abajo.y + abajo.height, `${tam.width}×${tam.height}`).toBeLessThanOrEqual(tam.height);
  }
});
