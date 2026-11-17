// El juego en varios archivos (index.html crecía sin fin): estilos propios en
// juego.css y arte, sonido y datos en js/. Que todo se guarde para jugar sin
// internet, que carguen en orden y que nada se defina dos veces.
import { test, expect } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";

const leer = (ruta) => readFile(new URL(`../${ruta}`, import.meta.url), "utf8");
const ARCHIVOS_JS = ["js/datos.js", "js/arte.js", "js/sonido.js", "js/multiplos.js", "js/area.js"];

test("todo lo que index.html carga del sitio está en la lista del service worker, y existe", async () => {
  const html = await leer("index.html");
  const sw = await leer("sw.js");
  const lista = [...sw.match(/const ARCHIVOS = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const usados = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)].map((m) => m[1])
    .filter((u) => !/^(https?:|data:)/.test(u));
  for (const u of usados) expect(lista, `${u} se guarda para usar sin internet`).toContain(u);
  for (const a of lista.filter((x) => x !== "./")) await expect(stat(new URL(`../${a}`, import.meta.url))).resolves.toBeTruthy();
  for (const a of [...ARCHIVOS_JS, "juego.css"]) expect(lista).toContain(a);
});

test("los scripts cargan antes del principal y en orden: datos, arte, sonido, temas", async ({ page }) => {
  await page.goto("./");
  const orden = await page.evaluate(() => [...document.scripts].map((s) => s.getAttribute("src") || "principal"));
  expect(orden.slice(-ARCHIVOS_JS.length - 1)).toEqual([...ARCHIVOS_JS, "principal"]);
  // Y su contenido está disponible para el principal.
  expect(await page.evaluate(() => [typeof MUNDOS, typeof svgHeroe, typeof svgPaisajeJardin, typeof svgPlanta, typeof sonar, typeof trucoPara])).toEqual(["object", "function", "function", "function", "function", "function"]);
});

test("al cargar no hay errores (un orden mal hecho daría «no está definido»)", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("./");
  await page.click("#screen-welcome button");
  await page.evaluate(() => { mostrarJardin(); mostrarAventura(); });
  expect(errores).toEqual([]);
});

test("nada se define dos veces: lo que se fue de index.html ya no está ahí", async () => {
  const html = await leer("index.html");
  const definiciones = [];
  for (const archivo of ARCHIVOS_JS) {
    const js = await leer(archivo);
    for (const m of js.matchAll(/^(?:function|const|let) ([A-Za-z_]\w*)/gm)) definiciones.push([archivo, m[1]]);
  }
  expect(definiciones.length).toBeGreaterThan(20);
  const repetidas = definiciones.filter(([, n]) => new RegExp(`^\\s*(?:function|const|let) ${n}\\b`, "m").test(html));
  expect(repetidas).toEqual([]);
  expect(html).not.toContain("<style>");
});

test("los archivos aparte no leen ni guardan nada, ni hacen nada al cargar: solo declaran", async () => {
  // Así fue el primer intento: la carga de los perfiles se fue con los
  // mundos a js/datos.js, corría antes de que existiera el almacenamiento y
  // el error se tragaba en un try. Los perfiles guardados no se cargaban.
  for (const archivo of ARCHIVOS_JS) {
    const js = await leer(archivo);
    expect(js, archivo).not.toMatch(/localStorage|almacen\.|PREFIJO/);
    const sueltas = js.split("\n").filter((l) => /^[A-Za-z_(\[]/.test(l) && !/^(const|let|function|async function) /.test(l)
      && !/^document\.addEventListener\(/.test(l));
    expect(sueltas, `${archivo}: código que corre al cargar`).toEqual([]);
  }
});

test("las clases de Tailwind que solo usan los scripts también se compilan", async () => {
  // Los colores de los botones de las tablas viven ya solo en js/datos.js.
  const datos = await leer("js/datos.js");
  expect(datos).toContain("from-red-300");
  expect(await leer("index.html")).not.toContain("from-red-300");
  expect(await leer("estilos.css")).toContain(".from-red-300");
});

test("cada archivo se queda en un tamaño razonable", async () => {
  const kb = async (a) => (await stat(new URL(`../${a}`, import.meta.url))).size / 1000;
  expect(await kb("index.html")).toBeLessThan(600);
  for (const a of [...ARCHIVOS_JS, "juego.css"]) expect(await kb(a), a).toBeLessThan(150);
});
