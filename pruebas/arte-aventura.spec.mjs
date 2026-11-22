// Héroes y enemigos de la Aventura en SVG propio (issues #53 y #54): se ven
// igual en cualquier dispositivo, cambian de pose y siguen la guía de estilo.
import { test, expect } from "@playwright/test";

const EMOJI = /\p{Extended_Pictographic}/u;

async function alMapa(page) {
  await page.goto("./");
  // El navegador escribe el SVG a su manera: se compara lo que queda en la página.
  await page.evaluate(() => { window.normalizar = (html) => { const d = document.createElement("span"); d.innerHTML = html; return d.innerHTML; }; });
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.click("#screen-selector >> text=La Aventura");
  await page.evaluate(() => { aventura.manual = true; });
}

/** Abre el nivel `m-n` (desbloqueándolo) y hace salir un enemigo. */
async function nivel(page, m, n) {
  // Desde el camino (#46), cada mundo se abre también al saberse sus tablas.
  await page.evaluate(([m, n]) => { for (let n = 1; n <= 9; n++) for (let b = 1; b <= 10; b++) hechos[claveHecho(n, b)] = [{ d: "", m: "o", ok: 1, ms: null }, { d: "", m: "o", ok: 1, ms: null }]; aventuraGuardada.alcanzado = m * NIVELES_POR_MUNDO + n; guardarAventura(); mostrarAventura(); }, [m, n]);
  await page.click(`.btn-nivel[data-nivel="${m}-${n}"]`);
  await page.evaluate(() => { aventura.hastaAparecer = 0; aventuraPaso(16); aventura.hastaAparecer = 1e9; });
}

const estado = (page) => page.locator("#heroe > svg").getAttribute("data-estado");

test("los 8 héroes son dibujos propios distintos, sin emojis, con su varita", async ({ page }) => {
  await alMapa(page);
  const dibujos = await page.evaluate(() => HEROES.map((h) => svgHeroe(h.emoji)));
  expect(new Set(dibujos).size).toBe(8);
  for (const d of dibujos) {
    expect(d).toContain('class="arte heroe-arte"');
    expect(d).toContain('class="brazo-varita"');
    expect(d).toContain('aria-hidden="true"');
    expect(EMOJI.test(d)).toBe(false);
  }
  // En el mapa, la ficha para elegir héroe usa el mismo dibujo.
  await expect(page.locator("#screen-aventura .elegir-heroe svg.heroe-arte")).toHaveCount(8);
});

test("en el nivel, el héroe elegido es su dibujo, no un emoji", async ({ page }) => {
  await alMapa(page);
  await page.click('#screen-aventura .elegir-heroe label:has(input[value="🐼"])');
  await nivel(page, 0, 0);
  const heroe = page.locator("#heroe");
  await expect(heroe.locator("svg.heroe-arte")).toBeVisible();
  expect(EMOJI.test(await heroe.textContent())).toBe(false);
  expect(await heroe.locator("svg").evaluate((s) => s.outerHTML.includes("#3f3f46"))).toBe(true);   // los parches del panda
});

test("un héroe guardado de antes (como emoji) se sigue reconociendo", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("jardin:p1:aventura", JSON.stringify({ heroe: "🐸", alcanzado: 0, estrellas: {}, mejores: {} }));
  });
  await alMapa(page);
  await expect(page.locator('#screen-aventura .elegir-heroe input[value="🐸"]')).toBeChecked();
  await nivel(page, 0, 0);
  expect(await page.locator("#heroe > svg").evaluate((s) => s.outerHTML.includes("#86efac"))).toBe(true);   // verde de la ranita
});

test("el héroe lanza al acertar y vuelve a estar quieto; al recibir un golpe, pone otra cara", async ({ page }) => {
  await alMapa(page);
  await nivel(page, 0, 0);
  expect(await estado(page)).toBe("quieto");
  // Quieto: se ven sus ojos normales, no los de golpe.
  await expect(page.locator('#heroe [data-e="golpeado"]').first()).toBeHidden();
  await page.evaluate(() => responderAventura(enemigoObjetivo().op.respuesta));
  expect(await estado(page)).toBe("lanzando");
  await page.waitForTimeout(450);
  expect(await estado(page)).toBe("quieto");
  await page.evaluate(() => { aventura.hastaAparecer = 0; aventuraPaso(16); aventura.hastaAparecer = 1e9; for (let i = 0; i < 400 && aventura.corazones === CORAZONES; i++) aventuraPaso(50); });
  expect(await estado(page)).toBe("golpeado");
  await expect(page.locator('#heroe [data-e="golpeado"]').first()).toBeVisible();
  await page.waitForTimeout(700);
  expect(await estado(page)).toBe("quieto");
});

test("cada mundo tiene su enemigo dibujado, y el jefe lleva corona en el dibujo", async ({ page }) => {
  await alMapa(page);
  const dibujos = await page.evaluate(() => AVENTURA_MUNDOS.map((_, m) => [svgEnemigo(m), svgEnemigo(m, true)]));
  expect(new Set(dibujos.map(([n]) => n)).size).toBe(6);
  for (const [normal, jefe] of dibujos) {
    expect(EMOJI.test(normal) || EMOJI.test(jefe)).toBe(false);
    expect(normal).not.toBe(jefe);
    expect(jefe.length).toBeGreaterThan(normal.length);
  }
  // En el mapa, cada mundo abierto muestra a su enemigo.
  await page.evaluate(() => { for (let n = 1; n <= 9; n++) for (let b = 1; b <= 10; b++) hechos[claveHecho(n, b)] = [{ d: "", m: "o", ok: 1, ms: null }, { d: "", m: "o", ok: 1, ms: null }]; aventuraGuardada.alcanzado = 23; mostrarAventura(); });   // sabidas: abre los mundos (#46)
  await expect(page.locator(".titulo-mundo-arte svg.enemigo-arte")).toHaveCount(6);
});

test("en el nivel, los enemigos son su dibujo; el jefe, el grande con corona", async ({ page }) => {
  await alMapa(page);
  await nivel(page, 2, 0);
  const cara = page.locator("#arena .enemigo .cara").first();
  await expect(cara.locator("svg.enemigo-arte")).toBeVisible();
  expect(EMOJI.test(await page.locator("#arena .enemigo").first().textContent())).toBe(false);
  expect(await cara.innerHTML()).toBe(await page.evaluate(() => normalizar(svgEnemigo(2))));
  await page.evaluate(() => detenerAventura());
  await nivel(page, 2, 3);
  // Se vence a los normales hasta que sale el jefe.
  await page.evaluate(() => {
    for (let i = 0; i < 300 && !aventura.enemigos.some((e) => e.jefe); i++) {
      aventura.hastaAparecer = 0; aventuraPaso(16);
      for (const e of [...aventura.enemigos]) if (!e.jefe) responderAventura(e.op.respuesta);
    }
  });
  const jefe = page.locator("#arena .enemigo.jefe");
  await expect(jefe).toHaveCount(1);
  expect(await jefe.locator(".cara").innerHTML()).toBe(await page.evaluate(() => normalizar(svgEnemigo(2, true))));
  await expect(jefe.locator(".corona")).toHaveCount(0);   // ya no es el emoji 👑 aparte
});

test("una operación larga entra entera en la arena, sin cortarse en la orilla", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });   // en el teléfono es donde se cortaba
  await alMapa(page);
  await nivel(page, 5, 0);   // el mar: fracciones de un número, las más largas
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => { for (const e of [...aventura.enemigos]) quitarEnemigo(e, false); aventura.hastaAparecer = 0; aventuraPaso(1); aventura.hastaAparecer = 1e9; });
    const [op, arena] = await Promise.all([page.locator("#arena .enemigo .op").first().boundingBox(), page.locator("#arena").boundingBox()]);
    expect(op.x, "la operación se corta por la izquierda").toBeGreaterThanOrEqual(arena.x - 1);
    expect(op.x + op.width, "la operación se corta por la derecha").toBeLessThanOrEqual(arena.x + arena.width + 1);
  }
});

test("la imagen para compartir lleva el dibujo del héroe, solo con su cara de siempre", async ({ page }) => {
  await alMapa(page);
  const r = await page.evaluate(async () => {
    const c = (await dibujarTarjetaPuntaje()).getContext("2d");
    // Un punto del costado del gatito: su naranja, no el blanco de la tarjeta.
    const [rr, gg, bb] = c.getImageData(495, 449, 1, 1).data;
    const img = await imagenDeArte(svgHeroe("🐱"));
    const svg = decodeURIComponent(img.src.split(",")[1]);
    return { rr, gg, bb, golpe: svg.includes('data-e="golpeado"'), variables: svg.includes("var(--") };
  });
  expect(Math.abs(r.rr - 0xfb) + Math.abs(r.gg - 0xbf) + Math.abs(r.bb - 0x77), `color ${r.rr},${r.gg},${r.bb}`).toBeLessThan(30);
  expect(r.golpe).toBe(false);
  expect(r.variables).toBe(false);
});

test.describe("con movimiento", () => {
  test.use({ reducedMotion: "no-preference" });

  test("los enemigos caminan, el héroe respira y al vencer sale un «pof» de estrellas", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await alMapa(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await nivel(page, 1, 0);
    expect(await page.locator("#arena .enemigo .cara > svg").first().evaluate((s) => getComputedStyle(s).animationName)).toBe("anda");
    expect(await page.locator("#heroe > svg").evaluate((s) => getComputedStyle(s).animationName)).toBe("lumi-respira");
    // El «pof» dura menos de un segundo: se mira en el mismo instante en que sale,
    // para no depender de la velocidad de la máquina.
    const pofs = await page.evaluate(() => {
      responderAventura(enemigoObjetivo().op.respuesta);
      return [...document.querySelectorAll("#arena .pof")].map((p) => p.getAttribute("aria-hidden"));
    });
    expect(pofs).toEqual(["true"]);
    await expect(page.locator("#arena .pof")).toHaveCount(0, { timeout: 3000 });
  });

  test("con «Menos movimiento», no hay «pof» ni caminar", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await alMapa(page);
    await nivel(page, 1, 0);
    expect(await page.locator("#arena .enemigo .cara > svg").first().evaluate((s) => parseFloat(getComputedStyle(s).animationDuration))).toBeLessThan(0.01);
    await page.evaluate(() => responderAventura(enemigoObjetivo().op.respuesta));
    expect(await page.locator("#arena .pof").count()).toBe(0);   // ahora mismo: el «pof» se va solo
  });
});
