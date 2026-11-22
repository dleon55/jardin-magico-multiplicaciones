// Lo nuevo del Hito 4 en la vista para las personas adultas y en el informe:
// «Enséñale a Lumi», la Expedición de hoy y los retos con código. Ninguno
// toca el jardín, así que su cuenta se lleva aparte (clave «actividad»).
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-14T12:00:00"));
});

async function entrar(page, nombre = "Ana") {
  await page.goto("./");
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}
const actividad = (page) => page.evaluate(() => JSON.parse(localStorage.getItem(`jardin:${perfilActual}:actividad`)));
const lineas = (page) => page.evaluate(() => lineasDeActividad(perfilActual));
/** Una duda fija de «Enséñale a Lumi»: azar < 0.25, Lumi acierta. */
const duda = (page, azar) => page.evaluate((azar) => { ensenar.duda = nuevaDuda(dudaDeTabla(), azar); }, azar);
const abrirAdultos = (page) => page.click("#screen-selector >> text=Para las personas adultas");
const tarjeta = (page, nombre = "Ana") => page.locator(".tarjeta-adulto", { hasText: nombre });

test("sin haber jugado nada de eso, no se guarda ni se muestra nada", async ({ page }) => {
  await entrar(page);
  expect(await actividad(page)).toBeNull();
  expect(await lineas(page)).toEqual([]);
  await abrirAdultos(page);
  await expect(tarjeta(page).locator(".adulto-actividad")).toHaveCount(0);
});

test("Enséñale a Lumi: cuenta las rondas, las dudas resueltas y los errores de Lumi que se notaron", async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => mostrarEnsenar());
  // Cinco dudas: 1) error, se nota y se corrige bien; 2) error, se deja pasar; 3) Lumi acierta y se dice que sí;
  // 4) Lumi acierta y se dice que no; 5) error, se nota (corregir mal una vez y luego bien: ya no cuenta como resuelta).
  await duda(page, 0.9);
  await page.click(".ensenar-no");
  await page.click(`.ensenar-opcion[data-valor="${await page.evaluate(() => ensenar.duda.pregunta.respuesta)}"]`);
  expect(await actividad(page)).toMatchObject({ ensenar: { atrapados: 1, pasados: 0, rondas: 0, ultimo: "2026-11-14" } });
  await page.click("#ensenar-sigue");
  await duda(page, 0.9);
  await page.click(".ensenar-si");
  expect((await actividad(page)).ensenar).toMatchObject({ atrapados: 1, pasados: 1 });
  await page.click("#ensenar-sigue");
  await duda(page, 0.1);
  await page.click(".ensenar-si");
  await page.click("#ensenar-sigue");
  await duda(page, 0.1);
  await page.click(".ensenar-no");
  expect((await actividad(page)).ensenar).toMatchObject({ atrapados: 1, pasados: 1 });   // cuando Lumi acierta no hay error que notar
  await page.click("#ensenar-sigue");
  await duda(page, 0.9);
  await page.click(".ensenar-no");
  const buena = await page.evaluate(() => ensenar.duda.pregunta.respuesta);
  const malas = await page.locator(".ensenar-opcion").evaluateAll((bs, buena) => bs.map((b) => b.dataset.valor).filter((v) => Number(v) !== buena), buena);
  await page.click(`.ensenar-opcion[data-valor="${malas[0]}"]`);
  await page.click(`.ensenar-opcion[data-valor="${buena}"]`);
  await page.click("#ensenar-sigue");
  await expect(page.locator("#ensenar-cuenta")).toHaveText("2 de 5");
  expect((await actividad(page)).ensenar).toEqual({ rondas: 1, dudas: 5, bien: 2, atrapados: 2, pasados: 1, ultimo: "2026-11-14", dias: ["2026-11-14"] });
  expect(await lineas(page)).toEqual(["Enséñale a Lumi: 1 ronda; resolvió 2 de 5 dudas. Notó 2 de 3 errores de Lumi."]);
  // Dejar una ronda a medias no cuenta como ronda.
  await page.evaluate(() => { mostrarEnsenar(); backToSelector(); });
  expect((await actividad(page)).ensenar.rondas).toBe(1);
});

test("retos con código: los creados, los recibidos, los aciertos y las marcas superadas", async ({ page }) => {
  await entrar(page);
  const jugar = (marca, aciertos) => page.evaluate(([marca, aciertos]) => {
    mostrarRetos();
    empezarReto({ tablas: [2, 5], semilla: 7, marca });
    for (let i = 0; i < 10; i++) {
      const q = retoEnJuego.preguntas[retoEnJuego.n - 1];
      responderReto(i < aciertos ? q.respuesta : q.opciones.find((o) => o !== q.respuesta), document.querySelector(".reto-opcion"));
      siguientePreguntaDeReto();
    }
  }, [marca, aciertos]);
  await jugar(null, 8);
  expect((await actividad(page)).retos).toEqual({ creados: 1, recibidos: 0, superados: 0, aciertos: 8, preguntas: 10, ultimo: "2026-11-14", dias: ["2026-11-14"] });
  expect(await lineas(page)).toEqual(["Retos con código: 8 de 10 bien en 1 reto."]);
  await jugar(6, 9);   // recibido y superado
  expect(await lineas(page)).toEqual(["Retos con código: 17 de 20 bien en 2 retos. Superó la marca en 1 de 1 recibido."]);
  await jugar(6, 6);   // empate: no la supera
  await jugar(6, 2);   // por debajo
  expect((await actividad(page)).retos).toEqual({ creados: 1, recibidos: 3, superados: 1, aciertos: 25, preguntas: 40, ultimo: "2026-11-14", dias: ["2026-11-14"] });
  expect(await lineas(page)).toEqual(["Retos con código: 25 de 40 bien en 4 retos. Superó la marca en 1 de 3 recibidos."]);
  // Salir a medias no cuenta.
  await page.evaluate(() => { mostrarRetos(); empezarReto({ tablas: [2], semilla: 1, marca: null }); backToSelector(); });
  expect((await actividad(page)).retos.creados).toBe(1);
});

test("la vista de adultos lo dice en la tarjeta de cada quien, con la expedición y su último día", async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    almacen.guardar("actividad", JSON.stringify({ ensenar: { rondas: 3, dudas: 15, bien: 11, atrapados: 7, pasados: 2, ultimo: "2026-11-14" },
      retos: { creados: 2, recibidos: 0, superados: 0, aciertos: 15, preguntas: 20, ultimo: "2026-11-13" } }));
    almacen.guardar("expediciones", JSON.stringify(["2026-11-13", "2026-11-10", "2026-11-12"]));
  });
  await abrirAdultos(page);
  await expect(tarjeta(page).locator(".adulto-actividad p")).toHaveText([
    "Enséñale a Lumi: 3 rondas; resolvió 11 de 15 dudas. Notó 7 de 9 errores de Lumi.",
    "Expedición de hoy: la completó 3 días (el último, el 13 de noviembre).",
    "Retos con código: 15 de 20 bien en 2 retos.",
  ]);
});

test("solo sale lo que se jugó: una expedición sola, o rondas en las que Lumi nunca se equivocó", async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => almacen.guardar("expediciones", JSON.stringify(["2026-11-14"])));
  expect(await lineas(page)).toEqual(["Expedición de hoy: la completó 1 día (el último, el 14 de noviembre)."]);
  await page.evaluate(() => { almacen.guardar("expediciones", "[]"); almacen.guardar("actividad", JSON.stringify({ ensenar: { rondas: 2, dudas: 10, bien: 10 } })); });
  expect(await lineas(page)).toEqual(["Enséñale a Lumi: 2 rondas; resolvió 10 de 10 dudas."]);
});

test("cada jardín lleva lo suyo: lo de Ana no sale en la tarjeta de Beto", async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    almacen.guardar("actividad", JSON.stringify({ retos: { creados: 1, aciertos: 9, preguntas: 10, ultimo: "2026-11-14" } }));
    almacen.guardar("expediciones", JSON.stringify(["2026-11-14"]));
  });
  const beto = await page.evaluate(() => { const p = nuevoPerfil("Beto", true); guardarPerfiles(); return p.id; });
  expect(beto).toBe("p2");
  expect(await page.evaluate(() => [lineasDeActividad("p1").length, lineasDeActividad("p2").length])).toEqual([2, 0]);
  await page.evaluate(() => mostrarAdultos());
  await expect(tarjeta(page, "Ana").locator(".adulto-actividad")).toHaveCount(1);
  await expect(tarjeta(page, "Beto").locator(".adulto-actividad")).toHaveCount(0);
});

test("el informe imprimible lo incluye, junto a los otros temas", async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    almacen.guardar("actividad", JSON.stringify({ ensenar: { rondas: 1, dudas: 5, bien: 4, atrapados: 3, pasados: 1, ultimo: "2026-11-14" },
      retos: { creados: 0, recibidos: 2, superados: 2, aciertos: 19, preguntas: 20, ultimo: "2026-11-14" } }));
    almacen.guardar("expediciones", JSON.stringify(["2026-11-14"]));
    window.print = () => {};
  });
  await abrirAdultos(page);
  await tarjeta(page).locator(".btn-informe").click();
  await expect(page.locator("#informe .informe-actividad")).toHaveText([
    "Enséñale a Lumi: 1 ronda; resolvió 4 de 5 dudas. Notó 3 de 4 errores de Lumi.",
    "Expedición de hoy: la completó 1 día (el último, el 14 de noviembre).",
    "Retos con código: 19 de 20 bien en 2 retos. Superó la marca en 2 de 2 recibidos.",
  ]);
  await expect(page.locator("#informe")).toContainText("Otros temas y la Aventura");
});

test("lo guardado dañado no rompe nada, y viaja en la copia de seguridad", async ({ page }) => {
  await entrar(page);
  const limpia = (texto) => page.evaluate((t) => limpiarActividad(t), texto);
  const vacia = await page.evaluate(() => ACTIVIDAD_VACIA);
  for (const malo of ["no es json", "null", "[]", '"hola"', '{"ensenar":7,"retos":null}']) expect(await limpia(malo)).toEqual(vacia);
  expect(await limpia(JSON.stringify({ ensenar: { rondas: -3, dudas: 2.5, bien: "9", atrapados: 4, ultimo: "ayer", extra: 1 }, otra: { x: 1 }, retos: { ultimo: "2026-11-14" } })))
    .toEqual({ ensenar: { ...vacia.ensenar, atrapados: 4 }, retos: { ...vacia.retos, ultimo: "2026-11-14", dias: ["2026-11-14"] } });
  await page.evaluate(() => anotarActividad("retos", { creados: 1, aciertos: 7, preguntas: 10 }));
  expect(JSON.parse(await page.evaluate(() => Object.values(armarCopia().datos)[0].actividad)).retos).toMatchObject({ creados: 1, aciertos: 7 });
  expect(await page.evaluate(() => ACTIVIDAD_VACIA.retos.creados)).toBe(0);   // anotar no ensucia la plantilla
});

test("«Cuándo practica» cuenta también los días de solo Enséñale a Lumi, expedición o reto", async ({ page }) => {
  await entrar(page);
  const practicados = async () => {
    await page.evaluate(() => mostrarAdultos());
    return (await tarjeta(page).locator(".sr-only", { hasText: ": practicó" }).allTextContents()).map((t) => t.split(":")[0]);
  };
  expect(await practicados()).toEqual([]);
  // Hoy, un reto; ayer, una ronda de Lumi (guardada); anteayer, una expedición.
  await page.evaluate(() => {
    almacen.guardar("actividad", JSON.stringify({ ensenar: { rondas: 1, dudas: 5, bien: 3, dias: ["2026-11-13"] } }));
    almacen.guardar("expediciones", JSON.stringify(["2026-11-12"]));
    anotarActividad("retos", { creados: 1, aciertos: 7, preguntas: 10 });
  });
  expect(await page.evaluate(() => diasDeActividad(perfilActual).sort())).toEqual(["2026-11-12", "2026-11-13", "2026-11-14"]);
  expect(await practicados()).toEqual(["12 de noviembre", "13 de noviembre", "14 de noviembre"]);
  // Y el informe dice lo mismo.
  await page.evaluate(() => { window.print = () => {}; });
  await tarjeta(page).locator(".btn-informe").click();
  await expect(page.locator("#informe")).toContainText("Practicó 3 de los últimos");
  await expect(page.locator("#informe")).toContainText("(el último, el 14 de noviembre)");
});

test("los días de cada actividad: sin repetir, los últimos 60, y lo guardado antes conserva su último día", async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => { anotarActividad("ensenar", { atrapados: 1 }); anotarActividad("ensenar", { rondas: 1, dudas: 5, bien: 1 }); });
  expect((await actividad(page)).ensenar.dias).toEqual(["2026-11-14"]);
  expect((await actividad(page)).retos.dias).toEqual([]);
  // Lo guardado antes de llevar los días solo tenía «ultimo».
  expect(await page.evaluate(() => limpiarActividad(JSON.stringify({ retos: { creados: 2, ultimo: "2026-11-09" } })).retos.dias)).toEqual(["2026-11-09"]);
  expect(await page.evaluate(() => limpiarActividad(JSON.stringify({ retos: { ultimo: "2026-11-09", dias: ["2026-11-09", "2026-11-08", "2026-11-08", "ayer", 7] } })).retos.dias)).toEqual(["2026-11-09", "2026-11-08"]);
  expect(await page.evaluate(() => limpiarActividad(JSON.stringify({ retos: { dias: "2026-11-09" } })).retos.dias)).toEqual([]);
  const largos = await page.evaluate(() => {
    const dias = Array.from({ length: 70 }, (_, i) => `2025-${String(1 + Math.floor(i / 28)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`);
    almacen.guardar("actividad", JSON.stringify({ retos: { creados: 70, dias } }));
    anotarActividad("retos", { creados: 1 });
    const guardado = JSON.parse(almacen.leer("actividad")).retos.dias;
    return [guardado.length, guardado[0] === dias[11], guardado.at(-1)];
  });
  expect(largos).toEqual([60, true, "2026-11-14"]);
  expect(await page.evaluate(() => ACTIVIDAD_VACIA.retos.dias)).toEqual([]);   // la plantilla no se ensucia
});
