// Usabilidad: lo que salió de revisar cada pantalla en tableta y teléfono.
// Que nada tape a nada, que la respuesta se vea donde se respondió, que el
// teléfono no obligue a desplazarse en mitad de un nivel, y textos que no
// se contradigan.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-15T12:00:00"));
});

async function alMenu(page, nombre = "Sofía") {
  await page.goto("./");
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}

const seTocan = (a, b) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

test("la bienvenida invita a jugar, sin confundir con «La Aventura»", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#screen-welcome button.bubble-font").last()).toContainText("¡Comenzar a jugar!");
  await expect(page.locator("#screen-welcome")).not.toContainText("Comenzar Aventura");
});

test("«Ajustes» no tapa la cabecera de ninguna pantalla", async ({ page }) => {
  await alMenu(page);
  const ajustes = () => page.locator("#ajustes summary").boundingBox();
  // Menú, partida y nivel de la aventura: sus cabeceras van arriba a la derecha.
  const cabeceras = [
    ["screen-selector", "#screen-selector > div:first-child"],
    ["screen-game", "#screen-game > div:first-child"],
    ["screen-aventura-juego", "#nivel-cabecera"],
  ];
  await page.locator("#grid-tablas-container button").nth(0).click();   // tabla del 1: descubrir
  await page.evaluate(() => startTable(2));
  expect(seTocan(await ajustes(), await page.locator(cabeceras[1][1]).boundingBox())).toBe(false);
  await page.evaluate(() => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); });
  expect(seTocan(await ajustes(), await page.locator(cabeceras[2][1]).boundingBox())).toBe(false);
  await page.evaluate(() => backToSelector());
  expect(seTocan(await ajustes(), await page.locator(cabeceras[0][1]).boundingBox())).toBe(false);
});

test("el menú está ordenado por secciones y los subtítulos usan la letra del juego", async ({ page }) => {
  await alMenu(page);
  await expect(page.locator("#screen-selector .seccion-menu")).toHaveText(["Juegos y retos", "Tu progreso"]);
  const letra = await page.locator("#aventura-menu-resumen").evaluate((e) => getComputedStyle(e).fontFamily);
  expect(letra).toContain("Quicksand");
  await expect(page.locator("#screen-selector")).not.toContainText("(Tablas Mezcladas)");
});

test("lo que pasó con la respuesta se dice justo debajo de las opciones", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable(3));
  const orden = await page.evaluate(() => {
    const ids = ["opciones", "game-feedback", "btn-siguiente", "btn-help"];
    const todos = [...document.querySelectorAll("#screen-game *")].map((e) => e.id);
    return ids.map((id) => todos.indexOf(id));
  });
  expect([...orden].sort((a, b) => a - b)).toEqual(orden);
  const mala = await page.evaluate(() => [...document.querySelectorAll(".btn-option")].find((b) => Number(b.dataset.valor) !== correctAnswer).id);
  await page.click(`#${mala}`);
  const caja = await page.locator("#game-feedback").boundingBox();
  expect(caja.y + caja.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight + scrollY));
});

test("el aviso de que equivocarse no quita nada sale al empezar y se va tras la primera respuesta", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable(3));
  await expect(page.locator("#aviso-repaso")).toBeVisible();
  await page.click(`.btn-option[data-valor="${await page.evaluate(() => correctAnswer)}"]`);
  await expect(page.locator("#aviso-repaso")).toBeHidden();
  await page.evaluate(() => startTable(4));
  await expect(page.locator("#aviso-repaso")).toBeVisible();
});

test("con la pregunta escrita arriba (fracciones, retos, problemas) el girasol se hace pequeño", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => startTable("logica"));
  await expect(page.locator("#girasol")).toHaveClass(/girasol-chico/);
  const alto = (await page.locator("#girasol").boundingBox()).height;
  await page.evaluate(() => startTable(3));
  await expect(page.locator("#girasol")).not.toHaveClass(/girasol-chico/);
  expect((await page.locator("#girasol").boundingBox()).height).toBeGreaterThan(alto * 1.5);
});

test("al descubrir una tabla, el texto no contradice a la ayuda", async ({ page }) => {
  await alMenu(page);
  await page.locator("#grid-tablas-container button").nth(3).click();
  for (let i = 0; i < 3; i++) await page.click("#descubrir-otra");
  await expect(page.locator("#descubrir-cuenta")).toHaveText("4 × 3 = 12: 3 veces 4");
  // La ayuda dibuja 4 × 3 como «4 filas de 3»: aquí ya no se dice «3 filas de 4: 4 × 3».
  await expect(page.locator("#descubrir-cuenta")).not.toContainText("filas de");
});

test("al terminar un nivel de la aventura, el teclado se va y las estrellas son doradas", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); });
  await expect(page.locator("#aventura-entrada")).toBeVisible();
  await page.evaluate(() => {
    for (let i = 0; i < 200 && !aventura.terminado; i++) {
      const e = enemigoObjetivo();
      if (e) responderAventura(e.op.respuesta); else aventuraPaso(aventura.config.cruce * 1000);
    }
  });
  await expect(page.locator("#arena-fin")).toBeVisible();
  await expect(page.locator("#aventura-entrada")).toBeHidden();
  await expect(page.locator("#aventura-mensaje")).toHaveText("");
  expect(await page.locator("#fin-estrellas").evaluate((e) => getComputedStyle(e).color)).toBe("rgb(217, 119, 6)");
  await page.click("#btn-fin-otra");
  await expect(page.locator("#aventura-entrada")).toBeVisible();
});

test("cada pantalla empieza arriba: abrir «Mi jardín» desde el final del menú no la deja a media altura", async ({ page }) => {
  await alMenu(page);
  await page.locator("#screen-selector >> text=Mi jardín").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(200);
  await page.click("#screen-selector >> text=Mi jardín");
  await expect(page.locator("#screen-jardin")).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollHeight > innerHeight + 200)).toBe(true);   // es larga
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("la cabecera del menú es del niño; lo de las personas adultas va aparte, al final", async ({ page }) => {
  await alMenu(page);
  const cabecera = page.locator("#cabecera-menu");
  await expect(cabecera.locator("button")).toHaveText([/Cambiar de jugador/, /Mi mundo y mi personaje/]);
  await expect(cabecera).not.toContainText("personas adultas");
  await expect(cabecera).toContainText("Tus estrellas:");
  // El de adultos es lo último del menú.
  const ultimo = await page.evaluate(() => [...document.querySelectorAll("#screen-selector button")].at(-1).id);
  expect(ultimo).toBe("btn-adultos-menu");
  await page.click("#btn-adultos-menu");
  await expect(page.locator("#screen-adultos")).toBeVisible();
});

test("la semana de la misión se entiende: leyenda, «Hoy» y días vacíos sin marcas raras", async ({ page }) => {
  await alMenu(page);
  // La marca es el icono de «listo»; el lector de pantalla oye «marca».
  await expect(page.locator("#mision-leyenda")).toHaveText(/Tu semana: cada\s*marca\s*es un día con la misión cumplida\./);
  await expect(page.locator('#mision-leyenda svg.icono use[href="#i-listo"]')).toHaveCount(1);
  const dias = page.locator("#mision-semana li");
  await expect(dias).toHaveCount(7);
  await expect(dias.last().locator("span").first()).toHaveText("Hoy");
  // Ningún día sin misión muestra «·»: solo un círculo vacío.
  const marcas = await dias.evaluateAll((ls) => ls.map((l) => l.querySelectorAll("span")[1].textContent));
  expect(marcas).toEqual(["", "", "", "", "", "", ""]);
  // Al cumplirla, el de hoy lleva ✓ y el lector de pantalla lo dice.
  await page.evaluate(() => { misiones.dias.push(hoy()); actualizarMision(); });
  await expect(dias.last().locator("span").nth(1)).toHaveText("✓");
  await expect(dias.last().locator(".sr-only")).toHaveText("hoy: misión cumplida");
});

test("al pasar el ratón, los botones no se mueven (antes temblaban si el puntero quedaba en el borde)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "solo con ratón");
  await alMenu(page);
  const boton = page.locator("#grid-tablas-container button").first();
  await boton.scrollIntoViewIfNeeded();   // con «Seguir» arriba, las tablas quedan más abajo
  const antes = await boton.boundingBox();
  await page.mouse.move(antes.x + antes.width / 2, antes.y + antes.height - 1);   // en el borde de abajo
  await page.waitForTimeout(100);
  const despues = await boton.boundingBox();
  expect(despues.y).toBe(antes.y);
  expect(await boton.evaluate((b) => getComputedStyle(b).transform)).toBe("none");
});

test.describe("en el teléfono", () => {
  test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });

  test("un nivel de la aventura cabe entero: arena, modos y teclado sin desplazarse", async ({ page }) => {
    await alMenu(page);
    await page.evaluate(() => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); });
    const r = await page.evaluate(() => ({
      alto: innerHeight,
      arena: document.getElementById("arena").getBoundingClientRect().top,
      lanzar: document.getElementById("aventura-lanzar").getBoundingClientRect().bottom,
    }));
    expect(r.arena).toBeGreaterThan(0);
    expect(r.lanzar).toBeLessThanOrEqual(r.alto);
  });

  test("con el dedo, el recuadro y «¡Lanzar!» también caben", async ({ page }) => {
    await alMenu(page);
    await page.evaluate(() => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); cambiarModoAventura("dedo"); });
    const fondo = await page.evaluate(() => document.getElementById("pizarra-lanzar").getBoundingClientRect().bottom);
    expect(fondo).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
  });
});
