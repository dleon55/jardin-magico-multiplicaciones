// Mi progreso (Hito 4.7): el camino, el jardín, el mapa de tablas y el
// vivero, cada uno con su resumen, en una sola pantalla. Con el mundo a la
// vista sustituye a los cuatro botones del inicio; con la lista, siguen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// El inicio de serie: el mundo (las demás pruebas usan la lista).
test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] } });

async function alMundo(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.evaluate(() => { almacen.guardar("diagnostico", "saltado"); mostrarPantalla("screen-selector"); });
  await expect(page.locator("#mundo-vivo")).toBeVisible();
}
/** Se saben esas tablas (escritas bien y rápido en dos días), y se vuelve al inicio. */
const saber = (page, tablas) => page.evaluate((tablas) => {
  const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
  for (const a of tablas) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: d(1), m: "e", ok: 1, ms: 2000 }, { d: d(0), m: "e", ok: 1, ms: 2000 }];
  guardarHechos();
  mostrarPantalla("screen-selector");
}, tablas);
const fichas = (page) => page.locator("#progreso-mapa-fichas .ficha-tabla").evaluateAll((fs) => fs.map((f) => `${f.textContent}|${f.className.replace("ficha-tabla ficha-", "")}`));
/** Los anchos (en %) de unas barras, redondeados a dos decimales. */
const anchos = (page, sel) => page.locator(sel).evaluateAll((ts) => ts.map((t) => `${Math.round(parseFloat(t.style.width) * 100) / 100}%`));
const pct = (parte, total) => `${Math.round((parte / total) * 10000) / 100}%`;

test("con el mundo, el inicio tiene una sola tarjeta de progreso en lugar de los cuatro botones", async ({ page }) => {
  await alMundo(page);
  await expect(page.locator("#btn-progreso")).toBeVisible();
  await expect(page.locator("#btn-progreso")).toContainText("Mi progreso");
  await expect(page.locator("#progreso-resumen")).toHaveText("0 de 15 tramos · 0 cosechas · 0 estrellas");
  await expect(page.locator("#btn-progreso")).toHaveAccessibleDescription("0 de 15 tramos · 0 cosechas · 0 estrellas");
  await expect(page.locator("#progreso-lista")).toBeHidden();
  await expect(page.locator("#btn-camino")).toBeHidden();
  // El resumen sigue lo que pasa: tablas sabidas y estrellas, en singular cuando toca.
  await page.evaluate(() => ganarEstrellas(1));
  await saber(page, [2]);
  const florecidas = await page.evaluate(() => cuentaPorEstado().florecida);
  const tramos = await page.evaluate(() => CAMINO.filter((t) => estadoTramo(t).estado === "hecho").length);
  expect(tramos).toBeGreaterThan(0);
  await expect(page.locator("#progreso-resumen")).toHaveText(`${tramos} de 15 tramos · ${florecidas} cosechas · 1 estrella`);
  await page.evaluate(() => { hechos = {}; hechos[claveHecho(2, 3)] = [1, 0].map((k) => ({ d: new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10), m: "e", ok: 1, ms: 2000 })); guardarHechos(); mostrarPantalla("screen-selector"); });
  expect(await page.evaluate(() => cuentaPorEstado().florecida)).toBe(1);
  await expect(page.locator("#progreso-resumen")).toContainText("· 1 cosecha ·");
});

test("la pantalla, en un jardín que empieza: todo en cero, dicho con claridad", async ({ page }) => {
  await alMundo(page);
  await page.click("#btn-progreso");
  await expect(page.locator("#screen-progreso")).toBeVisible();
  await expect(page.locator("#screen-progreso h2")).toHaveText("Mi progreso");
  await expect(page.locator("#screen-progreso h2")).toBeFocused();
  await expect(page.locator("#progreso-lumi")).toHaveText(await page.evaluate(() => textoEtapaLumi()));
  await expect(page.locator("#lumi-progreso > svg")).toHaveAttribute("data-expresion", "contenta");
  await expect(page.locator("#progreso-camino-texto")).toHaveText("0 de 15 tramos · Ahora: Tabla del 2");
  expect(await anchos(page, "#progreso-camino-barra")).toEqual(["0%"]);
  await expect(page.locator("#progreso-jardin-texto")).toHaveText("0 de 54 cosechas");
  await expect(page.locator("#progreso-jardin-detalle")).toHaveText("0 están casi · 0 en práctica · 54 por descubrir");
  expect(await anchos(page, "#progreso-jardin-barra .tramo-barra")).toEqual(["0%", "0%", "0%"]);
  await expect(page.locator("#progreso-mapa-texto")).toHaveText("Sabes 0 de 9 tablas");
  expect(await fichas(page)).toEqual(["1|nueva", "2|nueva", "3|nueva", "4|nueva", "5|nueva", "6|nueva", "7|nueva", "8|nueva", "9|nueva"]);
  await expect(page.locator("#progreso-vivero-texto")).toHaveText("0 estrellas · Tienes 0 de 18 del vivero");
  await expect(page.locator("#progreso-vivero-detalle")).toHaveText("Te faltan 10 ⭐ para la mariposa");
  await expect(page.locator("#progreso-datos")).toBeHidden();
});

test("con avance: cada tarjeta cuenta lo suyo, con sus barras y fichas", async ({ page }) => {
  await alMundo(page);
  await saber(page, [2, 5]);
  await page.evaluate(() => {
    const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    hechos[claveHecho(7, 8)] = [{ d: d(0), m: "o", ok: 1, ms: 1500 }];   // una en práctica, que empieza la del 7 y la del 8
    guardarHechos();
    ganarEstrellas(34);
    comprar("mariposa");
    almacen.guardar("expediciones", JSON.stringify([d(2), d(1)]));
    misiones.dias = [d(2), d(1), d(0)];
    mostrarProgreso();
  });
  const r = await page.evaluate(() => ({ ...resumenDeProgreso(), total: plantas().length, actual: nombreTramo(tramoActual()), antojo: document.getElementById("vivero-antojo").textContent }));
  expect(r.plantas.florecida).toBeGreaterThan(10);
  expect(r.plantas.practica + r.plantas.casi).toBeGreaterThan(0);
  expect(r.plantas.florecida + r.plantas.casi + r.plantas.practica + r.plantas.nuevo).toBe(54);
  expect(r.tramos).toBeGreaterThan(0);
  await expect(page.locator("#progreso-camino-texto")).toHaveText(`${r.tramos} de 15 tramos · Ahora: ${r.actual}`);
  expect(await anchos(page, "#progreso-camino-barra")).toEqual([pct(r.tramos, 15)]);
  await expect(page.locator("#progreso-jardin-texto")).toHaveText(`${r.plantas.florecida} de 54 cosechas`);
  await expect(page.locator("#progreso-jardin-detalle")).toHaveText(`${r.plantas.casi} ${r.plantas.casi === 1 ? "está casi" : "están casi"} · ${r.plantas.practica} en práctica · ${r.plantas.nuevo} por descubrir`);
  expect(await anchos(page, "#progreso-jardin-barra .tramo-barra")).toEqual(["florecida", "casi", "practica"].map((e) => pct(r.plantas[e], 54)));
  expect(await page.locator("#progreso-jardin-barra .tramo-barra").evaluateAll((ts) => ts.map((t) => t.dataset.estado))).toEqual(["florecida", "casi", "practica"]);
  // El mapa: la del 2 y la del 5 se saben; las demás ya se empezaron (comparten plantas con ellas).
  await expect(page.locator("#progreso-mapa-texto")).toHaveText("Sabes 2 de 9 tablas");
  expect(await fichas(page)).toEqual(["1 •|empezada", "2 ✓|sabida", "3 •|empezada", "4 •|empezada", "5 ✓|sabida", "6 •|empezada", "7 •|empezada", "8 •|empezada", "9 •|empezada"]);
  await expect(page.locator("#progreso-vivero-texto")).toHaveText("24 estrellas · Tienes 1 de 18 del vivero");
  await expect(page.locator("#progreso-vivero-detalle")).toHaveText(r.antojo);
  await expect(page.locator("#progreso-datos")).toHaveText("2 banderines de expedición · 3 días seguidos con la meta");
});

test("los casos que casi no se dan: una sola planta «casi» y el camino completo", async ({ page }) => {
  await alMundo(page);
  await page.evaluate(() => {
    window.cuentaPorEstado = () => ({ florecida: 3, casi: 1, practica: 2, nuevo: 48 });
    window.tramoActual = () => null;
    mostrarProgreso();
  });
  await expect(page.locator("#progreso-jardin-detalle")).toHaveText("1 está casi · 2 en práctica · 48 por descubrir");
  await expect(page.locator("#progreso-camino-texto")).toHaveText(/^¡Camino completo: \d+ de 15 tramos!$/);
});

test("los datos de abajo: solo lo que hay, y la racha desde dos días", async ({ page }) => {
  await alMundo(page);
  const pon = (banderines, dias) => page.evaluate(([b, n]) => {
    const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    almacen.guardar("expediciones", JSON.stringify(Array.from({ length: b }, (_, k) => d(k))));
    misiones.dias = Array.from({ length: n }, (_, k) => d(k)).reverse();
    mostrarProgreso();
  }, [banderines, dias]);
  await pon(1, 1);
  await expect(page.locator("#progreso-datos")).toHaveText("1 banderín de expedición");
  await pon(0, 2);
  await expect(page.locator("#progreso-datos")).toHaveText("2 días seguidos con la meta");
  await pon(0, 1);
  await expect(page.locator("#progreso-datos")).toBeHidden();
});

test("con todo aprendido: camino completo, las nueve tablas sabidas y la barra llena", async ({ page }) => {
  await alMundo(page);
  await saber(page, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  await page.evaluate(() => {
    aventuraGuardada.alcanzado = AVENTURA_MUNDOS.length * NIVELES_POR_MUNDO;
    aventuraGuardada.jugados = AVENTURA_MUNDOS.map((_, i) => i);
    mostrarProgreso();
  });
  await expect(page.locator("#progreso-mapa-texto")).toHaveText("Sabes 9 de 9 tablas");
  expect((await fichas(page)).every((f) => f.endsWith("✓|sabida"))).toBe(true);
  await expect(page.locator("#progreso-jardin-texto")).toHaveText("54 de 54 cosechas");
  expect(await anchos(page, "#progreso-jardin-barra .tramo-barra")).toEqual(["100%", "0%", "0%"]);
  const hechos = await page.evaluate(() => [CAMINO.filter((t) => estadoTramo(t).estado === "hecho").length, tramoActual()]);
  if (hechos[1] === null) {
    await expect(page.locator("#progreso-camino-texto")).toHaveText("¡Camino completo: 15 de 15 tramos!");
    expect(await anchos(page, "#progreso-camino-barra")).toEqual(["100%"]);
  } else {
    await expect(page.locator("#progreso-camino-texto")).toContainText(`${hechos[0]} de 15 tramos · Ahora:`);
  }
});

for (const [tarjeta, pantalla] of [["camino", "screen-camino"], ["jardin", "screen-jardin"], ["mapa", "screen-mapa"], ["vivero", "screen-vivero"]]) {
  test(`la tarjeta «${tarjeta}» abre su pantalla, y «Menú» vuelve a Mi progreso`, async ({ page }) => {
    await alMundo(page);
    await page.click("#btn-progreso");
    await page.click(`#progreso-${tarjeta}`);
    await expect(page.locator(`#${pantalla}`)).toBeVisible();
    await page.click(`#${pantalla} .btn-volver`);
    await expect(page.locator("#screen-progreso")).toBeVisible();
    await expect(page.locator("#screen-progreso h2")).toBeFocused();
    // Y de Mi progreso, «Menú» va al inicio.
    await page.click("#screen-progreso .btn-volver");
    await expect(page.locator("#screen-selector")).toBeVisible();
  });
}

test("Escape hace el mismo recorrido de vuelta: detalle, Mi progreso, inicio", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "el teclado físico es de escritorio");
  await alMundo(page);
  await page.click("#btn-progreso");
  await page.click("#progreso-jardin");
  await expect(page.locator("#screen-jardin")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#screen-progreso")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#screen-selector")).toBeVisible();
});

test("lo que se abre por fuera de Mi progreso vuelve al inicio, como siempre", async ({ page }) => {
  await alMundo(page);
  // Entrar a Mi progreso, volver al inicio y abrir el jardín por otro lado: no debe regresar a Mi progreso.
  await page.click("#btn-progreso");
  await page.click("#screen-progreso .btn-volver");
  await page.evaluate(() => mostrarJardin());
  await page.click("#screen-jardin .btn-volver");
  await expect(page.locator("#screen-selector")).toBeVisible();
  // Y si desde el jardín se sale a jugar, al terminar tampoco: una partida corta el regreso.
  await page.click("#btn-progreso");
  await page.click("#progreso-jardin");
  await page.evaluate(() => { startTable(2); backToSelector(); });
  await expect(page.locator("#screen-selector")).toBeVisible();
  expect(await page.evaluate(() => desdeProgreso)).toBe(false);
});

test("al volver del vivero, Mi progreso ya cuenta lo comprado", async ({ page }) => {
  await alMundo(page);
  await page.evaluate(() => ganarEstrellas(12));
  await page.click("#btn-progreso");
  await expect(page.locator("#progreso-vivero-texto")).toHaveText("12 estrellas · Tienes 0 de 18 del vivero");
  await page.click("#progreso-vivero");
  await page.evaluate(() => comprar("mariposa"));
  await page.click("#screen-vivero .btn-volver");
  await expect(page.locator("#progreso-vivero-texto")).toHaveText("2 estrellas · Tienes 1 de 18 del vivero");
});

test("en otro mundo, el jardín cuenta lo suyo (dinosaurios, no cosechas)", async ({ page }) => {
  await alMundo(page);
  await page.evaluate(() => {
    perfilEnUso().mundo = Object.keys(MUNDOS).find((k) => MUNDOS[k].nombreFlores === "dinosaurios");
    hechos[claveHecho(2, 3)] = [1, 0].map((k) => ({ d: new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10), m: "e", ok: 1, ms: 2000 }));
    guardarHechos();
    mostrarPantalla("screen-selector");
  });
  await expect(page.locator("#progreso-resumen")).toContainText("· 1 dinosaurio ·");
  await page.click("#btn-progreso");
  await expect(page.locator("#progreso-jardin-texto")).toHaveText("1 de 54 dinosaurios");
});

test("no guarda nada: abrir Mi progreso no cambia lo guardado", async ({ page }) => {
  await alMundo(page);
  await saber(page, [2]);
  const antes = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
  await page.click("#btn-progreso");
  await page.click("#progreso-mapa");
  await page.click("#screen-mapa .btn-volver");
  expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()))).toBe(antes);
});

test("cabe en el teléfono, con tarjetas de 44 px, y pasa la revisión de accesibilidad", async ({ page }, testInfo) => {
  await alMundo(page);
  await saber(page, [2, 5]);
  const medidas = (sel) => page.evaluate((sel) => ({
    ancho: document.documentElement.clientWidth, total: document.documentElement.scrollWidth,
    chicos: [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).filter((e) => e.getBoundingClientRect().height < 44 || e.getBoundingClientRect().right > document.documentElement.clientWidth).map((e) => e.id),
  }), sel);
  let m = await medidas("#btn-progreso");
  expect(m.chicos).toEqual([]);
  expect(m.total).toBeLessThanOrEqual(m.ancho);
  let axe = await new AxeBuilder({ page }).include("#btn-progreso").analyze();
  expect(axe.violations.map((v) => v.id), `${testInfo.project.name}: inicio`).toEqual([]);
  await page.click("#btn-progreso");
  m = await medidas(".tarjeta-progreso");
  expect(m.chicos).toEqual([]);
  expect(m.total).toBeLessThanOrEqual(m.ancho);
  // Las fichas del mapa no se salen de su tarjeta.
  expect(await page.evaluate(() => { const t = document.getElementById("progreso-mapa").getBoundingClientRect(); return [...document.querySelectorAll("#progreso-mapa-fichas .ficha-tabla")].every((f) => f.getBoundingClientRect().right <= t.right && f.getBoundingClientRect().left >= t.left); })).toBe(true);
  axe = await new AxeBuilder({ page }).include("#screen-progreso").analyze();
  expect(axe.violations.map((v) => v.id), `${testInfo.project.name}: pantalla`).toEqual([]);
});

test.describe("con el menú en lista", () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }, { name: "jardin:ajustes", value: '{"lista":true}' }] }] } });
  test("siguen los cuatro botones de siempre y no hay tarjeta; al cambiar a mundo en Ajustes, se intercambian", async ({ page }) => {
    await page.goto("./");
    await page.fill("#player-name", "Ana");
    await page.click("#screen-welcome button:has-text('Comenzar')");
    await expect(page.locator("#btn-progreso")).toBeHidden();
    await expect(page.locator("#btn-camino")).toBeVisible();
    await expect(page.locator("#progreso-lista button")).toHaveCount(4);
    await page.click("#btn-camino");
    await page.click("#screen-camino .btn-volver");
    await expect(page.locator("#screen-selector")).toBeVisible();
    await page.evaluate(() => { ajustes.lista = false; aplicarAjustes(); mostrarPantalla("screen-selector"); });
    await expect(page.locator("#btn-progreso")).toBeVisible();
    await expect(page.locator("#btn-camino")).toBeHidden();
  });
});
