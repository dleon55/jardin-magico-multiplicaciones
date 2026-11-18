// Accesibilidad medida con axe-core (las reglas WCAG 2.1 A y AA), pantalla por
// pantalla. Antes del cambio el sitio no tenía ni un solo atributo aria, y
// varios textos no llegaban al contraste mínimo.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { entrarATabla, responder, siguiente } from "./ayudas.mjs";

async function auditar(page, contexto) {
  // Se congela el avance automático: axe tarda, y con el equipo cargado la
  // pregunta seguía sola a mitad de la auditoría. Se audita lo que se ve
  // mientras se espera, que es lo que tiene que ser accesible.
  await page.evaluate(() => { if (espera) clearTimeout(espera.temporizador); });
  // Se espera a que acaben las animaciones de entrada: axe mide el contraste
  // de lo que ve, y a mitad de un fundido los colores aún no son los finales.
  await page.waitForTimeout(400);
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const resumen = resultado.violations.map((v) =>
    `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(resumen, `violaciones en ${contexto}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  // Sin movimiento: el confeti y los fundidos no deben interferir en la medida.
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("bienvenida", async ({ page }) => {
  await page.goto("./");
  await auditar(page, "la bienvenida");
});

test("selector de tablas", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await auditar(page, "el selector");
});

test("pregunta, con la ayuda abierta", async ({ page }) => {
  await entrarATabla(page, 7);
  await page.click("#btn-help");
  await auditar(page, "la pregunta");
});

test("tras un acierto y tras un error", async ({ page }) => {
  await entrarATabla(page, 8);
  await responder(page, true);
  await auditar(page, "el acierto");
  await siguiente(page);
  await responder(page, false);
  await auditar(page, "el error");
});

test("victoria", async ({ page }) => {
  await entrarATabla(page, 2);
  for (let i = 0; i < 10; i++) {
    await responder(page, true);
    await siguiente(page);
  }
  await expect(page.locator("#screen-victory")).toBeVisible();
  await auditar(page, "la victoria");
});

test("panel de ajustes abierto", async ({ page }) => {
  await page.goto("./");
  await page.click("#ajustes summary");
  await auditar(page, "los ajustes");
});

test("al cambiar de pantalla, el foco va a su encabezado", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await expect(page.locator("#screen-selector [data-foco]")).toBeFocused();
});

test("la pregunta y el resultado se anuncian solos al lector de pantalla", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#question-text")).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#game-feedback")).toHaveAttribute("aria-live", "polite");
});

test("ayuda girada", async ({ page }) => {
  await entrarATabla(page, 9);
  await page.click("#btn-help");
  await page.click("#btn-girar");
  await auditar(page, "la ayuda girada");
});

test("ayuda tocada: con una fila menos y partida", async ({ page }) => {
  await entrarATabla(page, 7);
  await page.click("#btn-help");
  await page.click("#btn-quitar-fila");
  await page.click("#btn-partir");
  await page.focus("#ayuda-rect");
  await auditar(page, "la ayuda tocada");
});

test("estatus de las tablas: victoria que lo celebra, jardín y mapa", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  const sembrar = (n, dias) => page.evaluate(([n, dias]) => {
    const dia = (k) => new Date(Date.parse(hoy()) - k * 86400000).toISOString().slice(0, 10);
    for (let b = 1; b <= 10; b++) hechos[claveHecho(n, b)] = Array.from({ length: dias }, (_, i) => ({ d: dia(dias - 1 - i), m: "e", ok: 1, ms: 2000 }));
  }, [n, dias]);
  await page.evaluate(() => { startTable("mix"); cancelarEspera(); });
  await sembrar(4, 1);
  await sembrar(3, 2);
  await sembrar(2, 3);
  await page.evaluate(() => endGameSuccess());
  await expect(page.locator("#victoria-estatus")).toBeVisible();
  await auditar(page, "la victoria con estatus");
  await page.evaluate(() => mostrarJardin());
  await auditar(page, "el jardín con estatus");
  await page.evaluate(() => mostrarMapa());
  await auditar(page, "el mapa con estatus");
});

test("el camino, con tramos hechos, abiertos y cerrados", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => {
    for (const n of [2, 5, 3]) for (let b = 1; b <= 10; b++) hechos[claveHecho(n, b)] = [{ d: "", m: "o", ok: 1, ms: null }, { d: "", m: "o", ok: 1, ms: null }];
    aventuraGuardada.estrellas = { "0-3": 2 }; aventuraGuardada.alcanzado = 4;
    mostrarCamino();
  });
  await auditar(page, "el camino");
});

test("en equipo: la elección de jugadores y la partida con la banda del turno", async ({ page }) => {
  await page.goto("./");
  await page.fill("#player-name", "Leo");
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=Cambiar de jugador");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button");
  await page.click("#btn-equipo");
  await auditar(page, "la elección del equipo");
  await page.locator("#equipo-jugadores input").evaluateAll((cs) => cs.forEach((c) => { c.checked = true; }));
  await page.click('#equipo-tablas [data-tabla="3"]');
  await auditar(page, "la partida en equipo");
});

test("múltiplos y divisores, con la ayuda abierta", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#btn-multiplos");
  await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 4, b: 1, reto: { clase: "divisor", d: 4, q: 6 } }]; nextQuestion(); });
  await page.click("#btn-help");
  await auditar(page, "múltiplos y divisores");
});

test("perímetro y área, con la ayuda abierta", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#btn-area");
  await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 7, b: 4, reto: { clase: "perimetro", a: 7, b: 4, lugar: "un huerto" } }]; nextQuestion(); });
  await page.click("#btn-help");
  await auditar(page, "perímetro y área");
});

test("decimales y dinero, con la ayuda abierta (el cambio y los decimales)", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#btn-dinero");
  for (const reto of [{ clase: "cambio", billete: 50, precio: 3740 }, { clase: "decimal", a: 50, b: 45 }]) {
    await page.evaluate((r) => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 5, b: 1, reto: r }]; nextQuestion(); }, reto);
    if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
    await auditar(page, `decimales y dinero: ${reto.clase}`);
  }
});

test("porcentajes, con la ayuda abierta (de un número y fracción)", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#btn-porcentajes");
  for (const reto of [{ clase: "de", p: 25, n: 40 }, { clase: "fraccion", p: 75 }]) {
    await page.evaluate((r) => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 4, b: 1, reto: r }]; nextQuestion(); }, reto);
    if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
    await auditar(page, `porcentajes: ${reto.clase}`);
  }
});

test("fracciones decimales, con la ayuda abierta (las cuatro clases)", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#btn-decimales");
  for (const reto of [{ clase: "aDecimal", arriba: 3, abajo: 10 }, { clase: "aFraccion", arriba: 25, abajo: 100 }, { clase: "comparar", t: 7, x: 5 }, { clase: "sumar", a: 6, b: 5 }]) {
    await page.evaluate((r) => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 3, b: 1, reto: r }]; nextQuestion(); }, reto);
    if (await page.locator("#help-panel").isHidden()) await page.click("#btn-help");
    await auditar(page, `decimales: ${reto.clase}`);
  }
});

test("mapa de tablas, con hechos en los cuatro estados", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => {
    hechos["3x4"] = [{ d: "2026-11-01", m: "e", ok: 1, ms: 2000 }, { d: "2026-11-02", m: "e", ok: 1, ms: 2000 }];   // florecida
    registrarIntento(5, 6, true); registrarIntento(5, 6, true);   // casi
    registrarIntento(7, 8, false);                               // practicando
  });
  await page.click("text=Mi mapa de tablas");
  await auditar(page, "el mapa");
});

test("pregunta que se responde escribiendo, con un número a medias", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => { for (let b = 1; b <= 10; b++) registrarIntento(3, b, true); });
  await page.click("#screen-welcome button");
  await page.locator("#grid-tablas-container button").nth(2).click();
  await page.click('#escritura [data-digito="1"]');
  await auditar(page, "el teclado de números");
  await page.click("#btn-letra");
  await auditar(page, "escribir la respuesta con el dedo");
  await page.evaluate(() => {
    pizarraJuego.trazos = [Array.from({ length: 20 }, (_, i) => ({ x: 100, y: 20 + i * 8 }))];
    pizarraJuego.dibujar();
    pizarraJuego.leer();
  });
  await page.click("#pizarra-juego-corregir");
  await auditar(page, "corregir lo que leyó, para aprender la letra");
  await page.evaluate(() => { aprenderCifra(pizarraJuego.trazos, 1); guardarLetra(); });
  await page.evaluate(() => mostrarAdultos());
  await expect(page.locator(".adulto-letra")).toBeVisible();
  await auditar(page, "la vista para adultos con la letra aprendida");
});

test("mi jardín, con plantas en todos los estados", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => {
    const r = (d) => ({ d, t: 1, m: "e", ok: 1, ms: 2000 });
    hechos["2x3"] = [r("2026-01-01"), r(hoy())];       // flor
    hechos["3x3"] = [r("2020-01-01"), r("2020-01-02")]; // marchita
    hechos["4x5"] = [r(hoy())];                         // capullo
    registrarIntento(6, 7, true);                       // brote
  });
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=Mi jardín");
  await auditar(page, "el jardín");
});

test("selector con «Practicar lo que me falta»", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => registrarIntento(7, 8, false));
  await page.click("#screen-welcome button");
  await auditar(page, "el selector con el botón de lo que falta");
});

test("descubrir una tabla, a medias y entera", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.locator("#grid-tablas-container button").nth(6).click();
  await page.click("#descubrir-otra");
  await auditar(page, "descubrir la tabla, con una fila");
  for (let i = 0; i < 9; i++) await page.click("#descubrir-otra");
  await auditar(page, "descubrir la tabla, entera");
});

test("«¿Quién juega?» y la vista para las personas adultas", async ({ page }) => {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { registrarIntento(7, 8, false); registrarIntento(5, 5, true); });
  await page.click("#screen-selector >> text=Cambiar de jugador");
  await auditar(page, "la bienvenida con un jardín");
  await page.click("#screen-welcome >> text=Para las personas adultas");
  await page.click(".btn-borrar");
  await auditar(page, "la vista para adultos, pidiendo confirmar el borrado");
});

test("elegir mundo y personaje, en la bienvenida y en el menú", async ({ page }) => {
  await page.goto("./");
  await page.click('#screen-welcome .elegir-mundo label:has(input[value="dinos"])');
  await auditar(page, "la bienvenida con las fichas de mundo y personaje");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await auditar(page, "el menú en la selva de dinosaurios");
  await page.click("#screen-selector >> text=Mi mundo y mi personaje");
  await auditar(page, "cambiar de mundo");
});

for (const mundo of ["huerto", "bosque", "dinos", "espacio", "mar", "granja", "desierto", "flores"]) {
  test(`el menú y el jardín se leen bien en el mundo «${mundo}»`, async ({ page }) => {
    await page.goto("./");
    await page.click(`#screen-welcome .elegir-mundo label:has(input[value="${mundo}"])`);
    await page.click("#screen-welcome button:has-text('Comenzar')");
    await page.evaluate(() => { registrarIntento(7, 8, false); registrarIntento(5, 5, true); });
    await auditar(page, `el menú en ${mundo}`);
    await page.click("#screen-selector >> text=Mi jardín");
    await auditar(page, `el jardín en ${mundo}`);
  });
}

test("un reto de lógica, con la ayuda abierta y uno fallado", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("text=Retos de lógica");
  await page.click("#btn-help");
  await auditar(page, "un reto de lógica con la ayuda");
  const mala = await page.evaluate(() => [...document.querySelectorAll(".btn-option")].find((b) => Number(b.dataset.valor) !== correctAnswer).id);
  await page.click(`#${mala}`);
  await auditar(page, "un reto de lógica fallado");
});

test("una fracción con la ayuda abierta", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#btn-fracciones");
  await page.click('#clases-fracciones button[data-clase="mezcla"]');
  await page.click("#btn-help");
  await auditar(page, "una fracción con el rectángulo repartido");
});

test("comparar fracciones con las tiras de la ayuda", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 4, b: 4, reto: { clase: "comparar", variante: "mismoNum", fracs: [[1, 5], [1, 3], [1, 8], [1, 4]] } }]; nextQuestion(); });
  await page.click("#btn-help");
  await auditar(page, "comparar fracciones con tiras");
});

test("sumar fracciones con las tiras de la ayuda", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 7, b: 2, reto: { clase: "sumar", op: "+", a: 2, b: 3, d: 7 } }]; nextQuestion(); });
  await page.click("#btn-help");
  await auditar(page, "sumar fracciones con tiras");
});

test("sumar fracciones con distinto denominador, con las tiras", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { startTable("fracciones"); colaRepaso = []; bolsa = [{ a: 2, b: 3, reto: { clase: "sumarDistinto", a: 1, b: 2, c: 1, d: 3 } }]; nextQuestion(); });
  await page.click("#btn-help");
  await auditar(page, "sumar con distinto denominador");
});

test("elegir qué fracciones practicar", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#btn-fracciones");
  await auditar(page, "la elección de fracciones");
});

test("la vista para adultos con fracciones y retos", async ({ page }) => {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button");
  await page.evaluate(() => {
    for (const ok of [0, 1, 0, 0, 1]) registrarOtro("fraccion:equivalente", ok);
    registrarOtro("logica:intruso", 1);
    registrarIntento(7, 8, false);
  });
  await page.click("#screen-selector >> text=Para las personas adultas");
  await auditar(page, "la vista para adultos con fracciones y retos");
});

test("la aventura: el mapa y un nivel", async ({ page }) => {
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.click("#screen-selector >> text=La Aventura");
  await auditar(page, "el mapa de la aventura");
  await page.evaluate(() => { aventura.manual = true; });
  await page.click('.btn-nivel[data-nivel="0-0"]');
  await auditar(page, "un nivel de la aventura");
  await page.click('#modos-aventura [data-modo="elegir"]');
  await auditar(page, "un nivel de la aventura, eligiendo");
  await page.click('#modos-aventura [data-modo="dedo"]');
  await auditar(page, "un nivel de la aventura, con el dedo");
});
