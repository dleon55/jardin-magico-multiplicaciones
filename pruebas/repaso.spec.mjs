// Repaso de la semana (Hito 6.6): cuando ya se saben las ocho tablas, una
// vez por semana el juego propone diez preguntas de todas mezcladas. Al
// ganarlas, el sol del mundo brilla con rayos hasta el lunes siguiente.
import { test, expect } from "@playwright/test";

const MUNDO = { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] };
test.use({ storageState: MUNDO });

// Un miércoles: 2026-11-18. Su semana empieza el lunes 16.
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date("2026-11-18T12:00:00")); });

async function entrar(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.evaluate(() => almacen.guardar("diagnostico", "saltado"));
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#mundo-vivo")).toBeVisible();
}
/** Se saben (y florecen) esas tablas, practicadas ayer y hoy; la Aventura, terminada. */
const saber = (page, tablas) => page.evaluate((tablas) => {
  const d = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
  for (const a of tablas) for (let b = 1; b <= 10; b++) hechos[claveHecho(a, b)] = [{ d: d(1), m: "e", ok: 1, ms: 2000 }, { d: d(0), m: "e", ok: 1, ms: 2000 }];
  guardarHechos();
  aventuraGuardada.alcanzado = AVENTURA_MUNDOS.length * NIVELES_POR_MUNDO - 1;
  for (let m = 0; m < AVENTURA_MUNDOS.length; m++) aventuraGuardada.estrellas[`${m}-0`] = 1;
  guardarAventura();
  mostrarPantalla("screen-selector");
}, tablas);
const TODAS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const ganar = (page) => page.evaluate(() => {
  let n = 0;
  while (score < targetScore && n < 30) { cancelarEspera(); evaluar(correctAnswer, null); cancelarEspera(); n++; if (score < targetScore) nextQuestion(); }
  endGameSuccess();
});
const repasos = (page) => page.evaluate(() => JSON.parse(almacen.leer("repasos") || "[]"));

test("el lunes de cada fecha: la semana va de lunes a domingo", async ({ page }) => {
  await page.goto("./");
  expect(await page.evaluate(() => ["2026-11-16", "2026-11-18", "2026-11-22", "2026-11-23", "2026-11-15", "2027-01-01"].map(lunesDe)))
    .toEqual(["2026-11-16", "2026-11-16", "2026-11-16", "2026-11-23", "2026-11-09", "2026-12-28"]);
});

test("mientras falte una tabla por saber, no se propone el repaso", async ({ page }) => {
  await entrar(page);
  await saber(page, [1, 2, 3, 4, 5, 6, 7, 8]);   // falta la del 9
  expect(await page.evaluate(() => [repasoPendiente(), siguientePaso().tipo])).not.toContain("repaso");
  expect(await page.evaluate(() => repasoPendiente())).toBe(false);
  await expect(page.locator("#mundo-etapa")).not.toContainText("repaso");
  await expect(page.locator("#mundo-mapa .rayos-sol")).toHaveCount(0);
});

test("con las ocho tablas sabidas, el inicio propone el repaso y lo dice bajo el mundo", async ({ page }) => {
  await entrar(page);
  await saber(page, TODAS);
  expect(await page.evaluate(() => siguientePaso())).toEqual({ tipo: "repaso", que: "Repaso de la semana", detalle: "Diez de todas las tablas, para que nada se olvide.", cara: "contenta" });
  expect(await page.evaluate(() => siguientePaso(true).tipo)).toBe("repaso");   // también como primera parada de la expedición
  await expect(page.locator("#expedicion-parada-1")).toHaveText("Repaso de la semana");
  await expect(page.locator("#mundo-etapa")).toContainText("Esta semana toca repaso.");
  await expect(page.locator("#mundo-mapa .rayos-sol")).toHaveCount(0);
  await page.click("#btn-expedicion");
  await expect(page.locator("#screen-game")).toBeVisible();
  expect(await page.evaluate(() => currentTable)).toBe("mix");
});

test("al ganarlo: se anota la semana, hay 5 estrellas, la victoria lo dice y el sol brilla con rayos", async ({ page }) => {
  await entrar(page);
  await saber(page, TODAS);
  await page.click("#btn-expedicion");
  const antes = await page.evaluate(() => globalStars);
  await ganar(page);
  await expect(page.locator("#victoria-repaso")).toBeVisible();
  await expect(page.locator("#victoria-repaso")).toHaveText("¡Repaso de la semana hecho! Ganaste 5 estrellas más. Llevas 1 semana cuidando lo que sabes.");
  expect(await repasos(page)).toEqual(["2026-11-16"]);
  const ganadas = await page.evaluate((antes) => globalStars - antes, antes);
  expect(ganadas).toBeGreaterThanOrEqual(15);   // 10 aciertos y el premio del repaso (y quizá la meta del día)
  await expect(page.locator("#victoria-estrellas")).toContainText(`Ganaste ${ganadas} estrellas`);   // el premio entra en la cuenta de la partida
  await page.evaluate(() => backToSelector());
  await expect(page.locator("#mundo-mapa .rayos-sol")).toHaveCount(1);
  await expect(page.locator("#mundo-mapa .rayos-sol path")).toHaveCount(8);
  await expect(page.locator("#mundo-etapa")).toContainText("Repaso de la semana: hecho.");
  // Ya no se propone esta semana: vuelve lo de siempre.
  expect(await page.evaluate(() => [repasoPendiente(), siguientePaso().tipo])).toEqual([false, "logica"]);
});

test("repetir el Desafío la misma semana no da otro premio; la semana siguiente vuelve a tocar", async ({ page }) => {
  await entrar(page);
  await saber(page, TODAS);
  await page.evaluate(() => almacen.guardar("repasos", JSON.stringify(["2026-11-09", "2026-11-16"])));
  await page.evaluate(() => startTable("mix"));
  const antes = await page.evaluate(() => globalStars);
  await ganar(page);
  await expect(page.locator("#victoria-repaso")).toBeHidden();
  expect(await repasos(page)).toEqual(["2026-11-09", "2026-11-16"]);
  expect(await page.evaluate((antes) => globalStars - antes, antes)).toBeLessThan(15 + 10);
  // El lunes siguiente: toca otra vez, y ya van tres.
  await page.clock.setFixedTime(new Date("2026-11-23T09:00:00"));
  await page.evaluate(() => {
    // Lo aprendido sigue fresco ese día (para que no se proponga regar).
    for (const k of Object.keys(hechos)) hechos[k] = [{ d: "2026-11-22", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-23", m: "e", ok: 1, ms: 2000 }];
    guardarHechos(); mostrarPantalla("screen-selector");
  });
  expect(await page.evaluate(() => siguientePaso().tipo)).toBe("repaso");
  await expect(page.locator("#mundo-mapa .rayos-sol")).toHaveCount(0);   // los rayos eran de la semana pasada
  await page.evaluate(() => startTable("mix"));
  await ganar(page);
  await expect(page.locator("#victoria-repaso")).toContainText("Llevas 3 semanas cuidando lo que sabes.");
  expect(await repasos(page)).toEqual(["2026-11-09", "2026-11-16", "2026-11-23"]);
});

test("solo cuenta el Desafío de todas las tablas, jugado por una persona: otra partida o en equipo no lo anotan", async ({ page }) => {
  await entrar(page);
  await saber(page, TODAS);
  await page.evaluate(() => startTable(7));
  await ganar(page);
  await expect(page.locator("#victoria-repaso")).toBeHidden();
  expect(await repasos(page)).toEqual([]);
  expect(await page.evaluate(() => { currentTable = "mix"; equipo = { ids: [perfilActual], turno: 0, original: perfilActual }; const dicho = anotarRepaso(); equipo = null; return dicho; })).toBe("");
  expect(await repasos(page)).toEqual([]);
});

test("lo guardado dañado no rompe nada, guarda solo las últimas 60 semanas y viaja en la copia", async ({ page }) => {
  await entrar(page);
  for (const malo of ["no es json", '{"a":1}', "null", '"hola"']) expect(await page.evaluate((t) => leerRepasos(t), malo)).toEqual([]);
  expect(await page.evaluate(() => leerRepasos(JSON.stringify(["2026-11-16", "2026-11-16", "ayer", 7, null, "2026-11-09"])))).toEqual(["2026-11-16", "2026-11-09"]);
  await saber(page, TODAS);
  const viejas = Array.from({ length: 60 }, (_, i) => `2025-${String(1 + Math.floor(i / 28)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`);
  await page.evaluate((v) => { almacen.guardar("repasos", JSON.stringify(v)); startTable("mix"); }, viejas);
  await ganar(page);
  const ahora = await repasos(page);
  expect([ahora.length, ahora[0], ahora.at(-1)]).toEqual([60, viejas[1], "2026-11-16"]);
  expect(JSON.parse(await page.evaluate(() => Object.values(armarCopia().datos)[0].repasos)).at(-1)).toBe("2026-11-16");
});

test("los rayos del sol no se salen del mapa ni tapan el huerto", async ({ page }) => {
  await entrar(page);
  await saber(page, TODAS);
  await page.evaluate(() => { almacen.guardar("repasos", JSON.stringify(["2026-11-16"])); mostrarPantalla("screen-selector"); });
  const r = await page.evaluate(() => {
    const caja = (sel) => document.querySelector(sel).getBoundingClientRect();
    const [rayos, sol, mapa, huerto] = [caja("#mundo-mapa .rayos-sol"), caja("#mundo-mapa .mundo-sol"), caja("#mundo-mapa"), caja('.lugar-mundo[data-lugar="huerto"]')];
    return { dentro: rayos.left >= mapa.left && rayos.right <= mapa.right && rayos.top >= mapa.top, rodean: rayos.left < sol.left && rayos.right > sol.right && rayos.top < sol.top && rayos.bottom > sol.bottom,
      tapaHuerto: rayos.left < huerto.right && huerto.left < rayos.right && rayos.top < huerto.bottom && huerto.top < rayos.bottom };
  });
  expect(r).toEqual({ dentro: true, rodean: true, tapaHuerto: false });
});

test("el premio del repaso son exactamente 5 estrellas, una sola vez por semana", async ({ page }) => {
  await entrar(page);
  await saber(page, TODAS);
  const r = await page.evaluate(() => {
    currentTable = "mix";
    const antes = globalStars;
    const dicho = anotarRepaso();
    const trasPrimera = globalStars - antes;
    const otra = anotarRepaso();
    return { dicho, trasPrimera, otra, trasSegunda: globalStars - antes, bono: BONO_REPASO };
  });
  expect(r).toEqual({ dicho: "¡Repaso de la semana hecho! Ganaste 5 estrellas más. Llevas 1 semana cuidando lo que sabes.", trasPrimera: 5, otra: "", trasSegunda: 5, bono: 5 });
});
