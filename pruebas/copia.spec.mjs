// Cuidar el progreso: copia de seguridad que guarda el adulto, aviso para
// instalar en iPad/iPhone y pedir al navegador que conserve los datos.
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida } from "./ayudas.mjs";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Una carpeta sin acentos: setInputFiles no sube archivos cuya ruta los
// tiene, y la de salida de cada prueba toma el título («versión», «No»…).
const carpeta = () => mkdtemp(join(tmpdir(), "jardin-copia-"));

const flor = [rapida("2026-11-01"), rapida("2026-11-02")];

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00"));
});

async function entrar(page, nombre, mundo) {
  await page.fill("#player-name", nombre);
  if (mundo) await page.click(`#screen-welcome .elegir-mundo label:has(input[value="${mundo}"])`);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

async function dosJardines(page) {
  await page.goto("./");
  await entrar(page, "Ana", "flores");
  await ponerIntentos(page, "7x8", flor);
  await page.evaluate(() => { ganarEstrellas(40); comprar("mariposa"); });
  await page.click("#screen-selector >> text=Cambiar de jugador");
  await entrar(page, "Leo", "dinos");
  await ponerIntentos(page, "3x4", flor);
}

async function descargarCopia(page, testInfo) {
  await page.click("#screen-selector >> text=Para las personas adultas");
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.click("#btn-copia")]);
  expect(descarga.suggestedFilename()).toBe("jardin-magico-copia-2026-11-03.json");
  const ruta = join(await carpeta(), "copia.json");
  await descarga.saveAs(ruta);
  return ruta;
}

test("la copia guarda todos los jardines y se recupera en otro dispositivo", async ({ page, browser }, testInfo) => {
  await dosJardines(page);
  const ruta = await descargarCopia(page, testInfo);
  await expect(page.locator("#cuidar-estado")).toContainText("Última copia descargada: 3 de noviembre.");
  const copia = JSON.parse(await readFile(ruta, "utf8"));
  expect(copia).toMatchObject({ app: "jardin-magico-multiplicaciones", version: 1, creada: "2026-11-03" });
  expect(copia.perfiles.map((p) => [p.nombre, p.mundo])).toEqual([["Ana", "flores"], ["Leo", "dinos"]]);
  expect(Object.keys(copia.datos.p1)).toEqual(expect.arrayContaining(["intentos", "estrellas", "compras"]));

  // Otro dispositivo: un navegador limpio, con un jardín propio que se reemplaza.
  const otro = await browser.newPage();
  await otro.clock.setFixedTime(new Date("2026-11-03T12:00:00"));
  await otro.goto("./");
  await entrar(otro, "Prueba");
  await otro.click("#screen-selector >> text=Para las personas adultas");
  await otro.setInputFiles("#archivo-copia", ruta);
  await expect(otro.locator("#confirmar-copia-texto")).toHaveText(
    "La copia del 3 de noviembre tiene 2 jardines: Ana, Leo. Reemplaza todos los jardines de este dispositivo. No se puede deshacer.");
  await otro.click("#btn-copia-si");
  await expect(otro.locator("#aviso-copia")).toHaveText("Copia recuperada.");
  await expect(otro.locator(".tarjeta-adulto")).toHaveCount(2);
  await otro.click("text=Volver");
  await expect(otro.locator(".btn-perfil")).toHaveCount(2);
  await otro.click(".btn-perfil:has-text('Ana')");
  expect(await otro.evaluate(() => [estadoHecho(7, 8), globalStars, compras, document.body.dataset.mundo]))
    .toEqual(["florecida", 30, ["mariposa"], "flores"]);
  const claves = await otro.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("jardin:p")));
  expect(claves.some((k) => k.includes("Prueba"))).toBe(false);
  expect(await otro.evaluate(() => perfiles.map((p) => p.nombre))).toEqual(["Ana", "Leo"]);   // «Prueba» se reemplazó
  await otro.close();
});

test("recuperar pide confirmar; «No» no toca nada", async ({ page }, testInfo) => {
  await dosJardines(page);
  const ruta = await descargarCopia(page, testInfo);
  await page.evaluate(() => registrarIntento(9, 9, true));
  await page.setInputFiles("#archivo-copia", ruta);
  await expect(page.locator("#btn-copia-no")).toBeFocused();   // lo seguro, a mano
  await page.click("#btn-copia-no");
  await expect(page.locator("#confirmar-copia")).toBeHidden();
  expect(await page.evaluate(() => intentosDe(9, 9).length)).toBe(1);
});

test("un archivo que no es una copia, dañado o de una versión más nueva, no cambia nada", async ({ page }, testInfo) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await page.click("#screen-selector >> text=Para las personas adultas");
  const casos = [
    ["{no es json", "El archivo no es una copia del jardín."],
    [JSON.stringify({ app: "otra-cosa", perfiles: [], datos: {} }), "El archivo no es una copia del jardín."],
    [JSON.stringify({ app: "jardin-magico-multiplicaciones", version: 99, perfiles: [{ id: "p1", nombre: "X" }], datos: {} }),
      "La copia es de una versión más nueva del juego: actualízalo y vuelve a intentarlo."],
    [JSON.stringify({ app: "jardin-magico-multiplicaciones", version: 1, perfiles: [{ id: "../x", nombre: 3 }], datos: {} }),
      "La copia no tiene ningún jardín."],
  ];
  for (const [i, [contenido, mensaje]] of casos.entries()) {
    const ruta = join(await carpeta(), `mala-${i}.json`);
    await writeFile(ruta, contenido);
    await page.setInputFiles("#archivo-copia", ruta);
    await expect(page.locator("#aviso-copia"), `caso ${i}`).toHaveText(mensaje);
    await expect(page.locator("#confirmar-copia")).toBeHidden();
  }
  expect(await page.evaluate(() => perfiles.map((p) => p.nombre))).toEqual(["Ana"]);
});

test("solo se recuperan claves conocidas de perfiles válidos", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => revisarCopia(JSON.stringify({
    app: "jardin-magico-multiplicaciones", version: 1, creada: "2026-11-01",
    perfiles: [{ id: "p1", nombre: "Ana", mundo: "bosque", emoji: "🦉", iniciado: true }, { id: "p1", nombre: "Doble" }],
    datos: { p1: { intentos: "{}", estrellas: "5", ajustes: "{}", "otra-clave": "x", compras: 7 } },
  })));
  expect(r.perfiles.map((p) => p.nombre)).toEqual(["Ana"]);   // sin ids repetidos
  expect(r.datos).toEqual({ p1: { intentos: "{}", estrellas: "5" } });
});

test("en iPad o iPhone sin instalar, avisa cómo instalarlo; si no, no", async ({ browser }) => {
  const ipad = await browser.newContext({
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const p = await ipad.newPage();
  await p.goto("http://localhost:4173/jardin-magico-multiplicaciones/");
  await p.click("#screen-welcome >> text=Para las personas adultas");
  await expect(p.locator("#cuidar-ios")).toBeVisible();
  await expect(p.locator("#cuidar-ios")).toContainText("Añadir a pantalla de inicio");
  await ipad.close();
});

test("en un navegador de escritorio no sale el aviso de iPad", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "el proyecto tableta emula otro dispositivo");
  await page.goto("./");
  await page.click("#screen-welcome >> text=Para las personas adultas");
  await expect(page.locator("#cuidar-ios")).toBeHidden();
  await expect(page.locator("#cuidar-estado")).toContainText("Aún no has guardado ninguna copia.");
});

test.describe("lo que encontró la revisión", () => {
  test("una copia con fechas que no existen se recupera sin romper la vista para adultos", async ({ page }) => {
    await page.goto("./");
    await entrar(page, "Ana");
    await page.click("#screen-selector >> text=Para las personas adultas");
    const ruta = join(await carpeta(), "fechas.json");
    await writeFile(ruta, JSON.stringify({
      app: "jardin-magico-multiplicaciones", version: 1, creada: "2026-13-45",
      perfiles: [{ id: "p1", nombre: "Leo", iniciado: true }],
      datos: { p1: { intentos: JSON.stringify({ "3x4": [{ d: "2026-13-01", m: "e", ok: "0", ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: "x" }] }) } },
    }));
    await page.setInputFiles("#archivo-copia", ruta);
    await expect(page.locator("#confirmar-copia-texto")).toHaveText(
      "La copia tiene 1 jardín: Leo. Reemplaza todos los jardines de este dispositivo. No se puede deshacer.");
    await page.click("#btn-copia-si");
    await expect(page.locator("#aviso-copia")).toHaveText("Copia recuperada.");
    // El «ok» de texto no cuenta como acierto, la fecha mala queda vacía y el tiempo malo, sin medir.
    expect(await page.evaluate(() => intentosDe(3, 4))).toEqual([
      { d: "", m: "e", ok: 0, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: null }]);
    await page.click("text=Volver");
    await page.click("#screen-welcome >> text=Para las personas adultas");   // sigue abriéndose
    await expect(page.locator(".tarjeta-adulto .adulto-cuesta")).toHaveText("Le cuestan más: 3 × 4 (falló 1 de las últimas 2).");
  });

  test("una copia sin ningún jardín empezado se rechaza, y no se guarda una así", async ({ page }) => {
    await page.goto("./");
    await page.click("#screen-welcome >> text=Para las personas adultas");
    await page.click("#btn-copia");
    await expect(page.locator("#aviso-copia")).toHaveText("Aún no hay ningún jardín que guardar.");
    await expect(page.locator("#cuidar-estado")).toContainText("Aún no has guardado ninguna copia.");
    expect(await page.evaluate(() => revisarCopia(JSON.stringify({
      app: "jardin-magico-multiplicaciones", version: 1, perfiles: [{ id: "p1", nombre: "", iniciado: false }], datos: {} }))))
      .toBe("La copia no tiene ningún jardín.");
  });

  test("si el dispositivo no deja guardar a medias, no se cambia nada", async ({ page }, testInfo) => {
    await dosJardines(page);
    const ruta = await descargarCopia(page, testInfo);
    await page.evaluate(() => registrarIntento(9, 9, true));   // lo de ahora, que no debe perderse
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      let n = 0;
      Storage.prototype.setItem = function (k, v) {
        // Falla una escritura a mitad de la recuperación, como si se llenara.
        if (k.startsWith("jardin:p") && ++n === 3) throw new DOMException("lleno", "QuotaExceededError");
        return original.call(this, k, v);
      };
      window.__restaurar = () => { Storage.prototype.setItem = original; };
    });
    await page.setInputFiles("#archivo-copia", ruta);
    await page.click("#btn-copia-si");
    await expect(page.locator("#aviso-copia")).toHaveText(
      "No se pudo recuperar la copia: este dispositivo no dejó guardarla (¿sin espacio?). No se cambió nada.");
    await page.evaluate(() => window.__restaurar());
    await page.reload();
    await page.click(".btn-perfil:has-text('Leo')");
    expect(await page.evaluate(() => [intentosDe(9, 9).length, perfiles.map((p) => p.nombre)])).toEqual([1, ["Ana", "Leo"]]);
  });

  test("lo guardado dañado no da estrellas negativas ni rompe la misión", async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem("sembrado")) return;
      localStorage.setItem("jardin:estrellas", "-100");
      localStorage.setItem("jardin:misiones", JSON.stringify({ hoy: { d: "2026-11-03", tipo: "partida", cuenta: "mucho", cumplida: "sí" }, dias: [] }));
      sessionStorage.setItem("sembrado", "1");
    });
    await page.goto("./");
    expect(await page.evaluate(() => [globalStars, misiones.hoy.cuenta, misiones.hoy.cumplida])).toEqual([0, 0, false]);
  });

  test("con intentos de la versión antigua (sin fecha), no dice que no ha jugado", async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem("sembrado")) return;
      localStorage.setItem("jardin:nombre", "Ana");
      localStorage.setItem("jardin:hechos", JSON.stringify({ "3x4": "11" }));
      sessionStorage.setItem("sembrado", "1");
    });
    await page.goto("./");
    await page.click("#screen-welcome >> text=Para las personas adultas");
    await expect(page.locator(".adulto-resumen")).toContainText("Casi: 1.");
    await expect(page.locator(".adulto-cuesta")).toHaveText("Le cuestan más: nada por ahora.");
  });

  test("pedir que conserve los datos espera a que un adulto abra su vista", async ({ page }) => {
    await page.addInitScript(() => {
      window.__pedidos = 0;
      if (navigator.storage) {
        navigator.storage.persist = async () => { window.__pedidos++; return true; };
        navigator.storage.persisted = async () => false;
      }
    });
    await page.goto("./");
    await entrar(page, "Ana");
    expect(await page.evaluate(() => window.__pedidos)).toBe(0);
    await page.click("#screen-selector >> text=Para las personas adultas");
    await expect(page.locator("#cuidar-estado")).toContainText("Este navegador se comprometió a conservar los datos.");
    expect(await page.evaluate(() => window.__pedidos)).toBe(1);
  });
});
