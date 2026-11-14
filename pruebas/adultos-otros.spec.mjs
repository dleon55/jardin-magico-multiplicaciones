// Fracciones y retos de lógica en la vista para las personas adultas.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-14T12:00:00"));
});

async function entrar(page, nombre) {
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

test("contestar fracciones y retos queda registrado por clase, con el día", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await page.click("#screen-selector >> text=Fracciones");
  await page.click('#clases-fracciones button[data-clase="equivalente"]');
  await page.click(`.btn-option[data-valor="${await page.evaluate(() => correctAnswer)}"]`);
  await page.click("#screen-game button:has-text('Menú')");
  await page.click("#screen-selector >> text=Retos de lógica");
  const mala = await page.evaluate(() => [...document.querySelectorAll(".btn-option")].find((b) => Number(b.dataset.valor) !== correctAnswer).id);
  const clase = await page.evaluate(() => pregunta.clase);
  await page.click(`#${mala}`);
  const r = await page.evaluate(() => JSON.parse(localStorage.getItem(`jardin:${perfilActual}:otros`)));
  expect(r["fraccion:equivalente"]).toEqual([{ d: "2026-11-14", ok: 1 }]);
  expect(r[`logica:${clase}`]).toEqual([{ d: "2026-11-14", ok: 0 }]);
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);   // el jardín no cambia
});

test("la vista para adultos: aciertos por clase, cuál cuesta más y dónde practicarla sola", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await page.evaluate(() => {
    const r = (ok) => ({ d: "2026-11-13", ok });
    otros = {
      "fraccion:de": [1, 1, 1, 1, 1, 1, 1, 1, 1, 0].map(r),
      "fraccion:sumarDistinto": [0, 1, 0, 0, 1, 0].map(r),
      "logica:misterio": [1, 0, 1].map(r),
    };
    almacen.guardar("otros", JSON.stringify(otros));
  });
  await page.click("#screen-selector >> text=Para las personas adultas");
  const tarjeta = page.locator(".tarjeta-adulto", { hasText: "Ana" });
  await expect(tarjeta.locator(".adulto-fracciones")).toHaveText(
    "Fracciones (sus últimas respuestas): de un número 9 de 10, sumar con distinto número de abajo 2 de 6. " +
    "Le cuesta más: sumar con distinto número de abajo. Para practicar solo eso: «🍕 Fracciones» → «Sumar con distinto número de abajo».");
  // Con menos de 4 respuestas aún no se juzga.
  await expect(tarjeta.locator(".adulto-retos")).toHaveText("Retos de lógica (sus últimas respuestas): el número misterioso 2 de 3.");
  // Esos días cuentan como días de práctica.
  await expect(tarjeta.locator(".adulto-dias")).toContainText("Practicó 1 de los últimos 14 días. Último día: 13 de noviembre.");
});

test("sin fracciones ni retos no sale nada de eso; otro jardín muestra lo suyo", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await page.evaluate(() => registrarOtro("logica:intruso", true));
  await page.click("#screen-selector >> text=Cambiar de jugador");
  await entrar(page, "Leo");
  await page.click("#screen-selector >> text=Para las personas adultas");
  await expect(page.locator(".tarjeta-adulto", { hasText: "Leo" }).locator(".adulto-retos")).toHaveCount(0);
  await expect(page.locator(".tarjeta-adulto", { hasText: "Ana" }).locator(".adulto-retos")).toHaveText("Retos de lógica (sus últimas respuestas): el intruso 1 de 1.");
});

test("lo guardado dañado o con claves desconocidas no rompe nada; se guardan solo las últimas 30", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  const r = await page.evaluate(() => {
    const a = limpiarOtros("{no es json");
    const b = limpiarOtros(JSON.stringify({ "fraccion:de": [{ d: "2026-13-40", ok: "1" }, null, { d: "2026-11-01", ok: 1 }], "otra:cosa": [{ ok: 1 }] }));
    for (let i = 0; i < 40; i++) registrarOtro("fraccion:comparar", i % 2 === 0);
    registrarOtro("no:existe", true);
    return { a, b, n: otros["fraccion:comparar"].length, claves: Object.keys(otros) };
  });
  expect(r.a).toEqual({});
  expect(r.b).toEqual({ "fraccion:de": [{ d: "", ok: 0 }, { d: "2026-11-01", ok: 1 }] });
  expect(r.n).toBe(30);
  expect(r.claves).toEqual(["fraccion:comparar"]);
});

test("borrar el jardín borra también sus fracciones y retos; la copia los incluye", async ({ page }) => {
  await page.goto("./");
  await entrar(page, "Ana");
  await page.evaluate(() => registrarOtro("fraccion:sumar", true));
  expect(await page.evaluate(() => Object.keys(armarCopia().datos[perfilActual]))).toContain("otros");
  await page.evaluate(() => borrarPerfil(perfilActual));
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.endsWith(":otros")))).toEqual([]);
});
