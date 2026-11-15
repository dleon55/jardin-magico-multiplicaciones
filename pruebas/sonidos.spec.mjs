// Sonidos por capas (issue #50): un efecto para cada momento, de la misma
// escala que la música, parejos de volumen y apagables.
import { test, expect } from "@playwright/test";
import { entrarATabla, responder, siguiente, ponerIntentos, rapida } from "./ayudas.mjs";

/** Registra qué efectos pide el juego (window.__sonidos), sin tocar el audio. */
async function espiar(page) {
  await page.evaluate(() => {
    window.__sonidos = [];
    const real = window.sonar;
    window.sonar = (n) => { window.__sonidos.push(n); real(n); };
  });
}
const pedidos = (page) => page.evaluate(() => window.__sonidos);

test("acierto, fallo y racha de 3 suenan cada uno a lo suyo", async ({ page }) => {
  await entrarATabla(page, 3);
  await espiar(page);
  await responder(page, true);
  expect(await pedidos(page)).toContain("acierto");
  await siguiente(page);
  await responder(page, false);
  expect(await pedidos(page)).toContain("fallo");
  await siguiente(page);
  await page.evaluate(() => { window.__sonidos = []; });
  for (let i = 0; i < 3; i++) { await responder(page, true); if (i < 2) await siguiente(page); }
  await page.waitForTimeout(400);
  expect(await pedidos(page)).toContain("racha");
});

test("al florecer suena «florecer», no el acierto de siempre", async ({ page }) => {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button");
  for (let b = 1; b <= 10; b++) await ponerIntentos(page, `2x${b}`, [rapida("2026-10-01")]);
  await page.locator("#grid-tablas-container button").nth(1).click();
  if (await page.locator("#screen-descubrir:not(.hidden)").count()) await page.click("#descubrir-practicar");
  await espiar(page);
  await responder(page, true);
  await expect(page.locator("#game-feedback")).toContainText("floreció");
  const s = await pedidos(page);
  expect(s).toContain("florecer");
  expect(s).not.toContain("acierto");
});

test("en la Aventura: vencer, el último golpe al jefe y el nivel superado", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.click("#screen-selector >> text=La Aventura");
  await page.evaluate(() => { aventura.manual = true; aventuraGuardada.alcanzado = 3; mostrarAventura(); });
  await page.click('.btn-nivel[data-nivel="0-3"]');
  await espiar(page);
  await page.evaluate(() => {
    for (let i = 0; i < 400 && !aventura.terminado; i++) {
      aventura.hastaAparecer = 0; aventuraPaso(16);
      const e = enemigoObjetivo();
      if (e) responderAventura(e.op.respuesta);
    }
  });
  await page.waitForTimeout(600);
  const s = await pedidos(page);
  expect(s).toContain("vencer");
  expect(s.filter((x) => x === "jefe")).toHaveLength(1);
  expect(s.at(-1)).toBe("nivel");
});

test("comprar en el vivero tiene su sonido", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await espiar(page);
  await page.evaluate(() => { ganarEstrellas(500); comprar(VIVERO[0].id); });
  expect(await pedidos(page)).toEqual(["comprar"]);
});

test("los botones del menú hacen un toque suave; los de responder, no", async ({ page }) => {
  await entrarATabla(page, 4);
  await espiar(page);
  await page.locator(".btn-option, #escritura [data-digito]").first().dispatchEvent("pointerdown");
  expect(await pedidos(page)).toEqual([]);
  await page.locator("#btn-help").dispatchEvent("pointerdown");
  expect(await pedidos(page)).toEqual(["toque"]);
});

test("con «Sonidos: No» no suena nada", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => {
    ajustes.efectos = false;
    let osciladores = 0;
    initAudio();
    const crear = audioCtx.createOscillator.bind(audioCtx);
    audioCtx.createOscillator = () => { osciladores++; return crear(); };
    ["acierto", "fallo", "nivel", "toque"].forEach((n) => sonar(n));
    return osciladores;
  });
  expect(r).toBe(0);
});

test("parejos de volumen, medidos sin conexión; el fallo, más suave; el toque, casi un susurro", async ({ page }) => {
  await page.goto("./");
  const rms = await page.evaluate(async () => {
    const sr = 22050, salida = {};
    for (const nombre of Object.keys(SONIDOS)) {
      const fin = Math.max(...SONIDOS[nombre].map(([t, , d]) => t + d)) + 0.1;
      const ctx = new OfflineAudioContext(1, Math.ceil(sr * fin), sr);
      const g = ctx.createGain(); g.gain.value = VOLUMEN_EFECTOS; g.connect(ctx.destination);
      tocarSonido(ctx, g, nombre, 0);
      const d = (await ctx.startRendering()).getChannelData(0);
      let mejor = 0, pico = 0; const w = Math.floor(sr / 10);
      for (const v of d) pico = Math.max(pico, Math.abs(v));
      for (let i = 0; i + w < d.length; i += Math.floor(w / 4)) { let s = 0; for (let j = i; j < i + w; j++) s += d[j] * d[j]; mejor = Math.max(mejor, Math.sqrt(s / w)); }
      salida[nombre] = { rms: mejor, pico };
    }
    return salida;
  });
  for (const n of ["acierto", "racha", "florecer", "vencer", "comprar", "entrar"]) {
    expect(rms[n].rms, n).toBeGreaterThan(0.08);
    expect(rms[n].rms, n).toBeLessThan(0.125);
  }
  for (const n of ["nivel", "jefe"]) expect(rms[n].rms, n).toBeLessThan(0.14);
  expect(rms.fallo.rms).toBeLessThan(rms.acierto.rms);
  expect(rms.fallo.rms).toBeGreaterThan(0.05);   // suave, pero se oye
  expect(rms.toque.rms).toBeLessThan(0.05);
  for (const [n, v] of Object.entries(rms)) expect(v.pico, `${n} satura`).toBeLessThan(0.9);
});
