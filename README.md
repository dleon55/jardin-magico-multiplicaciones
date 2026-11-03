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
- **Primero se elige, después se escribe.** Lo nuevo y lo recién fallado se
  responden eligiendo entre cuatro opciones. Lo que ya salió bien se responde
  **escribiendo** en un teclado de números grande: recordarlo sin opciones
  delante es saberlo, y elegirlo entre cuatro solo es reconocerlo.
- **Las opciones se parecen a la respuesta.** Son errores típicos, como el
  resultado de la fila de al lado, así que no basta con adivinar.
- **La ayuda dibuja la multiplicación como un rectángulo** de filas × columnas,
  con huecos cada 5 para contar de 5 en 5. Al girarlo se ve que 9 × 7 y 7 × 9
  son los mismos puntos.
- **Cada tabla tiene su truco** (el del 9 es «por 10 y una vez menos»), con los
  números de la pregunta, y la voz lo lee. El último paso lo da quien juega: la
  ayuda no da la respuesta.
- **Tablas del 1 al 9**, cada una del ×1 al ×10, y un desafío que mezcla las
  del 2 al 9. Las del 10, 11 y 12 se quitaron: la del 10 no exige memoria (se
  añade un cero) y la 11 y la 12 dispersaban la práctica.
- **«Mi mapa de tablas»** muestra las 90 multiplicaciones en cuatro estados:

  | Estado | Cuándo |
  | --- | --- |
  | 🌸 Florecida | Desde el último fallo, **escrita en 6 segundos o menos en dos días distintos**. Es saberla de memoria |
  | 🌷 Casi | Desde el último fallo, escrita rápido una vez, o acertada dos veces |
  | 🌱 Practicando | Jugada, sin llegar a «casi» |
  | (gris) | Sin jugar |

  Dos días, porque lo que se recuerda al día siguiente ya no es memoria de
  corto plazo. El tiempo no cuenta si se abrió la ayuda. Un acierto lento no
  quita lo ganado; solo un fallo reinicia la cuenta. Tocar una tabla en el
  mapa la abre para practicar.
- **«Practicar lo que me falta»** arma una partida con lo que está en
  «practicando» o «casi»: primero lo fallado la última vez, luego lo que se
  practica, luego lo «casi» de otro día (que hoy puede florecer). Así el repaso
  sigue entre días, no solo dentro de una partida. El botón solo aparece si hay
  algo pendiente.
- **Al ganar, el juego dice lo aprendido**: qué multiplicaciones florecieron
  en esa partida, cuántas quedan «casi» (y qué falta: escribirlas rápido otro
  día) o cuántas van en camino.

Con teclado (en una tableta estos atajos no se muestran):

| Tecla | Qué hace |
| --- | --- |
| `1`–`9` | Elegir tabla en el menú |
| `1`–`4` | Elegir respuesta, cuando hay opciones |
| `0`–`9`, `Retroceso`, `Enter` | Escribir la respuesta, borrar y mandarla, cuando se escribe |
| `H` | Abrir o cerrar la ayuda |
| `Enter` o `Espacio` | Seguir a la siguiente pregunta |
| `Esc` | Volver al menú, desde el juego o el mapa |

En **Ajustes** se pueden apagar por separado la voz y los sonidos, elegir la
velocidad de la voz (despacio, normal o rápida) y activar «menos movimiento».
Este último se enciende solo si el dispositivo ya lo pide.

### Velocidad de la voz

En **Ajustes**, el botón «Velocidad» cambia de posición con cada toque
(Despacio → Normal → Rápida → Despacio). La voz anuncia el cambio ya a la
velocidad nueva, para que se oiga la diferencia.

| Posición | Velocidad | Para quién |
| --- | --- | --- |
| Despacio | 0,8 | Quien aún está aprendiendo a leer o a oír los números |
| Normal | 0,95 | La de serie |
| Rápida | 1,2 | Quien ya domina la tabla y no quiere esperar a que termine la frase |

La velocidad elegida se recuerda en el dispositivo. Quien tenía activado «Voz
despacio» en la versión anterior sigue en Despacio.

No se sube de 1,2: a partir de ahí, en español, los números se atropellan
(«siete por ocho, cincuenta y seis»). Además, cada voz del sistema acelera
distinto: en iPad la misma velocidad suena más rápida que en Android.

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

Las pruebas (`pruebas/`) cubren el aprendizaje (orden, repasos y opciones), la
respuesta escrita (teclado, tiempo, ayuda y florecer), la didáctica
(rectángulo de ayuda, trucos, tablas del 1 al 9, estados del mapa y lo
guardado por la versión anterior), el
uso con teclado y en tableta, la accesibilidad (axe, WCAG 2.1 AA), el modo sin
internet y la voz. Si Chromium está instalado fuera de la caché de Playwright,
su ruta se indica con `CHROMIUM_RUTA`.

Lo que cuenta como «rápido» para florecer es la constante `RAPIDO_MS` de
`index.html` (6000 ms, medidos desde que aparece la pregunta: incluye leerla o
oírla y teclear la respuesta). Las pruebas de `pruebas/didactica.spec.mjs`
fijan las reglas de cada estado.

Las velocidades de la voz se definen en la constante `VELOCIDADES` de
`index.html`; es el único sitio que hay que tocar para ajustarlas. Las pruebas
de `pruebas/audio.spec.mjs` comprueban esos valores, así que hay que cambiarlas
a la vez.

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
