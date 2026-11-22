// Inicio simple: con el mundo a la vista hay menos cosas antes del mapa.
// La Expedición de hoy ocupa el lugar de «Seguir» (una sola propuesta), la
// meta del día va compacta y después del mundo, y el encabezado pierde el
// lema. Con el «Menú en lista», todo queda como estaba.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { pasarDescubrir } from "./ayudas.mjs";

const MUNDO = { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] };
const LISTA = { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }, { name: "jardin:ajustes", value: '{"lista":true}' }] }] };

async function entrar(page, conDiagnostico = true) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  if (conDiagnostico) await page.evaluate(() => { almacen.guardar("diagnostico", "saltado"); mostrarPantalla("screen-selector"); });
}
const saber = (page, tablas) => page.evaluate((tablas) => {
  const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
  for (const a of tablas) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: d(1), m: "e", ok: 1, ms: 2000 }, { d: d(0), m: "e", ok: 1, ms: 2000 }];
  guardarHechos();
  mostrarPantalla("screen-selector");
}, tablas);
/** El orden, de arriba abajo, de lo que se ve de esa lista de ids. */
const ordenVisible = (page, ids) => page.evaluate((ids) => ids.map((id) => document.getElementById(id)).filter((e) => e.offsetParent !== null)
  .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map((e) => e.id), ids);
const PIEZAS = ["cabecera-menu", "seguir", "expedicion", "mision", "mundo-vivo", "btn-progreso"];

test.describe("con el mundo a la vista", () => {
  test.use({ storageState: MUNDO });

  test("la Expedición ocupa el lugar de «Seguir»: una sola propuesta arriba, con Lumi", async ({ page }) => {
    await entrar(page);
    await expect(page.locator("#expedicion")).toBeVisible();
    await expect(page.locator("#seguir")).toBeHidden();
    await expect(page.locator("#expedicion-parada-1")).toHaveText("Tabla del 2");
    await expect(page.locator("#lumi-expedicion > svg")).toHaveAttribute("data-expresion", await page.evaluate(() => paradaUno().cara));
    await expect(page.locator("#expedicion-tambien")).toBeHidden();
    // En el teléfono: encabezado, expedición, el mundo, y después la meta y el progreso.
    if ((page.viewportSize()?.width ?? 0) < 700) expect(await ordenVisible(page, PIEZAS)).toEqual(["cabecera-menu", "expedicion", "mundo-vivo", "mision", "btn-progreso"]);
    await page.click("#btn-expedicion");
    await pasarDescubrir(page);
    expect(await page.evaluate(() => [currentTable, expedicion.paso])).toEqual([2, 1]);
  });

  test("en un jardín sin nada jugado sigue «Seguir» (el diagnóstico) y no hay expedición", async ({ page }) => {
    await entrar(page, false);
    await expect(page.locator("#seguir")).toBeVisible();
    await expect(page.locator("#seguir-que")).toHaveText("¿Qué tablas ya sabes?");
    await expect(page.locator("#expedicion")).toBeHidden();
    // Al saltar el diagnóstico, se intercambian.
    await page.evaluate(() => { almacen.guardar("diagnostico", "saltado"); mostrarPantalla("screen-selector"); });
    await expect(page.locator("#seguir")).toBeHidden();
    await expect(page.locator("#expedicion")).toBeVisible();
  });

  test("si lo que tocaba era la Aventura (un mundo recién abierto), la tarjeta lo ofrece aparte", async ({ page }) => {
    await entrar(page);
    await saber(page, [2, 5]);
    const sigue = await page.evaluate(() => siguientePaso());
    expect(sigue.tipo).toBe("aventura");
    await expect(page.locator("#expedicion-parada-1")).toHaveText("Tabla del 3");
    await expect(page.locator("#expedicion-tambien")).toBeVisible();
    await expect(page.locator("#expedicion-tambien")).toHaveText(`También puedes ir a ${sigue.que}`);
    await page.click("#expedicion-tambien");
    await expect(page.locator("#screen-aventura")).toBeVisible();
    expect(await page.evaluate(() => expedicion)).toBeNull();   // ir a la Aventura no es salir de expedición
    // Cuando «Seguir» ya no propone la Aventura, el botón se va.
    await page.evaluate(() => { window.siguientePaso = (sin) => ({ tipo: "tabla", tabla: 3, que: "Tabla del 3", detalle: "", cara: "contenta" }); mostrarPantalla("screen-selector"); });
    await expect(page.locator("#expedicion-tambien")).toBeHidden();
    await expect(page.locator("#expedicion-tambien")).toHaveText("");
  });

  test("el encabezado va sin lema y la meta del día compacta, sin la semana; el avance de la meta sigue a la vista", async ({ page }) => {
    await entrar(page);
    await expect(page.locator("#cabecera-lema")).toBeHidden();
    await expect(page.locator("#mision")).toBeVisible();
    await expect(page.locator("#mision-texto")).toContainText("0 de 10");
    await expect(page.locator("#mision-progreso")).toBeVisible();
    await expect(page.locator("#mision-semana")).toBeHidden();
    await expect(page.locator("#mision-leyenda")).toBeHidden();
    // La racha se sigue diciendo.
    await page.evaluate(() => { misiones.dias = [2, 1, 0].map((k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10)); mostrarPantalla("screen-selector"); });
    await expect(page.locator("#mision-racha")).toContainText("3 días seguidos");
  });

  test("el mundo queda más arriba: en el teléfono, su título se ve sin desplazarse", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await entrar(page);
    const titulo = await page.locator("#mundo-titulo").evaluate((e) => e.getBoundingClientRect().bottom);
    expect(titulo).toBeLessThan(844);
    const mapa = await page.locator("#mundo-mapa").evaluate((e) => e.getBoundingClientRect().top);
    expect(mapa).toBeLessThan(844);   // y asoma el mapa
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test("acostado, la expedición queda junto al encabezado, entera y sin tapar los ajustes", async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 });
    await entrar(page);
    const r = await page.evaluate(() => {
      const caja = (id) => document.getElementById(id).getBoundingClientRect();
      const [cab, exp, boton] = [caja("cabecera-menu"), caja("expedicion"), caja("btn-expedicion")];
      const ajustes = document.querySelector("#ajustes > summary").getBoundingClientRect();
      return { alLado: exp.left >= cab.right - 1 && Math.abs(exp.top - cab.top) < 4, botonAlto: boton.height, botonVisible: boton.bottom <= 360,
        tapa: ajustes ? exp.right > ajustes.left && exp.top < ajustes.bottom && exp.left < ajustes.right && exp.bottom > ajustes.top : null,
        desborda: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    expect(r.alLado).toBe(true);
    expect(r.botonAlto).toBeGreaterThanOrEqual(44);
    expect(r.botonVisible).toBe(true);
    expect(r.tapa).toBe(false);
    expect(r.desborda).toBe(false);
  });

  test("cambiar a «Menú en lista» y volver deja cada cosa en su sitio", async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => { ajustes.lista = true; aplicarAjustes(); mostrarPantalla("screen-selector"); });
    await expect(page.locator("#seguir")).toBeVisible();
    await expect(page.locator("#expedicion")).toBeHidden();
    await expect(page.locator("#cabecera-lema")).toBeVisible();
    await expect(page.locator("#mision-semana")).toBeVisible();
    expect(await page.evaluate(() => document.getElementById("mision").compareDocumentPosition(document.getElementById("mundo-vivo")) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
    await page.evaluate(() => { ajustes.lista = false; aplicarAjustes(); mostrarPantalla("screen-selector"); });
    await expect(page.locator("#seguir")).toBeHidden();
    await expect(page.locator("#expedicion")).toBeVisible();
    await expect(page.locator("#mision-semana")).toBeHidden();
    expect(await page.evaluate(() => document.getElementById("mision").compareDocumentPosition(document.getElementById("mundo-vivo")) & Node.DOCUMENT_POSITION_PRECEDING)).toBeTruthy();
    expect(await page.evaluate(() => document.querySelectorAll("#mision").length)).toBe(1);
  });

  test("el inicio pasa la revisión de accesibilidad, con botones de 44 px", async ({ page }, testInfo) => {
    await entrar(page);
    await saber(page, [2, 5]);
    const chicos = await page.evaluate(() => [...document.querySelectorAll("#expedicion button")].filter((b) => b.offsetParent !== null && b.getBoundingClientRect().height < 44).map((b) => b.id));
    expect(chicos).toEqual([]);
    const axe = await new AxeBuilder({ page }).include("#cabecera-menu").include("#expedicion").include("#mision").analyze();
    expect(axe.violations.map((v) => v.id), testInfo.project.name).toEqual([]);
  });
});

test.describe("con el menú en lista", () => {
  test.use({ storageState: LISTA });
  test("nada cambia: «Seguir», el lema, la meta con su semana antes del menú, y sin expedición", async ({ page }) => {
    await entrar(page);
    await expect(page.locator("#seguir")).toBeVisible();
    await expect(page.locator("#expedicion")).toBeHidden();
    await expect(page.locator("#cabecera-lema")).toBeVisible();
    await expect(page.locator("#mision-semana")).toBeVisible();
    await expect(page.locator("#mision-leyenda")).toBeVisible();
    if ((page.viewportSize()?.width ?? 0) < 700) expect(await ordenVisible(page, [...PIEZAS, "menu-lista"])).toEqual(["cabecera-menu", "seguir", "mision", "menu-lista"]);
    expect(await page.evaluate(() => document.getElementById("screen-selector").classList.contains("inicio-mundo"))).toBe(false);
  });
});
