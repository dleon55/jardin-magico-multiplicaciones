// «Seguir» (issue #59): un solo camino. El botón grande del menú propone lo
// que toca —regar, terminar la tabla empezada, descubrir la siguiente,
// repasar o un reto— y el resto del menú queda como «Juego libre».
import { test, expect } from "@playwright/test";

const ORDEN = [2, 5, 3, 4, 9, 6, 7, 8, 1];

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/** Deja guardada la tabla `n` según `estado`: "bien" (todo acertado la última vez), "florecida" o "a medias". */
function ponerTabla(page, n, estado) {
  return page.evaluate(([n, estado]) => {
    const h = hoy(), ayer = fechaMenos(h, 1);
    const i = (d, ok = 1, ms = 2000, m = "e") => ({ d, t: 1, m, ok, ms });
    for (let b = 1; b <= MULTIPLICADORES; b++) {
      if (estado === "a medias" && b > 4) continue;
      hechos[claveHecho(n, b)] = estado === "florecida" ? [i(ayer), i(h)] : [i(h, 1, null, "o")];
    }
    guardarHechos();
  }, [n, estado]);
}
const refrescar = (page) => page.evaluate(() => mostrarPantalla("screen-selector"));
const que = (page) => page.locator("#seguir-que").textContent();
const detalle = (page) => page.locator("#seguir-detalle").textContent();

test("un jardín nuevo empieza por descubrir la tabla del 2", async ({ page }) => {
  await alMenu(page);
  expect(await que(page)).toBe("Tabla del 2");
  expect(await detalle(page)).toContain("Nueva");
  await page.click("#btn-seguir");
  await expect(page.locator("#screen-descubrir")).toBeVisible();
  expect(await page.evaluate(() => descubriendo.tabla)).toBe(2);
});

test("con una tabla a medias, sigue con ella y dice cuántas faltan", async ({ page }) => {
  await alMenu(page);
  await ponerTabla(page, 2, "a medias");
  await refrescar(page);
  expect(await que(page)).toBe("Tabla del 2");
  expect(await detalle(page)).toBe("Te faltan 6 por aprender.");
  await page.click("#btn-seguir");
  await expect(page.locator("#screen-game")).toBeVisible();
  expect(await page.evaluate(() => currentTable)).toBe(2);
});

test("lo que la última vez salió mal cuenta como «por aprender»", async ({ page }) => {
  await alMenu(page);
  await ponerTabla(page, 2, "bien");
  await page.evaluate(() => registrarIntento(2, 7, false));
  await refrescar(page);
  expect(await que(page)).toBe("Tabla del 2");
  expect(await detalle(page)).toBe("Te falta una por aprender.");
});

test("las tablas nuevas salen de la más fácil a la más difícil", async ({ page }) => {
  await alMenu(page);
  const vistas = [];
  for (const n of ORDEN) {
    await refrescar(page);
    vistas.push(await que(page));
    await ponerTabla(page, n, "bien");
  }
  expect(vistas).toEqual(ORDEN.map((n) => `Tabla del ${n}`));
});

test("si algo se marchita, primero se riega", async ({ page }) => {
  await alMenu(page);
  await ponerTabla(page, 3, "a medias");
  await page.evaluate(() => { hechos[claveHecho(2, 2)] = [{ d: "2020-01-01", t: 1, m: "e", ok: 1, ms: 2000 }, { d: "2020-01-02", t: 1, m: "e", ok: 1, ms: 2000 }]; guardarHechos(); });
  await refrescar(page);
  expect(await que(page)).toBe("Regar tu jardín");
  expect(await detalle(page)).toBe("Una flor se marchita: repásala y revivirá.");
  await page.click("#btn-seguir");
  await expect(page.locator("#screen-game")).toBeVisible();
  expect(await page.evaluate(() => currentTable)).toBe("falta");
});

test("con todas las tablas empezadas, repasa lo que está casi para que florezca", async ({ page }) => {
  await alMenu(page);
  for (const n of ORDEN) await ponerTabla(page, n, "bien");
  await refrescar(page);
  expect(await que(page)).toBe("Que florezca lo que falta");
  await page.click("#btn-seguir");
  expect(await page.evaluate(() => currentTable)).toBe("falta");
});

test("con todo florecido, la Aventura; y si ya la terminó, un reto de lógica", async ({ page }) => {
  await alMenu(page);
  for (const n of ORDEN) await ponerTabla(page, n, "florecida");
  await refrescar(page);
  expect(await que(page)).toBe("La Aventura");
  await page.click("#btn-seguir");
  await expect(page.locator("#screen-aventura")).toBeVisible();
  await page.evaluate(() => { aventuraGuardada.alcanzado = AVENTURA_MUNDOS.length * NIVELES_POR_MUNDO - 1; guardarAventura(); });
  await refrescar(page);
  expect(await que(page)).toBe("Un reto de lógica");
  await page.click("#btn-seguir");
  expect(await page.evaluate(() => currentTable)).toBe("logica");
});

test("el botón dice lo que hará al lector de pantalla, y el resto del menú sigue a un toque", async ({ page }) => {
  await alMenu(page);
  await expect(page.locator("#btn-seguir")).toHaveAccessibleName(/^Seguir: Tabla del 2/);
  await expect(page.locator("#btn-seguir")).toHaveAccessibleDescription("Nueva: vamos a descubrirla.");
  await expect(page.locator("#juego-libre")).toHaveText("Juego libre: elige tú");
  await expect(page.locator("#grid-tablas-container button").first()).toBeVisible();
  // «Seguir» va antes que la misión y que el juego libre.
  const orden = await page.evaluate(() => ["btn-seguir", "mision", "juego-libre"].map((id) => document.getElementById(id).getBoundingClientRect().top));
  expect(orden[0]).toBeLessThan(orden[1]);
  expect(orden[1]).toBeLessThan(orden[2]);
});

test("en el teléfono, «Seguir» se ve sin desplazarse, en vertical y acostado", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await alMenu(page);
    const caja = await page.locator("#btn-seguir").boundingBox();
    expect(caja.y + caja.height, `${tam.width}×${tam.height}`).toBeLessThanOrEqual(tam.height);
    expect(caja.height).toBeGreaterThanOrEqual(44);
  }
});
