// El candado de la pantalla de adultos (Hito 6.3): para entrar hay que
// mantener presionado un momento; un toque corto solo lo explica. Con el
// teclado o un lector de pantalla se activa dos veces. Se quita desde dentro.
// (Las demás pruebas parten de un dispositivo con el candado quitado: ver
// pruebas/estado-inicial.json.)
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] } });

async function alInicio(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}
const aviso = (page, boton) => page.locator(`${boton} + .aviso-adultos`);

test("de serie hay candado: un toque corto no entra y dice cómo; mantener presionado, sí", async ({ page }) => {
  await alInicio(page);
  expect(await page.evaluate(() => [ajustes.candado, ESPERA_ADULTOS_MS])).toEqual([true, 1500]);
  await page.click("#btn-adultos-menu");
  await expect(page.locator("#screen-selector")).toBeVisible();
  await expect(page.locator("#screen-adultos")).toBeHidden();
  await expect(aviso(page, "#btn-adultos-menu")).toHaveText("Para entrar, mantén presionado un momento.");
  await expect(aviso(page, "#btn-adultos-menu")).toHaveAttribute("role", "status");
  // Casi el tiempo, pero no: tampoco.
  await page.click("#btn-adultos-menu", { delay: 900 });
  await expect(page.locator("#screen-adultos")).toBeHidden();
  // Mantener presionado: mientras, lo dice; al cumplirse el tiempo, entra sin soltar.
  await page.locator("#btn-adultos-menu").hover();
  await page.mouse.down();
  await expect(aviso(page, "#btn-adultos-menu")).toHaveText("Sigue presionando…");
  await expect(page.locator("#btn-adultos-menu")).toHaveClass(/presionando/);
  await expect(page.locator("#screen-adultos")).toBeVisible({ timeout: 3000 });
  await page.mouse.up();
  await expect(page.locator("#screen-adultos")).toBeVisible();
  // Al volver, no queda nada a medias.
  await page.click("#screen-adultos .btn-volver");
  await expect(page.locator("#btn-adultos-menu")).not.toHaveClass(/presionando/);
  await expect(aviso(page, "#btn-adultos-menu")).toHaveText("");
});

test("sacar el dedo del botón antes de tiempo cancela", async ({ page }) => {
  await alInicio(page);
  await page.locator("#btn-adultos-menu").hover();
  await page.mouse.down();
  await page.mouse.move(5, 5);   // se va del botón
  await page.waitForTimeout(1800);
  await page.mouse.up();
  await expect(page.locator("#screen-adultos")).toBeHidden();
  expect(await page.evaluate(() => esperaAdultos)).toBeNull();
});

test("con el teclado no se puede «mantener»: se activa dos veces", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "el teclado físico es de escritorio");
  await alInicio(page);
  await page.focus("#btn-adultos-menu");
  await page.keyboard.press("Enter");
  await expect(page.locator("#screen-adultos")).toBeHidden();
  await expect(aviso(page, "#btn-adultos-menu")).toHaveText("Esta parte es para personas adultas. Actívalo otra vez para entrar.");
  await page.keyboard.press("Enter");
  await expect(page.locator("#screen-adultos")).toBeVisible();
  // Y la próxima vez vuelve a pedir las dos.
  await page.keyboard.press("Escape");
  await page.focus("#btn-adultos-menu");
  await page.keyboard.press("Enter");
  await expect(page.locator("#screen-adultos")).toBeHidden();
});

test("un lector de pantalla (activación sin puntero) también entra en dos pasos", async ({ page }) => {
  await alInicio(page);
  await page.evaluate(() => document.getElementById("btn-adultos-menu").click());
  await expect(page.locator("#screen-adultos")).toBeHidden();
  await page.evaluate(() => document.getElementById("btn-adultos-menu").click());
  await expect(page.locator("#screen-adultos")).toBeVisible();
});

test("la entrada de la bienvenida tiene el mismo candado", async ({ page }) => {
  await page.goto("./");
  await page.click("#btn-adultos-bienvenida");
  await expect(page.locator("#screen-adultos")).toBeHidden();
  await expect(aviso(page, "#btn-adultos-bienvenida")).toHaveText("Para entrar, mantén presionado un momento.");
  await page.click("#btn-adultos-bienvenida", { delay: 1700 });
  await expect(page.locator("#screen-adultos")).toBeVisible();
});

test("se quita desde dentro, se recuerda, y entonces basta un toque; se puede volver a poner", async ({ page }) => {
  await alInicio(page);
  await page.click("#btn-adultos-menu", { delay: 1700 });
  const interruptor = page.locator('#inicio-adultos .ajuste[data-ajuste="candado"]');
  await expect(interruptor).toHaveAttribute("aria-pressed", "true");
  await expect(interruptor.locator(".estado")).toHaveText("Sí");
  await expect(interruptor).toHaveAccessibleDescription(/mantener presionado «Para las personas adultas» un momento/);
  await interruptor.click();
  await expect(interruptor).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("jardin:ajustes")).candado)).toBe(false);
  await page.click("#screen-adultos .btn-volver");
  // Sin candado, presionar no arranca ningún reloj ni dice «sigue presionando»: al soltar, entra.
  await page.locator("#btn-adultos-menu").hover();
  await page.mouse.down();
  expect(await page.evaluate(() => [esperaAdultos, document.getElementById("btn-adultos-menu").classList.contains("presionando")])).toEqual([null, false]);
  await expect(page.locator("#screen-adultos")).toBeHidden();
  await page.mouse.up();
  await expect(page.locator("#screen-adultos")).toBeVisible();
  await page.reload();
  await page.click("#btn-adultos-bienvenida");
  await expect(page.locator("#screen-adultos")).toBeVisible();
  await page.click('#inicio-adultos .ajuste[data-ajuste="candado"]');
  await page.click("#screen-adultos .btn-volver");
  await page.click("#btn-adultos-bienvenida");
  await expect(page.locator("#screen-adultos")).toBeHidden();
});

test("mantener presionado no abre el menú del navegador, y el botón sigue siendo táctil y accesible", async ({ page }, testInfo) => {
  await alInicio(page);
  const evitado = await page.evaluate(() => { const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true }); document.getElementById("btn-adultos-menu").dispatchEvent(e); return e.defaultPrevented; });
  expect(evitado).toBe(true);
  await page.click("#btn-adultos-menu");   // con el aviso a la vista
  const caja = await page.locator("#btn-adultos-menu").boundingBox();
  expect(caja.height).toBeGreaterThanOrEqual(44);
  const axe = await new AxeBuilder({ page }).include("#btn-adultos-menu").include(".aviso-adultos").analyze();
  expect(axe.violations.map((v) => v.id), testInfo.project.name).toEqual([]);
  // Sin candado, el menú del navegador vuelve a ser el de siempre.
  await page.evaluate(() => { ajustes.candado = false; });
  expect(await page.evaluate(() => { const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true }); document.getElementById("btn-adultos-menu").dispatchEvent(e); return e.defaultPrevented; })).toBe(false);
});
