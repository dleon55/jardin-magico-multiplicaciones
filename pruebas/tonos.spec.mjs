// Los tres tonos (Hito 4.3): Brote, Explora y Pro. El mismo juego para
// distintas edades; lo elige quien juega, al entrar o después.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Con el mundo a la vista (el inicio de serie).
test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] } });

async function entrar(page, tono, nombre = "Ana") {
  await page.goto("./");
  if (tono) await page.click(`#screen-welcome .elegir-tono label:has(input[value="${tono}"])`);
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}
const tonoDelCuerpo = (page) => page.evaluate(() => document.body.dataset.tono);
/** Diez aciertos y la victoria. */
const ganar = (page) => page.evaluate(() => {
  for (let i = 0; i < 10; i++) { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); if (score < targetScore) nextQuestion(); }
  endGameSuccess();
});

test("la bienvenida ofrece los tres tonos sin elegir ninguno, y sin edades escritas", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#screen-welcome .elegir-tono input")).toHaveCount(3);
  await expect(page.locator("#screen-welcome .elegir-tono input:checked")).toHaveCount(0);
  await expect(page.locator("#screen-welcome .elegir-tono")).toContainText("Brote");
  await expect(page.locator("#screen-welcome .elegir-tono")).toContainText("Explora");
  await expect(page.locator("#screen-welcome .elegir-tono")).toContainText("Pro");
  await expect(page.locator("#screen-welcome .elegir-tono")).not.toContainText(/años|\d/);
  expect(await tonoDelCuerpo(page)).toBeUndefined();   // en la bienvenida aún no hay tono
});

test("quien no elige juega en Explora, como siempre", async ({ page }) => {
  await entrar(page, null);
  expect(await tonoDelCuerpo(page)).toBe("explora");
  expect(await page.evaluate(() => perfilEnUso().tono)).toBe("explora");
  await expect(page.locator('.lugar-mundo[data-lugar="huerto"] .rotulo-lugar b')).toHaveText("Huerto de las tablas");
  await expect(page.locator("#mundo-datos")).toBeHidden();
});

test("Brote: rótulos de una palabra, más grandes y sin letra chica", async ({ page }) => {
  await entrar(page, "brote");
  expect(await tonoDelCuerpo(page)).toBe("brote");
  expect(await page.locator(".rotulo-lugar b").allTextContents()).toEqual(["Las tablas", "Dividir", "Números", "Partes", "Medir"]);
  await expect(page.locator('.lugar-mundo[data-lugar="huerto"] .rotulo-lugar span')).toBeHidden();
  const tam = await page.locator(".rotulo-lugar b").first().evaluate((b) => parseFloat(getComputedStyle(b).fontSize));
  expect(tam).toBeGreaterThanOrEqual(20);
  // El lector de pantalla sigue oyendo el nombre entero y qué falta.
  await expect(page.locator('.lugar-mundo[data-lugar="bosque"]')).toHaveAttribute("aria-label", "Bosque de dividir, dormido: despierta cuando sepas la del 2 y la del 5");
  // En los juegos de un lugar, solo el nombre.
  await page.click('.lugar-mundo[data-lugar="huerto"]');
  await expect(page.locator("#lugar-juegos .juego-lugar b")).toBeVisible();
  await expect(page.locator("#lugar-juegos .juego-lugar span > span")).toBeHidden();
});

test("Brote y Pro cambian el tamaño de Lumi en el mundo", async ({ page }) => {
  const ancho = async (tono) => { await entrar(page, tono, tono || "nadie"); return (await page.locator(".lumi-mundo").boundingBox()).width; };
  const explora = await ancho(null);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("jardin:guia", "1"); });
  const brote = await ancho("brote");
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("jardin:guia", "1"); });
  const pro = await ancho("pro");
  expect(brote).toBeGreaterThan(explora);
  expect(pro).toBeLessThan(explora);
});

test("Pro: el mundo de noche, letra sobria, datos y felicitaciones sin adornos", async ({ page }) => {
  await entrar(page, "pro");
  expect(await tonoDelCuerpo(page)).toBe("pro");
  expect(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--mundo-pasto").trim())).toBe("#23493f");
  const letra = await page.locator("#mundo-titulo").evaluate((t) => getComputedStyle(t).fontFamily);
  expect(letra).not.toContain("Fredoka");
  await expect(page.locator("#mundo-datos")).toHaveText("0 de 54");
  await page.evaluate(() => { registrarIntento(3, 4, true); registrarIntento(3, 5, true); registrarIntento(3, 6, false, { dada: 9 }); registrarIntento(3, 7, true); mostrarPantalla("screen-selector"); });
  await expect(page.locator("#mundo-datos")).toHaveText("0 de 54 · precisión 75%");
  // Al acertar: «Correcto.», «Bien.» o «Exacto.», sin emojis.
  await page.evaluate(() => { startTable(3); cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); });
  const dicho = await page.locator("#game-feedback").innerText();
  expect(dicho).toMatch(/^(Correcto\.|Bien\.|Exacto\.)/);
  expect(dicho).not.toMatch(/🎉|👏|🌟|⭐ |🌱/u);
});

test("Pro mide el tiempo de la partida contra la mejor marca propia", async ({ page }) => {
  await entrar(page, "pro");
  await page.evaluate(() => startTable(3));
  await page.evaluate(() => { inicioPartida = Date.now() - 72000; });   // 1:12
  await ganar(page);
  await expect(page.locator("#victoria-tiempo")).toBeVisible();
  await expect(page.locator("#victoria-tiempo")).toHaveText("Tiempo: 1:12. Es tu primera marca aquí: a vencerla.");
  expect(await page.evaluate(() => Math.round(leerMarcas()["3"] / 1000))).toBe(72);
  // Más lento: no cambia la marca.
  await page.evaluate(() => { backToSelector(); startTable(3); inicioPartida = Date.now() - 95000; });
  await ganar(page);
  await expect(page.locator("#victoria-tiempo")).toHaveText("Tiempo: 1:35. Tu mejor marca: 1:12.");
  // Más rápido: marca nueva.
  await page.evaluate(() => { backToSelector(); startTable(3); inicioPartida = Date.now() - 58000; });
  await ganar(page);
  await expect(page.locator("#victoria-tiempo")).toHaveText(/^Tiempo: 0:5[89]\. ¡Nueva marca! La anterior era 1:12\.$/)   // jugarla tarda: con la máquina cargada, 58 s se ven como 59;
  // Cada juego tiene la suya, y el inicio las cuenta.
  await page.evaluate(() => { backToSelector(); startTable("tiempo"); inicioPartida = Date.now() - 61000; });
  await ganar(page);
  await expect(page.locator("#victoria-tiempo")).toContainText("Tiempo: 1:01. Es tu primera marca aquí");
  await page.evaluate(() => backToSelector());
  await expect(page.locator("#mundo-datos")).toContainText("2 marcas");
  // Y van en la copia de seguridad.
  expect(await page.evaluate(() => Object.keys(JSON.parse(Object.values(armarCopia().datos)[0].marcas)).sort())).toEqual(["3", "tiempo"]);
});

test("el tiempo no se mide con «Sin prisa», ni en Explora o Brote", async ({ page }) => {
  await entrar(page, "pro");
  await page.evaluate(() => { aventuraGuardada.sinPrisa = true; guardarAventura(); startTable(3); });
  await ganar(page);
  await expect(page.locator("#victoria-tiempo")).toBeHidden();
  expect(await page.evaluate(() => leerMarcas())).toEqual({});
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("jardin:guia", "1"); });
  await entrar(page, null);
  await page.evaluate(() => startTable(3));
  await ganar(page);
  await expect(page.locator("#victoria-tiempo")).toBeHidden();
  expect(await page.evaluate(() => leerMarcas())).toEqual({});
});

test("el tono se cambia en «Mi mundo y mi personaje», se recuerda y es de cada quien", async ({ page }) => {
  await entrar(page, "brote");
  await page.click("#screen-selector >> text=Mi mundo y mi personaje");
  await expect(page.locator("#screen-mundo .elegir-tono input:checked")).toHaveValue("brote");
  await page.click('#screen-mundo .elegir-tono label:has(input[value="pro"])');
  await page.click("#screen-mundo >> text=Listo");
  expect(await tonoDelCuerpo(page)).toBe("pro");
  await expect(page.locator('.lugar-mundo[data-lugar="huerto"] .rotulo-lugar b')).toHaveText("Huerto de las tablas");
  await page.reload();
  await page.locator(".btn-perfil", { hasText: "Ana" }).click();
  expect(await tonoDelCuerpo(page)).toBe("pro");
  // Otra persona, en el mismo aparato, con el suyo.
  await page.click("#screen-selector >> text=Cambiar de jugador");
  expect(await tonoDelCuerpo(page)).toBeUndefined();
  await page.click('#screen-welcome .elegir-tono label:has(input[value="brote"])');
  await page.fill("#player-name", "Leo");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  expect(await tonoDelCuerpo(page)).toBe("brote");
  expect(await page.evaluate(() => perfiles.map((p) => [p.nombre, p.tono]))).toEqual([["Ana", "pro"], ["Leo", "brote"]]);
});

test("un perfil de antes de los tonos, o con un tono dañado, queda en Explora", async ({ page }) => {
  await page.goto("./");
  expect(await page.evaluate(() => limpiarPerfiles([{ id: "p1", nombre: "Ana", emoji: "🦊", mundo: "huerto", iniciado: true }, { id: "p2", nombre: "Leo", tono: "gigante", iniciado: true }]).map((p) => p.tono))).toEqual(["explora", "explora"]);
  expect(await page.evaluate(() => limpiarPerfiles([{ id: "p1", nombre: "Ana", tono: "pro", iniciado: true }])[0].tono)).toBe("pro");
});

test("accesible (axe) y sin desbordes en el teléfono, en Brote y en Pro", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  for (const tono of ["brote", "pro"]) {
    await entrar(page, tono, tono);
    await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`), tono).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), tono).toBeLessThanOrEqual(360);
    const mapa = await page.locator("#mundo-mapa").boundingBox();
    for (const c of await page.locator(".rotulo-lugar").evaluateAll((rs) => rs.map((x) => x.getBoundingClientRect().toJSON()))) {
      expect(c.left, tono).toBeGreaterThanOrEqual(mapa.x);
      expect(c.right, tono).toBeLessThanOrEqual(mapa.x + mapa.width);
      expect(c.height, tono).toBeGreaterThanOrEqual(44);
    }
  }
});
