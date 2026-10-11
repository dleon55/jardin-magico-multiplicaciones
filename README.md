# El Jardín Mágico de las Multiplicaciones

Sitio web para practicar las tablas de multiplicar, pensado para niñas y niños
que están aprendiéndolas.

Sitio publicado en GitHub Pages: https://dleon55.github.io/jardin-magico-multiplicaciones/

## Cómo se juega

Se elige una tabla y se responden preguntas hasta juntar 10 aciertos.

- **Cada partida va en otro orden.** Dentro de una tabla no se repite ninguna
  multiplicación hasta haber salido todas.
- **Lo que se falla vuelve.** Una multiplicación que salió mal se pregunta otra
  vez a los 2 turnos y de nuevo a los 5.
- **Equivocarse no resta.** Sale el resultado correcto, se explica y se sigue.
- **Las opciones se parecen a la respuesta.** Son errores típicos, como el
  resultado de la fila de al lado, así que no basta con adivinar.
- **La ayuda dibuja la multiplicación** en grupos de objetos para contarlos.

Con teclado (en una tableta estos atajos no se muestran):

| Tecla | Qué hace |
| --- | --- |
| `1`–`9` | Elegir tabla, en el menú |
| `1`–`4` | Elegir respuesta, en el juego |
| `H` | Abrir o cerrar la ayuda |
| `Enter` o `Espacio` | Seguir a la siguiente pregunta |
| `Esc` | Volver al menú |

En **Ajustes** se pueden apagar por separado la voz y los sonidos, elegir la
velocidad de la voz (despacio, normal o rápida) y activar «menos movimiento». Este último se enciende
solo si el dispositivo ya lo pide.

## Instalarlo y usarlo sin internet

Basta con abrir el sitio una vez con conexión. A partir de ahí carga y se juega
sin internet, y en una tableta o un teléfono se puede añadir a la pantalla de
inicio («Añadir a pantalla de inicio» o «Instalar»).

Cuando se publica una versión nueva, el dispositivo la descarga en segundo plano
y la usa **la siguiente vez que se abre el juego**, nunca a mitad de una partida.

## Desarrollo

El sitio no necesita ninguna dependencia para funcionar: es `index.html` más
archivos estáticos. Node.js solo hace falta para construirlo y probarlo.

```sh
npm ci
npm run construir   # obligatorio después de tocar index.html
npm test            # pruebas en Chromium, escritorio y tablet
npm run servir      # http://localhost:4173/jardin-magico-multiplicaciones/
```

`npm run construir` hace dos cosas:

1. Compila `estilos.css` con Tailwind, con solo las clases que usa `index.html`.
2. Sella en `sw.js` una versión calculada a partir del contenido de los
   archivos del sitio. Así cada cambio publicado llega a los dispositivos que ya
   tienen el juego guardado.

El CI comprueba que la construcción está al día y falla si no lo está.

Las pruebas (`pruebas/`) cubren el aprendizaje (orden, repasos y opciones), el
uso con teclado y en tableta, la accesibilidad (axe, WCAG 2.1 AA), el modo sin
internet y la voz. Si Chromium está instalado fuera de la caché de Playwright,
su ruta se indica con `CHROMIUM_RUTA`.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | El juego |
| `estilos.css` | Hoja de estilos generada; no se edita a mano |
| `estilos/entrada.css` | Entrada de Tailwind |
| `sw.js` | Service worker que guarda el juego para usarlo sin internet |
| `manifest.webmanifest`, `iconos/` | Para instalarlo en la pantalla de inicio |
| `fuentes/` | Fredoka One y Quicksand |
| `herramientas/construir.mjs` | Construcción |
| `pruebas/` | Pruebas automatizadas |

## Licencias de las fuentes

Fredoka One y Quicksand se distribuyen bajo la SIL Open Font License 1.1. El
texto de cada licencia está en `fuentes/`.
