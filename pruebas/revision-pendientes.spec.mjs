// Lo que quedó de la revisión visual (#114): personajes, contraste de la
// Aventura y la vista para adultos.
import { test, expect } from "@playwright/test";

async function alMenu(page, nombre = "Ana") {
  await page.goto("./");
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

test("«Mi mundo y mi personaje»: quien no eligió ve marcado al jardinero", async ({ page }) => {
  await alMenu(page);
  await page.click("#screen-selector >> text=Mi mundo y mi personaje");
  await expect(page.locator("#screen-mundo .elegir-personaje input")).toHaveCount(13);
  await expect(page.locator("#screen-mundo .elegir-personaje input:checked")).toHaveCount(1);
  await expect(page.locator("#screen-mundo .elegir-personaje input:checked")).toHaveValue("🧑‍🌾");
  await expect(page.locator("#screen-mundo .elegir-personaje label:has(input:checked)")).toContainText("jardinero");
});

test("en equipo, a quien se suma le toca un personaje que nadie usa", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarEquipo());
  for (const nombre of ["Leo", "Mia"]) {
    await page.fill("#equipo-nombre", nombre);
    await page.press("#equipo-nombre", "Enter");
  }
  const emojis = await page.evaluate(() => perfiles.filter((p) => p.iniciado).map((p) => p.emoji));
  expect(emojis.length).toBe(3);
  expect(new Set(emojis).size).toBe(3);
});

test("Aventura: lo cerrado se lee (sin desvanecer, borde punteado) y las estrellas se ven", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarAventura());
  const cerrado = page.locator('.btn-nivel[data-nivel="1-0"]');
  await expect(cerrado).toBeDisabled();
  const estilo = await cerrado.evaluate((b) => { const c = getComputedStyle(b); return { opacidad: c.opacity, borde: c.borderTopStyle }; });
  expect(estilo).toEqual({ opacidad: "1", borde: "dashed" });
  const tam = await page.locator('.btn-nivel[data-nivel="0-0"] .estrellas-nivel').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(tam).toBeGreaterThanOrEqual(16);
});

test("Aventura: «Compartir mi puntaje» aparece solo con puntaje", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarAventura());
  await expect(page.locator("#btn-compartir")).toBeHidden();
  await page.evaluate(() => { aventuraGuardada.mejores = { "0-0": 500 }; aventuraGuardada.estrellas = { "0-0": 2 }; aventuraGuardada.alcanzado = 1; guardarAventura(); mostrarAventura(); });
  await expect(page.locator("#btn-compartir")).toBeVisible();
});

test("vista para adultos: un tema por tarjeta, con una pastilla por clase, y los 14 días en dos semanas de 7", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await alMenu(page);
  await page.evaluate(() => {
    for (const clave of ["tiempo:leer", "tiempo:duracion"]) for (let i = 0; i < 4; i++) registrarOtro(clave, clave === "tiempo:leer" || i === 0);
    registrarIntento(3, 4, true);
    mostrarAdultos();
  });
  const tarjeta = page.locator(".adulto-tiempo");
  await expect(tarjeta).toHaveClass(/adulto-tema/);
  await expect(tarjeta.locator(".adulto-clase")).toHaveCount(2);
  await expect(tarjeta.locator(".adulto-clase").first()).toHaveText("leer el reloj 4 de 4");
  await expect(tarjeta.locator(".adulto-clase").first()).toHaveClass(/bg-green-100/);
  await expect(tarjeta.locator(".adulto-clase").last()).toHaveClass(/bg-rose-50/);
  // El texto que se lee sigue siendo una frase completa.
  await expect(tarjeta).toContainText("Medidas de tiempo (sus últimas respuestas): leer el reloj 4 de 4, cuánto dura 1 de 4.");
  await expect(tarjeta.locator(".adulto-cuesta")).toContainText("Le cuesta más: cuánto dura.");
  // Dos semanas: 7 y 7.
  const filas = await page.locator(".adulto-semanas").first().evaluate((ol) => {
    const tops = [...ol.children].map((li) => Math.round(li.getBoundingClientRect().top));
    return [...new Set(tops)].map((t) => tops.filter((x) => x === t).length);
  });
  expect(filas).toEqual([7, 7]);
  // «Todo se guarda solo en este dispositivo» una sola vez en la pantalla.
  const veces = await page.locator("#screen-adultos").evaluate((s) => (s.innerText.match(/Todo se guarda solo en este dispositivo/g) || []).length);
  expect(veces).toBe(1);
});

test("vivero: sin estrellas se dice solo el precio; con algunas, cuánto falta; y los botones son de dedo", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarVivero());
  const primero = page.locator("#screen-vivero li button").first();
  await expect(primero).toBeVisible();
  expect(await primero.locator("span[aria-hidden]").textContent()).not.toContain("faltan");
  expect((await primero.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.evaluate(() => { ganarEstrellas(3); mostrarVivero(); });
  expect(await page.locator("#screen-vivero li button").first().locator("span[aria-hidden]").textContent()).toContain("faltan");
});

// --- Detalles de #114 ---

test("jardín en el teléfono: «Tabla del 2», su estatus y «Ver la tabla del 2» no se parten a la mitad", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await alMenu(page);
  // La del 2 «Árbol con frutos»: el encabezado más largo, el que se partía.
  await page.evaluate(() => {
    const dia = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    for (let b = 1; b <= 10; b++) hechos[claveHecho(2, b)] = [{ d: dia(3), m: "e", ok: 1, ms: 2000 }, { d: dia(2), m: "e", ok: 1, ms: 2000 }, { d: dia(0), m: "e", ok: 1, ms: 2000 }];
    mostrarJardin();
  });
  const titulo = page.locator("#bancal-2");
  await expect(titulo).toContainText("Árbol con frutos");
  for (const sel of ["button >> nth=0", ".descubrir-bancal"]) {
    const renglones = await titulo.locator(sel).evaluate((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      // Un solo renglón: todos los pedazos empiezan a la misma altura (el emoji
      // puede quedar unos píxeles distinto; un renglón nuevo, una línea entera).
      const tops = [...r.getClientRects()].map((x) => x.top);
      return Math.max(...tops) - Math.min(...tops) < parseFloat(getComputedStyle(e).fontSize) * 0.8 ? 1 : 2;
    });
    expect(renglones, sel).toBe(1);
  }
  // Y nada se sale del bancal.
  const [enlace, bancal] = await titulo.evaluate((t) => [t.querySelector(".descubrir-bancal").getBoundingClientRect().right, t.closest("section").getBoundingClientRect().right]);
  expect(enlace).toBeLessThanOrEqual(bancal);
  // El enlace, a la derecha del renglón (no suelto a la izquierda).
  const [derechaEnlace, derechaTitulo] = await titulo.evaluate((t) => [t.querySelector(".descubrir-bancal").getBoundingClientRect().right, t.getBoundingClientRect().right]);
  expect(derechaTitulo - derechaEnlace).toBeLessThanOrEqual(2);
});

test("las fichas de mundo de una misma fila miden lo mismo", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await alMenu(page);
  await page.evaluate(() => mostrarMiMundo());
  const filas = await page.locator("#screen-mundo .elegir-mundo .cara").evaluateAll((cs) => {
    const porFila = {};
    for (const c of cs) { const r = c.getBoundingClientRect(); (porFila[Math.round(r.top)] ||= []).push(Math.round(r.height)); }
    return Object.values(porFila);
  });
  for (const alturas of filas) expect(new Set(alturas).size).toBe(1);
});

test("13 personajes en 5 columnas en el teléfono (para que midan 44 px): nadie queda solo en un renglón", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await alMenu(page);
  await page.evaluate(() => mostrarMiMundo());
  const porFila = await page.locator("#screen-mundo .elegir-personaje .ficha").evaluateAll((fs) => {
    const tops = fs.map((f) => Math.round(f.getBoundingClientRect().top));
    return [...new Set(tops)].map((t) => tops.filter((x) => x === t).length);
  });
  expect(porFila).toEqual([5, 5, 3]);
});

test("en equipo, con uno solo las tablas esperan (y al tocarlas dicen qué falta); con dos, se activan", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => mostrarEquipo());
  const tabla = page.locator('#equipo-tablas [data-tabla="3"]');
  await expect(tabla).toHaveAttribute("data-espera", "true");
  await expect(tabla).toHaveClass(/border-dashed/);
  await expect(page.locator("#equipo-falta")).toBeVisible();
  await expect(tabla).toHaveAttribute("aria-describedby", "equipo-falta");
  await tabla.click();
  await expect(page.locator("#equipo-aviso")).toHaveText("Elijan al menos a dos para jugar en equipo.");
  await page.fill("#equipo-nombre", "Leo");
  await page.press("#equipo-nombre", "Enter");
  await expect(tabla).toHaveAttribute("data-espera", "false");
  await expect(tabla).not.toHaveClass(/border-dashed/);
  await expect(page.locator("#equipo-falta")).toBeHidden();
  // Desmarcar a uno las vuelve a poner en espera.
  await page.locator("#equipo-jugadores input").last().uncheck();
  await expect(tabla).toHaveAttribute("data-espera", "true");
});

test("lo que se cuenta en el jardín es de cada mundo: dinosaurios, estrellas…", async ({ page }) => {
  await page.goto("./");
  await page.click('#screen-welcome .elegir-mundo label:has(input[value="dinos"])');
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toContainText("Mi jardín (0 de 54 dinosaurios)");
  await page.evaluate(() => mostrarJardin());
  await expect(page.locator("#jardin-resumen")).toHaveText("0 de 54 dinosaurios");
  const plurales = await page.evaluate(() => Object.values(MUNDOS).map((m) => m.nombreFlores));
  expect(plurales.every((x) => typeof x === "string" && x.length > 2)).toBe(true);
});

test("el bancal de la partida: dice qué va a pasar mientras está vacío, se pinta del mundo y lo riega tu personaje", async ({ page }) => {
  await page.goto("./");
  await page.click('#screen-welcome .elegir-mundo label:has(input[value="espacio"])');
  await page.click('#screen-welcome .elegir-personaje label:has(input[value="🦊"])');
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.evaluate(() => startTable(3));
  await expect(page.locator("#garden-vacio")).toHaveText("Aquí crece lo que aciertes");
  await expect(page.locator("#watering-can")).toHaveText("💧🦊");
  const fondo = await page.locator("#garden-plot").evaluate((e) => getComputedStyle(e).backgroundImage);
  expect(fondo).toContain("rgb(30, 27, 75)");   // el azul noche del espacio, no el pasto
  await page.evaluate(() => { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); });
  await expect(page.locator("#garden-vacio")).toHaveCount(0);
});
