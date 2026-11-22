// Retos con código (Hito 4.6): diez multiplicaciones que se mandan con un
// código de seis signos o un enlace. Sin cuentas, sin servidor y sin nombres:
// el código dice las tablas, las preguntas (una semilla) y la marca a vencer.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { instalarDobles } from "./ayudas.mjs";

async function alMenu(page, direccion = "./") {
  await page.goto(direccion);
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}
const codigo = (page, reto) => page.evaluate((r) => codigoDeReto(r), reto);
const estrellas = (page) => page.evaluate(() => globalStars);
/** Responde la pregunta en pantalla, bien o mal, y pasa a la siguiente. */
async function responder(page, bien) {
  const buena = await page.evaluate(() => retoEnJuego.preguntas[retoEnJuego.n - 1].respuesta);
  const valores = await page.locator(".reto-opcion").evaluateAll((bs) => bs.map((b) => Number(b.dataset.valor)));
  await page.click(`.reto-opcion[data-valor="${bien ? buena : valores.find((v) => v !== buena)}"]`);
  await page.click("#reto-sigue");
}
/** Juega las diez: `aciertos` bien y el resto mal. */
async function jugar(page, aciertos) {
  for (let i = 0; i < 10; i++) await responder(page, i < aciertos);
  await expect(page.locator("#reto-fin")).toBeVisible();
}

test.describe("el código", () => {
  test.beforeEach(async ({ page }) => { await page.goto("./"); });

  test("ida y vuelta: cualquier combinación de tablas, semilla y marca se recupera igual", async ({ page }) => {
    const r = await page.evaluate(() => {
      let malos = 0, n = 0;
      const vistos = new Set();
      for (let bits = 1; bits < 256; bits++) for (let semilla = bits % 7; semilla < RETO_SEMILLAS; semilla += 41) for (let marca = 0; marca <= RETO_PREGUNTAS; marca++) {
        const tablas = RETO_TABLAS.filter((t, i) => bits & (1 << i));
        const c = codigoDeReto({ tablas, semilla, marca });
        const leido = leerCodigoDeReto(c);
        n++;
        vistos.add(c);
        if (!leido || leido.semilla !== semilla || leido.marca !== marca || leido.tablas.join() !== tablas.join() || leido.codigo !== c || !/^[2-9A-HJ-NP-Z]{6}$/.test(c)) malos++;
      }
      return { malos, n, distintos: vistos.size };
    });
    expect(r.malos).toBe(0);
    expect(r.distintos).toBe(r.n);
    expect(r.n).toBeGreaterThan(60000);
  });

  test("seis signos sin 0, 1, I ni O; se lee con minúsculas, espacios y guiones", async ({ page }) => {
    const c = await codigo(page, { tablas: [2, 5], semilla: 77, marca: 8 });
    expect(c).toBe("NKWK4S");
    expect(await page.evaluate(() => RETO_SIGNOS)).toBe("23456789ABCDEFGHJKLMNPQRSTUVWXYZ");
    expect(await page.evaluate(() => codigoALaVista("NKWK4S"))).toBe("NKW K4S");
    for (const escrito of ["NKWK4S", "nkw k4s", " NKW-K4S ", "n.k.w.k.4.s"]) {
      expect(await page.evaluate((t) => leerCodigoDeReto(t), escrito)).toEqual({ tablas: [2, 5], semilla: 77, marca: 8, codigo: "NKWK4S" });
    }
  });

  test("un código mal copiado no pasa: un signo cambiado, dos intercambiados, de más, de menos o vacío", async ({ page }) => {
    const r = await page.evaluate(() => {
      const c = codigoDeReto({ tablas: [3, 4, 7], semilla: 513, marca: 6 });
      let cambiados = 0, aceptados = 0;
      for (let i = 0; i < c.length; i++) for (const s of RETO_SIGNOS) {
        if (s === c[i]) continue;
        cambiados++;
        if (leerCodigoDeReto(c.slice(0, i) + s + c.slice(i + 1))) aceptados++;
      }
      let cruzados = 0;
      for (let i = 0; i < c.length - 1; i++) {
        const x = c.slice(0, i) + c[i + 1] + c[i] + c.slice(i + 2);
        if (x !== c && leerCodigoDeReto(x)) cruzados++;
      }
      return { cambiados, aceptados, cruzados, otros: [c + "2", c.slice(1), "", "      ", null, undefined, "NKWK4O", "NKWK41", "ñandúes", c + c].map((t) => leerCodigoDeReto(t)) };
    });
    expect(r.cambiados).toBe(186);
    expect(r.aceptados).toBe(0);
    expect(r.cruzados).toBe(0);
    expect(r.otros).toEqual(Array(10).fill(null));
    // Un signo de más al principio (aunque sea el «cero» del código), los signos que no existen y un reto sin tablas.
    const mas = await page.evaluate(() => {
      const aceptados = [];
      const azar = azarDeReto(7);
      for (let n = 0; n < 300; n++) {
        const c = codigoDeReto({ tablas: [2 + (n % 8)], semilla: Math.floor(azar() * RETO_SEMILLAS), marca: n % 11 });
        if (leerCodigoDeReto(RETO_SIGNOS[0] + c)) aceptados.push(`2${c}`);
        for (let i = 0; i < c.length; i++) for (const s of "01IO") {
          const x = c.slice(0, i) + s + c.slice(i + 1);
          if (leerCodigoDeReto(x)) aceptados.push(x);
        }
      }
      for (let semilla = 0; semilla < RETO_SEMILLAS; semilla += 50) if (leerCodigoDeReto(codigoDeReto({ tablas: [], semilla, marca: 3 }))) aceptados.push(`sin tablas ${semilla}`);
      return aceptados;
    });
    expect(mas).toEqual([]);
  });

  test("de cien mil códigos al azar pasan muy pocos, y ninguno con una marca imposible o sin tablas", async ({ page }) => {
    const r = await page.evaluate(() => {
      let validos = 0, raros = 0;
      const azar = azarDeReto(2026);
      for (let i = 0; i < 100000; i++) {
        let c = "";
        for (let k = 0; k < RETO_LARGO; k++) c += RETO_SIGNOS[Math.floor(azar() * 32)];
        const leido = leerCodigoDeReto(c);
        if (!leido) continue;
        validos++;
        if (leido.marca > RETO_PREGUNTAS || leido.tablas.length === 0 || codigoDeReto(leido) !== c) raros++;
      }
      return { validos, raros };
    });
    expect(r.validos).toBeLessThan(600);   // uno de cada 256, menos las marcas imposibles
    expect(r.validos).toBeGreaterThan(100);
    expect(r.raros).toBe(0);
  });

  test("las diez preguntas: siempre las mismas para el mismo reto, sin repetir, de sus tablas y con cuatro opciones", async ({ page }) => {
    const r = await page.evaluate(() => {
      const fallas = [];
      for (let bits = 1; bits < 256; bits += 3) for (const semilla of [0, 1, 500, 1023]) {
        const tablas = RETO_TABLAS.filter((t, i) => bits & (1 << i));
        const p = preguntasDeReto(tablas, semilla);
        const etiqueta = `${tablas.join()}/${semilla}`;
        if (JSON.stringify(p) !== JSON.stringify(preguntasDeReto(tablas, semilla))) fallas.push(`${etiqueta}: cambia`);
        if (p.length !== 10 || new Set(p.map((q) => q.texto)).size !== 10) fallas.push(`${etiqueta}: no son diez distintas`);
        for (const q of p) {
          if (!tablas.includes(q.a) || q.respuesta !== q.a * q.b || q.texto !== `${q.a} × ${q.b}`) fallas.push(`${etiqueta}: ${q.texto}`);
          if (tablas.length > 1 && (q.b < 2 || q.b > 9)) fallas.push(`${etiqueta}: ${q.texto} fuera del 2 al 9`);
          if (q.opciones.length !== 4 || new Set(q.opciones).size !== 4 || q.opciones.filter((o) => o === q.respuesta).length !== 1 || q.opciones.some((o) => o <= 0 || !Number.isInteger(o))) fallas.push(`${etiqueta}: opciones de ${q.texto}: ${q.opciones}`);
        }
      }
      return fallas;
    });
    expect(r).toEqual([]);
  });

  test("otra semilla u otras tablas dan otras preguntas; la buena no cae siempre en el mismo botón", async ({ page }) => {
    const r = await page.evaluate(() => {
      const textos = (t, s) => preguntasDeReto(t, s).map((q) => q.texto).join();
      const lugares = new Set();
      for (let s = 0; s < 30; s++) for (const q of preguntasDeReto([2, 3, 4, 5], s)) lugares.add(q.opciones.indexOf(q.respuesta));
      return { otraSemilla: textos([2, 3, 4, 5], 1) !== textos([2, 3, 4, 5], 2), otrasTablas: textos([2, 3], 1) !== textos([2, 4], 1), lugares: [...lugares].sort() };
    });
    expect(r).toEqual({ otraSemilla: true, otrasTablas: true, lugares: [0, 1, 2, 3] });
  });

  test("con una sola tabla entran también el × 10 y el × 1, para llegar a diez", async ({ page }) => {
    const bs = await page.evaluate(() => preguntasDeReto([7], 3).map((q) => q.b).sort((x, y) => x - y));
    expect(bs).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // Las falsas del × 1 no incluyen el cero ni negativos.
    expect(await page.evaluate(() => preguntasDeReto([2], 3).every((q) => q.opciones.every((o) => o > 0)))).toBe(true);
  });

  test("cómo se dicen las tablas y cómo es el enlace", async ({ page }) => {
    expect(await page.evaluate(() => [[2], [2, 5], [2, 3, 5], RETO_TABLAS].map(tablasDeReto))).toEqual(
      ["la tabla del 2", "las tablas del 2 y del 5", "las tablas del 2, del 3 y del 5", "todas las tablas"]);
    expect(await page.evaluate(() => enlaceDeReto("NKWK4S", "https://ejemplo.org/jardin/?reto=VIEJO&x=1#parte"))).toBe("https://ejemplo.org/jardin/?reto=NKWK4S");
  });
});

test("crear un reto: diez preguntas de las tablas empezadas, una oportunidad cada una, y al final el código con la marca", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await alMenu(page);
  await page.evaluate(() => { for (const a of [3, 6]) hechos[claveHecho(a, 2)] = [{ d: hoy(), m: "o", ok: 1, ms: 2000 }]; guardarHechos(); });
  await page.click("#btn-reto");
  await expect(page.locator("#screen-reto")).toBeVisible();
  await expect(page.locator("#reto-crear-detalle")).toHaveText("Diez multiplicaciones de las tablas del 2, del 3 y del 6.");   // 3 × 2 también es de la del 2
  await expect(page.locator("#reto-llego")).toBeHidden();
  await page.click("#btn-reto-crear");
  await expect(page.locator("#reto-juego")).toBeVisible();
  await expect(page.locator("#reto-cuenta")).toHaveText("Pregunta 1 de 10");
  await expect(page.locator(".reto-opcion")).toHaveCount(4);
  expect(await page.evaluate(() => [retoEnJuego.tablas, retoEnJuego.marca, retoEnJuego.preguntas.every((q) => [2, 3, 6].includes(q.a))])).toEqual([[2, 3, 6], null, true]);
  const primera = await page.evaluate(() => retoEnJuego.preguntas[0]);
  await expect(page.locator("#reto-pregunta")).toHaveText(primera.texto);
  await expect(page.locator("#reto-pregunta")).toBeFocused();
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe(`${primera.a} por ${primera.b}`);
  // Acertar: una estrella, la buena en verde, y no se puede responder dos veces.
  const antes = await estrellas(page);
  await page.click(`.reto-opcion[data-valor="${primera.respuesta}"]`);
  await expect(page.locator("#reto-nota")).toHaveText(`¡Bien! ${primera.texto} = ${primera.respuesta}.`);
  await expect(page.locator(`.reto-opcion[data-valor="${primera.respuesta}"]`)).toHaveClass(/ensenar-buena/);
  expect(await page.locator(".reto-opcion:disabled").count()).toBe(4);
  expect(await estrellas(page)).toBe(antes + 1);
  await page.evaluate((v) => responderReto(v, document.querySelector(".reto-opcion")), primera.respuesta);
  expect(await page.evaluate(() => [retoEnJuego.bien, globalStars])).toEqual([1, antes + 1]);
  await expect(page.locator("#reto-sigue")).toHaveText("Siguiente");
  await expect(page.locator("#reto-sigue")).toBeFocused();
  await page.click("#reto-sigue");
  // Fallar: sin estrella, la elegida en rojo, la buena en verde y la explicación.
  await expect(page.locator("#reto-cuenta")).toHaveText("Pregunta 2 de 10");
  const segunda = await page.evaluate(() => retoEnJuego.preguntas[1]);
  const mala = segunda.opciones.find((o) => o !== segunda.respuesta);
  await page.click(`.reto-opcion[data-valor="${mala}"]`);
  await expect(page.locator("#reto-nota")).toHaveText(`Era ${segunda.respuesta}: ${segunda.a} × ${segunda.b} son ${segunda.a} filas de ${segunda.b}.`);
  await expect(page.locator(`.reto-opcion[data-valor="${mala}"]`)).toHaveClass(/ensenar-mala/);
  await expect(page.locator(`.reto-opcion[data-valor="${segunda.respuesta}"]`)).toHaveClass(/ensenar-buena/);
  expect(await page.locator(".ensenar-mala").count()).toBe(1);
  expect(await estrellas(page)).toBe(antes + 1);
  await page.click("#reto-sigue");
  for (let i = 2; i < 10; i++) {
    await expect(page.locator("#reto-cuenta")).toHaveText(`Pregunta ${i + 1} de 10`);
    const buena = await page.evaluate(() => retoEnJuego.preguntas[retoEnJuego.n - 1].respuesta);
    await page.click(`.reto-opcion[data-valor="${buena}"]`);
    await expect(page.locator("#reto-sigue")).toHaveText(i === 9 ? "Ver el resultado" : "Siguiente");
    await page.click("#reto-sigue");
  }
  // El final: 9 de 10, sin marca que vencer, y el código propio con la marca.
  await expect(page.locator("#reto-fin")).toBeVisible();
  await expect(page.locator("#reto-juego")).toBeHidden();
  await expect(page.locator("#reto-cuenta")).toBeHidden();
  await expect(page.locator("#reto-resultado")).toHaveText("Hiciste 9 de 10");
  await expect(page.locator("#reto-resultado")).toBeFocused();
  await expect(page.locator("#reto-comparacion")).toHaveText("Tu marca va en el código. ¡A ver quién la vence!");
  await expect(page.locator("#reto-estrellas")).toHaveText("Ganaste 9 estrellas.");
  await expect(page.locator("#lumi-reto > svg")).toHaveAttribute("data-expresion", "celebrando");
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("Hiciste 9 de 10. Tu marca va en el código. ¡A ver quién la vence!");
  const propio = await page.evaluate(() => retoEnJuego.codigo);
  expect(await page.evaluate((c) => leerCodigoDeReto(c), propio)).toEqual({ tablas: [2, 3, 6], semilla: await page.evaluate(() => retoEnJuego.semilla), marca: 9, codigo: propio });
  await expect(page.locator("#reto-codigo-propio")).toHaveText(`${propio.slice(0, 3)} ${propio.slice(3)}`);
  await expect(page.locator("#reto-codigo-propio")).toHaveAttribute("aria-label", propio.split("").join(" "));
  expect(await estrellas(page)).toBe(antes + 9);
  await page.click("#btn-reto-inicio");
  await expect(page.locator("#screen-selector")).toBeVisible();
});

test("en un jardín sin nada jugado, el reto nuevo es de la tabla del 2; la semilla sale al azar", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-reto");
  await expect(page.locator("#reto-crear-detalle")).toHaveText("Diez multiplicaciones de la tabla del 2.");
  await expect(page.locator("#btn-reto-crear")).toHaveAccessibleDescription("Diez multiplicaciones de la tabla del 2.");
  const semillas = await page.evaluate(() => {
    const vistas = new Set();
    for (let i = 0; i < 40; i++) { empezarRetoNuevo(); vistas.add(retoEnJuego.semilla); }
    return [...vistas];
  });
  expect(semillas.length).toBeGreaterThan(20);
  expect(semillas.every((s) => Number.isInteger(s) && s >= 0 && s <= 1023)).toBe(true);
  expect(await page.evaluate(() => retoEnJuego.tablas)).toEqual([2]);
});

test("jugar un código escrito: las mismas diez preguntas de quien lo creó, y se compara con su marca", async ({ page }) => {
  await alMenu(page);
  const c = await codigo(page, { tablas: [4, 7], semilla: 321, marca: 6 });
  await page.click("#btn-reto");
  await page.fill("#reto-codigo", c.toLowerCase());
  await page.click("#btn-reto-codigo");
  await expect(page.locator("#reto-juego")).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(retoEnJuego.preguntas) === JSON.stringify(preguntasDeReto([4, 7], 321)))).toBe(true);
  expect(await page.evaluate(() => retoEnJuego.marca)).toBe(6);
  await jugar(page, 8);
  await expect(page.locator("#reto-resultado")).toHaveText("Hiciste 8 de 10");
  await expect(page.locator("#reto-comparacion")).toHaveText("¡Superaste la marca de 6!");
  await expect(page.locator("#lumi-reto > svg")).toHaveAttribute("data-expresion", "celebrando");
  // El código propio: el mismo reto, con la marca nueva (para la revancha).
  expect(await page.evaluate(() => leerCodigoDeReto(retoEnJuego.codigo))).toMatchObject({ tablas: [4, 7], semilla: 321, marca: 8 });
});

test("empate, marca no alcanzada y cero aciertos: cada final dice lo suyo, sin regaños", async ({ page }) => {
  await alMenu(page);
  const empezar = async (marca) => page.evaluate((m) => { mostrarRetos(); piezaReto("codigo").value = codigoDeReto({ tablas: [2, 3], semilla: 9, marca: m }); jugarCodigoDeReto(); }, marca);
  await empezar(7);
  await jugar(page, 7);
  await expect(page.locator("#reto-comparacion")).toHaveText("¡Empate! La marca también era 7.");
  await expect(page.locator("#lumi-reto > svg")).toHaveAttribute("data-expresion", "celebrando");
  await empezar(7);
  await jugar(page, 1);
  await expect(page.locator("#reto-comparacion")).toHaveText("La marca era 7. ¡Pide la revancha!");
  await expect(page.locator("#reto-estrellas")).toHaveText("Ganaste 1 estrella.");
  await expect(page.locator("#lumi-reto > svg")).toHaveAttribute("data-expresion", "animando");
  await empezar(0);
  await jugar(page, 0);
  await expect(page.locator("#reto-resultado")).toHaveText("Hiciste 0 de 10");
  await expect(page.locator("#reto-comparacion")).toHaveText("¡Empate! La marca también era 0.");
  await expect(page.locator("#reto-estrellas")).toBeHidden();
  expect(await page.evaluate(() => leerCodigoDeReto(retoEnJuego.codigo).marca)).toBe(0);
});

test("«Jugar otra vez»: las mismas diez contra la misma marca", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => { mostrarRetos(); piezaReto("codigo").value = codigoDeReto({ tablas: [5, 9], semilla: 44, marca: 5 }); jugarCodigoDeReto(); });
  const antes = await page.evaluate(() => JSON.stringify(retoEnJuego.preguntas));
  await jugar(page, 3);
  await page.click("#btn-reto-otra");
  await expect(page.locator("#reto-juego")).toBeVisible();
  await expect(page.locator("#reto-fin")).toBeHidden();
  await expect(page.locator("#reto-cuenta")).toHaveText("Pregunta 1 de 10");
  expect(await page.evaluate(() => [JSON.stringify(retoEnJuego.preguntas), retoEnJuego.marca, retoEnJuego.bien, retoEnJuego.n])).toEqual([antes, 5, 0, 1]);
});

test("un código que no es de un reto se dice con claridad y deja corregirlo", async ({ page }) => {
  await alMenu(page);
  await page.click("#btn-reto");
  await page.fill("#reto-codigo", "ABC");
  await page.click("#btn-reto-codigo");
  await expect(page.locator("#reto-error")).toHaveText("Ese código no es de un reto. Revísalo signo por signo: son 6 letras y números.");
  await expect(page.locator("#reto-codigo")).toBeFocused();
  await expect(page.locator("#reto-inicio")).toBeVisible();
  expect(await page.evaluate(() => retoEnJuego)).toBeNull();
  // Con Intro también se manda, y al volver a entrar el error ya no está.
  await page.fill("#reto-codigo", await codigo(page, { tablas: [2], semilla: 1, marca: 10 }));
  await page.press("#reto-codigo", "Enter");
  await expect(page.locator("#reto-juego")).toBeVisible();
  await page.evaluate(() => mostrarRetos());
  await expect(page.locator("#reto-error")).toBeHidden();
  await expect(page.locator("#reto-codigo")).toHaveValue("");
});

test("el enlace: tras la bienvenida abre el reto con lo que trae, y la dirección queda limpia", async ({ page }) => {
  await page.goto("./");
  const c = await codigo(page, { tablas: [2, 5], semilla: 77, marca: 8 });
  await page.goto(`./?reto=${c}`);
  expect(new URL(page.url()).search).toBe("");
  await expect(page.locator("#screen-welcome")).toBeVisible();   // primero, quién juega
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-reto")).toBeVisible();
  await expect(page.locator("#reto-llego")).toHaveText("¡Te llegó un reto! Son diez multiplicaciones de las tablas del 2 y del 5. La marca a vencer: 8 de 10.");
  await expect(page.locator("#reto-codigo")).toHaveValue("NKW K4S");
  await expect(page.locator("#btn-reto-codigo")).toBeFocused();
  // Con un reto recibido, jugarlo va antes que crear uno; sin él, al revés.
  const orden = () => page.evaluate(() => [...document.querySelectorAll("#reto-inicio > section, #reto-inicio > form")].map((e) => e.id));
  expect(await orden()).toEqual(["reto-form", "reto-crear"]);
  await page.evaluate(() => mostrarRetos());
  expect(await orden()).toEqual(["reto-crear", "reto-form"]);
  await page.evaluate(() => mostrarRetos("NKWK4S"));
  await page.click("#btn-reto-codigo");
  expect(await page.evaluate(() => [retoEnJuego.tablas, retoEnJuego.semilla, retoEnJuego.marca])).toEqual([[2, 5], 77, 8]);
  // Solo se abre una vez: al volver al inicio ya no reaparece.
  await page.evaluate(() => backToSelector());
  await expect(page.locator("#screen-selector")).toBeVisible();
  expect(await page.evaluate(() => retoPendiente)).toBeNull();
});

test("un enlace con un código dañado lo dice y no rompe nada; uno larguísimo se recorta", async ({ page }) => {
  await alMenu(page, "./?reto=NKWK4T");
  await expect(page.locator("#screen-reto")).toBeVisible();
  await expect(page.locator("#reto-error")).toHaveText("El código del enlace no es de un reto. Pide que te lo manden otra vez.");
  await expect(page.locator("#reto-llego")).toBeHidden();
  await expect(page.locator("#reto-codigo")).toHaveValue("NKWK4T");
  await page.goto(`./?reto=${"<b>x</b>".repeat(50)}`);
  expect(await page.evaluate(() => retoPendiente)).toHaveLength(20);
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-reto")).toBeVisible();
  expect(await page.locator("#screen-reto b").count()).toBe(0);   // se escribe como texto, nunca como HTML
  // Sin ?reto no hay nada pendiente.
  await page.goto("./?otra=1");
  expect(await page.evaluate(() => retoPendiente)).toBeNull();
  expect(new URL(page.url()).search).toBe("?otra=1");
});

test("copiar: el mensaje lleva la marca, las tablas, el código y el enlace, y ningún nombre", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await alMenu(page);
  await page.evaluate(() => { mostrarRetos(); piezaReto("codigo").value = codigoDeReto({ tablas: [2, 5], semilla: 77, marca: 3 }); jugarCodigoDeReto(); });
  await jugar(page, 8);
  await page.click("#btn-reto-copiar");
  await expect(page.locator("#reto-copiado")).toHaveText("Copiado. Pégalo en un mensaje.");
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  const base = await page.evaluate(() => location.origin + location.pathname);
  expect(copiado).toBe(`¡Te reto en el Jardín Mágico! Hice 8 de 10 en las tablas del 2 y del 5. Código: NKW K4S\n${base}?reto=NKWK4S`);
  expect(copiado).not.toContain("Ana");
  // El enlace copiado abre este mismo reto, con la marca nueva.
  expect(await page.evaluate(() => leerCodigoDeReto("NKWK4S").marca)).toBe(8);
});

test("si no se puede copiar, se dicta el código; «Compartir» solo sale donde el aparato lo ofrece", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("no")) }, configurable: true });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    mostrarRetos(); piezaReto("codigo").value = codigoDeReto({ tablas: [2, 5], semilla: 77, marca: 3 }); jugarCodigoDeReto();
  });
  await jugar(page, 8);
  await expect(page.locator("#btn-reto-compartir")).toBeHidden();
  await expect(page.locator("#btn-reto-copiar")).toHaveClass(/col-span-2/);
  await page.click("#btn-reto-copiar");
  await expect(page.locator("#reto-copiado")).toHaveText("No se pudo copiar. Dicta el código: NKW K4S.");
  // Con hoja de compartir: se le pasa el texto y el enlace, y cerrarla no rompe nada.
  await page.evaluate(() => {
    window.__compartido = [];
    Object.defineProperty(navigator, "share", { value: (datos) => { window.__compartido.push(datos); return Promise.reject(new Error("cerrada")); }, configurable: true });
    repetirReto();
  });
  await jugar(page, 10);
  await expect(page.locator("#reto-copiado")).toHaveText("");   // el aviso de la vez anterior no se queda
  await expect(page.locator("#btn-reto-compartir")).toBeVisible();
  await expect(page.locator("#btn-reto-copiar")).not.toHaveClass(/col-span-2/);
  await page.click("#btn-reto-compartir");
  const base = await page.evaluate(() => location.origin + location.pathname);
  const c10 = await codigo(page, { tablas: [2, 5], semilla: 77, marca: 10 });
  expect(await page.evaluate(() => window.__compartido)).toEqual([{ title: "Reto del Jardín Mágico",
    text: `¡Te reto en el Jardín Mágico! Hice 10 de 10 en las tablas del 2 y del 5. Código: ${c10.slice(0, 3)} ${c10.slice(3)}`, url: `${base}?reto=${c10}` }]);
  await expect(page.locator("#reto-fin")).toBeVisible();
});

test("cuenta para la meta del día y no toca el jardín, el mapa ni lo guardado del perfil", async ({ page }) => {
  await alMenu(page);
  const antes = await page.evaluate(() => [JSON.stringify(hechos), Object.keys(localStorage).sort().join()]);
  await page.evaluate(() => { mostrarRetos(); empezarRetoNuevo(); });
  await jugar(page, 4);
  expect(await page.evaluate(() => misionDeHoy().cuenta)).toBe(4);
  // Lo único nuevo que guarda es su cuenta para las personas adultas (pruebas/adultos-actividad.spec.mjs).
  expect(await page.evaluate(() => JSON.parse(almacen.leer("actividad")).retos)).toMatchObject({ creados: 1, aciertos: 4, preguntas: 10 });
  const despues = await page.evaluate(() => [JSON.stringify(hechos), Object.keys(localStorage).filter((k) => !/misiones|estrellas|actividad/.test(k)).sort().join()]);
  expect(despues[0]).toBe(antes[0]);
  expect(despues[1]).toBe(antes[1].split(",").filter((k) => !/misiones|estrellas|actividad/.test(k)).join());
});

test("Escape vuelve al inicio, y salir a medias no deja nada pendiente", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "el teclado físico es de escritorio");
  await alMenu(page);
  await page.evaluate(() => { mostrarRetos(); empezarRetoNuevo(); });
  await expect(page.locator("#reto-juego")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#screen-selector")).toBeVisible();
  await page.click("#btn-reto");
  await expect(page.locator("#reto-inicio")).toBeVisible();
  await expect(page.locator("#reto-juego")).toBeHidden();
  await expect(page.locator("#reto-cuenta")).toBeHidden();
  expect(await page.evaluate(() => retoEnJuego)).toBeNull();
});

test("cabe en el teléfono, con botones de 44 px, y pasa la revisión de accesibilidad en sus tres partes", async ({ page }, testInfo) => {
  await alMenu(page);
  const revisar = async (parte) => {
    const medidas = await page.evaluate(() => ({
      ancho: document.documentElement.clientWidth, total: document.documentElement.scrollWidth,
      chicos: [...document.querySelectorAll("#screen-reto button, #screen-reto input")].filter((e) => e.offsetParent !== null && !e.classList.contains("btn-volver"))
        .filter((e) => e.getBoundingClientRect().height < 44 || e.getBoundingClientRect().right > document.documentElement.clientWidth).map((e) => e.id || e.className),
    }));
    expect(medidas.total, parte).toBeLessThanOrEqual(medidas.ancho);
    expect(medidas.chicos, parte).toEqual([]);
    const axe = await new AxeBuilder({ page }).include("#screen-reto").analyze();
    expect(axe.violations.map((v) => v.id), `${testInfo.project.name}: ${parte}`).toEqual([]);
  };
  await page.click("#btn-reto");
  await page.fill("#reto-codigo", "ABC");
  await page.click("#btn-reto-codigo");
  await revisar("inicio con error");
  await page.evaluate(() => { piezaReto("codigo").value = codigoDeReto({ tablas: [8, 9], semilla: 5, marca: 9 }); jugarCodigoDeReto(); });
  await revisar("pregunta");
  await responder(page, false);
  await page.evaluate(() => { const q = retoEnJuego.preguntas[retoEnJuego.n - 1]; responderReto(q.opciones.find((o) => o !== q.respuesta), document.querySelector(".reto-opcion")); });
  await revisar("respondida mal");
  await page.click("#reto-sigue");
  for (let i = 2; i < 10; i++) await responder(page, true);
  await revisar("final");
});

test.describe("con el mundo a la vista", () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] } });
  test("se entra desde el botón bajo el mundo, y un reto cancela la expedición en curso", async ({ page }) => {
    await alMenu(page);
    await expect(page.locator("#btn-reto")).toBeHidden();
    await page.click("#btn-reto-mundo");
    await expect(page.locator("#screen-reto")).toBeVisible();
    await expect(page.locator("#reto-codigo")).toHaveValue("");   // el clic no se cuela como código
    await expect(page.locator("#reto-error")).toBeHidden();
    await page.evaluate(() => { expedicion = { paso: 1 }; mostrarRetos(); });
    expect(await page.evaluate(() => expedicion)).toBeNull();
  });
});
