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

/** Responde bien o mal pulsando el botón (funciona en táctil y en escritorio). */
export async function responder(pagina, acertar) {
  const { producto } = await preguntaActual(pagina);
  const ops = await opciones(pagina);
  const i = acertar ? ops.indexOf(producto) : ops.findIndex((o) => o !== producto);
  await pagina.click(`#opt-${i}`);
  return i;
}

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
