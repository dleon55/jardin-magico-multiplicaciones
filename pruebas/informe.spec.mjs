// Informe para adultos imprimible (issue #65): una hoja carta, sin servidor,
// con lo que ya está en el dispositivo: tablas, lo que cuesta, confusiones,
// días de práctica, fracciones y retos, y una idea para casa.
import { test, expect } from "@playwright/test";

async function entrar(page, nombre) {
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

/** Mucho jugado: estatus variados, confusiones, días, metas, fracciones, retos y Aventura. */
function jugarMucho(page) {
  return page.evaluate(() => {
    const dia = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    const sembrar = (n, dias, ms = 2000) => {
      for (let b = 1; b <= 10; b++) hechos[claveHecho(n, b)] = Array.from({ length: dias }, (_, i) => ({ d: dia(dias - 1 - i), m: "e", ok: 1, ms }));
    };
    sembrar(4, 1); sembrar(3, 2); sembrar(2, 3); sembrar(5, 3);
    registrarIntento(6, 8, false, { dada: 42 });
    registrarIntento(6, 8, false, { dada: 42 });
    registrarIntento(7, 9, false, { dada: 16 });
    registrarIntento(7, 9, false, { dada: 16 });
    registrarIntento(8, 9, false, { dada: 71 });
    guardarHechos();
    for (const clave of Object.keys(CLASES_OTROS)) for (let i = 0; i < 10; i++) registrarOtro(clave, i % 3 !== 0);
    almacen.guardar("misiones", JSON.stringify({ dias: [dia(0), dia(1), dia(3)] }));
    aventuraGuardada.alcanzado = 5; aventuraGuardada.estrellas = { "0-0": 3 }; aventuraGuardada.mejores = { "0-0": 500 }; guardarAventura();
  });
}

async function abrirInforme(page, nombre = "Ana") {
  await page.evaluate(() => { window.__impresiones = 0; window.print = () => { window.__impresiones++; }; });
  if (await page.locator("#screen-adultos").isHidden()) await page.click("#screen-selector >> text=Para las personas adultas");
  await page.locator(".tarjeta-adulto", { hasText: nombre }).locator(".btn-informe").click();
}

test("el botón de la vista para adultos arma el informe y abre el diálogo de imprimir", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await jugarMucho(page);
  await abrirInforme(page);
  expect(await page.evaluate(() => window.__impresiones)).toBe(1);
  const informe = page.locator("#informe");
  await expect(informe.locator("h1")).toHaveText("Informe del Jardín Mágico de las Multiplicaciones");
  await expect(informe.locator(".informe-quien")).toContainText("Ana · ");
  await expect(informe.locator(".informe-quien")).toContainText(String(new Date().getFullYear()));
});

test("en pantalla no se ve; al imprimir es lo único que sale", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await abrirInforme(page);
  await expect(page.locator("#informe")).toBeHidden();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#informe")).toBeVisible();
  await expect(page.locator("main")).toBeHidden();
  // Al cerrar el diálogo se vuelve a lo normal: imprimir otra pantalla sale como siempre.
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("#informe")).toBeHidden();
});

test("cabe en una sola hoja carta, aun con mucho jugado", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "page.pdf solo existe en Chromium");
  await page.goto("./");
  await entrar(page, "Ana");
  await jugarMucho(page);
  await abrirInforme(page);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const paginas = (pdf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;
  expect(paginas).toBe(1);
  // Carta: 8.5 × 11 pulgadas = 612 × 792 puntos.
  expect(pdf.toString("latin1")).toMatch(/\/MediaBox\s*\[\s*0 0 612 792\s*\]/);
});

test("dice cómo va cada tabla, cuáles domina, lo que le cuesta y las confusiones", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await jugarMucho(page);
  await abrirInforme(page);
  const informe = page.locator("#informe");
  const fila = (n) => informe.locator(`tr[data-tabla="${n}"]`);
  await expect(informe.locator("tbody tr")).toHaveCount(9);
  await expect(fila(2)).toContainText("Árbol con frutos: de memoria y repasada");
  await expect(fila(3)).toContainText("Árbol: entera de memoria");
  await expect(fila(4)).toContainText("Arbolito: se la sabe");
  await expect(fila(2)).toContainText("10 de 10");
  await expect(fila(2).locator("svg[data-estatus='frutos']")).toHaveCount(1);
  await expect(informe).toContainText("Tablas dominadas (enteras de memoria): la del 2, la del 3 y la del 5.");
  await expect(informe).toContainText("6 × 8");
  await expect(informe).toContainText("Se le cruzan: 6 × 8 con 6 × 7 (2 veces); sumar en lugar de multiplicar (2 veces).");
});

test("dice cuándo practica, la meta, las fracciones, los retos y la Aventura", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await jugarMucho(page);
  await abrirInforme(page);
  const informe = page.locator("#informe");
  await expect(informe).toContainText("Practicó 3 de los últimos 14 días");
  await expect(informe).toContainText("Cumplió la meta del día (acertar 10) 3 veces.");
  await expect(informe.locator(".informe-dias span")).toHaveCount(14);
  await expect(informe.locator(".informe-dias .si")).toHaveCount(3);
  await expect(informe).toContainText("Fracciones: de un número, 6 de 10 bien");
  await expect(informe).toContainText("Retos de lógica: ¿cuál da más?, 6 de 10 bien");
  await expect(informe).toContainText("La Aventura: va en el mundo 2 de 6.");
  await expect(informe.locator("footer")).toContainText("No se envió nada por internet.");
});

test("sin jugar: lo dice claro y sugiere empezar juntos", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await abrirInforme(page);
  const informe = page.locator("#informe");
  await expect(informe).toContainText("Aún no ha jugado a multiplicar.");
  await expect(informe).toContainText("Todavía no domina ninguna tabla entera de memoria.");
  await expect(informe.locator("tbody tr").first()).toContainText("Sin jugar");
  await expect(informe).not.toContainText("Fracciones, retos, división y Aventura");
  await expect(informe.locator(".informe-sugerencia")).toContainText("Siéntense juntos la primera vez");
});

test("la idea para casa es una sola y concreta, según lo que más ayuda ahora", async ({ page }) => {
  await page.goto("./");
  const s = (datos) => page.evaluate((d) => sugerenciaParaCasa({ h: { "2x3": [{}] }, cuesta: [], confusiones: [], practicados: 10, filas: [], ...d }), datos);
  expect(await s({ confusiones: [["6 × 8 con 6 × 7", 3]] })).toContain("«6 por 8, 48; 6 por 7, 42»");
  expect(await s({ confusiones: [["sumar en lugar de multiplicar", 2]] })).toContain("«¿cuántas veces?»");
  expect(await s({ confusiones: [["escribir las cifras al revés", 2]] })).toContain("en voz alta antes de escribirla");
  expect(await s({ cuesta: [{ a: 7, b: 8 }] })).toContain("Lo que más le cuesta ahora es 7 × 8. Pregúntesela una vez al día durante una semana, sin prisa. Si no le sale, que la piense desde una que sí sepa: 7 × 7, y sumar 7 más.");
  expect(await s({ practicados: 2 })).toContain("Cinco minutos casi todos los días");
  expect(await s({ filas: [{ n: 6, estatus: "arbolito" }] })).toContain("Ya se sabe la tabla del 6.");
  expect(await s({})).toContain("Va muy bien.");
  // La vecina va antes que lo que cuesta: es lo más concreto.
  expect(await s({ confusiones: [["6 × 8 con 6 × 7", 3]], cuesta: [{ a: 7, b: 8 }] })).toContain("6 por 8");
});

test("el informe de otro jardín usa lo de ese jardín, no lo del que juega", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await jugarMucho(page);
  await page.click("#screen-selector >> text=Cambiar de jugador");
  await entrar(page, "Leo");
  await abrirInforme(page, "Ana");
  await expect(page.locator("#informe .informe-quien")).toContainText("Ana");
  await expect(page.locator("#informe")).toContainText("Tablas dominadas (enteras de memoria): la del 2, la del 3 y la del 5.");
  await abrirInforme(page, "Leo");
  await expect(page.locator("#informe .informe-quien")).toContainText("Leo");
  await expect(page.locator("#informe")).toContainText("Aún no ha jugado a multiplicar.");
});

test("no contiene nada que no esté ya guardado en el dispositivo", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await jugarMucho(page);
  await abrirInforme(page);
  // Sin enlaces ni imágenes externas, y nada se pide a la red al armarlo.
  expect(await page.locator("#informe a, #informe img, #informe iframe").count()).toBe(0);
  const pedidos = [];
  page.on("request", (r) => pedidos.push(r.url()));
  await page.evaluate(() => imprimirInforme(perfilActual));
  expect(pedidos).toEqual([]);
});
