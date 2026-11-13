// Fase 3: las estrellas se gastan en el vivero, y cada día hay una misión.
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
const mision = (tipo, extra = {}) => ({ hoy: { d: HOY, tipo, cuenta: 0, cumplida: false, ...extra }, dias: [] });

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
    await preparar(page, { estrellas: 3, compras: ["mariposa", "dragon", "mariposa"], misiones: { hoy: { d: "ayer", tipo: "nada" }, dias: ["x", HOY] } });
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

test.describe("misión del día", () => {
  test("se cumple al ganar una partida: da 10 estrellas y la victoria lo dice", async ({ page }) => {
    await preparar(page, { estrellas: 0, misiones: mision("partida") });
    await entrarATabla(page, 2);
    for (let i = 0; i < 10; i++) {
      await responder(page, true);
      await siguiente(page);
    }
    await expect(page.locator("#screen-victory")).toBeVisible();
    await expect(page.locator("#victoria-mision")).toBeVisible();
    await expect(page.locator("#victoria-mision")).toContainText("¡Misión de hoy cumplida!");
    // 10 aciertos + 10 de la misión; con 20, ya alcanza para la mariposa.
    await expect(page.locator("#victoria-estrellas")).toContainText("Ganaste 20 estrellas en esta partida");
    await expect(page.locator("#victoria-estrellas")).toContainText("¡Ya te alcanza para la mariposa en el Vivero!");

    await page.click("text=Sigue Cultivando");
    await expect(page.locator("#mision-texto")).toContainText("✓ ¡Misión cumplida!");
    await expect(page.locator(`#mision-semana [data-dia="${HOY}"]`)).toHaveAttribute("data-cumplida", "si");
  });

  test("«escribe bien 5» cuenta de una en una y premia una sola vez", async ({ page }) => {
    await preparar(page, { estrellas: 0, misiones: mision("escribir") });
    await page.goto("./");
    const r = await page.evaluate(() => {
      const vueltas = [];
      for (let i = 0; i < 6; i++) vueltas.push(avanzarMision("escrita"));
      return { vueltas, estrellas: globalStars, dias: misiones.dias, cuenta: misiones.hoy.cuenta };
    });
    expect(r).toEqual({ vueltas: [false, false, false, false, true, false], estrellas: 10, dias: [HOY], cuenta: 5 });
  });

  test("el reto del arcoíris y el repaso solo se cumplen con su propia partida", async ({ page }) => {
    await preparar(page, { misiones: mision("arcoiris") });
    await page.goto("./");
    expect(await page.evaluate(() => [avanzarMision("escrita"), avanzarMision("partida", 3), avanzarMision("partida", "mix")]))
      .toEqual([false, false, true]);
    expect(await page.evaluate(() => {
      misiones.hoy = { d: hoy(), tipo: "falta", cuenta: 0, cumplida: false };
      return [avanzarMision("partida", "mix"), avanzarMision("partida", "falta")];
    })).toEqual([false, true]);
  });

  test("se elige una vez al día y no cambia aunque cambie lo pendiente", async ({ page }) => {
    await preparar(page);
    await page.goto("./");
    const r = await page.evaluate(() => {
      const primera = misionDeHoy().tipo;
      registrarIntento(7, 8, false);   // ahora sí hay algo que repasar
      registrarIntento(6, 9, true);
      return [primera, misionDeHoy().tipo, JSON.parse(localStorage.getItem("jardin:p1:misiones")).hoy.d];
    });
    expect(r[1]).toBe(r[0]);
    expect(r[2]).toBe(HOY);
  });

  test("solo propone lo que se puede cumplir hoy", async ({ page }) => {
    await preparar(page);
    await page.goto("./");
    // Sin nada jugado no hay 5 multiplicaciones que se escriban ni nada que
    // repasar: en una semana entera solo salen la partida y el arcoíris.
    const vacio = await page.evaluate(() => {
      const tipos = [];
      for (let k = 0; k < 8; k++) {
        const d = new Date(Date.parse("2026-11-01") + k * 86400000).toISOString().slice(0, 10);
        hoy = () => d;   // un día distinto en cada vuelta
        misiones.hoy = null;
        tipos.push(misionDeHoy().tipo);
      }
      return [...new Set(tipos)].sort();
    });
    expect(vacio).toEqual(["arcoiris", "partida"]);

    // Con 5 que ya se escriben y algo pendiente, aparecen las cuatro.
    const lleno = await page.evaluate(() => {
      [[2, 3], [2, 4], [2, 5], [3, 3], [3, 4]].forEach(([a, b]) => registrarIntento(a, b, true));
      registrarIntento(7, 8, false);
      const tipos = [];
      for (let k = 0; k < 4; k++) {
        const d = new Date(Date.parse("2026-11-01") + k * 86400000).toISOString().slice(0, 10);
        hoy = () => d;
        misiones.hoy = null;
        tipos.push(misionDeHoy().tipo);
      }
      return [...new Set(tipos)].sort();
    });
    expect(lleno).toEqual(["arcoiris", "escribir", "falta", "partida"]);
  });

  test("al día siguiente hay misión nueva, y la de ayer se queda en el calendario", async ({ page }) => {
    const ayer = fechaMenos(HOY, 1);
    await preparar(page, { misiones: { hoy: { d: ayer, tipo: "partida", cuenta: 1, cumplida: true }, dias: [ayer] } });
    await page.goto("./");
    await page.click("#screen-welcome button");
    expect(await page.evaluate(() => [misiones.hoy.d, misiones.hoy.cumplida, misiones.hoy.cuenta])).toEqual([HOY, false, 0]);
    await expect(page.locator(`#mision-semana [data-dia="${ayer}"]`)).toHaveAttribute("data-cumplida", "si");
    await expect(page.locator(`#mision-semana [data-dia="${HOY}"]`)).toHaveAttribute("data-cumplida", "no");
  });
});

test.describe("días seguidos", () => {
  test("la racha sigue viva hoy aunque la misión de hoy esté pendiente", async ({ page }) => {
    const dias = [3, 2, 1].map((n) => fechaMenos(HOY, n));
    await preparar(page, { misiones: { ...mision("partida"), dias } });
    await page.goto("./");
    await page.click("#screen-welcome button");
    await expect(page.locator("#mision-racha")).toHaveText("🔥 3 días seguidos");
    await expect(page.locator('#mision-semana [data-cumplida="si"]')).toHaveCount(3);
    expect(await page.evaluate(() => { avanzarMision("partida", 2); return rachaActual(); })).toBe(4);
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
    await page.evaluate(() => { currentTable = 2; estrellasAlEmpezar = 0; endGameSuccess(); });
    await expect(page.locator("#victoria-mision")).toBeVisible();
    await auditar(page, "la victoria con la misión");
  });
});
