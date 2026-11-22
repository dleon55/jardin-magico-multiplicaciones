// Bienvenida guiada (issue #58): la primera vez, Lumi lleva al niño paso a
// paso hasta su primera tabla. Estas pruebas parten de un dispositivo vacío
// (las demás, de uno que ya la vio: ver playwright.config.mjs).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { instalarDobles } from "./ayudas.mjs";

test.use({ storageState: { cookies: [], origins: [] } });

const paso = (page) => page.locator("#guia-paso");
const seguir = (page) => page.locator("#guia-seguir");
const caraLumi = (page) => page.locator("#lumi-guia > svg.lumi").getAttribute("data-expresion");

/** Recorre la guía entera: nombre, mundo, personaje, tono, la práctica y los lugares. */
async function recorrer(page, { nombre = "Leo", mundo = "espacio", personaje = "🐙", tono = null } = {}) {
  await seguir(page).click();                                         // ¡Sí, vamos!
  if (nombre) await page.fill("#guia-nombre", nombre);
  await seguir(page).click();
  await page.click(`#screen-guia .elegir-mundo label:has(input[value="${mundo}"])`);
  await seguir(page).click();
  await page.click(`#screen-guia .elegir-personaje label:has(input[value="${personaje}"])`);
  await seguir(page).click();
  if (tono) await page.click(`#screen-guia .elegir-tono label:has(input[value="${tono}"])`);
  await seguir(page).click();
  await page.click('#guia-opciones [data-valor="6"]');
  await seguir(page).click();                                         // de la práctica a los lugares
  await seguir(page).click();                                         // ¡A mi primera tabla!
}

test("la primera vez sale la guía con Lumi, no el formulario", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#screen-guia")).toBeVisible();
  await expect(page.locator("#screen-welcome")).toBeHidden();
  await expect(paso(page)).toHaveText("Paso 1 de 7");
  await expect(page.locator("#guia-titulo")).toHaveText("¡Hola! Soy Lumi");
  await expect(page.locator("#lumi-guia > svg.lumi")).toBeVisible();
  await expect(seguir(page)).toHaveText("¡Sí, vamos!");
});

test("un paso por pantalla: nombre, mundo y personaje, y Lumi usa el nombre", async ({ page }) => {
  await page.goto("./");
  await seguir(page).click();
  await expect(paso(page)).toHaveText("Paso 2 de 7");
  await expect(page.locator("#guia-nombre")).toBeVisible();
  await expect(page.locator("#guia-nombre")).toBeFocused();
  await expect(page.locator('#screen-guia [data-paso="mundo"]')).toBeHidden();
  await page.fill("#guia-nombre", "Leo");
  await page.keyboard.press("Enter");                                 // Enter también sigue
  await expect(paso(page)).toHaveText("Paso 3 de 7");
  await expect(page.locator("#guia-titulo")).toHaveText("Leo, elige tu mundo");
  await expect(page.locator('#screen-guia [data-paso="nombre"]')).toBeHidden();
  await expect(page.locator('#screen-guia .elegir-mundo input[type=radio]')).toHaveCount(8);
  await seguir(page).click();
  await expect(paso(page)).toHaveText("Paso 4 de 7");
  await expect(page.locator('#screen-guia .elegir-personaje input[type=radio]').first()).toBeAttached();
});

test("la práctica: hay que dar con la respuesta; al fallar Lumi anima, al acertar celebra", async ({ page }) => {
  await page.goto("./");
  for (let i = 0; i < 5; i++) await seguir(page).click();
  await expect(paso(page)).toHaveText("Paso 6 de 7");
  await expect(seguir(page)).toBeDisabled();
  expect(await caraLumi(page)).toBe("pensando");
  await page.click('#guia-opciones [data-valor="5"]');
  await expect(page.locator("#guia-respuesta")).toContainText("¡Casi!");
  await expect(page.locator('#guia-opciones [data-valor="5"]')).toBeDisabled();
  await expect(seguir(page)).toBeDisabled();
  expect(await caraLumi(page)).toBe("animando");
  await page.click('#guia-opciones [data-valor="6"]');
  await expect(page.locator("#guia-respuesta")).toContainText("¡Eso es! 2 × 3 = 6");
  await expect(seguir(page)).toBeEnabled();
  expect(await caraLumi(page)).toBe("celebrando");
});

test("al terminar, crea su jardín con lo elegido y lo lleva a descubrir su primera tabla", async ({ page }) => {
  await page.goto("./");
  await recorrer(page);
  await expect(page.locator("#screen-descubrir")).toBeVisible();
  expect(await page.evaluate(() => descubriendo.tabla)).toBe(2);
  expect(await page.evaluate(() => ({ nombre: perfilEnUso().nombre, mundo: perfilEnUso().mundo, emoji: perfilEnUso().emoji, iniciado: perfilEnUso().iniciado })))
    .toEqual({ nombre: "Leo", mundo: "espacio", emoji: "🐙", iniciado: true });
  expect(await page.evaluate(() => localStorage.getItem("jardin:guia"))).toBe("1");
  // De ahí a la primera pregunta hay un toque.
  await page.click("#descubrir-practicar");
  await expect(page.locator("#screen-game")).toBeVisible();
});

test("el tono: tres fichas con Explora marcado; lo elegido queda en el jardín", async ({ page }) => {
  await page.goto("./");
  for (let i = 0; i < 4; i++) await seguir(page).click();
  await expect(paso(page)).toHaveText("Paso 5 de 7");
  await expect(page.locator("#guia-titulo")).toHaveText("¿Cómo quieres jugar?");
  await expect(page.locator("#guia-texto")).toHaveText("Elige el que más te guste. Puedes cambiarlo cuando quieras.");
  await expect(page.locator('#screen-guia [data-paso="tono"] input[type=radio]')).toHaveCount(3);
  await expect(page.locator('#screen-guia [data-paso="tono"] input:checked')).toHaveValue("explora");
  await expect(page.locator('#screen-guia [data-paso="tono"]')).toContainText("Brote");
  await page.click('#screen-guia .elegir-tono label:has(input[value="brote"])');
  await seguir(page).click();
  await page.click('#guia-opciones [data-valor="6"]');
  await seguir(page).click();
  await seguir(page).click();
  expect(await page.evaluate(() => [perfilEnUso().tono, document.body.dataset.tono])).toEqual(["brote", "brote"]);
});

test("sin tocar el tono queda Explora, el de siempre", async ({ page }) => {
  await page.goto("./");
  await recorrer(page);
  expect(await page.evaluate(() => perfilEnUso().tono)).toBe("explora");
});

test("el último paso presenta el mundo: el huerto despierto, el bosque dormido, y de ahí a la primera tabla", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  for (let i = 0; i < 5; i++) await seguir(page).click();
  await page.click('#guia-opciones [data-valor="6"]');
  await expect(seguir(page)).toHaveText("Seguir");
  await seguir(page).click();
  await expect(paso(page)).toHaveText("Paso 7 de 7");
  await expect(page.locator("#guia-titulo")).toHaveText("Así es tu mundo");
  await expect(page.locator("#guia-texto")).toHaveText("Cada lugar tiene juegos. Los que duermen despiertan con las tablas que aprendas.");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("Así es tu mundo. Cada lugar tiene juegos. Los que duermen despiertan con las tablas que aprendas.");
  const mini = page.locator("#guia-lugares");
  await expect(mini).toBeVisible();
  await expect(mini).toHaveAttribute("role", "img");
  await expect(mini).toHaveAttribute("aria-label", /Huerto de las tablas, despierto.*Bosque de dividir, dormido/);
  await expect(mini.locator('.escena-lugar[data-lugar="huerto"]:not(.escena-dormida)')).toHaveCount(1);
  await expect(mini.locator(".escena-dormida")).toHaveCount(4);
  expect(await mini.locator("svg").getAttribute("viewBox")).toBe("0 95 370 440");
  // En el recorte se ven el huerto y el bosque, no los de más abajo.
  const dentro = await mini.evaluate((caja) => {
    const c = caja.getBoundingClientRect();
    const ve = (id) => { const r = caja.querySelector(`.escena-lugar[data-lugar="${id}"]`).getBoundingClientRect(); return r.top < c.bottom && r.bottom > c.top; };
    return ["huerto", "bosque", "mercado"].map(ve);
  });
  expect(dentro).toEqual([true, true, false]);
  await expect(page.locator('#screen-guia [data-paso="practica"]')).toBeHidden();
  await expect(seguir(page)).toHaveText("¡A mi primera tabla!");
  expect(await caraLumi(page)).toBe("sorprendida");
  await seguir(page).click();
  await expect(page.locator("#screen-descubrir")).toBeVisible();
});

test("sin nombre también se puede: el jardín queda sin nombre", async ({ page }) => {
  await page.goto("./");
  await recorrer(page, { nombre: "" });
  await expect(page.locator("#screen-descubrir")).toBeVisible();
  expect(await page.evaluate(() => perfilEnUso().nombre)).toBe("");
});

test("quien ya la terminó no la vuelve a ver: entra a la bienvenida con su jardín", async ({ page }) => {
  await page.goto("./");
  await recorrer(page);
  await page.reload();
  await expect(page.locator("#screen-guia")).toBeHidden();
  await expect(page.locator("#screen-welcome")).toBeVisible();
  await expect(page.locator("#perfiles-lista")).toContainText("Leo");
});

test("se puede saltar: lleva a la bienvenida de siempre y no vuelve a salir", async ({ page }) => {
  await page.goto("./");
  await page.click("#guia-saltar");
  await expect(page.locator("#screen-welcome")).toBeVisible();
  await expect(page.locator("#screen-guia")).toBeHidden();
  await page.reload();
  await expect(page.locator("#screen-welcome")).toBeVisible();
  await expect(page.locator("#screen-guia")).toBeHidden();
});

test("un dispositivo con jardines de antes no ve la guía", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("jardin:perfiles")) {
      localStorage.setItem("jardin:perfiles", JSON.stringify([{ id: "p1", nombre: "Ana", emoji: "🦊", mundo: "bosque", iniciado: true }]));
      localStorage.setItem("jardin:perfil", "p1");
    }
  });
  await page.goto("./");
  await expect(page.locator("#screen-welcome")).toBeVisible();
  await expect(page.locator("#screen-guia")).toBeHidden();
  await expect(page.locator("#perfiles-lista")).toContainText("Ana");
});

test("Lumi dice cada paso en voz alta", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  await page.waitForTimeout(300);
  await seguir(page).click();
  const dicho = await page.evaluate(() => window.__dicho.map((d) => d.texto).join(" | "));
  expect(dicho).toContain("Soy Lumi");
  expect(dicho).toContain("¿Cómo te llamas?");
});

test("cada paso es accesible (WCAG 2.1 AA) y el foco va a su título", async ({ page }) => {
  await page.goto("./");
  const auditar = async (donde) => {
    await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`), donde).toEqual([]);
  };
  await auditar("hola");
  await expect(page.locator("#guia-titulo")).toBeFocused();
  for (const nombre of ["nombre", "mundo", "personaje", "tono"]) {
    await seguir(page).click();
    await auditar(nombre);
  }
  await seguir(page).click();
  await expect(page.locator("#guia-titulo")).toBeFocused();
  await page.click('#guia-opciones [data-valor="8"]');
  await auditar("práctica, con un fallo");
  await page.click('#guia-opciones [data-valor="6"]');
  await auditar("práctica, acertada");
  await seguir(page).click();
  await auditar("los lugares");
  await expect(page.locator("#guia-titulo")).toBeFocused();
});

for (const [nombre, tam] of [["teléfono en vertical", { width: 360, height: 640 }], ["teléfono acostado", { width: 740, height: 360 }]]) {
  test(`cada paso cabe sin desplazarse en un ${nombre}, con botones de 44 px`, async ({ page }) => {
    await page.setViewportSize(tam);
    await page.goto("./");
    for (let i = 0; i < 7; i++) {
      const caja = await seguir(page).boundingBox();
      expect(caja.y + caja.height, `paso ${i + 1}: «${await seguir(page).textContent()}» fuera de la pantalla`).toBeLessThanOrEqual(tam.height);
      expect(caja.height).toBeGreaterThanOrEqual(44);
      const saltar = await page.locator("#guia-saltar").boundingBox();
      expect(saltar.height).toBeGreaterThanOrEqual(44);
      if (i === 5) {
        // Tras acertar, el aviso aparece y «Seguir» debe seguir a la vista.
        await page.click('#guia-opciones [data-valor="6"]');
        const tras = await seguir(page).boundingBox();
        expect(tras.y + tras.height, "«Seguir» fuera de la pantalla tras acertar").toBeLessThanOrEqual(tam.height);
      }
      if (i < 6) await seguir(page).click();
    }
    // El último paso: el mundo en pequeño, entero y a la vista.
    await expect(page.locator("#guia-paso")).toHaveText("Paso 7 de 7");
    const mini = await page.locator("#guia-lugares").boundingBox();
    expect(mini.y).toBeGreaterThanOrEqual(0);
    expect(mini.y + mini.height).toBeLessThanOrEqual(tam.height);
    expect(mini.x + mini.width).toBeLessThanOrEqual(tam.width);
    expect(mini.height).toBeGreaterThan(100);
  });
}
