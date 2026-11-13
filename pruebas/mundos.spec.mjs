// Cada quien elige su mundo y su personaje: la mecánica es la misma, cambia
// qué crece y el ambiente. Antes todo era un jardín de flores rosa.
import { test, expect } from "@playwright/test";
import { ponerIntentos, rapida } from "./ayudas.mjs";

const flor = [rapida("2026-11-01"), rapida("2026-11-02")];

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00"));
});

async function crear(page, nombre, { mundo = null, personaje = null } = {}) {
  await page.fill("#player-name", nombre);
  if (mundo) await page.click(`#screen-welcome .elegir-mundo label:has(input[value="${mundo}"])`);
  if (personaje) await page.click(`#screen-welcome .elegir-personaje label:has(input[value="${personaje}"])`);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

test("la bienvenida ofrece 5 mundos y 12 personajes, sin elegir ninguno por adelantado, y es neutra", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#screen-welcome .elegir-mundo input")).toHaveCount(5);
  await expect(page.locator("#screen-welcome .elegir-personaje input")).toHaveCount(12);
  await expect(page.locator("#screen-welcome input[type=radio]:checked")).toHaveCount(0);
  await expect(page.locator("#screen-welcome .elegir-mundo")).toContainText("Selva de dinosaurios");
  expect(await page.evaluate(() => document.body.dataset.mundo)).toBeUndefined();
  await expect(page.locator("#screen-welcome")).not.toContainText("hermosas flores");
});

test("elegir la selva de dinosaurios cambia el ambiente, el personaje y lo que crece", async ({ page }) => {
  await page.goto("./");
  await crear(page, "Leo", { mundo: "dinos", personaje: "🦖" });
  expect(await page.evaluate(() => document.body.dataset.mundo)).toBe("dinos");
  await expect(page.locator("#display-personaje")).toHaveText("🦖");
  await ponerIntentos(page, "3x4", flor);
  await ponerIntentos(page, "5x6", [rapida("2026-11-02")]);
  await page.click("#screen-selector >> text=Mi jardín");
  await expect(page.locator('[data-planta="3x4"]')).toContainText("🐊");          // la flora de la tabla del 3
  await expect(page.locator('[data-planta="3x4"]')).toContainText("dinosaurio, te la sabes");
  await expect(page.locator('[data-planta="5x6"]')).toContainText("🥚");          // lo «casi» es un huevo
  await expect(page.locator("#screen-jardin .sim-flor")).toHaveText("🦕");
  const brota = await page.evaluate(() => Array.from({ length: 30 }, () => algoQueCrece()));
  const selva = await page.evaluate(() => MUNDOS.dinos.crecen);
  expect(brota.every((e) => selva.includes(e))).toBe(true);
});

test("quien no elige empieza en el huerto, con el jardinero", async ({ page }) => {
  await page.goto("./");
  await crear(page, "Sam");
  expect(await page.evaluate(() => [perfilEnUso().mundo, perfilEnUso().emoji])).toEqual(["huerto", "🧑‍🌾"]);
  await page.click("#screen-selector >> text=Cambiar de jugador");
  expect(await page.evaluate(() => document.body.dataset.mundo)).toBeUndefined();   // la bienvenida vuelve a ser neutra
  await expect(page.locator(".btn-perfil")).toContainText("🥕 Huerto · 0 de 54 flores");
});

test("cambiar de mundo desde el menú no borra nada y se recuerda", async ({ page }) => {
  await page.goto("./");
  await crear(page, "Ana", { mundo: "flores", personaje: "🦄" });
  await ponerIntentos(page, "2x2", flor);
  await page.click("#screen-selector >> text=Mi mundo y mi personaje");
  await expect(page.locator('#screen-mundo input[value="flores"]')).toBeChecked();
  await expect(page.locator('#screen-mundo input[value="🦄"]')).toBeChecked();
  await page.click('#screen-mundo label:has(input[value="bosque"])');
  await page.click('#screen-mundo label:has(input[value="🦉"])');
  await page.click("#screen-mundo >> text=Listo");
  await expect(page.locator("#screen-selector")).toBeVisible();
  await expect(page.locator("#display-personaje")).toHaveText("🦉");
  await page.reload();
  await page.click(".btn-perfil");
  expect(await page.evaluate(() => [document.body.dataset.mundo, estadoHecho(2, 2), plantaDe(2, 2).emoji])).toEqual(["bosque", "florecida", "🌳"]);
});

test("los jardines de antes de los mundos siguen siendo de flores", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("sembrado")) return;
    localStorage.setItem("jardin:perfiles", JSON.stringify([{ id: "p1", nombre: "Ana", emoji: "🌻", iniciado: true }]));
    localStorage.setItem("jardin:perfil", "p1");
    sessionStorage.setItem("sembrado", "1");
  });
  await page.goto("./");
  expect(await page.evaluate(() => [perfilEnUso().mundo, perfilEnUso().emoji])).toEqual(["flores", "🌻"]);
});

test("un mundo o personaje guardado desconocido no rompe nada", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("jardin:perfiles", JSON.stringify([{ id: "p1", nombre: "Ana", emoji: "<b>", mundo: "marte", iniciado: true }]));
  });
  await page.goto("./");
  expect(await page.evaluate(() => [perfilEnUso().mundo, perfilEnUso().emoji])).toEqual(["flores", "🧑‍🌾"]);
});

test("el vivero trae premios variados, ordenados por precio", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => [VIVERO.map((v) => v.id), VIVERO.every((v, i) => i === 0 || VIVERO[i - 1].precio <= v.precio),
    articulo(VIVERO.find((v) => v.id === "tortuga")), articulo(VIVERO.find((v) => v.id === "dragon"))]);
  expect(r[0]).toEqual(expect.arrayContaining(["tractor", "dinosaurio", "cohete", "dragon", "unicornio", "buho", "tortuga"]));
  expect(r.slice(1)).toEqual([true, "la tortuga", "el dragón"]);
});

test("cada mundo tiene una cosa por tabla y emojis que existen en tabletas viejas", async ({ page }) => {
  await page.goto("./");
  const mundos = await page.evaluate(() => MUNDOS);
  // Emojis de Unicode 14 o posteriores salen como cuadros en iPad con iOS 14.
  const nuevos = /[\u{1FA70}-\u{1FAFF}]|\u{1F6DD}|\u{1F7F0}/u;
  for (const [id, m] of Object.entries(mundos)) {
    expect(m.flora, id).toHaveLength(9);
    for (const e of [...m.flora, ...m.crecen, m.flor, m.capullo, m.emoji]) {
      expect(nuevos.test(e), `${id}: ${e}`).toBe(false);
    }
  }
});
