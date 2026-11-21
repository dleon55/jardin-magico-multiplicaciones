// Presentación: fondo ilustrado por mundo, entrada suave de cada pantalla,
// botones con relieve y una onda al tocar. Todo el movimiento se apaga con
// «Menos movimiento» o si el sistema lo pide.
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-15T12:00:00"));
});

async function entrar(page, nombre = "Leo", mundo = null) {
  await page.fill("#player-name", nombre);
  if (mundo) await page.click(`#screen-welcome .elegir-mundo label:has(input[value="${mundo}"])`);
  // Con movimiento, el botón late sin parar y nunca está «quieto»: se fuerza.
  await page.click("#screen-welcome button:has-text('Comenzar')", { force: true });
  await expect(page.locator("#screen-selector")).toBeVisible();
}

const paisaje = (page) => page.locator("#fondo svg.paisaje").getAttribute("data-paisaje");
const EMOJI = /\p{Extended_Pictographic}/u;

test("el fondo es neutro en la bienvenida y del mundo de cada quien después; no se lee ni se toca", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#fondo")).toHaveAttribute("aria-hidden", "true");
  expect(await page.locator("#fondo").evaluate((e) => getComputedStyle(e).pointerEvents)).toBe("none");
  expect(await paisaje(page)).toBe("neutro");
  await entrar(page, "Leo", "espacio");
  expect(await paisaje(page)).toBe("espacio");
  // Es un dibujo propio: sin emojis, con planeta y estrellas.
  const dibujo = await page.locator("#fondo").innerHTML();
  expect(EMOJI.test(dibujo)).toBe(false);
  expect(dibujo).toContain('class="titila"');
  // Las colinas toman el color del mundo.
  expect(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--colina1").trim())).toBe("#c7d2fe");
  // Cambiar de pantalla en el mismo mundo no lo vuelve a pintar.
  await page.evaluate(() => { document.querySelector("#fondo svg.paisaje").dataset.marca = "1"; });
  await page.click("#screen-selector >> text=Mi jardín");
  expect(await page.locator("#fondo svg.paisaje[data-marca]").count()).toBe(1);
});

test("el fondo no tapa nada: la tarjeta del juego queda encima", async ({ page }) => {
  await page.goto("./");
  const encima = await page.evaluate(() => {
    const b = document.querySelector("#screen-welcome input#player-name");
    b.scrollIntoView({ block: "center" });
    const r = b.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2).closest("main") !== null;
  });
  expect(encima).toBe(true);
});

test("los botones con sombra tienen relieve", async ({ page }) => {
  await page.goto("./");
  await entrar(page);
  const sombra = await page.locator("#screen-selector button.shadow-md").first().evaluate((b) => getComputedStyle(b).boxShadow);
  expect(sombra).toContain("0px 4px 0px");
});

test("el color del navegador ya no es rosa", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#047857");
  const manifiesto = JSON.parse(await readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
  expect(manifiesto.theme_color).toBe("#047857");
});

test.describe("con movimiento", () => {
  test.use({ reducedMotion: "no-preference" });

  test("cada pantalla entra con un fundido corto, y las tablas una tras otra", async ({ page }) => {
    await page.goto("./");
    await entrar(page);
    const r = await page.evaluate(() => {
      mostrarPantalla("screen-selector");
      const pantalla = document.getElementById("screen-selector");
      const nombres = (el) => el.getAnimations().map((a) => a.animationName);
      const tablas = [...document.querySelectorAll("#screen-selector .escalonar > button")];
      return {
        clase: pantalla.classList.contains("entrando"),
        pantalla: nombres(pantalla),
        retrasos: tablas.slice(0, 3).map((t) => getComputedStyle(t).animationDelay),
      };
    });
    expect(r.clase).toBe(true);
    expect(r.pantalla).toContain("entrar");
    expect(r.retrasos).toEqual(["0s", "0.04s", "0.08s"]);
    // Al terminar, se quita la clase: no queda nada animándose.
    await expect(page.locator("#screen-selector")).not.toHaveClass(/entrando/);
  });

  test("tocar un botón deja una onda que se va sola", async ({ page }) => {
    await page.goto("./");
    await entrar(page);
    const boton = page.locator("#screen-selector button.shadow-md:visible").first();   // el primero a la vista: los del mundo no se ven con la lista
    await boton.scrollIntoViewIfNeeded();   // con «Seguir» arriba, puede quedar más abajo
    const caja = await boton.boundingBox();
    await page.evaluate(({ x, y }) => {
      const b = document.elementFromPoint(x, y);
      b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: x, clientY: y }));
    }, { x: caja.x + 10, y: caja.y + 10 });
    await expect(page.locator("#screen-selector .onda")).toHaveCount(1);
    await expect(page.locator("#screen-selector .onda")).toHaveCount(0, { timeout: 2000 });
  });

  test("las nubes del fondo se mueven despacio", async ({ page }) => {
    await page.goto("./");
    const nombre = await page.locator("#fondo .nube").first().evaluate((a) => getComputedStyle(a).animationName);
    expect(nombre).toBe("nube-deriva");
  });

  test("con «Menos movimiento» no hay fundidos, ni ondas, ni nubes que se muevan", async ({ page }) => {
    await page.goto("./");
    await page.click("#ajustes summary");
    await page.click('[data-ajuste="calma"]');
    await expect(page.locator("html")).toHaveClass(/calma/);
    await page.click("#ajustes summary");
    await entrar(page);
    const r = await page.evaluate(() => {
      mostrarPantalla("screen-selector");
      const b = document.querySelector("#screen-selector button.shadow-md");
      const c = b.getBoundingClientRect();
      b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: c.left + 5, clientY: c.top + 5 }));
      return {
        entrar: document.getElementById("screen-selector").getAnimations().length,
        ondas: document.querySelectorAll("#screen-selector .onda").length,
        flota: getComputedStyle(document.querySelector("#fondo .nube")).animationName,
      };
    });
    expect(r).toEqual({ entrar: 0, ondas: 0, flota: "none" });
  });

  test("accesibilidad con el fondo y las animaciones ya terminadas", async ({ page }) => {
    await page.goto("./");
    await entrar(page, "Leo", "espacio");
    await expect(page.locator("#screen-selector")).not.toHaveClass(/entrando/);
    await page.waitForTimeout(500);
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });
});
