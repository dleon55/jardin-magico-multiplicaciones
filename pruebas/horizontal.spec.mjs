// El teléfono acostado: poca altura (360 a 390 px), así que se usa el ancho.
// La pregunta a la izquierda y la respuesta a la derecha; en la Aventura, la
// arena a la izquierda y el teclado a la derecha. Nada fuera de la pantalla.
import { test, expect } from "@playwright/test";

for (const [ancho, alto] of [[667, 375], [640, 360]]) {
  test.describe(`acostado, ${ancho} × ${alto}`, () => {
    test.use({ viewport: { width: ancho, height: alto }, isMobile: true, hasTouch: true });

    test.beforeEach(async ({ page }) => {
      await page.clock.setFixedTime(new Date("2026-11-15T12:00:00"));
      await page.goto("./");
      await page.fill("#player-name", "Leo");
      await page.click("#screen-welcome button:has-text('Comenzar')");
      await expect(page.locator("#screen-selector")).toBeVisible();
    });

    const caja = (page, sel) => page.evaluate((s) => {
      const r = [...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect());
      return { top: Math.min(...r.map((x) => x.top)), bottom: Math.max(...r.map((x) => x.bottom)), left: Math.min(...r.map((x) => x.left)), right: Math.max(...r.map((x) => x.right)), height: Math.max(...r.map((x) => x.height)) };
    }, sel);

    test("la partida: la pregunta a la izquierda, las respuestas a la derecha, todo a la vista", async ({ page }) => {
      await page.evaluate(() => startTable(3));
      const girasol = await caja(page, "#girasol"), opciones = await caja(page, "#opciones");
      expect(girasol.right).toBeLessThanOrEqual(opciones.left);
      expect(opciones.bottom).toBeLessThanOrEqual(alto);
      await page.evaluate(() => evaluar(-1, null));
      expect((await caja(page, "#btn-siguiente")).bottom).toBeLessThanOrEqual(alto);
      await page.evaluate(() => { cancelarEspera(); startTable("logica"); });
      expect((await caja(page, "#opciones")).bottom).toBeLessThanOrEqual(alto);
    });

    test("escribir la respuesta: el teclado entero a la vista", async ({ page }) => {
      await page.evaluate(() => { for (let x = 1; x <= 10; x++) registrarIntento(5, x, true); startTable(5); evaluar(-1, null); cancelarEspera(); nextQuestion(); });
      expect(await page.evaluate(() => modoEscrito)).toBe(true);
      expect((await caja(page, "#teclado-juego")).bottom).toBeLessThanOrEqual(alto);
      // El aviso sigue ahí para el lector de pantalla.
      await expect(page.locator("#escritura-aviso")).toHaveText("Esta ya te salió bien: ahora escríbela.");
    });

    test("la Aventura: la arena a la izquierda y el teclado a la derecha, en los tres modos", async ({ page }) => {
      for (const [modo, sel] of [["teclear", "#aventura-lanzar"], ["elegir", "#aventura-opciones button"], ["dedo", "#pizarra-lanzar"]]) {
        await page.evaluate((m) => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); cambiarModoAventura(m); }, modo);
        const arena = await caja(page, "#arena"), entrada = await caja(page, "#aventura-entrada");
        expect(arena.right, modo).toBeLessThanOrEqual(entrada.left);
        expect(arena.height, modo).toBeGreaterThanOrEqual(176);                // la arena, tan alta como quepa
        expect(arena.bottom, modo).toBeLessThanOrEqual(alto);
        expect((await caja(page, sel)).bottom, modo).toBeLessThanOrEqual(alto);
      }
    });

    test("«Ajustes» es un icono de 44 px que no tapa ninguna cabecera, y conserva su nombre", async ({ page }) => {
      const ajustes = page.locator("#ajustes summary");
      await expect(ajustes).toHaveAccessibleName("Ajustes");
      const a = await ajustes.boundingBox();
      expect(Math.round(a.width)).toBeGreaterThanOrEqual(44);
      expect(Math.round(a.width)).toBeLessThanOrEqual(48);
      const seTocan = (x, y) => !(x.x + x.width <= y.x || y.x + y.width <= x.x || x.y + x.height <= y.y || y.y + y.height <= x.y);
      for (const [abrir, sel] of [[() => backToSelector(), "#cabecera-menu"], [() => startTable(2), "#screen-game > div:first-child"],
        [() => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); }, "#nivel-cabecera"]]) {
        await page.evaluate(abrir);
        expect(seTocan(await ajustes.boundingBox(), await page.locator(sel).boundingBox()), sel).toBe(false);
      }
    });

    test("nada se sale a lo ancho y todo lo que se toca sigue midiendo 44 px", async ({ page }) => {
      const pantallas = [() => backToSelector(), () => startTable(3), () => { mostrarAventura(); aventura.manual = true; empezarNivel(0, 0); },
        () => mostrarMapa(), () => mostrarJardin(), () => mostrarAventura()];
      for (const abrir of pantallas) {
        await page.evaluate(abrir);
        const r = await page.evaluate(() => ({
          desborda: document.documentElement.scrollWidth > innerWidth + 1,
          chicos: [...document.querySelectorAll("main button, main summary")].filter((e) => { const q = e.getBoundingClientRect(); return q.width > 1 && !e.closest(".hidden") && (q.width < 43.5 || q.height < 43.5); }).map((e) => e.textContent.trim().slice(0, 20)),
        }));
        expect(r).toEqual({ desborda: false, chicos: [] });
      }
    });
  });
}
