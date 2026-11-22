// El mundo vivo (Hito 4): el inicio es un mundo que se recorre. Cada lugar
// reúne unos temas y despierta con las tablas que se van sabiendo; el camino
// florece con lo aprendido y Lumi está junto al último lugar despierto. La
// lista de siempre sigue en Ajustes («Menú en lista»).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Las demás pruebas usan la lista; estas, el inicio de serie: el mundo.
test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] } });

async function alMundo(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#mundo-vivo")).toBeVisible();
}

/** Se saben esas tablas («arbolito»: escritas bien y rápido en dos días), y se vuelve al inicio. */
const saber = (page, tablas) => page.evaluate((tablas) => {
  const dia = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
  for (const a of tablas) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: dia(1), m: "e", ok: 1, ms: 2000 }, { d: dia(0), m: "e", ok: 1, ms: 2000 }];
  guardarHechos();
  mostrarPantalla("screen-selector");
}, tablas);

const lugar = (page, id) => page.locator(`.lugar-mundo[data-lugar="${id}"]`);
const dormidos = (page) => page.locator(".lugar-dormido").evaluateAll((ls) => ls.map((l) => l.dataset.lugar));

test("al empezar: el mundo en lugar de la lista, con el huerto despierto y lo demás dormido", async ({ page }) => {
  await alMundo(page);
  await expect(page.locator("#menu-lista")).toBeHidden();
  await expect(page.locator(".lugar-mundo")).toHaveCount(5);
  expect(await dormidos(page)).toEqual(["bosque", "rio", "partes", "mercado"]);
  await expect(page.locator("#mundo-mapa .niebla-lugar")).toHaveCount(4);
  await expect(page.locator("#mundo-mapa .flor-mundo")).toHaveCount(0);
  await expect(page.locator(".lumi-mundo")).toHaveAttribute("data-lugar", "huerto");
  await expect(lugar(page, "huerto")).toContainText("Huerto de las tablas");
  await expect(lugar(page, "bosque")).toContainText("Despierta con la del 2 y la del 5");
  await expect(lugar(page, "mercado")).toContainText("Despierta con 7 tablas más");
  // El foco, en el encabezado del mundo (no en el de la lista, que no se ve).
  await expect(page.locator("#mundo-titulo")).toBeFocused();
  // «Seguir» y la meta siguen donde estaban; el progreso, en una sola tarjeta (Hito 4.7).
  await expect(page.locator("#btn-seguir")).toBeVisible();
  await expect(page.locator("#btn-progreso")).toBeVisible();
});

test("un lugar dormido no se abre: dice qué tablas faltan, entero", async ({ page }) => {
  await alMundo(page);
  await lugar(page, "partes").click();
  await expect(page.locator("#mundo-aviso")).toHaveText("Jardín de las partes sigue dormido: despierta cuando sepas la del 2, la del 5, la del 3, la del 4, la del 9 y la del 6.");
  await expect(page.locator("#lugar-fondo")).toBeHidden();
  await expect(lugar(page, "partes")).toHaveAttribute("aria-label", /dormido: despierta cuando sepas la del 2/);
  // Y por código tampoco.
  await page.evaluate(() => abrirLugar("partes"));
  await expect(page.locator("#lugar-fondo")).toBeHidden();
});

test("el huerto: las nueve tablas y el Desafío; elegir una tabla nueva lleva a descubrirla", async ({ page }) => {
  await alMundo(page);
  await lugar(page, "huerto").click();
  await expect(page.locator("#lugar-panel")).toBeVisible();
  await expect(page.locator("#lugar-titulo")).toHaveText("Huerto de las tablas");
  await expect(page.locator("#lugar-tablas .tabla-lugar")).toHaveCount(9);
  await expect(page.locator("#lugar-juegos .juego-lugar")).toHaveCount(1);
  await page.click('#lugar-tablas [data-tabla="3"]');
  await expect(page.locator("#lugar-fondo")).toBeHidden();
  await expect(page.locator("#screen-descubrir")).toBeVisible();
  await expect(page.locator("#descubrir-tabla")).toHaveText("3");
  // El Desafío empieza la partida mezclada.
  await page.evaluate(() => backToSelector());
  await lugar(page, "huerto").click();
  await page.click('#lugar-juegos [data-juego="mix"]');
  await expect(page.locator("#screen-game")).toBeVisible();
  expect(await page.evaluate(() => currentTable)).toBe("mix");
});

test("con la del 2 y la del 5 despierta el bosque; con cuatro, el río; Lumi va al último despierto", async ({ page }) => {
  await alMundo(page);
  await saber(page, [2, 5]);
  expect(await dormidos(page)).toEqual(["rio", "partes", "mercado"]);
  await expect(page.locator(".lumi-mundo")).toHaveAttribute("data-lugar", "bosque");
  await expect(lugar(page, "bosque")).toContainText("3 juegos");
  await expect(lugar(page, "rio")).toContainText("Despierta con la del 3 y la del 4");
  // En el huerto, las sabidas se ven marcadas.
  await lugar(page, "huerto").click();
  await expect(page.locator("#lugar-tablas .tabla-sabida")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await saber(page, [3, 4]);
  expect(await dormidos(page)).toEqual(["partes", "mercado"]);
  await expect(page.locator(".lumi-mundo")).toHaveAttribute("data-lugar", "rio");
  await saber(page, [9, 6, 7]);
  expect(await dormidos(page)).toEqual([]);
  await expect(page.locator(".lumi-mundo")).toHaveAttribute("data-lugar", "mercado");
});

test("los juegos de un lugar empiezan su partida; Fracciones abre su pantalla", async ({ page }) => {
  await alMundo(page);
  await saber(page, [2, 5, 3, 4, 9, 6, 7]);
  await lugar(page, "bosque").click();
  expect(await page.locator("#lugar-juegos .juego-lugar").evaluateAll((bs) => bs.map((b) => b.dataset.juego))).toEqual(["div", "residuo", "problemas"]);
  await page.click('#lugar-juegos [data-juego="residuo"]');
  await expect(page.locator("#screen-game")).toBeVisible();
  expect(await page.evaluate(() => [currentTable, pregunta.tipo])).toEqual(["residuo", "residuo"]);
  await page.evaluate(() => backToSelector());
  await lugar(page, "mercado").click();
  await expect(page.locator("#lugar-juegos .juego-lugar")).toHaveCount(4);
  await page.click('#lugar-juegos [data-juego="tiempo"]');
  expect(await page.evaluate(() => currentTable)).toBe("tiempo");
  await page.evaluate(() => backToSelector());
  await lugar(page, "partes").click();
  await page.click('#lugar-juegos [data-juego="fracciones"]');
  await expect(page.locator("#screen-fracciones")).toBeVisible();
});

test("ningún tema se pierde: los catorce están en algún lugar, cada uno con su dibujo", async ({ page }) => {
  await alMundo(page);
  const juegos = await page.evaluate(() => LUGARES.flatMap((l) => l.juegos.map(([icono, , , destino]) => [destino, iconoTema(icono).includes("<svg") && iconoTema(icono).length > 120])));
  expect(juegos.map(([d]) => d).sort()).toEqual(["area", "calendario", "decimales", "dinero", "div", "fracciones", "logica", "mix", "multiplos", "porcentajes", "problemas", "residuo", "tiempo"].sort());
  expect(juegos.every(([, dibujo]) => dibujo)).toBe(true);
  // (El decimocuarto son las tablas mismas, en el huerto.)
});

test("quien ya jugaba un tema no lo pierde: su lugar sigue despierto aunque falten tablas", async ({ page }) => {
  await alMundo(page);
  await page.evaluate(() => { registrarOtro("porcentaje:de", true); mostrarPantalla("screen-selector"); });
  expect(await dormidos(page)).toEqual(["bosque", "rio", "mercado"]);
  await lugar(page, "partes").click();
  await expect(page.locator("#lugar-titulo")).toHaveText("Jardín de las partes");
});

test("el camino florece con lo aprendido", async ({ page }) => {
  await alMundo(page);
  await saber(page, [2]);
  const conUna = await page.locator("#mundo-mapa .flor-mundo").count();
  expect(conUna).toBeGreaterThanOrEqual(1);
  await saber(page, [5, 3, 4]);
  const conCuatro = await page.locator("#mundo-mapa .flor-mundo").count();
  expect(conCuatro).toBeGreaterThan(conUna);
  expect(await page.evaluate(() => FLORES_MUNDO.length)).toBeGreaterThanOrEqual(conCuatro);
});

test("los juegos de un lugar son un diálogo: Escape cierra, el foco vuelve y las teclas de las tablas no se cuelan", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "teclado");
  await alMundo(page);
  await lugar(page, "huerto").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#lugar-panel")).toHaveAttribute("role", "dialog");
  await expect(page.locator("#lugar-titulo")).toBeFocused();
  await page.keyboard.press("5");   // en el inicio, el 5 abre la tabla del 5: aquí no
  await expect(page.locator("#screen-selector")).toBeVisible();
  await expect(page.locator("#lugar-fondo")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#lugar-fondo")).toBeHidden();
  await expect(lugar(page, "huerto")).toBeFocused();
  await expect(page.locator("#screen-selector")).toBeVisible();
});

test("«Menú en lista», en la pantalla de adultos, cambia a la lista de siempre, y se recuerda", async ({ page }) => {
  await alMundo(page);
  // Ya no está en Ajustes, a mano de quien juega (Hito 5.4).
  await page.click("#ajustes summary");
  await expect(page.locator('#ajustes .ajuste[data-ajuste="lista"]')).toHaveCount(0);
  await page.click("#ajustes summary");
  await page.click("#btn-adultos-menu");
  const boton = page.locator('#inicio-adultos .ajuste[data-ajuste="lista"]');
  await expect(boton).toHaveAttribute("aria-pressed", "false");
  await expect(boton.locator(".estado")).toHaveText("No");
  await expect(boton).toHaveAccessibleDescription(/Con el menú en lista se ve todo de una vez/);
  await boton.click();
  await expect(boton).toHaveAttribute("aria-pressed", "true");
  await expect(boton.locator(".estado")).toHaveText("Sí");
  await page.click("#screen-adultos .btn-volver");
  await expect(page.locator("#mundo-vivo")).toBeHidden();
  await expect(page.locator("#menu-lista")).toBeVisible();
  await expect(page.locator("#btn-porcentajes")).toBeVisible();   // en la lista nada duerme
  await page.reload();
  await page.click(".btn-perfil >> nth=0");
  await expect(page.locator("#menu-lista")).toBeVisible();
  await page.click("#btn-adultos-menu");
  await page.click('#inicio-adultos .ajuste[data-ajuste="lista"]');
  await page.click("#screen-adultos .btn-volver");
  await expect(page.locator("#mundo-vivo")).toBeVisible();
  await expect(page.locator(".lugar-mundo")).toHaveCount(5);
});

test("La Aventura y En equipo siguen a un toque, bajo el mundo", async ({ page }) => {
  await alMundo(page);
  await page.click("#btn-aventura-mundo");
  await expect(page.locator("#screen-aventura")).toBeVisible();
  await page.evaluate(() => backToSelector());
  await page.click("#btn-equipo-mundo");
  await expect(page.locator("#screen-equipo")).toBeVisible();
});

test("en otro mundo (el espacio) el suelo y el cielo cambian", async ({ page }) => {
  await page.goto("./");
  await page.click('#screen-welcome .elegir-mundo label:has(input[value="espacio"])');
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  const pasto = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--mundo-pasto").trim());
  expect(pasto).toBe("#2b2a5e");
});

test("cabe en el teléfono, en vertical y acostado: rótulos enteros, lugares de dedo y sin desbordes", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMundo(page);
    const nombre = `${tam.width}×${tam.height}`;
    expect(await page.evaluate(() => document.documentElement.scrollWidth), nombre).toBeLessThanOrEqual(tam.width);
    const mapa = await page.locator("#mundo-mapa").boundingBox();
    const rotulos = await page.locator(".rotulo-lugar").evaluateAll((rs) => rs.map((r) => { const c = r.getBoundingClientRect(); return [c.left, c.right, c.height, r.scrollWidth - r.clientWidth]; }));
    for (const [izq, der, alto, sobra] of rotulos) {
      expect(izq, nombre).toBeGreaterThanOrEqual(mapa.x);
      expect(der, nombre).toBeLessThanOrEqual(mapa.x + mapa.width);
      expect(alto, nombre).toBeGreaterThanOrEqual(44);
      expect(sobra, nombre).toBeLessThanOrEqual(0);
    }
    // El panel de un lugar cabe en la pantalla.
    await lugar(page, "huerto").click();
    const panel = await page.locator("#lugar-panel").boundingBox();
    expect(panel.y, nombre).toBeGreaterThanOrEqual(0);
    expect(panel.y + panel.height, nombre).toBeLessThanOrEqual(tam.height + 1);
    await page.locator("#lugar-juegos .juego-lugar").last().scrollIntoViewIfNeeded();
    await expect(page.locator("#lugar-juegos .juego-lugar").last()).toBeInViewport();
  }
});

test("accesible (axe): el mundo, con lugares dormidos, y los juegos de un lugar", async ({ page }) => {
  await alMundo(page);
  await saber(page, [2, 5]);
  const auditar = async (contexto) => {
    await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`), contexto).toEqual([]);
  };
  await auditar("el mundo");
  await lugar(page, "bosque").click();
  await auditar("los juegos del bosque");
});
