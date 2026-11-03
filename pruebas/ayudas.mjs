// Ayudas compartidas por las pruebas.

/** Lee la pregunta en pantalla y devuelve { a, b, producto }. */
export async function preguntaActual(pagina) {
  const texto = (await pagina.textContent("#question-text")).trim();
  const [a, b] = texto.split("×").map((n) => parseInt(n, 10));
  return { a, b, producto: a * b, texto };
}

/** Valores de las cuatro opciones, por orden de botón. */
export function opciones(pagina) {
  return pagina.$$eval(".btn-option", (bs) => bs.map((b) => Number(b.dataset.valor)));
}

/** Entra al juego desde la bienvenida y abre la tabla indicada. */
export async function entrarATabla(pagina, tabla, nombre = "Ana") {
  await pagina.goto("./");
  await pagina.fill("#player-name", nombre);
  await pagina.click("#screen-welcome button");
  await pagina.locator("#grid-tablas-container button").nth(tabla - 1).click();
  await pagina.waitForSelector("#screen-game:not(.hidden)");
}

/** ¿La pregunta en curso se responde escribiendo? */
export async function seEscribe(pagina) {
  return (await pagina.locator("#escritura:not(.hidden)").count()) > 0;
}

/** Escribe un número con el teclado de la pantalla y lo manda. */
export async function escribir(pagina, numero) {
  for (const d of String(numero)) await pagina.click(`#escritura [data-digito="${d}"]`);
  await pagina.click("#tecla-listo");
}

/**
 * Responde bien o mal, como toque: eligiendo un botón o escribiendo en el
 * teclado de la pantalla (funciona en táctil y en escritorio). Devuelve el
 * índice del botón elegido, o "escrita".
 */
export async function responder(pagina, acertar) {
  const { producto } = await preguntaActual(pagina);
  if (await seEscribe(pagina)) {
    await escribir(pagina, acertar ? producto : producto + 1);
    return "escrita";
  }
  const ops = await opciones(pagina);
  const i = acertar ? ops.indexOf(producto) : ops.findIndex((o) => o !== producto);
  await pagina.click(`#opt-${i}`);
  return i;
}

/**
 * Deja guardados en la página unos intentos de una multiplicación, con día,
 * modo y tiempo a medida. `rapida(d)` y compañía arman cada intento.
 */
export function ponerIntentos(pagina, clave, intentos) {
  return pagina.evaluate(([k, lista]) => { hechos[k] = lista; guardarHechos(); }, [clave, intentos]);
}
export const rapida = (d) => ({ d, m: "e", ok: 1, ms: 2000 });
export const lenta = (d) => ({ d, m: "e", ok: 1, ms: 15000 });
export const elegida = (d) => ({ d, m: "o", ok: 1, ms: 1500 });
export const conAyuda = (d) => ({ d, m: "e", ok: 1, ms: null });
export const fallo = (d) => ({ d, m: "e", ok: 0, ms: 3000 });

/** Avanza a la siguiente pregunta en cuanto el juego lo permite. */
export async function siguiente(pagina) {
  const antes = (await pagina.textContent("#question-text")).trim();
  await pagina.locator("#btn-siguiente:not([disabled])").click({ timeout: 5000 });
  await pagina.waitForFunction(
    (p) => document.getElementById("question-text").innerText.trim() !== p ||
           !document.getElementById("screen-victory").classList.contains("hidden"),
    antes
  );
}

/**
 * Sustituye speechSynthesis y AudioContext por dobles que registran lo que se
 * les pide (window.__dicho, __cancelaciones, __tonos): así se prueba qué dice
 * el juego, sin altavoces.
 */
export function instalarDobles(page, voces) {
  return page.addInitScript((listaVoces) => {
    window.__dicho = [];
    window.__cancelaciones = 0;
    window.__tonos = [];
    const voces = listaVoces.map((v) => ({ ...v, name: v.lang, localService: true, default: false }));
    // speechSynthesis es de solo lectura en window: una asignación normal
    // falla EN SILENCIO y deja la voz real. Hay que redefinir la propiedad.
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => voces,
        speak: (u) => window.__dicho.push({ texto: u.text, voz: u.voice?.lang ?? null, lang: u.lang, rate: u.rate }),
        cancel: () => { window.__cancelaciones++; },
        addEventListener: () => {},
      },
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: function (texto) { this.text = texto; },
    });
    class Oscilador {
      constructor() { this.type = "sine"; this.frequency = { setValueAtTime: (f) => window.__tonos.push(f) }; }
      connect() {} start() {} stop() {}
    }
    window.webkitAudioContext = undefined;
    window.AudioContext = class {
      constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; }
      createOscillator() { return new Oscilador(); }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      resume() { this.state = "running"; }
    };
  }, voces);
}
