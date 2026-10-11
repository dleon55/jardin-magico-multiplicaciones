// Servidor estático mínimo para las pruebas. Sin dependencias.
//
// Sirve el repositorio bajo /jardin-magico-multiplicaciones/, EXACTAMENTE la
// ruta de GitHub Pages. Una ruta absoluta ("/sw.js", "/estilos.css") funciona
// en un servidor local en la raíz y se rompe al publicar; aquí se rompe antes.
//
// Además, el service worker no funciona abriendo el archivo con doble clic:
// necesita http. Por eso las pruebas no usan file://.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PREFIJO = "/jardin-magico-multiplicaciones/";
const PUERTO = Number(process.env.PUERTO || 4173);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

createServer(async (peticion, respuesta) => {
  const url = new URL(peticion.url, "http://localhost");
  if (!url.pathname.startsWith(PREFIJO)) {
    respuesta.writeHead(404).end("Fuera de la ruta publicada");
    return;
  }
  let relativa = decodeURIComponent(url.pathname.slice(PREFIJO.length)) || "index.html";
  if (relativa.endsWith("/")) relativa += "index.html";
  const archivo = normalize(join(RAIZ, relativa));
  if (!archivo.startsWith(RAIZ) || archivo.includes("node_modules")) {
    respuesta.writeHead(403).end();
    return;
  }
  try {
    const contenido = await readFile(archivo);
    respuesta.writeHead(200, {
      "Content-Type": TIPOS[extname(archivo)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    respuesta.end(contenido);
  } catch {
    respuesta.writeHead(404).end("No encontrado");
  }
}).listen(PUERTO, () => {
  console.log(`Jardín Mágico en http://localhost:${PUERTO}${PREFIJO}`);
});
