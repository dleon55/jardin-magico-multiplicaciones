// Mide cuánto tarda en cargar el juego como en un teléfono modesto: con el
// procesador frenado y una red lenta. No es una prueba (el resultado depende
// de la máquina): es para anotar la medida en docs/PLAN.md y compararla.
//
//   node pruebas/servidor.mjs &        (en otra terminal)
//   node herramientas/medir-carga.mjs  (CHROMIUM_RUTA=… si hace falta)
//   JUEGO_URL=https://… node herramientas/medir-carga.mjs   (el sitio publicado)
import { chromium } from "@playwright/test";

// JUEGO_URL permite medir el sitio publicado, que comprime los archivos (el servidor de pruebas no).
const URL_JUEGO = process.env.JUEGO_URL || "http://localhost:4173/jardin-magico-multiplicaciones/";
const CASOS = [
  { nombre: "sin frenar", cpu: 1, red: null },
  { nombre: "procesador 4× más lento", cpu: 4, red: null },
  { nombre: "4× más lento y red 4G lenta (1,6 Mbps, 150 ms)", cpu: 4, red: { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 } },
];
const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const navegador = await chromium.launch(process.env.CHROMIUM_RUTA ? { executablePath: process.env.CHROMIUM_RUTA } : {});
for (const caso of CASOS) {
  const listo = [], dom = [];
  for (let i = 0; i < 5; i++) {
    // Un contexto nuevo cada vez: sin caché ni service worker, como una primera visita.
    const contexto = await navegador.newContext({ viewport: { width: 360, height: 640 }, serviceWorkers: "block" });
    const pagina = await contexto.newPage();
    const cdp = await contexto.newCDPSession(pagina);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: caso.cpu });
    if (caso.red) { await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", caso.red); }
    const inicio = Date.now();
    await pagina.goto(URL_JUEGO, { waitUntil: "commit" });
    // «Listo»: la primera pantalla a la vista y el juego respondiendo (window.onload ya corrió).
    await pagina.waitForFunction(() => document.querySelector("#guia-seguir, #screen-welcome button")?.offsetParent && typeof pantallaActual === "string" && document.readyState === "complete");
    listo.push(Date.now() - inicio);
    dom.push(await pagina.evaluate(() => Math.round(performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd)));
    await contexto.close();
  }
  console.log(`${caso.nombre}: listo en ${(mediana(listo) / 1000).toFixed(1)} s (DOM en ${(mediana(dom) / 1000).toFixed(1)} s); corridas: ${listo.map((t) => (t / 1000).toFixed(1)).join(", ")}`);
}
await navegador.close();
