// La Aventura: un animalito con su varita contra enemigos con operaciones.
// El bucle de animación se apaga (aventura.manual) y el tiempo se avanza a
// mano con aventuraPaso(ms): así las pruebas no dependen de la velocidad.
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-14T12:00:00"));
});

async function alMapa(page, nombre = "Leo") {
  await page.goto("./");
  await page.fill("#player-name", nombre);
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.click("#screen-selector >> text=La Aventura");
  await expect(page.locator("#screen-aventura")).toBeVisible();
  await page.evaluate(() => { aventura.manual = true; });
}

/** Vence a todos los enemigos del nivel respondiendo bien. */
async function ganarNivel(page) {
  await page.evaluate(() => {
    for (let i = 0; i < 200 && !aventura.terminado; i++) {
      const e = enemigoObjetivo();
      if (e) responderAventura(e.op.respuesta);
      else aventuraPaso(aventura.config.cruce * 1000);
    }
  });
}

test("el menú lleva a la aventura: 6 mundos, solo el primer nivel abierto, y el héroe se elige", async ({ page }) => {
  await alMapa(page);
  await expect(page.locator(".mundo-aventura")).toHaveCount(6);
  await expect(page.locator(".btn-nivel:not([disabled])")).toHaveCount(1);
  await expect(page.locator('.btn-nivel[data-nivel="0-0"]')).toBeEnabled();
  await expect(page.locator("#screen-aventura .elegir-heroe input")).toHaveCount(8);
  await expect(page.locator('#screen-aventura input[value="🐱"]')).toBeChecked();
  await page.click('#screen-aventura .elegir-heroe label:has(input[value="🐶"])');
  await page.reload();
  expect(await page.evaluate(() => aventuraGuardada.heroe)).toBe("🐶");
});

test("cada mundo trae sus retos, de menos a más difícil", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => {
    const muestra = (m) => Array.from({ length: 200 }, () => operacionAventura(m));
    const t0 = muestra(0).every((o) => [o.a, o.b].some((x) => [2, 5, 10].includes(x)) && o.respuesta === o.a * o.b && o.texto.includes("×"));
    const t2 = muestra(2).every((o) => [o.a, o.b].some((x) => [7, 8, 9].includes(x)));
    const div = muestra(4).every((o) => o.texto.includes("÷") && Number(o.texto.split(" ÷ ")[0]) / Number(o.texto.split(" ÷ ")[1]) === o.respuesta);
    const frac = muestra(5).every((o) => /^\d\/\d de \d+$/.test(o.texto) && o.respuesta === o.m * o.b);
    const cruces = AVENTURA_MUNDOS.map((m, i) => [configNivel(i, 0).cruce, configNivel(i, 2).cruce]);
    return { t0, t2, div, frac, masRapido: cruces.every(([a, b]) => b < a), enemigos: [0, 1, 2].map((n) => configNivel(0, n).enemigos) };
  });
  expect(r).toEqual({ t0: true, t2: true, div: true, frac: true, masRapido: true, enemigos: [6, 8, 10] });
});

test("responder bien vence al enemigo y da puntos; mal, no lo vence y rompe la racha", async ({ page }) => {
  await alMapa(page);
  await page.click('.btn-nivel[data-nivel="0-0"]');
  await expect(page.locator("#screen-aventura-juego")).toBeVisible();
  await expect(page.locator("#arena .enemigo")).toHaveCount(1);
  const op = await page.evaluate(() => enemigoObjetivo().op);
  await expect(page.locator("#aventura-objetivo")).toHaveText(`Más cerca: ${op.texto}`);
  expect(await page.evaluate((v) => responderAventura(v), op.respuesta + 1)).toBe(false);
  await expect(page.locator("#aventura-mensaje")).toContainText(`${op.respuesta + 1} no vence a ningún enemigo`);
  expect(await page.evaluate((v) => [responderAventura(v), aventura.enemigos.length, aventura.puntos > 0, aventura.racha], op.respuesta))
    .toEqual([true, 0, true, 1]);
  expect(await page.evaluate(() => Object.keys(hechos).length)).toBe(0);   // no toca el jardín
});

test("con el teclado de la pantalla y con el físico", async ({ page }, testInfo) => {
  await alMapa(page);
  await page.click('.btn-nivel[data-nivel="0-0"]');
  let op = await page.evaluate(() => enemigoObjetivo().op);
  for (const d of String(op.respuesta)) await page.click(`#aventura-teclado [data-digito="${d}"]`);
  await expect(page.locator("#aventura-escrito")).toHaveText(String(op.respuesta));
  await page.click("#aventura-lanzar");
  expect(await page.evaluate(() => aventura.puntos)).toBeGreaterThan(0);
  if (testInfo.project.name === "escritorio") {
    await page.evaluate(() => aventuraPaso(aventura.config.cruce * 1000));
    op = await page.evaluate(() => enemigoObjetivo().op);
    for (const d of String(op.respuesta)) await page.keyboard.press(d);
    await page.keyboard.press("Enter");
    expect(await page.evaluate((id) => aventura.enemigos.some((e) => e.op === id), op)).toBe(false);
    await page.keyboard.press("Escape");
    await expect(page.locator("#screen-aventura")).toBeVisible();
    expect(await page.evaluate(() => aventura.activo)).toBe(false);   // el nivel no sigue de fondo
  }
});

test("si un enemigo llega, se pierde un corazón, se ve la respuesta y vuelve; sin corazones, «¡Casi!»", async ({ page }) => {
  await alMapa(page);
  await page.click('.btn-nivel[data-nivel="0-0"]');
  const op = await page.evaluate(() => enemigoObjetivo().op);
  await page.evaluate(() => { for (let i = 0; i < 400 && aventura.corazones === 3; i++) aventuraPaso(100); });
  expect(await page.evaluate(() => [aventura.corazones, aventura.pendientes.length])).toEqual([2, 1]);
  await expect(page.locator("#aventura-mensaje")).toHaveText(`¡Uy! ${op.texto} = ${op.respuesta}`);
  await expect(page.locator("#nivel-corazones")).toHaveAttribute("aria-label", "2 de 3 corazones");
  await page.evaluate(() => { for (let i = 0; i < 3000 && !aventura.terminado; i++) aventuraPaso(100); });
  await expect(page.locator("#arena-fin")).toBeVisible();
  await expect(page.locator("#fin-titulo")).toHaveText("¡Casi!");
  await expect(page.locator("#btn-fin-siguiente")).toBeHidden();
  expect(await page.evaluate(() => aventuraGuardada.alcanzado)).toBe(0);
});

test("ganar un nivel: estrellas, récord, se abre el siguiente y se recuerda", async ({ page }) => {
  await alMapa(page);
  await page.click('.btn-nivel[data-nivel="0-0"]');
  await ganarNivel(page);
  await expect(page.locator("#fin-titulo")).toHaveText("¡Nivel superado!");
  await expect(page.locator("#fin-estrellas")).toHaveAttribute("aria-label", "3 de 3 estrellas");
  await expect(page.locator("#fin-texto")).toContainText("¡Nuevo récord en este nivel!");
  const pts = await page.evaluate(() => aventura.puntos);
  await page.reload();
  await page.click(".btn-perfil");
  await page.click("#screen-selector >> text=La Aventura");
  await expect(page.locator('.btn-nivel[data-nivel="0-1"]')).toBeEnabled();
  await expect(page.locator("#aventura-resumen")).toContainText(`Puntaje: ${pts} · Estrellas: 3 de 72`);
  await expect(page.locator("#aventura-menu-resumen")).toHaveCount(1);
});

test("el jefe necesita varias respuestas, y vencerlo abre el siguiente mundo", async ({ page }) => {
  await alMapa(page);
  await page.evaluate(() => { aventuraGuardada.alcanzado = 3; guardarAventura(); pintarAventura(); });
  await page.click('.btn-nivel[data-nivel="0-3"]');
  // Primero los enemigos normales…
  await page.evaluate(() => {
    for (let i = 0; i < 100 && !aventura.jefeSalio; i++) {
      const e = enemigoObjetivo();
      if (e && !e.jefe) responderAventura(e.op.respuesta); else aventuraPaso(aventura.config.cruce * 1000);
    }
  });
  await expect(page.locator(".enemigo.jefe")).toHaveCount(1);
  await expect(page.locator("#aventura-objetivo")).toContainText("El jefe:");
  const golpes = await page.evaluate(() => {
    let n = 0;
    for (let i = 0; i < 20 && !aventura.terminado; i++) {
      const e = enemigoObjetivo();
      if (e) { if (e.jefe) n++; responderAventura(e.op.respuesta); } else aventuraPaso(500);
    }
    return n;
  });
  expect(golpes).toBe(6);
  await expect(page.locator("#fin-titulo")).toHaveText("¡Venciste al jefe! Se abre el mundo 2");
  expect(await page.evaluate(() => aventuraGuardada.alcanzado)).toBe(4);
});

test("en «elegir», cuatro respuestas para el enemigo más cercano", async ({ page }) => {
  await alMapa(page);
  await page.click('.btn-nivel[data-nivel="0-0"]');
  await page.click("#btn-modo-aventura");
  await expect(page.locator("#aventura-opciones .opcion-aventura")).toHaveCount(4);
  await expect(page.locator("#aventura-teclado")).toBeHidden();
  const r = await page.evaluate(() => enemigoObjetivo().op.respuesta);
  await page.click(`.opcion-aventura[data-valor="${r}"]`);
  expect(await page.evaluate(() => aventura.enemigos.length)).toBe(0);
  expect(await page.evaluate(() => aventuraGuardada.modo)).toBe("elegir");   // se recuerda
});

test("compartir: una imagen PNG con el puntaje del jugador", async ({ page }) => {
  await alMapa(page, "Ana");
  await page.click('.btn-nivel[data-nivel="0-0"]');
  await ganarNivel(page);
  await page.click("#arena-fin >> text=Mapa");
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.click("#btn-compartir")]);
  expect(descarga.suggestedFilename()).toBe("aventura-ana-2026-11-14.png");
  const ruta = join(tmpdir(), `tarjeta-${Date.now()}.png`);
  await descarga.saveAs(ruta);
  const png = await readFile(ruta);
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.length).toBeGreaterThan(20000);
  await expect(page.locator("#aviso-compartir")).toContainText("Se descargó la imagen");
});

test("la vista para adultos dice cómo va en la aventura; la copia la incluye; lo dañado no rompe", async ({ page }) => {
  await alMapa(page);
  await page.click('.btn-nivel[data-nivel="0-0"]');
  await ganarNivel(page);
  await page.click("#arena-fin >> text=Mapa");
  await page.click("#screen-aventura button:has-text('Menú')");
  await page.click("#screen-selector >> text=Para las personas adultas");
  await expect(page.locator(".adulto-aventura")).toContainText("La Aventura:");
  await expect(page.locator(".adulto-aventura")).toContainText("3 estrellas; va en el mundo 1 (tablas del 2, del 5 y del 10).");
  expect(await page.evaluate(() => Object.keys(armarCopia().datos[perfilActual]))).toContain("aventura");
  const r = await page.evaluate(() => {
    almacen.guardar("aventura", JSON.stringify({ heroe: "<b>", alcanzado: 999, estrellas: { "0-0": 9, "x": 1, "1-1": 2 }, mejores: { "0-0": -5, "2-3": 40 } }));
    cargarAventura();
    return aventuraGuardada;
  });
  expect(r).toEqual({ heroe: "🐱", alcanzado: 23, estrellas: { "1-1": 2 }, mejores: { "2-3": 40 }, modo: "teclear" });
});

test("la operación que llegó al héroe vuelve tras dos enemigos más", async ({ page }) => {
  await alMapa(page);
  await page.click('.btn-nivel[data-nivel="0-0"]');
  const r = await page.evaluate(() => {
    const llego = enemigoObjetivo();
    enemigoLlega(llego);
    const salen = [];
    for (let i = 0; i < 3; i++) {
      aparecerEnemigo();
      const nuevo = aventura.enemigos.at(-1);
      salen.push(nuevo.op === llego.op);
      responderAventura(nuevo.op.respuesta);
    }
    return salen;
  });
  expect(r).toEqual([false, false, true]);
});
