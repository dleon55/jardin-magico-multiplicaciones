// En equipo (issue #70): dos o tres niños se turnan en el mismo aparato, sin
// servidor. Cada respuesta crece en el jardín de quien la contesta; la meta
// es común; no se compara a nadie y no hay mensajes entre niños.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function entrar(page, nombre) {
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

/** Ana y Leo con jardín; juega Ana. */
async function dosJardines(page) {
  await page.goto("./");
  await entrar(page, "Leo");
  await page.click("#screen-selector >> text=Cambiar de jugador");
  await entrar(page, "Ana");
}

const turno = (page) => page.locator("#turno-equipo");
const intentosDe = (page, nombre) => page.evaluate((n) => {
  const p = perfiles.find((x) => x.nombre === n);
  return Object.values(intentosDePerfil(p.id)).flat().length;
}, nombre);

/** Contesta la pregunta en pantalla (bien o mal) y pasa a la siguiente. */
function contestar(page, bien) {
  return page.evaluate((b) => {
    cancelarEspera();
    evaluar(b ? correctAnswer : correctAnswer + 1, null);
    cancelarEspera();
    if (score < targetScore) nextQuestion();
  }, bien);
}

test("el menú abre el modo; quien juega ya está marcado y se elige a los demás", async ({ page }) => {
  await dosJardines(page);
  await page.click("#btn-equipo");
  await expect(page.locator("#screen-equipo")).toBeVisible();
  const jugadores = page.locator("#equipo-jugadores .jugador-equipo");
  await expect(jugadores).toHaveCount(2);
  await expect(jugadores.filter({ hasText: "Ana" }).locator("input")).toBeChecked();
  await expect(jugadores.filter({ hasText: "Leo" }).locator("input")).not.toBeChecked();
  await expect(page.locator("#equipo-tablas button")).toHaveCount(9);   // del 2 al 9 y «Todas»
});

test("con uno solo no empieza, y con más de tres tampoco: lo dice", async ({ page }) => {
  await dosJardines(page);
  await page.click("#btn-equipo");
  await page.click('#equipo-tablas [data-tabla="3"]');
  await expect(page.locator("#equipo-aviso")).toHaveText("Elijan al menos a dos para jugar en equipo.");
  await expect(page.locator("#screen-equipo")).toBeVisible();
  for (const n of ["Sol", "Eva"]) { await page.fill("#equipo-nombre", n); await page.click("#equipo-nuevo button"); }
  await page.locator("#equipo-jugadores input").evaluateAll((cs) => cs.forEach((c) => { c.checked = true; }));
  await page.click('#equipo-tablas [data-tabla="3"]');
  await expect(page.locator("#equipo-aviso")).toHaveText("Como mucho 3: así a nadie le toca esperar demasiado.");
});

test("«¿Falta alguien?» crea su jardín, o marca el que ya tiene, sin repetirlo", async ({ page }) => {
  await dosJardines(page);
  await page.click("#btn-equipo");
  await page.fill("#equipo-nombre", "Sol");
  await page.click("#equipo-nuevo button");
  await expect(page.locator("#equipo-aviso")).toHaveText("Sol se une al equipo.");
  await expect(page.locator("#equipo-jugadores .jugador-equipo").filter({ hasText: "Sol" }).locator("input")).toBeChecked();
  await expect(page.locator("#equipo-jugadores .jugador-equipo").filter({ hasText: "Ana" }).locator("input")).toBeChecked();
  await page.fill("#equipo-nombre", "leo");   // ya existe (sin importar mayúsculas)
  await page.click("#equipo-nuevo button");
  await expect(page.locator("#equipo-jugadores .jugador-equipo")).toHaveCount(3);
  await expect(page.locator("#equipo-jugadores .jugador-equipo").filter({ hasText: "Leo" }).locator("input")).toBeChecked();
});

test("se turnan: cada pregunta dice de quién es, y lo contestado crece en su jardín", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await dosJardines(page);
  await page.click("#btn-equipo");
  await page.locator("#equipo-jugadores .jugador-equipo").filter({ hasText: "Leo" }).locator("input").check();
  await page.click('#equipo-tablas [data-tabla="3"]');
  await expect(page.locator("#screen-game")).toBeVisible();
  await expect(turno(page)).toBeVisible();
  await expect(turno(page)).toContainText("Turno de");
  await expect(turno(page)).toContainText("Ana");
  await expect(turno(page)).toContainText("Entre todos: 0 de 10");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toMatch(/^Turno de Ana\. /);
  await contestar(page, true);
  await expect(turno(page)).toContainText("Leo");
  await expect(turno(page)).toContainText("Entre todos: 1 de 10");
  await contestar(page, false);   // fallar no quita: sigue en 1
  await expect(turno(page)).toContainText("Ana");
  await expect(turno(page)).toContainText("Entre todos: 1 de 10");
  expect(await intentosDe(page, "Ana")).toBe(1);
  expect(await intentosDe(page, "Leo")).toBe(1);
});

test("las estrellas van al jardín de quien acierta", async ({ page }) => {
  await dosJardines(page);
  await page.evaluate(() => mostrarEquipo());
  await page.locator("#equipo-jugadores .jugador-equipo").filter({ hasText: "Leo" }).locator("input").check();
  await page.click('#equipo-tablas [data-tabla="2"]');
  await contestar(page, true);    // Ana
  await contestar(page, false);   // Leo
  await contestar(page, true);    // Ana
  const estrellas = await page.evaluate(() => Object.fromEntries(perfiles.map((p) => [p.nombre, Number(almacen.leerDe(p.id, "estrellas")) || 0])));
  expect(estrellas.Ana).toBeGreaterThanOrEqual(2);
  expect(estrellas.Leo).toBe(0);
});

test("diez aciertos entre todos: la victoria es del equipo, sin decir quién acertó más", async ({ page }) => {
  await dosJardines(page);
  await page.evaluate(() => mostrarEquipo());
  await page.locator("#equipo-jugadores .jugador-equipo").filter({ hasText: "Leo" }).locator("input").check();
  await page.click('#equipo-tablas [data-tabla="mix"]');
  for (let i = 0; i < 10; i++) await contestar(page, true);
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#screen-victory")).toBeVisible();
  await expect(page.locator("#victory-player-name")).toHaveText(", Ana y Leo");
  await expect(page.locator("#victoria-aprendido")).toHaveText("Entre todos acertaron 10. Cada respuesta creció en el jardín de quien la contestó.");
  await expect(page.locator("#victoria-estrellas")).toHaveText("⭐ Cada quien se lleva las estrellas de sus aciertos a su jardín.");
  // Nada que compare: ni nombres con números, ni «ganó».
  const texto = await page.locator("#screen-victory").innerText();
  expect(texto).not.toMatch(/Ana[^\n]*\d+ (aciertos|estrellas)|ganó|primer lugar/i);
  // Vuelve el jardín de quien abrió el modo.
  expect(await page.evaluate(() => perfilEnUso().nombre)).toBe("Ana");
  expect(await page.evaluate(() => equipo)).toBeNull();
});

test("salir a mitad devuelve el jardín de quien abrió el modo, y la partida normal no lleva turnos", async ({ page }) => {
  await dosJardines(page);
  await page.evaluate(() => mostrarEquipo());
  await page.locator("#equipo-jugadores .jugador-equipo").filter({ hasText: "Leo" }).locator("input").check();
  await page.click('#equipo-tablas [data-tabla="4"]');
  await contestar(page, true);   // ahora es turno de Leo
  expect(await page.evaluate(() => perfilEnUso().nombre)).toBe("Leo");
  await page.keyboard.press("Escape");
  await expect(page.locator("#screen-selector")).toBeVisible();
  expect(await page.evaluate(() => perfilEnUso().nombre)).toBe("Ana");
  await page.evaluate(() => startTable(4));
  await expect(turno(page)).toBeHidden();
});

test("no hay dónde escribirse mensajes: el único campo es el nombre de quien falta", async ({ page }) => {
  await dosJardines(page);
  await page.evaluate(() => mostrarEquipo());
  await expect(page.locator("#screen-equipo input[type=text], #screen-equipo textarea")).toHaveCount(1);
  await expect(page.locator("#equipo-nombre")).toHaveAttribute("maxlength", "20");
});

test("cabe en el teléfono, y la banda del turno no tapa las opciones", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await dosJardines(page);
  await page.click("#btn-equipo");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.locator("#equipo-jugadores .jugador-equipo").filter({ hasText: "Leo" }).locator("input").check();
  await page.click('#equipo-tablas [data-tabla="3"]');
  const banda = await turno(page).boundingBox();
  const opcion = await page.locator("#opciones .btn-option").first().boundingBox();
  expect(banda.y + banda.height).toBeLessThanOrEqual(opcion.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
