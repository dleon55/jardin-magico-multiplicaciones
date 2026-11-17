# Guía de estilo visual

Reglas para que todo el arte del juego (la mascota, héroes, enemigos, plantas,
paisajes e iconos) se vea del **mismo juego**. Es la tarea F1.1 del
[plan](PLAN.md) ([#48](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/48)).
Cada regla es medible, para poder revisar un dibujo nuevo contra ella.

## La idea

**Un jardín mágico hecho a mano:** formas redondas y gorditas, contorno oscuro
y cálido, colores planos con una sola sombra y un brillo. Amable, nunca de
miedo; claro antes que detallado. Público: de 8 a 12 años, niñas y niños por
igual.

La **operación** es siempre lo más importante de la pantalla. El arte
acompaña y no compite: los fondos son claros y de poco contraste, y los
números van sobre papel liso.

## Colores

Están definidos como variables CSS en `:root` (en `juego.css`). Úsalas en
lugar de escribir colores sueltos.

### Base de la interfaz

| Variable | Color | Uso |
|----------|-------|-----|
| `--hoja` | `#047857` | Color principal: botones primarios, elegido, barra del navegador |
| `--hoja-clara` | `#d1fae5` | Fondos de lo elegido y de los aciertos |
| `--cielo` | `#0369a1` | Enlaces y acciones secundarias |
| `--cielo-claro` | `#e0f2fe` | Fondos de información |
| `--sol` | `#facc15` | Estrellas, monedas, premios |
| `--sol-oscuro` | `#a16207` | Texto sobre fondos amarillos |
| `--flor` | `#be185d` | Foco del teclado y avisos suaves |
| `--tierra` | `#78350f` | Texto sobre fondos cálidos |
| `--tinta` | `#1f2937` | Texto principal |
| `--tinta-suave` | `#4b5563` | Texto secundario (contraste AA sobre blanco) |
| `--papel` | `#fffdf7` | Tarjetas y fondo de los números |

### Arte

| Variable | Color | Uso |
|----------|-------|-----|
| `--contorno` | `#2e2a3b` | El contorno de todos los dibujos: oscuro y cálido, nunca negro puro |
| `--brillo` | `#ffffff` al 55 % | El brillo de arriba a la izquierda |
| `--sombra-arte` | `#2e2a3b` al 18 % | La sombra plana de abajo a la derecha |
| `--mejilla` | `#fb7185` al 55 % | Mejillas de personajes |

Cada mundo conserva sus colores de fondo (ver `body[data-mundo=…]`). El arte
de un mundo usa **como mucho 5 colores propios** además del contorno, el
brillo y la sombra.

## Letra

- **Títulos y números grandes:** Fredoka One (incluida en el juego, sin
  internet).
- **Texto:** Quicksand, en negrita (600–700) para que se lea bien en pantallas
  pequeñas.
- **Tamaño mínimo** de texto que el niño necesita leer: 16 px. Operaciones:
  32 px o más en la partida.

## Formas

- **Esquinas:** tarjetas con radio de 1 rem (16 px), botones con 1 rem o
  redondos, fichas con 0.75 rem.
- **Bordes de la interfaz:** 2 a 3 px.
- **Relieve de los botones:** la sombra inferior de 4 px que ya usan; al
  tocar, se hunden 2 px.
- **Tamaño táctil:** 44 × 44 px como mínimo para todo lo que se toca.

## Reglas del dibujo (SVG)

1. **Lienzo de 100 × 100** (`viewBox="0 0 100 100"`) para personajes e
   iconos grandes; el dibujo deja 4 unidades de margen.
2. **Contorno** de 3 unidades (`stroke-width="3"`) en `--contorno`, con
   `stroke-linejoin="round"` y `stroke-linecap="round"`. Los iconos pequeños
   (24 × 24) llevan 2.
3. **Relleno plano** con una sola sombra: una forma del mismo color, más
   oscura, abajo a la derecha, y un brillo blanco **arriba a la izquierda**,
   como si la luz viniera de ahí. Sin degradados en los personajes (sí en los
   cielos).
4. **Formas redondas:** el cuerpo cabe en un círculo o una gota; sin puntas
   agresivas. Los enemigos pueden tener cuernos o antenas, siempre romos.
5. **Ojos grandes:** de 1/6 a 1/5 del ancho de la cara, con un punto de brillo
   blanco. Las expresiones cambian sobre todo con ojos, cejas y boca.
6. **Proporción de personaje:** cabeza grande (la mitad o más de la altura),
   cuerpo pequeño, brazos y piernas cortos.
7. **Legible a 48 px:** si a ese tamaño no se reconoce, sobra detalle.
8. **Accesibilidad:** todo dibujo decorativo lleva `aria-hidden="true"`; lo
   que comunica (acierto, nivel, nombre del personaje) va también en texto.
9. **Reutilizar:** las piezas que se repiten se definen una vez con
   `<symbol>` y se usan con `<use href="#…">`.
10. **Sin internet:** todo va dentro del HTML, sin imágenes externas.

## Iconos

La interfaz usa un solo juego de símbolos SVG (`<symbol id="i-…">`, al principio
del `<body>`), no emojis. Hay 28: volver, siguiente, estrella, corazón (lleno y
vacío), ajustes, ayuda, lanzar, borrar, goma, listo, voz, habla, efectos,
música, velocidad, calma, candado, corona, compartir, mapa, jardín, vivero, los
tres modos (teclear, elegir y dedo), girar y adultos.

- Se usan con `<svg class="icono" aria-hidden="true" focusable="false"><use href="#i-nombre"/></svg>`,
  o desde el código con `icono("nombre")`.
- Lienzo de 24 × 24 y contorno de 2 (1,8 en los rellenos).
- Los de línea (siguiente, listo, compartir, modos y girar) usan
  `currentColor`, para tomar el color del botón.
- Son decorativos: el nombre lo da el texto del botón o su `aria-label`.
- Miden lo que la letra (1,25 em). En las teclas no pasan de 1 em de alto, para
  que la fila no crezca.
- Los emojis siguen donde son contenido: lo que crece en cada mundo, los
  personajes del jardín y las frases.

## Movimiento

- **Corto:** de 150 a 600 ms para reacciones y hasta 1.2 s para celebraciones
  grandes.
- **Suave:** `ease-out` al entrar y rebote ligero en los personajes.
- **Respirar:** los personajes quietos se mueven poco (2 a 3 % de escala cada
  3 a 4 s) y parpadean cada 4 a 6 s.
- **«Menos movimiento»** (`prefers-reduced-motion` o el ajuste del juego)
  apaga todo; la expresión cambia sin animar.
- Nada parpadea más de 3 veces por segundo.

## La mascota: Lumi

Lumi es una **semilla mágica** que acaba de brotar. Es la guía del jardín:
- saluda;
- explica;
- anima cuando algo sale mal;
- celebra lo aprendido.

Lumi tiene un cuerpo redondo como un frijol, dos hojitas en la cabeza y, en la
punta del tallo, una chispa de luz: la magia del jardín. No es niña ni niño. Es
original y no se parece a ningún personaje de otro juego.

| Parte | Color |
|-------|-------|
| Cuerpo | `#f4c27a` (semilla tostada), sombra `#d99a4e` |
| Hojas | `#4ade80`, sombra `#16a34a` |
| Chispa | `--sol` con halo blanco |
| Mejillas | `--mejilla` |

**Expresiones:**

| Nombre | Cuándo | Cara |
|--------|--------|------|
| `contenta` | En reposo | Ojos abiertos, sonrisa |
| `pensando` | Al pedir ayuda | Ojos mirando arriba, boca de lado, una hoja levantada |
| `animando` | Tras un fallo | Cejas arriba, sonrisa pequeña, brazo en puño («¡casi!») |
| `celebrando` | Acierto en racha, nivel superado | Ojos cerrados de felicidad, boca abierta, brazos arriba, chispa más grande |
| `sorprendida` | Florecer, récord | Ojos muy abiertos, boca en «o» |
| `durmiendo` | Bienvenida sin tocar | Ojos cerrados en línea, «z» flotando |

**Voz y tono:**
- frases cortas, de tú y en positivo;
- nunca regaña: «¡Casi! Mira: 7 × 8 es una vez más 7 que 7 × 7»;
- celebra el esfuerzo, no solo el acierto.

## Cómo revisar un dibujo nuevo

- [ ] Contorno de 3 (o 2 en iconos de 24) en `--contorno`, puntas redondas.
- [ ] Una sombra plana y un brillo; sin degradados en personajes.
- [ ] Como mucho 5 colores propios.
- [ ] Se reconoce a 48 px.
- [ ] `aria-hidden` y el significado también en texto.
- [ ] Su animación se apaga con «Menos movimiento».
- [ ] Se ve igual en iPhone, Android y computadora (no depende de emojis).
