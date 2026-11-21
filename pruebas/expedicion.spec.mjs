// Expedición de hoy (Hito 4.5): un recorrido corto en dos paradas (lo que
// toca aprender y una ronda de «Enséñale a Lumi») que, al completarse, planta
// un banderín en el mundo: uno por día.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { instalarDobles, pasarDescubrir, responder, siguiente } from "./ayudas.mjs";

// El inicio de serie: el mundo (las demás pruebas usan la lista).
test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] } });

async function alMundo(page, conDiagnostico = true) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  if (conDiagnostico) await page.evaluate(() => { almacen.guardar("diagnostico", "saltado"); mostrarPantalla("screen-selector"); });
  await expect(page.locator("#mundo-vivo")).toBeVisible();
}
const refrescar = (page) => page.evaluate(() => mostrarPantalla("screen-selector"));
const estrellas = (page) => page.evaluate(() => globalStars);
const guardadas = (page) => page.evaluate(() => JSON.parse(almacen.leer("expediciones") || "[]"));
const dia = (page, k) => page.evaluate((k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10), k);
/** Gana la partida en curso sin pasar por los botones. */
const ganarPartida = (page) => page.evaluate(() => {
  for (let i = 0; i < 10; i++) { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); }
  endGameSuccess();
});
/** Una ronda de «Enséñale a Lumi» en la que Lumi siempre acierta: cinco «sí». */
async function rondaDeLumi(page) {
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => { if (!ensenar.duda.acierta) ensenar.duda = nuevaDuda(dudaDeTabla(), 0.1); });
    await page.click(ensenarBoton(await page.evaluate(() => ensenar.duda.acierta)));
    await page.click("#ensenar-sigue");
  }
}
/** Anota los sonidos que se piden desde ahora (window.__sonados). */
const espiarSonidos = (page) => page.evaluate(() => { const original = sonar; window.__sonados = []; window.sonar = (n) => { window.__sonados.push(n); original(n); }; });
const ensenarBoton = (acierta) => (acierta ? ".ensenar-si" : ".ensenar-no");
/** Se saben esas tablas (escritas bien y rápido en dos días). */
const saber = (page, tablas) => page.evaluate((tablas) => {
  const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
  for (const a of tablas) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: d(1), m: "e", ok: 1, ms: 2000 }, { d: d(0), m: "e", ok: 1, ms: 2000 }];
  guardarHechos();
  mostrarPantalla("screen-selector");
}, tablas);

test("en un jardín sin nada jugado no hay expedición: primero va el diagnóstico", async ({ page }) => {
  await alMundo(page, false);
  await expect(page.locator("#seguir-que")).toHaveText("¿Qué tablas ya sabes?");
  await expect(page.locator("#expedicion")).toBeHidden();
  expect(await page.evaluate(() => { empezarExpedicion(); return [expedicion, pantallaActual]; })).toEqual([null, "screen-selector"]);
});

test("la tarjeta dice las dos paradas, lo que se gana y cómo salir", async ({ page }) => {
  await alMundo(page);
  await expect(page.locator("#expedicion")).toBeVisible();
  await expect(page.locator("#expedicion-titulo")).toHaveText("Expedición de hoy");
  await expect(page.locator(".expedicion-paradas li")).toHaveText(["1Parada 1: Tabla del 2", "2Parada 2: Enséñale a Lumi"]);
  await expect(page.locator("#expedicion-estado")).toHaveText("Dos paradas cortas y plantas un banderín en tu mundo.");
  await expect(page.locator("#btn-expedicion")).toHaveText("Salir de expedición");
  await expect(page.locator("#btn-expedicion")).toHaveAccessibleDescription("Dos paradas cortas y plantas un banderín en tu mundo.");
  await expect(page.locator(".banderin-mundo")).toHaveCount(0);
  // Va antes del mapa, y «Seguir» sigue en su sitio.
  const orden = await page.evaluate(() => ["btn-seguir", "expedicion", "mundo-mapa"].map((id) => document.getElementById(id).getBoundingClientRect().top));
  expect([...orden].sort((a, b) => a - b)).toEqual(orden);
});

test("la expedición entera, tocando: la tabla, la victoria con la segunda parada, Lumi y el banderín", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMundo(page);
  await page.click("#btn-expedicion");
  await pasarDescubrir(page);
  expect(await page.evaluate(() => [currentTable, expedicion.paso])).toEqual([2, 1]);
  for (let i = 0; i < 10; i++) {
    await responder(page, true);
    await siguiente(page);
  }
  await expect(page.locator("#screen-victory")).toBeVisible();
  await expect(page.locator("#victoria-expedicion")).toBeVisible();
  await expect(page.locator("#victoria-expedicion p")).toHaveText("Expedición de hoy: primera parada lista. ¡Falta una!");
  await expect(page.locator("#btn-expedicion-sigue")).toHaveText("Siguiente parada: Enséñale a Lumi");
  await page.click("#btn-expedicion-sigue");
  await expect(page.locator("#screen-ensenar")).toBeVisible();
  await expect(page.locator("#ensenar-expedicion")).toHaveText("Expedición de hoy · parada 2 de 2");
  expect(await page.evaluate(() => expedicion.paso)).toBe(2);
  const antes = await estrellas(page);
  await espiarSonidos(page);
  await rondaDeLumi(page);
  expect(await page.evaluate(() => window.__sonados.filter((n) => n === "nivel"))).toEqual(["nivel"]);   // la fanfarria del banderín
  await expect(page.locator("#ensenar-nota")).toHaveText("Ganaste 5 estrellas. ¡Expedición completa! Plantaste un banderín en tu mundo y ganaste 5 estrellas más.");
  expect(await estrellas(page)).toBe(antes + 5 + 5);
  expect(await guardadas(page)).toEqual([await dia(page, 0)]);
  expect(await page.evaluate(() => expedicion)).toBeNull();
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("Resolvimos 5 dudas de 5. ¡Qué bien enseñas! ¡Expedición completa! Plantaste un banderín en tu mundo y ganaste 5 estrellas más.");
  await page.click("#ensenar-sigue");
  // De vuelta en el mundo: el banderín plantado y la tarjeta al día.
  await expect(page.locator("#mundo-vivo")).toBeVisible();
  await expect(page.locator(".banderin-mundo")).toHaveCount(1);
  await expect(page.locator("#expedicion-estado")).toHaveText("¡Hecha hoy! Llevas 1 banderín. Puedes repetirla.");
  await expect(page.locator("#btn-expedicion")).toHaveText("Repetir la expedición");
});

test("repetirla el mismo día no da otro banderín ni más estrellas de premio", async ({ page }) => {
  await alMundo(page);
  const hoyDia = await dia(page, 0);
  await page.evaluate((d) => almacen.guardar("expediciones", JSON.stringify([d])), hoyDia);
  await refrescar(page);
  await page.click("#btn-expedicion");
  await pasarDescubrir(page);
  await ganarPartida(page);
  await page.click("#btn-expedicion-sigue");
  const antes = await estrellas(page);
  await rondaDeLumi(page);
  await expect(page.locator("#ensenar-nota")).toHaveText("Ganaste 5 estrellas. ¡Expedición completa otra vez! Tu banderín de hoy ya está plantado.");
  expect(await estrellas(page)).toBe(antes + 5);
  expect(await guardadas(page)).toEqual([hoyDia]);
});

test("al otro día se planta otro banderín, con su premio", async ({ page }) => {
  await alMundo(page);
  const [ayer, hoyDia] = [await dia(page, 1), await dia(page, 0)];
  await page.evaluate((d) => almacen.guardar("expediciones", JSON.stringify([d])), ayer);
  await refrescar(page);
  await expect(page.locator("#expedicion-estado")).toHaveText("Llevas 1 banderín. ¡Planta el de hoy!");
  await expect(page.locator("#btn-expedicion")).toHaveText("Salir de expedición");
  await expect(page.locator(".banderin-mundo")).toHaveCount(1);
  await page.click("#btn-expedicion");
  await pasarDescubrir(page);
  await ganarPartida(page);
  await page.click("#btn-expedicion-sigue");
  const antes = await estrellas(page);
  await rondaDeLumi(page);
  expect(await estrellas(page)).toBe(antes + 10);
  expect(await guardadas(page)).toEqual([ayer, hoyDia]);
  await page.click("#ensenar-sigue");
  await expect(page.locator(".banderin-mundo")).toHaveCount(2);
  await expect(page.locator("#expedicion-estado")).toHaveText("¡Hecha hoy! Llevas 2 banderines. Puedes repetirla.");
});

test("se completa aunque Lumi y quien juega no resuelvan ninguna duda: cuenta el recorrido", async ({ page }) => {
  await alMundo(page);
  await page.evaluate(() => { expedicion = { paso: 2 }; mostrarEnsenar(); });
  for (let i = 0; i < 5; i++) {
    await page.click(ensenarBoton(!(await page.evaluate(() => ensenar.duda.acierta))));   // siempre al revés
    await page.click("#ensenar-sigue");
  }
  await expect(page.locator("#ensenar-nota")).toHaveText("¡Expedición completa! Plantaste un banderín en tu mundo y ganaste 5 estrellas más.");
  expect(await guardadas(page)).toHaveLength(1);
});

test("dejarla a medias la cancela sin quitar nada, y una partida suelta no ofrece la segunda parada", async ({ page }) => {
  await alMundo(page);
  await page.click("#btn-expedicion");
  await pasarDescubrir(page);
  expect(await page.evaluate(() => expedicion.paso)).toBe(1);
  await page.evaluate(() => backToSelector());
  expect(await page.evaluate(() => expedicion)).toBeNull();
  // Una partida por fuera de la expedición: la victoria de siempre.
  await page.evaluate(() => startTable(2));
  await ganarPartida(page);
  await expect(page.locator("#screen-victory")).toBeVisible();
  await expect(page.locator("#victoria-expedicion")).toBeHidden();
  // Y «Enséñale a Lumi» por su cuenta no es una parada ni planta banderín.
  await page.evaluate(() => mostrarEnsenar());
  await expect(page.locator("#ensenar-expedicion")).toBeHidden();
  await espiarSonidos(page);
  await rondaDeLumi(page);
  expect(await page.evaluate(() => window.__sonados)).not.toContain("nivel");
  await expect(page.locator("#ensenar-nota")).toHaveText("Ganaste 5 estrellas.");
  expect(await guardadas(page)).toEqual([]);
});

test("salir de la victoria hacia otra pantalla también la cancela", async ({ page }) => {
  await alMundo(page);
  await page.click("#btn-expedicion");
  await pasarDescubrir(page);
  await ganarPartida(page);
  await expect(page.locator("#victoria-expedicion")).toBeVisible();
  await page.evaluate(() => mostrarPantalla("screen-jardin"));
  expect(await page.evaluate(() => expedicion)).toBeNull();
});

test("la primera parada es siempre de tablas: si «Seguir» propone la Aventura, la expedición no", async ({ page }) => {
  await alMundo(page);
  await saber(page, [2, 5]);
  await expect(page.locator("#seguir-que")).toHaveText(/^La Aventura/);
  await expect(page.locator("#expedicion-parada-1")).toHaveText("Tabla del 3");
  await page.click("#btn-expedicion");
  await pasarDescubrir(page);
  expect(await page.evaluate(() => currentTable)).toBe(3);
  // Con todo florecido, «Seguir» manda a la Aventura y la expedición a un reto de lógica.
  await page.evaluate(() => backToSelector());
  await saber(page, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(await page.evaluate(() => [siguientePaso().tipo, siguientePaso(true).tipo])).toEqual(["aventura", "logica"]);
  await expect(page.locator("#expedicion-parada-1")).toHaveText("Un reto de lógica");
  await page.click("#btn-expedicion");
  await expect(page.locator("#screen-game")).toBeVisible();
  expect(await page.evaluate(() => [currentTable, expedicion.paso])).toEqual(["logica", 1]);
});

test("los banderines: uno por día hasta diez a la vista, sin tapar los lugares, y lo guardado se limpia", async ({ page }) => {
  await alMundo(page);
  const dias = [];
  for (let k = 12; k >= 1; k--) dias.push(await dia(page, k));
  await page.evaluate((d) => almacen.guardar("expediciones", JSON.stringify([...d, d[0], "ayer", 7, null])), dias);
  await saber(page, [1, 2, 3, 4, 5, 6, 7, 8, 9]);   // con todas las flores del camino a la vista
  await expect(page.locator(".flor-mundo")).toHaveCount(await page.evaluate(() => FLORES_MUNDO.length));
  expect(await page.evaluate(() => leerExpediciones().length)).toBe(12);
  await expect(page.locator("#expedicion-estado")).toHaveText("Llevas 12 banderines. ¡Planta el de hoy!");
  await expect(page.locator(".banderin-mundo")).toHaveCount(10);
  const choques = await page.evaluate(() => {
    const cajas = (sel) => [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect());
    const toca = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const banderines = cajas(".banderin-mundo");
    const mapa = document.getElementById("mundo-mapa").getBoundingClientRect();
    return banderines.filter((b, i) => [...cajas(".lugar-mundo"), ...cajas(".flor-mundo"), ...cajas(".lumi-mundo")].some((o) => toca(b, o))
      || banderines.some((o, j) => j !== i && toca(b, o)) || b.left < mapa.left || b.right > mapa.right).length;
  });
  expect(choques).toBe(0);
  // Algo que no es una lista no rompe nada.
  await page.evaluate(() => almacen.guardar("expediciones", '{"a":1}'));
  await refrescar(page);
  await expect(page.locator(".banderin-mundo")).toHaveCount(0);
  await page.evaluate(() => almacen.guardar("expediciones", "no es json"));
  expect(await page.evaluate(() => leerExpediciones())).toEqual([]);
});

test("solo se guardan los últimos 60 días", async ({ page }) => {
  await alMundo(page);
  const viejos = Array.from({ length: 60 }, (_, i) => `2025-${String(1 + Math.floor(i / 28)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`);
  await page.evaluate((d) => { almacen.guardar("expediciones", JSON.stringify(d)); expedicion = { paso: 2 }; completarExpedicion(); }, viejos);
  const ahora = await guardadas(page);
  expect(ahora).toHaveLength(60);
  expect(ahora[0]).toBe(viejos[1]);
  expect(ahora.at(-1)).toBe(await dia(page, 0));
});

test("los banderines son de cada jardín y viajan en la copia de seguridad", async ({ page }) => {
  await alMundo(page);
  const hoyDia = await dia(page, 0);
  await page.evaluate((d) => almacen.guardar("expediciones", JSON.stringify([d])), hoyDia);
  expect(await page.evaluate(() => Object.values(armarCopia().datos)[0].expediciones)).toBe(JSON.stringify([hoyDia]));
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.endsWith("expediciones")))).toEqual(["jardin:p1:expediciones"]);
});

test("armar un equipo cancela la expedición: en equipo la victoria no ofrece la segunda parada", async ({ page }) => {
  await alMundo(page);
  await page.click("#btn-expedicion");
  await pasarDescubrir(page);
  await page.evaluate(() => mostrarEquipo());
  await expect(page.locator("#screen-equipo")).toBeVisible();
  expect(await page.evaluate(() => expedicion)).toBeNull();
});

test("cabe en el teléfono, con botones de 44 px, y pasa la revisión de accesibilidad", async ({ page }, testInfo) => {
  await alMundo(page);
  const medidas = async (sel) => page.locator(sel).evaluate((e) => { const r = e.getBoundingClientRect(); return [r.height, r.right, document.documentElement.clientWidth, document.documentElement.scrollWidth]; });
  let [alto, derecha, ancho, total] = await medidas("#btn-expedicion");
  expect(alto).toBeGreaterThanOrEqual(44);
  expect(derecha).toBeLessThanOrEqual(ancho);
  expect(total).toBeLessThanOrEqual(ancho);
  let axe = await new AxeBuilder({ page }).include("#expedicion").analyze();
  expect(axe.violations.map((v) => v.id), `${testInfo.project.name}: tarjeta`).toEqual([]);
  await page.click("#btn-expedicion");
  await pasarDescubrir(page);
  await ganarPartida(page);
  [alto, derecha, ancho, total] = await medidas("#btn-expedicion-sigue");
  expect(alto).toBeGreaterThanOrEqual(44);
  expect(derecha).toBeLessThanOrEqual(ancho);
  expect(total).toBeLessThanOrEqual(ancho);
  axe = await new AxeBuilder({ page }).include("#victoria-expedicion").analyze();
  expect(axe.violations.map((v) => v.id), `${testInfo.project.name}: victoria`).toEqual([]);
});

test.describe("con el menú en lista", () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }, { name: "jardin:ajustes", value: '{"lista":true}' }] }] } });
  test("no hay tarjeta de expedición ni banderines: «Seguir» queda como estaba", async ({ page }) => {
    await page.goto("./");
    await page.fill("#player-name", "Ana");
    await page.click("#screen-welcome button:has-text('Comenzar')");
    await page.evaluate(() => { almacen.guardar("diagnostico", "saltado"); almacen.guardar("expediciones", JSON.stringify([hoy()])); mostrarPantalla("screen-selector"); });
    await expect(page.locator("#btn-seguir")).toBeVisible();
    await expect(page.locator("#expedicion")).toBeHidden();
    await expect(page.locator(".banderin-mundo")).toHaveCount(0);
  });
});
