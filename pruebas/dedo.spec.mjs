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
  expect(await page.evaluate(() => JSON.parse(almacen.leer("letra")))).toEqual({ modo: "dedo", muestras: {} });
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

// --- Aprender la letra de cada niño ---

test("aprender: una letra que se lee mal se lee bien tras una corrección, sin estropear las demás", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate((m) => {
    const L = trazoLinea, A = trazoArco, U = unir;
    const muestras = eval(m);
    let semilla = 11;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    // Letra muy deformada (ancha abajo, inclinada, aplastada): así son las malas lecturas.
    const deformar = (tr, q) => tr.map((t) => t.map((p) => {
      const sx = 1 + q.ab * (p.y / 100 - 0.5);
      return { x: (p.x - 30) * sx * q.w + q.sh * (50 - p.y) + 30, y: p.y < 50 ? p.y * q.arriba : 50 * q.arriba + (p.y - 50) * q.abajo };
    }));
    const temblor = (tr) => {
      const e = 0.9 + azar() * 0.2, sh = (azar() - 0.5) * 0.1;
      return tr.map((t) => t.map((p) => ({ x: (p.x + sh * (50 - p.y)) * e + (azar() - 0.5) * 5, y: p.y * (0.95 + azar() * 0.1) + (azar() - 0.5) * 5 })));
    };
    const estilos = [];
    for (let c = 0; c <= 9; c++) {
      for (let k = 0; k < 300 && estilos.filter((e) => e.c === c).length < 2; k++) {
        const q = { ab: (azar() - 0.5) * 1.6, w: 0.5 + azar() * 1.3, sh: (azar() - 0.3) * 0.8, arriba: 0.5 + azar(), abajo: 0.5 + azar() };
        const base = deformar(muestras[c][0], q);
        if (reconocerCifra(base) !== c) estilos.push({ c, base });
      }
    }
    let antes = 0, despues = 0, n = 0;
    for (const e of estilos) {
      letra.muestras = {};
      const pruebas = Array.from({ length: 10 }, () => temblor(e.base));
      antes += pruebas.filter((t) => reconocerCifra(t) === e.c).length;
      aprenderCifra(temblor(e.base), e.c);                // una sola corrección
      despues += pruebas.filter((t) => reconocerCifra(t) === e.c).length;
      n += 10;
    }
    // Con todo lo aprendido a la vez, las cifras normales se siguen leyendo bien.
    letra.muestras = {};
    for (const e of estilos) aprenderCifra(temblor(e.base), e.c);
    let normales = 0, total = 0;
    for (let c = 0; c <= 9; c++) for (let k = 0; k < 20; k++) { total++; if (reconocerCifra(temblor(muestras[c][0])) === c) normales++; }
    return { estilos: estilos.length, antes: antes / n, despues: despues / n, normales: normales / total };
  }, MUESTRAS);
  expect(r.estilos).toBeGreaterThanOrEqual(15);
  expect(r.antes).toBeLessThan(0.5);
  expect(r.despues).toBeGreaterThanOrEqual(0.95);
  expect(r.normales).toBeGreaterThanOrEqual(0.95);
});

test("«¿Leí mal?»: el niño dice qué escribió, el juego lo aprende y la próxima vez lo lee así", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await page.click("#btn-letra");
  const { producto } = await preguntaActual(page);
  await expect(page.locator("#pizarra-juego-corregir")).toBeHidden();
  await escribir(page, producto, "#pizarra-juego");
  await expect(page.locator("#escrito")).toHaveText(String(producto));
  await page.click("#pizarra-juego-corregir");
  await expect(page.locator("#pizarra-juego-corrector")).toBeVisible();
  await expect(page.locator("#escrito")).toHaveText("");
  // Dice otra última cifra: así se ve que lo dibujado pasa a leerse como dijo.
  const cifras = [...String(producto)];
  const ultima = Number(cifras.at(-1));
  const dicha = ultima === 1 ? 4 : 1;
  const numero = cifras.slice(0, -1).join("") + dicha;
  for (const c of numero) await page.click(`#pizarra-juego-corrector [data-digito="${c}"]`);
  await expect(page.locator("#pizarra-juego-corrector")).toBeHidden();
  await expect(page.locator("#escrito")).toHaveText(numero);
  await expect(page.locator("#pizarra-juego-ayuda")).toHaveText(`¡Gracias! Ya sé cómo escribes el ${dicha}. Toca «Listo».`);
  const guardado = await page.evaluate(() => JSON.parse(almacen.leer("letra")).muestras);
  expect(Object.keys(guardado)).toEqual([String(dicha)]);                   // solo la que se corrigió
  // Lo mismo dibujado otra vez ya se lee como lo dijo el niño.
  await page.click("#pizarra-juego-borrar");
  await escribir(page, producto, "#pizarra-juego");
  await expect(page.locator("#escrito")).toHaveText(numero);
});

test("«¿Leí mal?» con lo que sí leyó no aprende nada; «Cancelar» deja lo leído", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await page.click("#btn-letra");
  const { producto } = await preguntaActual(page);
  await escribir(page, producto, "#pizarra-juego");
  await page.click("#pizarra-juego-corregir");
  await page.click("#pizarra-juego-corrector >> text=Cancelar");
  await expect(page.locator("#escrito")).toHaveText(String(producto));
  await expect(page.locator("#pizarra-juego-corregir")).toBeVisible();
  await page.click("#pizarra-juego-corregir");
  for (const c of String(producto)) await page.click(`#pizarra-juego-corrector [data-digito="${c}"]`);
  await expect(page.locator("#pizarra-juego-ayuda")).toHaveText(`Eso es lo que leí: ${producto}. Toca «Listo».`);
  expect(await page.evaluate(() => letra.muestras)).toEqual({});
});

test("en la Aventura también se puede enseñar, y lo aprendido es del jugador", async ({ page }) => {
  await alNivel(page);
  const respuesta = await page.evaluate(() => enemigoObjetivo().op.respuesta);
  await escribir(page, respuesta);
  await expect(page.locator("#aventura-escrito")).toHaveText(String(respuesta));
  await page.click("#pizarra-corregir");
  const cifras = [...String(respuesta)];
  const otra = cifras[0] === "8" ? "6" : "8";
  const numero = otra + cifras.slice(1).join("");
  for (const c of numero) await page.click(`#pizarra-corrector [data-digito="${c}"]`);
  await expect(page.locator("#aventura-escrito")).toHaveText(numero);
  await expect(page.locator("#pizarra-ayuda")).toHaveText(`¡Gracias! Ya sé cómo escribes el ${otra}. Toca «¡Lanzar!».`);
  expect(await page.evaluate(() => Object.keys(letra.muestras))).toEqual([otra]);
  // Otro jugador empieza sin lo aprendido; al volver, sigue ahí.
  const r = await page.evaluate(() => {
    const leo = perfilActual;
    const otro = nuevoPerfil("Ana", true);
    usarPerfil(otro.id);
    const deAna = Object.keys(letra.muestras).length;
    usarPerfil(leo);
    return [deAna, Object.keys(letra.muestras).length];
  });
  expect(r).toEqual([0, 1]);
});

test("lo aprendido guardado se revisa al cargar: solo nubes válidas y las 3 últimas por cifra", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => {
    const buena = (v) => Array.from({ length: 32 }, (_, i) => [v, i / 40]);
    almacen.guardar("letra", JSON.stringify({
      modo: "dedo",
      muestras: { 5: [buena(0.1), buena(0.2), buena(0.3), buena(0.4)], 7: [[[1, 2]], buena(9), "x"], 12: [buena(0)], 3: "nada" },
    }));
    cargarLetra();
    return { cifras: Object.keys(letra.muestras), cinco: letra.muestras[5].map((n) => n[0][0]) };
  });
  expect(r).toEqual({ cifras: ["5"], cinco: [0.2, 0.3, 0.4] });
});

test("al seguir escribiendo, «¿Leí mal?» se esconde: lo leído ya no vale", async ({ page }) => {
  await tablaQueSeEscribe(page);
  await page.click("#btn-letra");
  const { producto } = await preguntaActual(page);
  await escribir(page, producto, "#pizarra-juego");
  await expect(page.locator("#pizarra-juego-corregir")).toBeVisible();
  const caja = await page.locator("#pizarra-juego").boundingBox();
  await page.mouse.move(caja.x + caja.width - 20, caja.y + 20);
  await page.mouse.down();
  await expect(page.locator("#pizarra-juego-corregir")).toBeHidden();       // en cuanto se apoya el dedo
  await page.mouse.up();
});

test("la vista para adultos dice qué cifras aprendió de cada quien, y se puede olvidar", async ({ page }) => {
  await page.goto("./");
  await page.fill("#player-name", "Leo");
  await page.click("#screen-welcome button:has-text('Comenzar')");
  await page.evaluate(() => {
    const raya = [Array.from({ length: 20 }, (_, i) => ({ x: 30, y: i * 5 }))];
    aprenderCifra(raya, 7); aprenderCifra(raya, 4);
    guardarLetra();
    registrarIntento(2, 3, true);   // para que el jardín cuente como empezado
  });
  await page.click("#screen-selector >> text=Para las personas adultas");
  await expect(page.locator(".adulto-letra")).toContainText("Escribir con el dedo: aprendió cómo escribe el 4 y el 7.");
  await page.click(".btn-olvidar-letra");
  await expect(page.locator(".adulto-letra")).toHaveCount(0);
  expect(await page.evaluate(() => [letra.muestras, JSON.parse(almacen.leer("letra")).muestras])).toEqual([{}, {}]);
});
