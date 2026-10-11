// El juego tiene que funcionar en un aula sin wifi.
import { test, expect } from "@playwright/test";
import { responder, siguiente } from "./ayudas.mjs";

test("no pide nada a ningún otro dominio", async ({ page }) => {
  const externas = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:4173/")) externas.push(r.url());
  });
  await page.goto("./");
  await page.waitForLoadState("networkidle");
  expect(externas, "antes: el CDN de Tailwind y Google Fonts").toEqual([]);
});

test("tras la primera visita, se juega sin conexión", async ({ page, context }) => {
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // La primera carga la hizo la red; el service worker toma el control desde la
  // siguiente navegación.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator("h1")).toContainText("El Jardín Mágico");
  const fuente = await page.evaluate(() => document.fonts.check("16px 'Fredoka One'"));
  expect(fuente, "la fuente también está guardada").toBe(true);

  await page.click("#screen-welcome button");
  await page.locator("#grid-tablas-container button").nth(2).click();
  await responder(page, true);
  await siguiente(page);
  await expect(page.locator("#current-stars")).toHaveText("1");
});

test("sin hoja de estilos, el juego sigue siendo jugable", async ({ page }) => {
  // Lo que pasaba antes sin internet: sin la hoja, el lienzo de partículas
  // quedaba encima de los botones y se tragaba todos los clics.
  await page.route("**/estilos.css", (r) => r.abort());
  await page.goto("./");
  const encima = await page.evaluate(() => {
    const b = document.querySelector("#screen-welcome button").getBoundingClientRect();
    return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.closest("button")?.id ?? "otro";
  });
  expect(encima, "el botón recibe el clic, no el lienzo").not.toBe("otro");
});

test("el manifiesto permite instalarlo en la pantalla de inicio", async ({ page, request }) => {
  await page.goto("./");
  const href = await page.getAttribute('link[rel="manifest"]', "href");
  const manifiesto = await (await request.get(new URL(href, page.url()).href)).json();
  expect(manifiesto.start_url).toBe("./");
  expect(manifiesto.display).toBe("standalone");
  expect(manifiesto.icons.some((i) => i.purpose === "maskable")).toBe(true);
  for (const icono of manifiesto.icons) {
    const r = await request.get(new URL(icono.src, page.url()).href);
    expect(r.ok(), icono.src).toBe(true);
  }
});
