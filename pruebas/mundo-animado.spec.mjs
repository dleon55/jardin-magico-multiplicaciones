// Un mundo más vivo (Hito 5.6): el sol late, la niebla deriva, las flores y
// los banderines se mecen; abrir un lugar suena; y con tres días seguidos
// cumpliendo la meta sale el arcoíris. Todo se apaga con «Menos movimiento».
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MUNDO = { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] };
test.use({ storageState: MUNDO });

async function alMundo(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.evaluate(() => { almacen.guardar("diagnostico", "saltado"); mostrarPantalla("screen-selector"); });
  await expect(page.locator("#mundo-vivo")).toBeVisible();
}
/** Con flores, banderines y racha a la vista. */
const poblar = (page, racha = 0) => page.evaluate((racha) => {
  const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
  for (const a of [2, 5]) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: d(1), m: "e", ok: 1, ms: 2000 }, { d: d(0), m: "e", ok: 1, ms: 2000 }];
  guardarHechos();
  almacen.guardar("expediciones", JSON.stringify([d(1), d(0)]));
  misiones.dias = Array.from({ length: racha }, (_, k) => d(k)).reverse();
  mostrarPantalla("screen-selector");
}, racha);
const animacion = (page, selector) => page.locator(selector).first().evaluate((e) => { const s = getComputedStyle(e); return [s.animationName, s.animationIterationCount, parseFloat(s.animationDuration)]; });
const PIEZAS = [["#mundo-mapa .mundo-sol", "mundo-late"], ["#mundo-mapa .niebla-lugar ellipse", "mundo-deriva"], ["#mundo-mapa .niebla-lugar text", "mundo-flota"],
  ["#mundo-mapa .flor-mundo", "mundo-mece"], ["#mundo-mapa .banderin-mundo path:last-child", "mundo-ondea"]];

test.describe("con movimiento", () => {
  // Se entra con movimiento reducido (con animaciones, «Comenzar» late y no se deja tocar) y se activa después.
  const conMovimiento = (page) => page.emulateMedia({ reducedMotion: "no-preference" });

  test("el sol late, la niebla deriva, las zetas flotan y las flores y los banderines se mecen, despacio y sin parar", async ({ page }) => {
    await alMundo(page);
    await poblar(page);
    await conMovimiento(page);
    for (const [selector, nombre] of PIEZAS) {
      const [n, veces, dura] = await animacion(page, selector);
      expect(n, selector).toBe(nombre);
      expect(veces, selector).toBe("infinite");
      expect(dura, selector).toBeGreaterThanOrEqual(2.5);   // despacio: nada que parpadee
    }
    // Solo se mueve con transform: ninguna animación toca el tamaño ni la posición del diseño.
    const propiedades = await page.evaluate(() => [...document.styleSheets].flatMap((h) => { try { return [...h.cssRules]; } catch (e) { return []; } })
      .filter((r) => r.type === CSSRule.KEYFRAMES_RULE && r.name.startsWith("mundo-")).flatMap((r) => [...r.cssRules].flatMap((k) => [...k.style])));
    expect([...new Set(propiedades)]).toEqual(["transform"]);
    expect(propiedades.length).toBeGreaterThanOrEqual(10);
  });

  test("con «Menos movimiento» en Ajustes, el mundo se queda quieto", async ({ page }) => {
    await alMundo(page);
    await poblar(page);
    await conMovimiento(page);
    expect((await animacion(page, PIEZAS[0][0]))[0]).toBe("mundo-late");
    await page.evaluate(() => { ajustes.calma = true; aplicarAjustes(); });
    for (const [selector] of PIEZAS) expect((await animacion(page, selector))[0], selector).toBe("none");
  });
});

test("con movimiento reducido en el sistema, tampoco se mueve", async ({ page }) => {
  await alMundo(page);
  await poblar(page);
  for (const [selector] of PIEZAS) expect((await animacion(page, selector))[0], selector).toBe("none");
});

test("abrir un lugar suena; uno dormido, no", async ({ page }) => {
  await alMundo(page);
  await page.evaluate(() => { const original = sonar; window.__sonados = []; window.sonar = (n) => { window.__sonados.push(n); original(n); }; });
  await page.evaluate(() => avisarLugarDormido(LUGARES[1], faltanParaLugar(LUGARES[1])));
  await page.evaluate(() => abrirLugar("bosque"));   // dormido: no se abre
  expect(await page.evaluate(() => window.__sonados.filter((n) => n === "lugar"))).toEqual([]);
  await page.evaluate(() => abrirLugar("huerto"));
  expect(await page.evaluate(() => window.__sonados.filter((n) => n === "lugar"))).toEqual(["lugar"]);
  // El sonido existe, es corto y tiene su ajuste de volumen como los demás.
  const s = await page.evaluate(() => ({ notas: SONIDOS.lugar, ajuste: AJUSTE_SONIDO.lugar, fin: Math.max(...SONIDOS.lugar.map(([t, , d]) => t + d)), conocidas: SONIDOS.lugar.every(([, nota]) => nota in DO) }));
  expect(s.notas.length).toBeGreaterThanOrEqual(2);
  expect(s.conocidas).toBe(true);
  expect(s.fin).toBeLessThan(0.5);
  expect(s.ajuste).toBeGreaterThan(0);
});

test("con tres días seguidos de meta sale el arcoíris; con dos, no; y al romperse la racha se va", async ({ page }) => {
  await alMundo(page);
  await poblar(page, 2);
  await expect(page.locator("#mundo-mapa .arcoiris-mundo")).toHaveCount(0);
  await poblar(page, 3);
  await expect(page.locator("#mundo-mapa .arcoiris-mundo")).toHaveCount(1);
  await expect(page.locator("#mundo-mapa .arcoiris-mundo path")).toHaveCount(3);
  expect(await page.evaluate(() => RACHA_ARCOIRIS)).toBe(3);
  // En el cielo, arriba del huerto, sin tapar el sol ni salirse del mapa.
  const r = await page.evaluate(() => {
    const caja = (sel) => document.querySelector(sel).getBoundingClientRect();
    const [arco, sol, mapa, huerto] = [caja("#mundo-mapa .arcoiris-mundo"), caja("#mundo-mapa .mundo-sol"), caja("#mundo-mapa"), caja('.lugar-mundo[data-lugar="huerto"]')];
    return { tapaSol: arco.left < sol.right && sol.left < arco.right && arco.top < sol.bottom && sol.top < arco.bottom,
      dentro: arco.left >= mapa.left && arco.right <= mapa.right && arco.top >= mapa.top, arriba: arco.top < huerto.top,
      // Va antes del pasto en el dibujo: el pasto le tapa los pies.
      antesDelPasto: Boolean(document.querySelector("#mundo-mapa .arcoiris-mundo").compareDocumentPosition(document.querySelector("#mundo-mapa svg > path")) & Node.DOCUMENT_POSITION_FOLLOWING) };
  });
  expect(r).toEqual({ tapaSol: false, dentro: true, arriba: true, antesDelPasto: true });
  // Racha rota: los tres días no son seguidos hasta hoy.
  await page.evaluate(() => { const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10); misiones.dias = [d(6), d(5), d(4)]; mostrarPantalla("screen-selector"); });
  await expect(page.locator("#mundo-mapa .arcoiris-mundo")).toHaveCount(0);
});

test("el mundo sigue pasando la revisión de accesibilidad, con todo a la vista", async ({ page }, testInfo) => {
  await alMundo(page);
  await poblar(page, 3);
  const axe = await new AxeBuilder({ page }).include("#mundo-vivo").analyze();
  expect(axe.violations.map((v) => v.id), testInfo.project.name).toEqual([]);
  await expect(page.locator("#mundo-mapa svg.mundo-arte")).toHaveAttribute("aria-hidden", "true");   // el dibujo es decorativo
});
