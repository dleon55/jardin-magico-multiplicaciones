// Antes de multiplicar (Hito 6.7): contar a saltos, grupos iguales y dobles,
// con dibujo y para elegir entre tres. Para quien aún no llega a las tablas:
// se ofrece en el tono Brote.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { instalarDobles } from "./ayudas.mjs";

const MUNDO = { cookies: [], origins: [{ origin: "http://localhost:4173", localStorage: [{ name: "jardin:guia", value: "1" }] }] };

async function entrar(page, tono) {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await page.goto("./");
  if (tono) await page.click(`#screen-welcome .elegir-tono label:has(input[value="${tono}"])`);
  await page.fill("#player-name", "Ana");
  await page.evaluate(() => almacen.guardar("diagnostico", "saltado"));
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await expect(page.locator("#screen-selector")).toBeVisible();
}
/** Abre una ronda con preguntas fijas: [clase, a, b]. */
const ronda = (page, fijas) => page.evaluate((fijas) => {
  mostrarSemillero();
  semillero.preguntas = fijas.map(([clase, a, b]) => preguntaDeSemillero(clase, a, b));
  semillero.n = 0;
  siguienteDeSemillero();
}, fijas);
const SEIS = [["contar", 2, 3], ["grupos", 3, 4], ["doble", 4], ["contar", 5, 4], ["grupos", 2, 5], ["doble", 7]];

test.describe("las preguntas", () => {
  test.beforeEach(async ({ page }) => { await page.goto("./"); });

  test("contar a saltos: lo que sigue, con los tropiezos explicados", async ({ page }) => {
    const p = await page.evaluate(() => preguntaDeSemillero("contar", 2, 3));
    expect(p.texto).toBe("2, 4, 6, ¿?");
    expect(p.voz).toBe("De 2 en 2: 2, 4, 6. ¿Qué sigue?");
    expect(p.respuesta).toBe(8);
    expect([...p.opciones].sort((x, y) => x - y)).toEqual([7, 8, 10]);
    expect(p.porQue[7]).toBe("7 es contar de uno en uno. Aquí se salta de 2 en 2: 6 y 2 más son 8.");
    expect(p.porQue[10]).toBe("10 es un salto de más. Después de 6 va 8.");
    expect(p.explicacion).toBe("De 2 en 2: 2, 4, 6, 8.");
    expect(p.dibujo).toBe("");
    const q = await page.evaluate(() => preguntaDeSemillero("contar", 10, 4));
    expect([q.texto, q.respuesta]).toEqual(["10, 20, 30, 40, ¿?", 50]);
  });

  test("grupos iguales: filas de puntos dibujadas, y sumar los dos números no es", async ({ page }) => {
    const p = await page.evaluate(() => preguntaDeSemillero("grupos", 3, 4));
    expect(p.texto).toBe("3 filas de 4. ¿Cuántos hay?");
    expect(p.respuesta).toBe(12);
    expect([...p.opciones].sort((x, y) => x - y)).toEqual([7, 12, 16]);
    expect(p.porQue[7]).toBe("3 + 4 es juntar los dos números. Son 3 filas de 4: cuenta todas.");
    expect(p.porQue[16]).toBe("16 es una fila de más. Hay 3 filas de 4: 12.");
    expect(p.dibujo).toContain('aria-label="3 filas de 4 puntos"');
    expect((p.dibujo.match(/<circle/g) || []).length).toBe(12);
    expect((p.dibujo.match(/<rect/g) || []).length).toBe(3);
    // 2 filas de 2: sumar da lo mismo que la buena, así que esa falsa no sale.
    const q = await page.evaluate(() => preguntaDeSemillero("grupos", 2, 2));
    expect([...q.opciones].sort((x, y) => x - y)).toEqual([2, 4, 6]);
    expect(q.porQue[2]).toBe("2 es una fila de menos. Hay 2 filas de 2: 4.");
  });

  test("el doble: dos filas iguales", async ({ page }) => {
    const p = await page.evaluate(() => preguntaDeSemillero("doble", 4));
    expect([p.texto, p.voz, p.respuesta]).toEqual(["El doble de 4", "¿Cuál es el doble de 4?", 8]);
    expect([...p.opciones].sort((x, y) => x - y)).toEqual([5, 6, 8]);
    expect(p.porQue[6]).toBe("6 es 4 y 2 más. El doble es 4 y otros 4: 8.");
    expect(p.porQue[5]).toBe("5 es solo uno más. El doble es 4 y otros 4: 8.");
    expect(p.dibujo).toContain('aria-label="2 filas de 4 puntos"');
    expect((p.dibujo.match(/<circle/g) || []).length).toBe(8);
    // El doble de 2: «2 y 2 más» da lo mismo que la buena.
    const q = await page.evaluate(() => preguntaDeSemillero("doble", 2));
    expect([...q.opciones].sort((x, y) => x - y)).toEqual([3, 4, 6]);
  });

  test("mil rondas: seis preguntas, dos de cada clase, sin repetir, con tres opciones distintas y la buena entre ellas", async ({ page }) => {
    const fallas = await page.evaluate(() => {
      const malas = [];
      for (let i = 0; i < 1000; i++) {
        const r = rondaDeSemillero();
        const clases = r.map((p) => p.clase).sort().join();
        if (r.length !== 6 || clases !== "contar,contar,doble,doble,grupos,grupos") malas.push(`clases ${clases}`);
        if (new Set(r.map((p) => p.texto)).size !== 6) malas.push(`repetida: ${r.map((p) => p.texto).join(" | ")}`);
        for (const p of r) {
          if (p.opciones.length !== 3 || new Set(p.opciones).size !== 3 || !p.opciones.includes(p.respuesta) || p.opciones.some((o) => o <= 0)) malas.push(`opciones de «${p.texto}»: ${p.opciones}`);
          if (p.opciones.filter((o) => o !== p.respuesta).some((o) => !p.porQue[o])) malas.push(`sin explicación en «${p.texto}»`);
          if (p.respuesta > 100) malas.push(`muy grande: ${p.texto}`);
        }
      }
      return [...new Set(malas)].slice(0, 5);
    });
    expect(fallas).toEqual([]);
  });

  test("la ronda sale mezclada: no empieza siempre por la misma clase", async ({ page }) => {
    const primeras = await page.evaluate(() => { const s = new Set(); for (let i = 0; i < 60; i++) s.add(rondaDeSemillero()[0].clase); return [...s].sort(); });
    expect(primeras).toEqual(["contar", "doble", "grupos"]);
  });

  test("la buena no cae siempre en el mismo botón", async ({ page }) => {
    const lugares = await page.evaluate(() => { const s = new Set(); for (let i = 0; i < 60; i++) { const p = preguntaDeSemillero("grupos", 3, 4); s.add(p.opciones.indexOf(p.respuesta)); } return [...s].sort(); });
    expect(lugares).toEqual([0, 1, 2]);
  });
});

test.describe("con el mundo a la vista", () => {
  test.use({ storageState: MUNDO });

  test("en Brote está bajo el mundo (en el sitio de los retos con código); en Explora, no", async ({ page }) => {
    await entrar(page, "brote");
    await expect(page.locator("#btn-semillero-mundo")).toBeVisible();
    expect(await page.locator("#mundo-extras button").allTextContents()).toEqual(["La Aventura", "En equipo", "Enséñale a Lumi", "Antes de multiplicar"]);
    await page.click("#btn-semillero-mundo");
    await expect(page.locator("#screen-semillero")).toBeVisible();
    await page.evaluate(() => { backToSelector(); perfilEnUso().tono = "explora"; mostrarPantalla("screen-selector"); });
    await expect(page.locator("#btn-semillero-mundo")).toHaveCount(0);
    await expect(page.locator("#btn-reto-mundo")).toBeVisible();
  });
});

test("en la lista, el botón solo se ve en Brote", async ({ page }) => {
  await entrar(page, "explora");
  await expect(page.locator("#btn-semillero")).toBeHidden();
  await page.evaluate(() => { perfilEnUso().tono = "brote"; document.body.dataset.tono = "brote"; });
  await expect(page.locator("#btn-semillero")).toBeVisible();
  await page.click("#btn-semillero");
  await expect(page.locator("#screen-semillero")).toBeVisible();
});

test("una ronda entera: seis preguntas, una oportunidad cada una, con voz, estrellas y la meta del día", async ({ page }) => {
  await entrar(page, "brote");
  await ronda(page, SEIS);
  await expect(page.locator("#semillero-cuenta")).toHaveText("1 de 6");
  await expect(page.locator("#semillero-pregunta")).toHaveText("2, 4, 6, ¿?");
  await expect(page.locator("#semillero-pregunta")).toBeFocused();
  await expect(page.locator(".semillero-opcion")).toHaveCount(3);
  await expect(page.locator("#semillero-dibujo")).toBeHidden();   // contar no lleva dibujo
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("De 2 en 2: 2, 4, 6. ¿Qué sigue?");
  const antes = await page.evaluate(() => [globalStars, misionDeHoy().cuenta]);
  // Acertar.
  await page.click('.semillero-opcion[data-valor="8"]');
  await expect(page.locator("#semillero-nota")).toHaveText("¡Bien! De 2 en 2: 2, 4, 6, 8.");
  await expect(page.locator('.semillero-opcion[data-valor="8"]')).toHaveClass(/ensenar-buena/);
  expect(await page.locator(".semillero-opcion:disabled").count()).toBe(3);
  await expect(page.locator("#lumi-semillero > svg")).toHaveAttribute("data-expresion", "celebrando");
  expect(await page.evaluate(() => [globalStars, misionDeHoy().cuenta])).toEqual([antes[0] + 1, antes[1] + 1]);
  // No se puede responder dos veces.
  await page.evaluate(() => responderSemillero(8, document.querySelector(".semillero-opcion")));
  expect(await page.evaluate(() => [semillero.bien, globalStars])).toEqual([1, antes[0] + 1]);
  await expect(page.locator("#semillero-sigue")).toHaveText("Siguiente");
  await expect(page.locator("#semillero-sigue")).toBeFocused();
  await page.click("#semillero-sigue");
  // Fallar: la explicación de ese tropiezo, la buena en verde y la elegida en rojo, sin estrella.
  await expect(page.locator("#semillero-pregunta")).toHaveText("3 filas de 4. ¿Cuántos hay?");
  await expect(page.locator("#semillero-dibujo svg")).toBeVisible();
  await page.click('.semillero-opcion[data-valor="7"]');
  await expect(page.locator("#semillero-nota")).toHaveText("3 + 4 es juntar los dos números. Son 3 filas de 4: cuenta todas.");
  await expect(page.locator('.semillero-opcion[data-valor="7"]')).toHaveClass(/ensenar-mala/);
  await expect(page.locator('.semillero-opcion[data-valor="12"]')).toHaveClass(/ensenar-buena/);
  await expect(page.locator("#lumi-semillero > svg")).toHaveAttribute("data-expresion", "animando");
  expect(await page.evaluate(() => globalStars)).toBe(antes[0] + 1);
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toContain("juntar los dos números");
  await page.click("#semillero-sigue");
  for (let i = 3; i <= 6; i++) {
    await expect(page.locator("#semillero-cuenta")).toHaveText(`${i} de 6`);
    const buena = await page.evaluate(() => semillero.preguntas[semillero.n - 1].respuesta);
    await page.click(`.semillero-opcion[data-valor="${buena}"]`);
    await expect(page.locator("#semillero-sigue")).toHaveText(i === 6 ? "Terminar" : "Siguiente");
    await page.click("#semillero-sigue");
  }
  // El final.
  await expect(page.locator("#semillero-pregunta")).toHaveText("Acertaste 5 de 6. ¡Vas muy bien!");
  await expect(page.locator("#semillero-nota")).toHaveText("Ganaste 5 estrellas.");
  await expect(page.locator("#semillero-cuenta")).toBeHidden();
  await expect(page.locator(".semillero-opcion")).toHaveCount(0);
  await expect(page.locator("#semillero-dibujo")).toBeHidden();
  expect(await page.evaluate(() => window.__dicho.at(-1).texto)).toBe("Acertaste 5 de 6. ¡Vas muy bien!");
  await expect(page.locator("#semillero-sigue")).toHaveText("Volver al inicio");
  await page.click("#semillero-sigue");
  await expect(page.locator("#screen-selector")).toBeVisible();
});

test("los otros finales: todas bien, ninguna, y una sola estrella", async ({ page }) => {
  await entrar(page, "brote");
  const jugar = async (aciertos) => {
    await ronda(page, SEIS);
    for (let i = 0; i < 6; i++) {
      const p = await page.evaluate(() => semillero.preguntas[semillero.n - 1]);
      await page.click(`.semillero-opcion[data-valor="${i < aciertos ? p.respuesta : p.opciones.find((o) => o !== p.respuesta)}"]`);
      await page.click("#semillero-sigue");
    }
  };
  await jugar(6);
  await expect(page.locator("#semillero-pregunta")).toHaveText("¡Todas! Ya casi estás para las tablas.");
  await expect(page.locator("#lumi-semillero > svg")).toHaveAttribute("data-expresion", "celebrando");
  await jugar(0);
  await expect(page.locator("#semillero-pregunta")).toHaveText("Hoy costó. Mira los dibujos con calma y prueba otra vez.");
  await expect(page.locator("#semillero-nota")).toHaveText("");
  await expect(page.locator("#lumi-semillero > svg")).toHaveAttribute("data-expresion", "animando");
  await jugar(1);
  await expect(page.locator("#semillero-nota")).toHaveText("Ganaste 1 estrella.");
});

test("no toca el jardín ni el mapa, y Escape vuelve al inicio", async ({ page }, testInfo) => {
  await entrar(page, "brote");
  const antes = await page.evaluate(() => JSON.stringify(hechos));
  await ronda(page, SEIS);
  await page.click('.semillero-opcion[data-valor="8"]');
  expect(await page.evaluate(() => JSON.stringify(hechos))).toBe(antes);
  if (testInfo.project.name === "escritorio") {
    await page.keyboard.press("Escape");
    await expect(page.locator("#screen-selector")).toBeVisible();
  }
});

for (const [nombre, tam] of [["teléfono en vertical", { width: 360, height: 640 }], ["teléfono acostado", { width: 740, height: 360 }]]) {
  test(`cabe en un ${nombre} con el dibujo más grande, con botones de 44 px, y pasa la revisión de accesibilidad`, async ({ page }, testInfo) => {
    await page.setViewportSize(tam);
    await entrar(page, "brote");
    await ronda(page, [["grupos", 4, 5], ["doble", 9], ["contar", 10, 4], ["grupos", 2, 2], ["doble", 2], ["contar", 2, 3]]);
    const revisar = async (donde) => {
      const m = await page.evaluate(() => ({
        ancho: document.documentElement.clientWidth, total: document.documentElement.scrollWidth,
        chicos: [...document.querySelectorAll("#screen-semillero button")].filter((b) => b.offsetParent !== null && !b.classList.contains("btn-volver") && b.getBoundingClientRect().height < 44).length,
        fuera: [...document.querySelectorAll("#semillero-dibujo svg, .semillero-opcion")].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth || e.getBoundingClientRect().left < 0).length,
      }));
      expect(m.total, donde).toBeLessThanOrEqual(m.ancho);
      expect(m.chicos, donde).toBe(0);
      expect(m.fuera, donde).toBe(0);
      // El dibujo no crece sin tope: como mucho 11rem de alto y 15rem de ancho.
      const dibujo = await page.locator("#semillero-dibujo svg").boundingBox();
      if (dibujo) { expect(dibujo.height, donde).toBeLessThanOrEqual(177); expect(dibujo.width, donde).toBeLessThanOrEqual(241); }
      const axe = await new AxeBuilder({ page }).include("#screen-semillero").analyze();
      expect(axe.violations.map((v) => v.id), `${testInfo.project.name}: ${donde}`).toEqual([]);
    };
    await revisar("4 filas de 5");
    await page.click('.semillero-opcion[data-valor="9"]');
    await revisar("respondida mal");
    await page.click("#semillero-sigue");
    await revisar("el doble de 9");
  });
}
