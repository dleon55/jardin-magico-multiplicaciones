// Varios niños en el mismo dispositivo: cada quien con su jardín, cambiar de
// jugador no borra nada, y una vista para las personas adultas.
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida, fallo, elegida } from "./ayudas.mjs";

const HOY = "2026-11-12";

/** Entra con un nombre desde la bienvenida (como alguien nuevo). */
async function entrarComo(page, nombre) {
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${HOY}T12:00:00`));
});

test("la primera vez solo se pide el nombre; al volver, «¿Quién juega?»", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#perfiles")).toBeHidden();
  await entrarComo(page, "Ana");
  await expect(page.locator("#display-name")).toHaveText("El jardín de Ana");
  await page.reload();
  await expect(page.locator("#perfiles")).toBeVisible();
  await expect(page.locator("#bienvenida-texto")).toHaveText("¡Hola! Toca tu jardín para seguir cultivándolo.");
  await expect(page.locator(".btn-perfil")).toHaveCount(1);
  await expect(page.locator(".btn-perfil")).toContainText("Ana");
  await expect(page.locator(".btn-perfil")).toContainText("0 de 54 flores");
  await expect(page.locator("#nuevo-titulo")).toHaveText("¿Juega alguien nuevo?");
  await expect(page.locator("#player-name")).toHaveValue("");   // no invita a escribir sobre el de Ana
});

test("cada quien tiene su jardín, y cambiar de jugador no borra nada", async ({ page }) => {
  await page.goto("./");
  await entrarComo(page, "Ana");
  await ponerIntentos(page, "7x8", [rapida("2026-11-10"), rapida("2026-11-11")]);
  await page.evaluate(() => ganarEstrellas(30));

  await page.click("text=Cambiar de jugador");
  await expect(page.locator("#screen-welcome")).toBeVisible();
  await entrarComo(page, "Luis");
  await expect(page.locator("#display-name")).toHaveText("El jardín de Luis");
  expect(await page.evaluate(() => [estadoHecho(7, 8), globalStars])).toEqual(["nuevo", 0]);
  await page.evaluate(() => registrarIntento(3, 4, true));

  await page.click("text=Cambiar de jugador");
  await expect(page.locator(".btn-perfil")).toHaveCount(2);
  await expect(page.locator(".btn-perfil", { hasText: "Ana" })).toContainText("1 de 54 flores");
  await page.click(".btn-perfil:has-text('Ana')");
  await expect(page.locator("#display-name")).toHaveText("El jardín de Ana");
  expect(await page.evaluate(() => [estadoHecho(7, 8), estadoHecho(3, 4), globalStars])).toEqual(["florecida", "nuevo", 30]);

  await page.reload();   // también tras recargar: sigue el último que jugó
  expect(await page.evaluate(() => [perfilEnUso().nombre, globalStars])).toEqual(["Ana", 30]);
});

test("escribir un nombre que ya tiene jardín sigue con el suyo, sin duplicarlo", async ({ page }) => {
  await page.goto("./");
  await entrarComo(page, "Ana");
  await page.evaluate(() => ganarEstrellas(12));
  await page.click("text=Cambiar de jugador");
  await entrarComo(page, "  ana ");
  expect(await page.evaluate(() => [perfiles.length, globalStars])).toEqual([1, 12]);
});

test("desde la victoria también se cambia de jugador", async ({ page }) => {
  await page.goto("./");
  await entrarComo(page, "Ana");
  await page.evaluate(() => { currentTable = 2; endGameSuccess(); });
  await page.click("#screen-victory >> text=Cambiar de jugador");
  await expect(page.locator(".btn-perfil")).toContainText("Ana");
});

test("los nombres se muestran como texto, nunca como HTML", async ({ page }) => {
  await page.goto("./");
  await entrarComo(page, "<b>Eva</b>");
  await page.click("text=Cambiar de jugador");
  await expect(page.locator(".btn-perfil")).toContainText("<b>Eva</b>");
  await expect(page.locator(".btn-perfil b")).toHaveCount(0);
});

test("con teclado, Enter sobre un jardín lo abre", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "solo donde hay teclado");
  await page.goto("./");
  await entrarComo(page, "Ana");
  await page.click("text=Cambiar de jugador");
  await entrarComo(page, "Luis");
  await page.click("text=Cambiar de jugador");
  await page.locator(".btn-perfil:has-text('Ana')").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#display-name")).toHaveText("El jardín de Ana");
});

test.describe("para las personas adultas", () => {
  async function dosJardines(page) {
    await page.goto("./");
    await entrarComo(page, "Ana");
    await ponerIntentos(page, "7x8", [rapida("2026-11-03"), fallo("2026-11-10"), fallo("2026-11-11"), elegida("2026-11-12")]);
    await ponerIntentos(page, "6x9", [fallo("2026-11-12")]);
    await ponerIntentos(page, "2x3", [rapida("2026-10-01"), rapida("2026-10-02")]);   // flor marchita
    await ponerIntentos(page, "5x5", [rapida("2026-11-11"), rapida("2026-11-12")]);   // flor
    await page.click("text=Cambiar de jugador");
    await entrarComo(page, "Luis");
  }

  test("cada jardín con sus flores, lo que más falla y los días que practicó", async ({ page }) => {
    await dosJardines(page);
    await page.click("#screen-selector >> text=Para las personas adultas");
    await expect(page.locator("#screen-adultos [data-foco]")).toBeFocused();
    await expect(page.locator(".tarjeta-adulto")).toHaveCount(2);
    const ana = page.locator(".tarjeta-adulto", { hasText: "Ana" });
    await expect(ana.locator(".adulto-resumen")).toHaveText("Flores: 2 de 54. Casi: 0. Practicando: 2. Marchitas: 1.");
    await expect(ana.locator(".adulto-cuesta")).toHaveText(
      "Le cuestan más: 7 × 8 (falló 2 de las últimas 4), 6 × 9 (falló la única vez).");
    await expect(ana.locator(".adulto-dias")).toHaveText("Practicó 4 de los últimos 14 días. Último día: 12 de noviembre.");
    await expect(ana.locator("ol li")).toHaveCount(14);
    await expect(ana.locator("ol li").last()).toContainText("12 de noviembre: practicó");
    await expect(ana.locator(".adulto-consejo")).toContainText("Practicar lo que me falta");

    const luis = page.locator(".tarjeta-adulto", { hasText: "Luis" });
    await expect(luis.locator(".adulto-cuesta")).toHaveText("Aún no ha jugado a multiplicar.");
    await expect(luis.locator(".adulto-consejo")).toHaveCount(0);
  });

  test("Volver regresa a donde estaba, también con Esc", async ({ page }, testInfo) => {
    await page.goto("./");
    await page.click("#screen-welcome >> text=Para las personas adultas");
    await expect(page.locator("#adultos-perfiles")).toHaveText("Todavía nadie ha jugado en este dispositivo.");
    await page.click("text=Volver");
    await expect(page.locator("#screen-welcome")).toBeVisible();
    if (testInfo.project.name === "escritorio") {
      await entrarComo(page, "Ana");
      await page.click("#screen-selector >> text=Para las personas adultas");
      await page.keyboard.press("Escape");
      await expect(page.locator("#screen-selector")).toBeVisible();
    }
  });

  test("borrar un jardín pide confirmar y solo borra ese", async ({ page }) => {
    await dosJardines(page);
    await page.click("#screen-selector >> text=Para las personas adultas");
    const ana = page.locator(".tarjeta-adulto", { hasText: "Ana" });
    await ana.locator(".btn-borrar").click();
    await expect(ana.locator(".confirmar-borrar")).toContainText("Se borrarán las flores, estrellas y amigos de Ana. No se puede deshacer.");
    await ana.locator(".btn-borrar-no").click();
    await expect(page.locator(".tarjeta-adulto")).toHaveCount(2);

    await ana.locator(".btn-borrar").click();
    await ana.locator(".btn-borrar-si").click();
    await expect(page.locator(".tarjeta-adulto")).toHaveCount(1);
    await expect(page.locator(".tarjeta-adulto")).toContainText("Luis");
    const claves = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("jardin:p1:")));
    expect(claves).toEqual([]);
    expect(await page.evaluate(() => perfilEnUso().nombre)).toBe("Luis");   // sigue jugando quien jugaba
  });

  test("borrar el jardín de quien juega lleva a «¿Quién juega?»", async ({ page }) => {
    await dosJardines(page);
    await page.click("#screen-selector >> text=Para las personas adultas");
    const luis = page.locator(".tarjeta-adulto", { hasText: "Luis" });
    await luis.locator(".btn-borrar").click();
    await luis.locator(".btn-borrar-si").click();
    await page.click("text=Volver");
    await expect(page.locator("#screen-welcome")).toBeVisible();
    await expect(page.locator(".btn-perfil")).toHaveCount(1);
    await page.click(".btn-perfil:has-text('Ana')");
    expect(await page.evaluate(() => estadoHecho(5, 5))).toBe("florecida");
  });
});

test("lo de antes de los perfiles pasa al primero, sin perder nada", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("sembrado")) return;
    localStorage.setItem("jardin:nombre", "Ana");
    localStorage.setItem("jardin:estrellas", "25");
    localStorage.setItem("jardin:intentos", JSON.stringify({ "3x3": [{ d: "2026-11-10", m: "e", ok: 1, ms: 2000 }] }));
    localStorage.setItem("jardin:compras", JSON.stringify(["mariposa"]));
    localStorage.setItem("jardin:ajustes", JSON.stringify({ voz: false }));
    sessionStorage.setItem("sembrado", "1");
  });
  await page.goto("./");
  const guardado = await page.evaluate(() => ({ ...localStorage }));
  expect(Object.keys(guardado).filter((k) => /^jardin:(nombre|estrellas|intentos|compras)$/.test(k))).toEqual([]);
  expect(guardado["jardin:ajustes"]).toBeDefined();   // los ajustes son del dispositivo
  await page.click(".btn-perfil:has-text('Ana')");
  expect(await page.evaluate(() => [globalStars, compras, estadoHecho(3, 3)])).toEqual([25, ["mariposa"], "casi"]);
});

test("una lista de perfiles dañada no rompe nada", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("jardin:perfiles", "{no es json"));
  await page.goto("./");
  await page.click("#screen-welcome button");
  await expect(page.locator("#screen-selector")).toBeVisible();
});
