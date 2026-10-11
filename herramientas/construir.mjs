// Construye lo que el sitio sirve y que no se escribe a mano:
//
//   1. estilos.css   Tailwind compilado a partir de las clases de index.html.
//   2. sw.js         su VERSION, sellada con el hash del contenido.
//
// Hay que correrlo tras cambiar index.html, y el CI comprueba que se hizo:
// regenera ambos y falla si difieren de lo que hay en el repositorio.
//
// Por qué la versión es un hash y no un número que se sube a mano: el service
// worker sirve todo desde la caché. Si se publica un cambio y la versión no
// cambia, quien ya tiene el juego instalado SE QUEDA PARA SIEMPRE en la versión
// vieja. Con un hash, cambiar cualquier archivo cambia la versión, y olvidarlo
// es imposible.
//
// Uso:  npm run construir

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ruta = (archivo) => join(RAIZ, archivo);

// 1. Tailwind
execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tailwindcss", "-i", "estilos/entrada.css", "-o", "estilos.css", "--content", "index.html", "--minify"],
  { cwd: RAIZ, stdio: ["ignore", "ignore", "inherit"] }
);
console.log("estilos.css compilado");

// 2. Versión del service worker. La lista de archivos se lee DEL PROPIO sw.js:
// una sola fuente de verdad, así no pueden divergir.
const sw = readFileSync(ruta("sw.js"), "utf8");
const lista = sw.match(/const ARCHIVOS = \[([\s\S]*?)\];/);
if (!lista) {
  throw new Error("No encuentro la lista ARCHIVOS en sw.js");
}
const archivos = [...lista[1].matchAll(/"([^"]+)"/g)]
  .map((m) => m[1])
  .filter((a) => a !== "./");   // "./" es index.html

const hash = createHash("sha256");
for (const archivo of archivos) {
  hash.update(archivo);
  hash.update("\0");
  hash.update(readFileSync(ruta(archivo)));
  hash.update("\0");
}
const version = hash.digest("hex").slice(0, 12);

const nuevo = sw.replace(/const VERSION = "[^"]*";/, `const VERSION = "${version}";`);
writeFileSync(ruta("sw.js"), nuevo);
console.log(`sw.js sellado con la versión ${version} (${archivos.length} archivos)`);
