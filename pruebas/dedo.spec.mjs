// La Aventura, «✍️ Con el dedo»: se escribe la respuesta en un recuadro, el
// juego la reconoce y solo se lanza al tocar «¡Lanzar!».
import { test, expect } from "@playwright/test";
import { entrarATabla, preguntaActual, ponerIntentos, elegida } from "./ayudas.mjs";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-14T12:00:00"));
});

async function alNivel(page) {
  await page.goto("./");
  await page.fill("#player-name", "Leo");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.click("#screen-selector >> text=La Aventura");
  await page.evaluate(() => { aventura.manual = true; });
  await page.click('.btn-nivel[data-nivel="0-0"]');
  await page.click('#modos-aventura [data-modo="dedo"]');
}

// Cifras dibujadas de otra forma que los modelos del juego (otro sentido,
// otras proporciones, otro número de trazos). Caja de 60 × 100.
const MUESTRAS = `({
  0: [[A(30,50,26,48,-90,-450,30)], [A(30,50,30,45,200,560,30)]],
  1: [[L(34,0,26,100)], [U(L(18,14,32,0,5), L(32,0,30,100))]],
  2: [[U(A(30,28,26,26,180,360,14), L(56,28,4,100,12), L(4,100,58,96,8))], [U(A(28,25,26,24,210,380,14), L(54,32,2,98,12), L(2,98,60,100,8))]],
  3: [[U(A(30,24,24,22,200,440,16), A(30,74,28,26,280,500,16))], [A(30,25,25,25,200,450,16), A(30,75,28,25,270,510,16)]],
  4: [[L(36,0,2,64), L(2,64,60,64), L(44,20,44,100)], [U(L(10,0,6,58), L(6,58,58,58)), L(44,6,48,100)]],
  5: [[L(54,2,10,2), U(L(10,2,8,46), A(30,70,26,28,230,510,16))], [U(L(10,0,8,42), A(30,68,26,30,220,500,16)), L(10,0,54,4)]],
  6: [[U(A(46,64,40,64,265,170,14), A(30,74,26,26,170,530,22))]],
  7: [[U(L(2,4,58,0), L(58,0,24,100))], [U(L(0,0,58,2), L(58,2,30,100)), L(20,52,50,48)]],
  8: [[A(30,25,22,24,0,360,20), A(30,74,28,26,0,360,22)], [U(A(30,24,22,24,90,450,20), A(30,74,28,26,-90,270,22))]],
  9: [[A(30,28,26,28,0,-360,22), L(56,28,52,100)], [U(A(30,30,28,28,10,370,22), L(58,30,50,100,12))]],
})`;

const muestras = (page) => page.evaluate((m) => {
  const L = trazoLinea, A = trazoArco, U = unir;
  return eval(m);
}, MUESTRAS);

/** Escribe un número en la pizarra con el ratón, cifra por cifra. */
async function escribir(page, numero, lienzo = "#pizarra") {
  const m = await muestras(page);
  const caja = await page.locator(lienzo).boundingBox();
  const escala = caja.height / 200;          // el lienzo mide 480 × 200
  for (const [i, c] of [...String(numero)].entries()) {
    for (const trazo of m[c][0]) {
      const pts = trazo.map((p) => ({ x: caja.x + (40 + i * 110 + p.x * 1.4) * escala, y: caja.y + (30 + p.y * 1.4) * escala }));
      await page.mouse.move(pts[0].x, pts[0].y);
      await page.mouse.down();
      for (const p of pts.slice(1)) await page.mouse.move(p.x, p.y);
      await page.mouse.up();
    }
  }
}

test("el reconocedor acierta casi siempre con cifras escritas de otra forma, torcidas y temblorosas", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate((m) => {
    const L = trazoLinea, A = trazoArco, U = unir;
    const muestras = eval(m);
    let semilla = 3;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    const torcer = (trazos) => {
      const inclina = (azar() - 0.3) * 0.3, ancho = 0.8 + azar() * 0.5;
      return trazos.map((t) => t.map((p) => ({ x: (p.x + inclina * (50 - p.y)) * ancho * 2 + (azar() - 0.5) * 4, y: p.y * 2 + (azar() - 0.5) * 4 })));
    };
    let bien = 0, total = 0;
    const porCifra = {};
    for (const [c, variantes] of Object.entries(muestras)) {
      for (const v of variantes) for (let k = 0; k < 20; k++) {
        total++;
        const ok = reconocerCifra(torcer(v)) === Number(c);
        if (ok) bien++;
        porCifra[c] = (porCifra[c] || 0) + (ok ? 0 : 1);
      }
    }
    return { tasa: bien / total, porCifra };
  }, MUESTRAS);
  expect(r.tasa).toBeGreaterThanOrEqual(0.95);
  for (const fallos of Object.values(r.porCifra)) expect(fallos).toBeLessThanOrEqual(8);   // ninguna cifra falla demasiado
});

test("los números de varias cifras se separan por dónde están", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate((m) => {
    const L = trazoLinea, A = trazoArco, U = unir;
    const s = eval(m);
    const mover = (tr, dx) => tr.map((t) => t.map((p) => ({ x: p.x + dx, y: p.y })));
    const num = (...cs) => cs.flatMap((v, i) => mover(v, i * 85));
    return [num(s[5][0], s[6][0]), num(s[4][0], s[2][0]), num(s[1][0], s[0][0], s[8][0]), num(s[4][1], s[5][1])].map(reconocerNumero)
      .concat([reconocerNumero([])]);
  }, MUESTRAS);
  expect(r).toEqual([56, 42, 108, 45, null]);
});

test("con el dedo: se ve lo reconocido y se lanza solo al tocar «¡Lanzar!»", async ({ page }) => {
  await alNivel(page);
  await expect(page.locator("#pizarra")).toBeVisible();
  await expect(page.locator("#aventura-teclado")).toBeHidden();
  await expect(page.locator('#modos-aventura [data-modo="dedo"]')).toHaveAttribute("aria-pressed", "true");
  const respuesta = await page.evaluate(() => enemigoObjetivo().op.respuesta);
  await escribir(page, respuesta);
  await expect(page.locator("#aventura-escrito")).toHaveText(String(respuesta));
  await expect(page.locator("#pizarra-ayuda")).toHaveText(`¿Escribiste ${respuesta}? Toca «¡Lanzar!». Si no, bórralo.`);
  expect(await page.evaluate(() => aventura.enemigos.length)).toBe(1);   // aún no se lanzó
  await page.click("#pizarra-lanzar");
  expect(await page.evaluate(() => [aventura.enemigos.length, aventura.puntos > 0])).toEqual([0, true]);
  await expect(page.locator("#aventura-escrito")).toHaveText("");
  expect(await page.evaluate(() => pizarra.trazos.length)).toBe(0);      // la pizarra queda limpia
});

test("lo mal reconocido no cuesta un corazón: se borra y se escribe otra vez", async ({ page }) => {
  await alNivel(page);
  const respuesta = await page.evaluate(() => enemigoObjetivo().op.respuesta);
  const otro = respuesta === 7 ? 3 : 7;
  await escribir(page, otro);
  await expect(page.locator("#aventura-escrito")).toHaveText(String(otro));
  await page.click("#pizarra-borrar");
  await expect(page.locator("#aventura-escrito")).toHaveText("");
  await expect(page.locator("#pizarra-ayuda")).toHaveText("Escribe la respuesta con el dedo.");
  expect(await page.evaluate(() => [aventura.corazones, aventura.enemigos.length])).toEqual([3, 1]);
  // Con el teclado: Enter lanza, como «¡Lanzar!» (si el foco no está en otro botón).
  await page.evaluate(() => document.activeElement.blur());
  await escribir(page, respuesta);
  await expect(page.locator("#aventura-escrito")).toHaveText(String(respuesta));
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => aventura.enemigos.length)).toBe(0);
});

test("lanzar sin esperar al reconocimiento también vale; sin nada escrito, no hace nada", async ({ page }) => {
  await alNivel(page);
  await page.click("#pizarra-lanzar");
  expect(await page.evaluate(() => [aventura.corazones, aventura.enemigos.length])).toEqual([3, 1]);
  const respuesta = await page.evaluate(() => enemigoObjetivo().op.respuesta);
  await page.evaluate(() => { const real = setTimeout; window.setTimeout = (f, ms) => (ms === 450 ? 0 : real(f, ms)); });
  await escribir(page, respuesta);
  await expect(page.locator("#aventura-escrito")).toHaveText("");          // aún sin leer
  await page.click("#pizarra-lanzar");
  expect(await page.evaluate(() => aventura.enemigos.length)).toBe(0);
});

test("el modo con el dedo se recuerda, y uno desconocido vuelve a teclear", async ({ page }) => {
  await alNivel(page);
  expect(await page.evaluate(() => JSON.parse(almacen.leer("aventura")).modo)).toBe("dedo");
  const r = await page.evaluate(() => {
    cargarAventura();
    const a = aventura.modo;
    almacen.guardar("aventura", JSON.stringify({ modo: "volar" }));
    cargarAventura();
    return [a, aventura.modo];
  });
  expect(r).toEqual(["dedo", "teclear"]);
  await page.click('#modos-aventura [data-modo="teclear"]');
  await expect(page.locator("#aventura-pizarra")).toBeHidden();
  await expect(page.locator("#aventura-teclado")).toBeVisible();
});

// --- En el juego: al responder escribiendo, también con el dedo ---

/** La tabla del 3 con todo acertado una vez: todas las preguntas se escriben. */
async function tablaQueSeEscribe(page) {
  await page.goto("./");
  for (let b = 1; b <= 10; b++) await ponerIntentos(page, `3x${b}`, [elegida("2026-11-01")]);
  await entrarATabla(page, 3);
  await expect(page.locator("#escritura")).toBeVisible();
}

test("en el juego se puede escribir con el dedo: lo leído se ve y cuenta al tocar «Listo»", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await expect(page.locator("#teclado-juego")).toBeVisible();          // de serie, con teclas
  await expect(page.locator("#btn-letra")).toHaveText("✍️ Mejor con el dedo");
  await page.click("#btn-letra");
  await expect(page.locator("#teclado-juego")).toBeHidden();
  await expect(page.locator("#pizarra-juego")).toBeVisible();
  await expect(page.locator("#btn-letra")).toHaveText("🔢 Mejor con teclas");
  const { a, b, producto } = await preguntaActual(page);
  await escribir(page, producto, "#pizarra-juego");
  await expect(page.locator("#escrito")).toHaveText(String(producto));
  await expect(page.locator("#pizarra-juego-ayuda")).toHaveText(`¿Escribiste ${producto}? Toca «Listo». Si no, bórralo.`);
  expect(await page.evaluate(() => espera)).toBeNull();                  // aún no se respondió
  await page.click("#pizarra-juego-listo");
  await expect(page.locator("#escrito")).toContainText("✓");
  await expect(page.locator("#game-feedback")).toContainText(`${a} × ${b} = ${producto}`);
  // Cuenta como respuesta escrita, igual que con teclas.
  expect(await page.evaluate(([x, y]) => intentosDe(x, y).at(-1).m, [a, b])).toBe("e");
  // La siguiente pregunta empieza con el recuadro limpio y sigue con el dedo.
  await page.locator("#btn-siguiente:not([disabled])").click();
  expect(await page.evaluate(() => pizarraJuego.trazos.length)).toBe(0);
  await expect(page.locator("#pizarra-juego")).toBeVisible();
});

test("en el juego, lo mal leído se borra sin contar como error", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await page.click("#btn-letra");
  const { a, b, producto } = await preguntaActual(page);
  const otro = producto === 7 ? 4 : 7;
  await escribir(page, otro, "#pizarra-juego");
  await expect(page.locator("#escrito")).toHaveText(String(otro));
  await page.click("#pizarra-juego-borrar");
  await expect(page.locator("#escrito")).toHaveText("");
  expect(await page.evaluate(([x, y]) => intentosDe(x, y).length, [a, b])).toBe(1);   // solo el de antes
  // Con nada escrito, «Listo» no responde.
  await page.click("#pizarra-juego-listo");
  expect(await page.evaluate(() => espera)).toBeNull();
});

test("en el juego, más de dos cifras no se toma: pide borrarlo", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await page.click("#btn-letra");
  await escribir(page, 108, "#pizarra-juego");
  await expect(page.locator("#pizarra-juego-ayuda")).toHaveText("Son demasiadas cifras: bórralo y escribe un número de dos cifras como mucho.");
  await expect(page.locator("#escrito")).toHaveText("");
});

test("cada jugador recuerda si escribe con teclas o con el dedo, y lo guarda la copia", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await page.click("#btn-letra");
  expect(await page.evaluate(() => JSON.parse(almacen.leer("letra")))).toEqual({ modo: "dedo" });
  expect(await page.evaluate(() => Object.keys(armarCopia().datos[perfilActual]))).toContain("letra");
  const r = await page.evaluate(() => {
    cargarLetra();
    const a = letra.modo;
    almacen.guardar("letra", "{roto");
    cargarLetra();
    return [a, letra.modo];
  });
  expect(r).toEqual(["dedo", "teclas"]);
});

test("en el juego, con el dedo, las cifras del teclado físico no escriben y Enter responde", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "teclado físico");
  await tablaQueSeEscribe(page);
  await page.click("#btn-letra");
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press("5");
  await expect(page.locator("#escrito")).toHaveText("");
  const { producto } = await preguntaActual(page);
  await escribir(page, producto, "#pizarra-juego");
  await expect(page.locator("#escrito")).toHaveText(String(producto));
  await page.keyboard.press("Enter");
  await expect(page.locator("#escrito")).toContainText("✓");
});

test("en el juego, «Listo» antes de que termine la lectura también vale", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await page.click("#btn-letra");
  await page.evaluate(() => { const real = setTimeout; window.setTimeout = (f, ms) => (ms === 450 ? 0 : real(f, ms)); });
  const { producto } = await preguntaActual(page);
  await escribir(page, producto, "#pizarra-juego");
  await expect(page.locator("#escrito")).toHaveText("");                  // aún sin leer
  await page.click("#pizarra-juego-listo");
  await expect(page.locator("#escrito")).toContainText("✓");
});
