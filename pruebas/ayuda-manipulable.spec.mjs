// Ayuda que se toca (issue #63): poner y quitar filas, partir el rectángulo
// tocando una fila (7 × 8 = 5 × 8 + 2 × 8) y girarlo, con el dedo y con las
// flechas. El total se actualiza y se dice; el de la pregunta misma, no.
import { test, expect } from "@playwright/test";
import { entrarATabla, instalarDobles } from "./ayudas.mjs";

/** Partida de la del 7, con la pregunta 7 × 8 y la ayuda abierta. */
async function ayudaDe7x8(page) {
  await entrarATabla(page, 7);
  await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 7, b: 8 }]; nextQuestion(); });
  await page.click("#btn-help");
}

const total = (page) => page.locator("#ayuda-total");
const puntos = (page) => page.locator("#help-visual-container .punto");

test("al abrirla: el rectángulo de la pregunta, con su total por contar y los controles", async ({ page }) => {
  await ayudaDe7x8(page);
  await expect(total(page)).toHaveText("7 × 8 = ?");   // no da la respuesta
  await expect(puntos(page)).toHaveCount(56);
  await expect(page.locator("#help-explain")).toContainText("Toca una fila para partirlo.");
  for (const id of ["#btn-quitar-fila", "#btn-poner-fila", "#btn-partir", "#btn-girar"]) {
    await expect(page.locator(id)).toBeVisible();
  }
});

test("quitar y poner filas: el total cambia al momento y dice cómo volver a la pregunta", async ({ page }) => {
  await ayudaDe7x8(page);
  await page.click("#btn-quitar-fila");
  await expect(total(page)).toHaveText("6 × 8 = 48");
  await expect(puntos(page)).toHaveCount(48);
  await expect(page.locator("#help-explain")).toHaveText("Ahora hay 6 filas de 8. Pon 1 fila y vuelves a 7 × 8.");
  await page.click("#btn-poner-fila");
  await expect(total(page)).toHaveText("7 × 8 = ?");   // de vuelta en la pregunta: otra vez por contar
  await page.click("#btn-poner-fila");
  await page.click("#btn-poner-fila");
  await expect(total(page)).toHaveText("9 × 8 = 72");
  await expect(page.locator("#help-explain")).toHaveText("Ahora hay 9 filas de 8. Quita 2 filas y vuelves a 7 × 8.");
});

test("no baja de 1 fila ni pasa de 10", async ({ page }) => {
  await ayudaDe7x8(page);
  for (let i = 0; i < 8; i++) await page.evaluate(() => cambiarFilasAyuda(-1));
  await expect(total(page)).toHaveText("1 × 8 = 8");
  await expect(page.locator("#btn-quitar-fila")).toBeDisabled();
  await expect(page.locator("#btn-partir")).toBeDisabled();   // una fila no se parte
  for (let i = 0; i < 12; i++) await page.evaluate(() => cambiarFilasAyuda(1));
  await expect(total(page)).toHaveText("10 × 8 = 80");
  await expect(page.locator("#btn-poner-fila")).toBeDisabled();
});

test("tocar una fila parte el rectángulo ahí; tocarla otra vez lo junta", async ({ page }) => {
  await ayudaDe7x8(page);
  await puntos(page).nth(4 * 8 + 3).click();   // un punto de la quinta fila
  await expect(total(page)).toHaveText("5 × 8 + 2 × 8 = 40 + 16 = ?");
  await expect(page.locator("#help-visual-container .tras-corte")).toHaveCount(8);
  await expect(page.locator("#help-explain")).toHaveText("Partido en dos: 5 filas de 8 y 2 filas de 8. Suma las dos partes.");
  await expect(page.locator("#btn-partir")).toHaveText("Juntar");
  // Las dos partes, de dos colores.
  const colores = await puntos(page).evaluateAll((ps) => [ps[0].className.includes("indigo"), ps[55].className.includes("orange")]);
  expect(colores).toEqual([true, true]);
  await puntos(page).nth(4 * 8).click();
  await expect(total(page)).toHaveText("7 × 8 = ?");
  await expect(page.locator("#help-visual-container .tras-corte")).toHaveCount(0);
});

test("tocar entre los puntos también vale: cuenta la fila más cercana", async ({ page }) => {
  await ayudaDe7x8(page);
  await page.locator("#ayuda-rect").scrollIntoViewIfNeeded();   // el clic por coordenadas no desplaza solo
  const p = await puntos(page).nth(2 * 8).boundingBox();   // tercera fila, primer punto
  const rect = await page.locator("#ayuda-rect").boundingBox();
  await page.mouse.click(rect.x + 3, p.y + p.height / 2);   // en el margen, a la altura de la fila
  await expect(total(page)).toHaveText("3 × 8 + 4 × 8 = 24 + 32 = ?");
});

test("«Partir» corta tras la quinta fila, y «Juntar» lo deshace", async ({ page }) => {
  await ayudaDe7x8(page);
  await page.click("#btn-partir");
  await expect(total(page)).toHaveText("5 × 8 + 2 × 8 = 40 + 16 = ?");
  await page.click("#btn-partir");
  await expect(total(page)).toHaveText("7 × 8 = ?");
});

test("con un rectángulo distinto de la pregunta, partido da también el total", async ({ page }) => {
  await ayudaDe7x8(page);
  await page.click("#btn-poner-fila");
  await page.click("#btn-partir");
  await expect(total(page)).toHaveText("5 × 8 + 3 × 8 = 40 + 24 = 64");
});

test("con teclado: flechas arriba y abajo quitan y ponen filas; izquierda y derecha mueven el corte", async ({ page }) => {
  await ayudaDe7x8(page);
  await page.focus("#ayuda-rect");
  await page.keyboard.press("ArrowUp");
  await expect(total(page)).toHaveText("6 × 8 = 48");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(total(page)).toHaveText("2 × 8 + 5 × 8 = 16 + 40 = ?");
  await page.keyboard.press("ArrowLeft");
  await expect(total(page)).toHaveText("1 × 8 + 6 × 8 = 8 + 48 = ?");
  await page.keyboard.press("ArrowLeft");
  await expect(total(page)).toHaveText("7 × 8 = ?");
  // El foco se queda en el rectángulo aunque se vuelva a dibujar.
  expect(await page.evaluate(() => document.activeElement.id)).toBe("ayuda-rect");
});

test("el rectángulo se presenta al lector de pantalla y el total se anuncia solo", async ({ page }) => {
  await ayudaDe7x8(page);
  await expect(page.locator("#ayuda-rect")).toHaveAttribute("role", "group");
  await expect(page.locator("#ayuda-rect")).toHaveAttribute("aria-label", /7 filas de 8.*Flecha arriba/);
  await expect(page.locator("#ayuda-rect")).toHaveAttribute("tabindex", "0");
  await expect(total(page)).toHaveAttribute("aria-live", "polite");
});

test("cada cambio se dice en voz, sin dar la respuesta de la pregunta", async ({ page }) => {
  await instalarDobles(page, [{ lang: "es-MX" }]);
  await ayudaDe7x8(page);
  const ultimo = () => page.evaluate(() => window.__dicho.at(-1).texto);
  await page.click("#btn-quitar-fila");
  expect(await ultimo()).toBe("6 por 8 es 48.");
  await page.click("#btn-poner-fila");
  expect(await ultimo()).toBe("7 filas de 8. Cuéntalos.");
  await page.click("#btn-partir");
  expect(await ultimo()).toBe("5 por 8 es 40, y 2 por 8 es 16. Súmalos y sabrás cuánto es todo junto.");
  const todo = await page.evaluate(() => window.__dicho.map((d) => d.texto).join(" | "));
  expect(todo).not.toContain("56");
});

test("girar cambia filas por columnas, también del rectángulo cambiado, y quita el corte", async ({ page }) => {
  await ayudaDe7x8(page);
  await page.click("#btn-girar");
  await expect(total(page)).toHaveText("8 × 7 = ?");
  await expect(page.locator("#help-explain")).toContainText("7 × 8 da lo mismo que 8 × 7");
  await page.click("#btn-quitar-fila");
  await expect(total(page)).toHaveText("7 × 7 = 49");
  await expect(page.locator("#help-explain")).toHaveText("Ahora hay 7 filas de 7. Pon 1 fila y vuelves a 7 × 8.");
  await page.click("#btn-partir");
  await page.click("#btn-girar");
  await expect(total(page)).toHaveText("7 × 7 = 49");
  await expect(page.locator("#help-visual-container .tras-corte")).toHaveCount(0);
});

test("la pregunta siguiente empieza con su rectángulo, sin lo tocado", async ({ page }) => {
  await ayudaDe7x8(page);
  await page.click("#btn-quitar-fila");
  await page.click("#btn-partir");
  await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 7, b: 4 }]; nextQuestion(); });
  await expect(total(page)).toHaveText("7 × 4 = ?");
  await expect(puntos(page)).toHaveCount(28);
});

test("al dividir y en los dibujos de fracciones no se toca: solo se mira", async ({ page }) => {
  await ayudaDe7x8(page);
  await page.evaluate(() => { pregunta = { ...pregunta, tipo: "div" }; generateHelpVisual(); });
  for (const id of ["#btn-quitar-fila", "#btn-poner-fila", "#btn-partir", "#ayuda-total"]) {
    await expect(page.locator(id)).toBeHidden();
  }
  await expect(page.locator("#help-visual-container > div")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#ayuda-rect")).toHaveCount(0);
  // Y lo de dividir no se manipula ni a mano.
  await page.evaluate(() => cambiarFilasAyuda(-1));
  await expect(puntos(page)).toHaveCount(56);
  // Un problema de repartir tampoco: el rectángulo es el mismo, pero se busca otra cosa.
  await page.evaluate(() => { pregunta = { ...pregunta, tipo: "problema", op: "÷" }; generateHelpVisual(); });
  await expect(page.locator("#btn-quitar-fila")).toBeHidden();
  await expect(page.locator("#ayuda-rect")).toHaveCount(0);
  // Y un problema de multiplicar, sí.
  await page.evaluate(() => { pregunta = { ...pregunta, tipo: "problema", op: "×" }; generateHelpVisual(); });
  await expect(page.locator("#btn-quitar-fila")).toBeVisible();
});

test("cabe en el teléfono, en vertical y acostado, con el rectángulo más grande", async ({ page }) => {
  for (const tam of [{ width: 360, height: 640 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(tam);
    await entrarATabla(page, 9);
    await page.evaluate(() => { cancelarEspera(); colaRepaso = []; bolsa = [{ a: 9, b: 10 }]; nextQuestion(); });
    await page.click("#btn-help");
    await page.click("#btn-poner-fila");   // 10 × 10
    await page.click("#btn-partir");
    const panel = await page.locator("#help-panel").boundingBox();
    expect(panel.height, `${tam.width}×${tam.height}: la ayuda entera a la vista`).toBeLessThanOrEqual(tam.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${tam.width}×${tam.height}: sin desplazar de lado`)
      .toBeLessThanOrEqual(tam.width);
    for (const id of ["#btn-quitar-fila", "#btn-poner-fila", "#btn-partir", "#btn-girar"]) {
      const b = await page.locator(id).boundingBox();
      expect(b.height, id).toBeGreaterThanOrEqual(44);
      expect(b.x + b.width, id).toBeLessThanOrEqual(tam.width);
    }
  }
});
