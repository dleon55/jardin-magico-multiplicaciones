// Confusiones típicas (issue #62): reconocer el patrón del error, decirlo con
// cariño y, si se repite, practicar juntas las dos multiplicaciones que se
// cruzan. La vista para adultos muestra las más frecuentes.
import { test, expect } from "@playwright/test";

async function alMenu(page) {
  await page.goto("./");
  await page.fill("#player-name", "Ana");
  await page.click("#screen-welcome button:has-text('Comenzar')");
}

/**
 * Pone en pantalla la pregunta a × b (de la tabla a), responde `valor` y
 * devuelve el aviso en ese mismo momento: el juego pasa solo a la siguiente
 * pregunta y lo borra, así que un «no contiene» que espera siempre acabaría
 * pasando.
 */
async function fallarCon(page, a, b, valor) {
  return page.evaluate(([a, b, valor]) => {
    startTable(a);
    colaRepaso = [];
    bolsa = [{ a, b }];
    nextQuestion();
    evaluar(valor, null);
    cancelarEspera();   // que no avance solo mientras se mira
    return document.getElementById("game-feedback").innerText;
  }, [a, b, valor]);
}

test("reconoce las cuatro confusiones típicas, en los dos sentidos", async ({ page }) => {
  await page.goto("./");
  const r = await page.evaluate(() => ({
    vecina: confusionDe(6, 8, 42), alReves: confusionDe(8, 6, 42), suma: confusionDe(6, 8, 14),
    cifras: confusionDe(7, 9, 36), tabla: confusionDe(6, 8, 30), nada: confusionDe(6, 8, 49), bien: confusionDe(6, 8, 48),
  }));
  expect(r).toEqual({
    vecina: { tipo: "vecina", con: [6, 7] }, alReves: { tipo: "vecina", con: [6, 7] }, suma: { tipo: "suma" },
    cifras: { tipo: "cifras" }, tabla: { tipo: "tabla", con: [6, 5] }, nada: null, bien: null,
  });
});

test("se guarda la respuesta equivocada (no la correcta), y sobrevive al recargar", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => {
    registrarIntento(6, 8, false, { dada: 42 });
    registrarIntento(6, 8, true, { dada: 48 });
  });
  expect(await page.evaluate(() => intentosDe(6, 8).map((i) => i.r))).toEqual([42, undefined]);
  await page.reload();
  await page.click(".btn-perfil:has-text('Ana')");
  const lista = await page.evaluate(() => intentosDe(6, 8).map((i) => ({ ok: i.ok, r: i.r })));
  expect(lista).toEqual([{ ok: 0, r: 42 }, { ok: 1, r: undefined }]);
  // Un valor raro guardado a mano se descarta al cargar.
  expect(await page.evaluate(() => limpiarIntento({ d: "", m: "e", ok: 0, ms: null, r: "mucho" }).r)).toBeUndefined();
});

test("al fallar con la de al lado, lo dice con cariño", async ({ page }) => {
  await alMenu(page);
  const aviso = await fallarCon(page, 6, 8, 42);
  expect(aviso).toContain("Diste 42, que es 6 × 7: la de al lado.");
  expect(aviso).not.toContain("Se te cruzan");   // a la primera solo se nombra
});

test("sumar en lugar de multiplicar también se nombra; si se repite, recuerda qué es «×»", async ({ page }) => {
  await alMenu(page);
  const primero = await fallarCon(page, 6, 8, 14);
  expect(primero).toContain("Sumaste: 6 + 8 = 14. Multiplicar es 6 veces 8.");
  expect(primero).not.toContain("«veces», no «más»");
  expect(await fallarCon(page, 6, 8, 14)).toContain("«×» es «veces», no «más»");
});

test("si la misma confusión se repite, la que se cruza sale enseguida y luego esta otra vez", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => registrarIntento(6, 8, false, { dada: 42 }));   // ya pasó una vez
  expect(await fallarCon(page, 6, 8, 42)).toContain("Se te cruzan seguido: ahora te pregunto 6 × 7 y luego otra vez esta.");
  const cola = await page.evaluate(() => colaRepaso.map((r) => [r.a, r.b, r.enTurnos]));
  expect(cola).toContainEqual([6, 7, 1]);
  expect(cola).toContainEqual([6, 8, 2]);
  // Y de verdad sale: la siguiente pregunta es 6 × 7.
  await page.evaluate(() => nextQuestion());
  expect((await page.textContent("#question-text")).replace(/\s/g, "")).toMatch(/^(6×7|7×6)$/);
});

test("un fallo sin patrón no inventa nada", async ({ page }) => {
  await alMenu(page);
  const aviso = await fallarCon(page, 6, 8, 49);
  expect(aviso).toContain("¡Casi!");
  expect(aviso).not.toContain("Diste");
  expect(aviso).not.toContain("Sumaste");
});

test("la vista para adultos muestra lo que se le cruza, solo si pasó más de una vez", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => {
    registrarIntento(6, 8, false, { dada: 42 });
    registrarIntento(6, 8, false, { dada: 42 });
    registrarIntento(3, 4, false, { dada: 7 });
    registrarIntento(3, 4, false, { dada: 7 });
    registrarIntento(9, 9, false, { dada: 72 });   // una sola vez: no sale
  });
  await page.click("#screen-selector >> text=Para las personas adultas");
  const p = page.locator(".tarjeta-adulto").filter({ hasText: "Ana" }).locator(".adulto-confusiones");
  await expect(p).toContainText("6 × 8 con 6 × 7 (2 veces)");
  await expect(p).toContainText("sumar en lugar de multiplicar (2 veces)");
  await expect(p).not.toContainText("9 × 9");
});

test("sin confusiones repetidas, la vista para adultos no dice nada de eso", async ({ page }) => {
  await alMenu(page);
  await page.evaluate(() => registrarIntento(6, 8, false, { dada: 42 }));
  await page.click("#screen-selector >> text=Para las personas adultas");
  await expect(page.locator(".adulto-confusiones")).toHaveCount(0);
});
