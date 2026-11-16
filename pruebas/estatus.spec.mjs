// Estatus de cada tabla por soltura (issue #64): semilla, arbolito, árbol y
// árbol con frutos. Siempre contra uno mismo; con «Sin prisa» no cuenta el
// tiempo. Se ve en el mapa y en el jardín, y se celebra al subir.
import { test, expect } from "@playwright/test";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/**
 * Siembra en el navegador las diez multiplicaciones de la tabla n: una
 * respuesta por día, en `dias` días distintos que acaban hace `hace` días.
 */
function sembrar(page, n, dias, { ms = 2000, m = "e", ok = 1, hace = 0, solo = null } = {}) {
  return page.evaluate(([n, dias, ms, m, ok, hace, solo]) => {
    const dia = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    for (let b = 1; b <= MULTIPLICADORES; b++) {
      if (solo && !solo.includes(b)) continue;
      const lista = Array.from({ length: dias }, (_, i) => ({ d: dia(hace + dias - 1 - i), t: 0, m, ok, ms }));
      hechos[claveHecho(n, b)] = lista;
    }
    guardarHechos();
  }, [n, dias, ms, m, ok, hace, solo]);
}

const estatus = (page, n, sinPrisa) => page.evaluate(([n, sp]) => estatusTabla(n, sp), [n, sinPrisa]);

test.describe("umbrales", () => {
  test("sin jugar no hay estatus; con una sola multiplicación jugada, semilla", async ({ page }) => {
    await alMenu(page);
    expect(await estatus(page, 7)).toBeNull();
    await page.evaluate(() => registrarIntento(7, 3, false));
    expect(await estatus(page, 7)).toBe("semilla");
  });

  test("arbolito: todas sus multiplicaciones al menos «casi»; si falta una, sigue en semilla", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 7, 2, { m: "o", ms: null });   // dos aciertos eligiendo: «casi»
    expect(await estatus(page, 7)).toBe("arbolito");
    await page.evaluate(() => { delete hechos[claveHecho(7, 9)]; });
    expect(await estatus(page, 7)).toBe("semilla");
  });

  test("árbol: todas escritas rápido en dos días distintos (la tabla entera florecida)", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 7, 2);
    expect(await estatus(page, 7)).toBe("arbol");
    expect(await page.evaluate(() => Array.from({ length: 10 }, (_, i) => estadoHecho(7, i + 1)).every((e) => e === "florecida"))).toBe(true);
    // Un solo día, aunque sea rápido, no basta.
    await sembrar(page, 6, 1);
    expect(await estatus(page, 6)).toBe("arbolito");
  });

  test("árbol con frutos: tres días distintos y repasada hace menos de 14 días", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 7, 3);
    expect(await estatus(page, 7)).toBe("frutos");
    await sembrar(page, 7, 3, { hace: 13 });
    expect(await estatus(page, 7)).toBe("frutos");
    await sembrar(page, 7, 3, { hace: 14 });   // sin repasar: se queda en árbol
    expect(await estatus(page, 7)).toBe("arbol");
  });

  test("un fallo vuelve a empezar la cuenta de días de esa multiplicación", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 7, 3);
    await page.evaluate(() => registrarIntento(7, 8, false));
    expect(await estatus(page, 7)).toBe("semilla");   // 7 × 8 recién fallada: ya no «casi»
    await page.evaluate(() => { registrarIntento(7, 8, true, { modo: "e", ms: 2000 }); registrarIntento(7, 8, true, { modo: "e", ms: 2000 }); });
    expect(await estatus(page, 7)).toBe("arbolito");   // de nuevo «casi», pero un solo día desde el fallo
  });

  test("lento no sube a árbol; con «Sin prisa», sí, porque no cuenta el tiempo", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 7, 3, { ms: 9000 });
    expect(await estatus(page, 7, false)).toBe("arbolito");
    expect(await estatus(page, 7, true)).toBe("frutos");
    // Pero hay que escribirla: eligiendo entre opciones no basta ni sin prisa.
    await sembrar(page, 7, 3, { m: "o", ms: null });
    expect(await estatus(page, 7, true)).toBe("arbolito");
  });

  test("«Sin prisa» se toma del ajuste del jugador, el mismo de la Aventura", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 7, 2, { ms: 9000 });
    expect(await page.evaluate(() => estatusTabla(7))).toBe("arbolito");
    await page.evaluate(() => cambiarSinPrisa());
    expect(await page.evaluate(() => estatusTabla(7))).toBe("arbol");
  });
});

test.describe("dónde se ve", () => {
  test("en el mapa, junto a cada tabla, con forma distinta y nombre para el lector", async ({ page }) => {
    await alMenu(page);
    const fila = (n) => page.locator(`#mapa-tabla tbody tr:nth-child(${n}) th`);
    await page.evaluate(() => mostrarMapa());
    await expect(fila(9)).toHaveAttribute("data-estatus", "");   // sin jugar: sin dibujo
    await expect(fila(9).locator("svg")).toHaveCount(0);
    // 7 × 8 y 8 × 7 son la misma planta: se siembra de la tabla que menos
    // comparte a la que más, para que cada una quede donde se quiere.
    await sembrar(page, 4, 2, { m: "o", ms: null });
    await sembrar(page, 3, 2);
    await sembrar(page, 2, 3);
    await page.evaluate(() => registrarIntento(5, 5, false));
    await page.evaluate(() => mostrarMapa());
    await expect(fila(2)).toHaveAttribute("data-estatus", "frutos");
    await expect(fila(3)).toHaveAttribute("data-estatus", "arbol");
    await expect(fila(4)).toHaveAttribute("data-estatus", "arbolito");
    await expect(fila(5)).toHaveAttribute("data-estatus", "semilla");
    await expect(fila(3).locator("button")).toContainText(", árbol");
    // Una forma por estatus: los cuatro dibujos son distintos.
    const formas = await page.evaluate(() => ESTATUS.map((e) => svgEstatus(e).replace(/data-estatus="[^"]*"/, "")));
    expect(new Set(formas).size).toBe(4);
  });

  test("en el jardín, en cada bancal, con el nombre y una leyenda que explica cómo se sube", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 3, 2);
    await page.evaluate(() => mostrarJardin());
    const bancal = page.locator("#jardin-bancales section").nth(2);
    await expect(bancal).toHaveAttribute("data-estatus", "arbol");
    await expect(bancal.locator(".estatus-nombre")).toHaveText("Árbol");
    await expect(bancal.locator("svg[data-estatus='arbol']")).toHaveCount(1);
    // La del 9 ya tiene 9 × 3 (la misma planta que 3 × 9): semilla.
    await expect(page.locator("#jardin-bancales section").nth(8)).toHaveAttribute("data-estatus", "semilla");
    await expect(page.locator("#estatus-leyenda li")).toHaveCount(4);
    await expect(page.locator("#estatus-explica")).toContainText("escribes rápido");
    // Con «Sin prisa», la leyenda lo dice.
    await page.evaluate(() => { cambiarSinPrisa(); mostrarJardin(); });
    await expect(page.locator("#estatus-explica")).toContainText("no cuenta el tiempo");
    await expect(page.locator("#estatus-explica")).not.toContainText("escribes rápido");
  });

  test("el mapa con estatus sigue cabiendo en el teléfono", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await alMenu(page);
    for (let n = 1; n <= 9; n++) await sembrar(page, n, 3);
    await page.evaluate(() => mostrarMapa());
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});

test.describe("celebración", () => {
  /** Empieza la partida de la tabla n (anota el estatus de antes) y la gana tras `cambio`. */
  async function partidaQue(page, n, cambio) {
    await page.evaluate((n) => { startTable(n); cancelarEspera(); }, n);
    await cambio();
    await page.evaluate(() => endGameSuccess());
  }

  test("al subir de estatus en la partida, la victoria lo celebra y lo dice", async ({ page }) => {
    await instalarDobles(page, [{ lang: "es-MX" }]);
    await alMenu(page);
    await sembrar(page, 7, 1);   // arbolito
    await partidaQue(page, 7, () => sembrar(page, 7, 2));
    const aviso = page.locator("#victoria-estatus");
    await expect(aviso).toBeVisible();
    await expect(aviso).toHaveText("¡Tu tabla del 7 ya es un árbol!");
    await expect(aviso.locator("svg[data-estatus='arbol']")).toHaveCount(1);
    const dicho = await page.evaluate(() => window.__dicho.map((d) => d.texto).join(" | "));
    expect(dicho).toContain("¡Tu tabla del 7 ya es un árbol!");
  });

  test("sin subir no hay aviso; bajar y volver a subir no se celebra otra vez", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 7, 2);
    await partidaQue(page, 7, async () => {});
    await expect(page.locator("#victoria-estatus")).toBeHidden();
    await partidaQue(page, 7, () => page.evaluate(() => registrarIntento(7, 8, false)));   // baja
    await expect(page.locator("#victoria-estatus")).toBeHidden();
    await partidaQue(page, 7, () => sembrar(page, 7, 2));   // vuelve a árbol: ya lo fue
    await expect(page.locator("#victoria-estatus")).toBeHidden();
    await partidaQue(page, 7, () => sembrar(page, 7, 3));   // frutos: nuevo
    await expect(page.locator("#victoria-estatus")).toHaveText("¡Tu tabla del 7 ya es un árbol con frutos!");
  });

  test("varias tablas a la vez, en una frase; la semilla no se celebra", async ({ page }) => {
    await alMenu(page);
    await partidaQue(page, "mix", async () => {   // una tabla sin jugar abriría «Descubre la tabla»
      await sembrar(page, 2, 2, { m: "o", ms: null });
      await sembrar(page, 5, 2);
      await page.evaluate(() => registrarIntento(6, 6, false));   // semilla en la 6
    });
    await expect(page.locator("#victoria-estatus")).toHaveText("¡Crecieron tus tablas: la del 2 ya es un arbolito y la del 5 ya es un árbol!");
  });

  test("lo que ya se tenía antes de esta versión no se celebra de golpe", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 3, 3);   // progreso de antes: frutos, sin estatus anotado
    expect(await page.evaluate(() => almacen.leer("estatus"))).toBeNull();
    await partidaQue(page, 3, async () => {});
    await expect(page.locator("#victoria-estatus")).toBeHidden();
  });

  test("una victoria sin nada anotado (el juego se actualizó a mitad de partida) tampoco celebra lo de antes", async ({ page }) => {
    await alMenu(page);
    await sembrar(page, 3, 3);
    await page.evaluate(() => endGameSuccess());   // sin startTable: nada anotado
    await expect(page.locator("#victoria-estatus")).toBeHidden();
    expect(await page.evaluate(() => mejoresEstatus()[3])).toBe(3);   // pero queda anotado para la próxima
  });

  test("el estatus anotado es de cada jardín, y uno dañado se ignora", async ({ page }) => {
    await alMenu(page);
    expect(await page.evaluate(() => DEL_PERFIL.includes("estatus"))).toBe(true);
    await page.evaluate(() => almacen.guardar("estatus", '{"7": 9, "x": 1, "3": "árbol"'));
    expect(await page.evaluate(() => mejoresEstatus())).toEqual({});
    await page.evaluate(() => almacen.guardar("estatus", '{"7": 9, "40": 1, "3": 2, "5": -1, "6": -2}'));
    expect(await page.evaluate(() => mejoresEstatus())).toEqual({ 3: 2, 5: -1 });   // -1 es «sin jugar»: se conserva
  });
});
