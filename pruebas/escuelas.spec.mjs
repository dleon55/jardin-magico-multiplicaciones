// Listo para escuelas (Hito 7): la vista de adultos cuenta también «Antes de
// multiplicar» y el repaso semanal, trae ayuda para quien acompaña y un jardín
// de ejemplo para ver el juego avanzado sin tocar el de nadie.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}
const lineas = (page, id = null) => page.evaluate((id) => lineasDeActividad(id ?? perfilActual), id);

test("una ronda de «Antes de multiplicar» queda en la vista de adultos y cuenta como día de práctica", async ({ page }) => {
  await alMenu(page);
  expect(await lineas(page)).toEqual([]);
  await page.evaluate(() => { mostrarSemillero(); semillero.bien = 4; semillero.n = SEMILLERO_PREGUNTAS; terminarSemillero(); });
  expect(await lineas(page)).toEqual(["Antes de multiplicar (contar a saltos, grupos y dobles): 4 de 6 bien en 1 ronda."]);
  await page.evaluate(() => { mostrarSemillero(); semillero.bien = 6; semillero.n = SEMILLERO_PREGUNTAS; terminarSemillero(); });
  expect(await lineas(page)).toEqual(["Antes de multiplicar (contar a saltos, grupos y dobles): 10 de 12 bien en 2 rondas."]);
  expect(await page.evaluate(() => diasDeActividad(perfilActual))).toEqual([await page.evaluate(() => hoy())]);
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".tarjeta-adulto")).toContainText("Antes de multiplicar (contar a saltos, grupos y dobles): 10 de 12 bien en 2 rondas.");
  await expect(page.locator(".tarjeta-adulto")).toContainText("Practicó 1 de los últimos 14 días");
});

test("lo guardado dañado de «Antes de multiplicar» no rompe nada ni inventa cuentas", async ({ page }) => {
  await alMenu(page);
  const limpia = await page.evaluate(() => limpiarActividad(JSON.stringify({ semillero: { rondas: -3, bien: "x", preguntas: 2.5, ultimo: "ayer", dias: ["2026-11-01", 7, "2026-11-01"] } })).semillero);
  expect(limpia).toEqual({ rondas: 0, bien: 0, preguntas: 0, ultimo: "", dias: ["2026-11-01"] });
  expect(await page.evaluate(() => limpiarActividad("{no es json").semillero.rondas)).toBe(0);
});

test("el repaso de la semana se dice en la vista de adultos, con cuántas semanas y la última", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => almacen.guardar("repasos", JSON.stringify(["2026-11-16"])));
  expect(await lineas(page)).toEqual([`Repaso de la semana (ya sabe todas las tablas): hecho 1 semana (la última, la del ${await page.evaluate(() => fechaLarga("2026-11-16"))}).`]);
  await page.evaluate(() => almacen.guardar("repasos", JSON.stringify(["2026-11-23", "2026-11-09", "2026-11-16"])));
  expect(await lineas(page)).toEqual([`Repaso de la semana (ya sabe todas las tablas): hecho 3 semanas (la última, la del ${await page.evaluate(() => fechaLarga("2026-11-23"))}).`]);
});

test("la ayuda: seis preguntas cerradas que se abren al tocarlas, de una en una o varias", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarAdultos());
  const preguntas = page.locator("#ayuda-adultos details");
  await expect(preguntas).toHaveCount(6);
  expect(await preguntas.evaluateAll((ds) => ds.filter((d) => d.open).length)).toBe(0);
  await expect(preguntas.nth(2).locator("p")).toBeHidden();
  await preguntas.nth(2).locator("summary").click();
  await expect(preguntas.nth(2).locator("p")).toBeVisible();
  await expect(preguntas.nth(2).locator("p")).toContainText("en dos días distintos");
  // Con teclado también.
  await preguntas.nth(0).locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(preguntas.nth(0).locator("p")).toBeVisible();
  // La ayuda va antes de los ajustes y de las copias: es lo primero que busca quien llega.
  expect(await page.evaluate(() => [...document.querySelectorAll("#screen-adultos > section")].map((s) => s.id))).toEqual(["ayuda-adultos", "inicio-adultos", "cuidar"]);
});

test("la ayuda cabe en el teléfono, con todo abierto: sin desborde, de 44 px y accesible", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await alMenu(page);
  await page.evaluate(() => { mostrarAdultos(); document.querySelectorAll("#ayuda-adultos details").forEach((d) => { d.open = true; }); });
  const m = await page.evaluate(() => ({
    desborda: document.documentElement.scrollWidth > innerWidth,
    chicos: [...document.querySelectorAll("#ayuda-adultos summary, #btn-ejemplo")].filter((e) => e.getBoundingClientRect().height < 44).length,
  }));
  expect(m).toEqual({ desborda: false, chicos: 0 });
  const axe = await new AxeBuilder({ page }).include("#ayuda-adultos").analyze();
  await testInfo.attach("axe", { body: JSON.stringify(axe.violations, null, 2), contentType: "application/json" });
  expect(axe.violations).toEqual([]);
});

test("el jardín de ejemplo: se crea avanzado, no toca el de quien juega y no se duplica", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { registrarIntento(7, 7, true, { modo: "e", ms: 2000 }); guardarHechos(); ganarEstrellas(3); });
  const antes = await page.evaluate(() => ({ id: perfilActual, hechos: almacen.leer("hechos") ?? almacen.leer("intentos"), estrellas: almacen.leer("estrellas") }));
  await page.evaluate(() => mostrarAdultos());
  await page.click("#btn-ejemplo");
  await expect(page.locator("#screen-selector")).toBeVisible();
  await expect(page.locator("#display-name")).toHaveText("El jardín de Ejemplo");
  const e = await page.evaluate(() => ({
    id: perfilActual, estrellas: globalStars, sabidas: [1, 2, 3, 4, 5, 6].filter((n) => tablaSabida(n)),
    cuatro: [1, 5, 6].map((b) => (hechos[claveHecho(4, b)] ?? []).length), flores: cuentaPorEstado().florecida,
    banderines: leerExpediciones().length, cuesta: loQueCuesta(hechos).map((x) => `${x.a}x${x.b}`),
    nombres: perfiles.filter((p) => p.iniciado).map((p) => p.nombre), diagnostico: almacen.leer("diagnostico"),
  }));
  expect(e.id).not.toBe(antes.id);
  expect(e.estrellas).toBe(40);
  expect(e.sabidas).toEqual([2, 3, 5]);
  expect(e.cuatro).toEqual([1, 1, 0]);          // la del 4, a medias y de un solo día
  expect(e.flores).toBeGreaterThanOrEqual(20);  // lo sabido se hizo en dos días distintos: florece
  expect(e.banderines).toBe(3);
  expect(e.cuesta).toEqual(["6x8"]);
  expect(e.nombres).toEqual(["Ana", "Ejemplo"]);
  expect(e.diagnostico).toBe("saltado");
  // El jardín de Ana, intacto.
  const ana = await page.evaluate((id) => ({ hechos: almacen.leerDe(id, "hechos") ?? almacen.leerDe(id, "intentos"), estrellas: almacen.leerDe(id, "estrellas") }), antes.id);
  expect(ana).toEqual({ hechos: antes.hechos, estrellas: antes.estrellas });
  expect(antes.estrellas).toBe("3");
  // Sobrevive a recargar, y pedirlo otra vez entra al mismo sin volver a sembrar.
  await page.evaluate(() => ganarEstrellas(1));
  await page.reload();
  await page.evaluate(() => { mostrarAdultos(); abrirJardinDeEjemplo(); });
  expect(await page.evaluate(() => ({ n: perfiles.filter((p) => p.nombre === "Ejemplo").length, estrellas: globalStars, id: perfilActual }))).toEqual({ n: 1, estrellas: 41, id: e.id });
  // Y se borra como cualquier jardín, sin llevarse el de Ana.
  await page.evaluate((id) => borrarPerfil(id), e.id);
  expect(await page.evaluate(() => ({ nombres: perfiles.map((p) => p.nombre), estrellas: globalStars }))).toEqual({ nombres: ["Ana"], estrellas: 3 });
});

test("en la vista de adultos, el jardín de ejemplo se ve con su avance y sus días", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { abrirJardinDeEjemplo(); mostrarAdultos(); });
  const tarjeta = page.locator(".tarjeta-adulto", { hasText: "Ejemplo" });
  await expect(tarjeta).toContainText("Le cuestan más: 6 × 8 (falló las 2 últimas veces)");
  await expect(tarjeta).toContainText("Expedición de hoy: la completó 3 días");
  await expect(tarjeta).toContainText("Practicó 4 de los últimos 14 días");
});
