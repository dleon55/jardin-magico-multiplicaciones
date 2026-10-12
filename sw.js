// Service worker del Jardín Mágico: hace que el juego funcione SIN INTERNET.
//
// Para qué: en un aula con wifi flojo, o sin conexión, el sitio no se podía
// usar. No solo se veía sin estilos: sin la hoja de Tailwind, el lienzo de
// partículas quedaba encima de los botones y se tragaba todos los clics.
//
// ESTRATEGIA: todo desde la caché de ESTA versión, y la versión nueva entra
// entera o no entra.
//
// El error clásico de un service worker es servir el HTML fresco de la red y
// los estilos de una caché vieja: HTML nuevo con CSS antiguo, y botones que
// dependen de clases que todavía no existen. Aquí cada versión precachea sus
// archivos juntos y los sirve juntos. Una versión nueva se descarga en segundo
// plano y toma el relevo la siguiente vez que se abre el juego, nunca a mitad
// de una partida.
//
// VERSION no se escribe a mano: la calcula `npm run construir` con el hash del
// contenido de los archivos de abajo, y el CI falla si no está al día. Si se
// olvidara cambiarla, quien ya tuviera el juego instalado se quedaría para
// siempre en la versión vieja, porque todo se sirve desde la caché.

const VERSION = "f066574f0c27";
const CACHE = `jardin-${VERSION}`;

const ARCHIVOS = [
  "./",
  "index.html",
  "estilos.css",
  "manifest.webmanifest",
  "fuentes/fredoka-one-latin.woff2",
  "fuentes/quicksand-latin.woff2",
  "iconos/icono.svg",
  "iconos/icono-192.png",
  "iconos/icono-512.png",
  "iconos/apple-touch-icon.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      // cache: "reload" salta la caché HTTP del navegador. GitHub Pages
      // responde con max-age=600: sin esto, una versión recién publicada
      // podría precachear archivos de la anterior.
      cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((n) => n.startsWith("jardin-") && n !== CACHE)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET" || new URL(peticion.url).origin !== self.location.origin) {
    return;   // nada de fuera: el juego ya no depende de ningún otro dominio
  }

  evento.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const guardada = await cache.match(peticion, { ignoreSearch: true });
      if (guardada) {
        return guardada;
      }
      // Navegar a cualquier ruta del sitio sin conexión devuelve el juego.
      if (peticion.mode === "navigate") {
        const portada = await cache.match("./");
        if (portada) {
          return fetch(peticion).catch(() => portada);
        }
      }
      return fetch(peticion);
    })
  );
});
