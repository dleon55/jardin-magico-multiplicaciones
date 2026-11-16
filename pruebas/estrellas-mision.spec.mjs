// Fase 3: las estrellas se gastan en el vivero, y cada día hay una meta
// (acertar 10; antes, una misión que cambiaba cada día).
// Las dos dan una razón para volver mañana, que es cuando de verdad se
// aprende: florecer exige acertar rápido en dos días distintos.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { entrarATabla, responder, siguiente, ponerIntentos, rapida } from "./ayudas.mjs";

const HOY = "2026-11-08";
const fechaMenos = (d, n) => new Date(Date.parse(d) - n * 86400000).toISOString().slice(0, 10);

/**
 * Fija el reloj del navegador y deja guardados estrellas, compras y misiones
 * antes de que cargue el juego (solo la primera vez: al recargar, el juego
 * debe leer lo que él mismo guardó).
 */
async function preparar(page, { estrellas = null, compras = null, misiones = null } = {}) {
  await page.clock.setFixedTime(new Date(`${HOY}T12:00:00`));
  await page.addInitScript(([e, c, m]) => {
    if (sessionStorage.getItem("sembrado")) return;
    if (e !== null) localStorage.setItem("jardin:estrellas", String(e));
    if (c !== null) localStorage.setItem("jardin:compras", JSON.stringify(c));
    if (m !== null) localStorage.setItem("jardin:misiones", JSON.stringify(m));
    sessionStorage.setItem("sembrado", "1");
  }, [estrellas, compras, misiones]);
}

/** Una misión de hoy ya elegida, para que no dependa del día de la semana. */
const mision = (tipo = "meta", extra = {}) => ({ hoy: { d: HOY, tipo, cuenta: 0, cumplida: false, ...extra }, dias: [] });

test.describe("las estrellas se gastan en el vivero", () => {
  test("con estrellas suficientes se compra: se descuenta y se queda para siempre en el jardín", async ({ page }) => {
    await preparar(page, { estrellas: 25, misiones: mision("partida") });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(page.locator("#vivero-antojo")).toHaveText("¡Ya te alcanza para la mariposa!");
    await page.click("text=Vivero mágico");

    await page.getByRole("button", { name: "Comprar Mariposa por 10 estrellas" }).click();
    await expect(page.locator("#screen-vivero .cuenta-estrellas")).toHaveText("15");
    await expect(page.locator('[data-vivero="mariposa"]')).toContainText("✓ En tu jardín");
    await expect(page.locator("#vivero-aviso")).toContainText("Mariposa llegó a tu jardín");

    await page.reload();
    expect(await page.evaluate(() => [globalStars, compras])).toEqual([15, ["mariposa"]]);
    await page.click("#screen-welcome button");
    await page.click("text=Mi jardín");
    await expect(page.locator('#jardin-amigos [data-amigo="mariposa"]')).toHaveCount(1);
    await expect(page.locator("#jardin-amigos-vacio")).toBeHidden();
  });

  test("sin estrellas suficientes no se compra, y se dice cuántas faltan", async ({ page }) => {
    await preparar(page, { estrellas: 5, misiones: mision("partida") });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(page.locator("#vivero-antojo")).toHaveText("Te faltan 5 ⭐ para la mariposa");
    await page.click("text=Vivero mágico");
    const boton = page.getByRole("button", { name: "Catarina: cuesta 20 estrellas, te faltan 15" });
    await expect(boton).toBeDisabled();
    expect(await page.evaluate(() => [comprar("catarina"), globalStars, compras])).toEqual([false, 5, []]);
  });

  test("lo que ya se tiene no se vuelve a cobrar", async ({ page }) => {
    await preparar(page, { estrellas: 100, compras: ["mariposa"], misiones: mision("partida") });
    await page.goto("./");
    expect(await page.evaluate(() => [comprar("mariposa"), comprar("inventado"), globalStars])).toEqual([false, false, 100]);
    expect(await page.evaluate(() => siguienteAntojo().id)).toBe("catarina");
  });

  test("lo guardado dañado o con ids desconocidos no rompe el juego", async ({ page }) => {
    await preparar(page, { estrellas: 3, compras: ["mariposa", "nave-espacial", "mariposa"], misiones: { hoy: { d: "ayer", tipo: "nada" }, dias: ["x", HOY] } });
    await page.goto("./");
    expect(await page.evaluate(() => [compras, misiones.hoy, misiones.dias])).toEqual([["mariposa"], null, [HOY]]);
  });

  test("florecer vale 5 estrellas más que un acierto", async ({ page }) => {
    await preparar(page, { estrellas: 0, misiones: mision("partida") });
    await page.goto("./");
    await ponerIntentos(page, "2x3", [rapida(fechaMenos(HOY, 1))]);
    const r = await page.evaluate(() => {
      startTable(2);
      numA = 2; numB = 3; correctAnswer = 6;
      modoEscrito = true; ayudaUsada = false; inicioPregunta = performance.now();
      evaluar(6, null);
      return [estadoHecho(2, 3), globalStars, document.getElementById("game-feedback").innerText];
    });
    expect(r[0]).toBe("florecida");
    expect(r[1]).toBe(6);
    expect(r[2]).toContain("+5 ⭐");
  });

  test("los amigos del vivero acompañan cada partida", async ({ page }) => {
    await preparar(page, { compras: ["mariposa", "rana"], misiones: mision("partida") });
    await entrarATabla(page, 3);
    await expect(page.locator("#garden-amigos")).toHaveText("🦋🐸");
  });
});

test.describe("la meta de hoy: acertar 10", () => {
  test("se cumple con el décimo acierto del día: da 10 estrellas y la victoria lo dice", async ({ page }) => {
    await preparar(page, { estrellas: 0, misiones: mision("meta") });
    await entrarATabla(page, 2);
    for (let i = 0; i < 10; i++) {
      await responder(page, true);
      await siguiente(page);
    }
    await expect(page.locator("#screen-victory")).toBeVisible();
    await expect(page.locator("#victoria-mision")).toBeVisible();
    await expect(page.locator("#victoria-mision")).toContainText("¡Meta de hoy cumplida!");
    // 10 aciertos + 10 de la meta; con 20, ya alcanza para la mariposa.
    await expect(page.locator("#victoria-estrellas")).toContainText("Ganaste 20 estrellas en esta partida");
    await expect(page.locator("#victoria-estrellas")).toContainText("¡Ya te alcanza para la mariposa en el Vivero!");

    await page.click("text=Sigue Cultivando");
    await expect(page.locator("#mision-texto")).toContainText("✓ ¡Meta de hoy cumplida!");
    await expect(page.locator(`#mision-semana [data-dia="${HOY}"]`)).toHaveAttribute("data-cumplida", "si");
  });

  test("cada acierto cuenta de uno en uno y el premio se da una sola vez", async ({ page }) => {
    await preparar(page, { estrellas: 0, misiones: mision("meta") });
    await page.goto("./");
    const r = await page.evaluate(() => {
      const vueltas = [];
      for (let i = 0; i < 11; i++) vueltas.push(avanzarMision("acierto"));
      return { vueltas, estrellas: globalStars, dias: misiones.dias, cuenta: misiones.hoy.cuenta };
    });
    expect(r).toEqual({ vueltas: [...Array(9).fill(false), true, false], estrellas: 10, dias: [HOY], cuenta: 10 });
  });

  test("en el menú dice cuánto lleva, en palabras claras", async ({ page }) => {
    await preparar(page, { misiones: mision("meta", { cuenta: 3 }) });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(page.locator("#mision-titulo")).toContainText("Meta de hoy");
    await expect(page.locator("#mision-texto")).toHaveText("Acierta 10 respuestas hoy, en lo que quieras (3 de 10). Premio: 10 estrellas.");
    await expect(page.locator("#mision-progreso")).toHaveAttribute("aria-valuenow", "3");
  });

  test("cuentan los aciertos de cualquier juego, también vencer en la Aventura; terminar una partida no suma", async ({ page }) => {
    await preparar(page, { misiones: mision("meta") });
    await page.goto("./");
    await page.click("#screen-welcome button:has-text('Comenzar')");
    expect(await page.evaluate(() => [avanzarMision("partida"), avanzarMision("escrita"), misiones.hoy.cuenta])).toEqual([false, false, 0]);
    await page.click("#screen-selector >> text=La Aventura");
    await page.evaluate(() => { aventura.manual = true; });
    await page.click('.btn-nivel[data-nivel="0-0"]');
    await page.evaluate(() => responderAventura(enemigoObjetivo().op.respuesta));
    expect(await page.evaluate(() => misiones.hoy.cuenta)).toBe(1);
  });

  test("la misión de antes se vuelve la meta: si ya estaba cumplida hoy, la meta también", async ({ page }) => {
    await preparar(page, { misiones: { hoy: { d: HOY, tipo: "partida", cuenta: 1, cumplida: true }, dias: [HOY] } });
    await page.goto("./");
    expect(await page.evaluate(() => { const m = misionDeHoy(); return [m.tipo, m.cumplida, m.cuenta]; })).toEqual(["meta", true, 10]);
  });

  test("una misión de antes, a medias, conserva lo que llevaba", async ({ page }) => {
    await preparar(page, { misiones: mision("escribir", { cuenta: 3 }) });
    await page.goto("./");
    expect(await page.evaluate(() => { const m = misionDeHoy(); return [m.tipo, m.cumplida, m.cuenta]; })).toEqual(["meta", false, 3]);
  });

  test("al día siguiente la meta empieza en cero, y la de ayer se queda en el calendario", async ({ page }) => {
    const ayer = fechaMenos(HOY, 1);
    await preparar(page, { misiones: { hoy: { d: ayer, tipo: "meta", cuenta: 10, cumplida: true }, dias: [ayer] } });
    await page.goto("./");
    await page.click("#screen-welcome button");
    expect(await page.evaluate(() => [misiones.hoy.d, misiones.hoy.cumplida, misiones.hoy.cuenta])).toEqual([HOY, false, 0]);
    await expect(page.locator(`#mision-semana [data-dia="${ayer}"]`)).toHaveAttribute("data-cumplida", "si");
    await expect(page.locator(`#mision-semana [data-dia="${HOY}"]`)).toHaveAttribute("data-cumplida", "no");
  });
});

test.describe("días seguidos", () => {
  test("la racha sigue viva hoy aunque la meta de hoy esté pendiente", async ({ page }) => {
    const dias = [3, 2, 1].map((n) => fechaMenos(HOY, n));
    await preparar(page, { misiones: { ...mision("partida"), dias } });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(page.locator("#mision-racha")).toHaveText("🔥 3 días seguidos");
    await expect(page.locator('#mision-semana [data-cumplida="si"]')).toHaveCount(3);
    expect(await page.evaluate(() => { for (let i = 0; i < 10; i++) avanzarMision("acierto"); return rachaActual(); })).toBe(4);
  });

  test("faltar un día vuelve a empezar la racha, pero no quita lo ganado", async ({ page }) => {
    const dias = [5, 4, 2].map((n) => fechaMenos(HOY, n));   // ayer no se jugó
    await preparar(page, { estrellas: 40, compras: ["mariposa"], misiones: { ...mision("partida"), dias } });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(page.locator("#mision-racha")).toHaveText("3 días cumplidos");
    expect(await page.evaluate(() => [rachaActual(), globalStars, compras, misiones.dias.length]))
      .toEqual([0, 40, ["mariposa"], 3]);
  });

  test("borrar el jardín borra sus estrellas, amigos y misiones", async ({ page }) => {
    await preparar(page, { estrellas: 40, compras: ["mariposa"], misiones: { ...mision("partida"), dias: [HOY] } });
    await page.goto("./");
    expect(await page.evaluate(() => globalStars)).toBe(40);
    await page.evaluate(() => borrarPerfil(perfilActual));
    const guardado = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("jardin:")));
    expect(guardado.filter((k) => /^jardin:p\d+:(estrellas|compras|misiones)$/.test(k))).toEqual([]);
    expect(await page.evaluate(() => [globalStars, compras, misiones.dias])).toEqual([0, [], []]);
  });
});

test.describe("accesibilidad de lo nuevo", () => {
  async function auditar(page, contexto) {
    await page.waitForTimeout(400);
    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const resumen = resultado.violations.map((v) =>
      `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    expect(resumen, `violaciones en ${contexto}`).toEqual([]);
  }

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("selector con la misión, la racha y la semana", async ({ page }) => {
    const dias = [2, 1].map((n) => fechaMenos(HOY, n));
    await preparar(page, { estrellas: 12, misiones: { ...mision("escribir", { cuenta: 2 }), dias } });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await auditar(page, "el selector con la misión");
  });

  test("vivero con cosas compradas, que alcanzan y que no", async ({ page }) => {
    await preparar(page, { estrellas: 30, compras: ["mariposa"], misiones: mision("partida") });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Vivero mágico");
    await auditar(page, "el vivero");
  });

  test("jardín con amigos y victoria con la misión cumplida", async ({ page }) => {
    await preparar(page, { estrellas: 0, compras: ["mariposa", "fuente"], misiones: mision("partida") });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await page.click("text=Mi jardín");
    await auditar(page, "el jardín con amigos");
    await page.evaluate(() => { currentTable = 2; estrellasAlEmpezar = 0; metaEnEstaPartida = true; endGameSuccess(); });
    await expect(page.locator("#victoria-mision")).toBeVisible();
    await auditar(page, "la victoria con la misión");
  });
});
