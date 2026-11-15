# Historial de cambios

Lo que cambió en el juego, de lo más nuevo a lo más antiguo, con el PR de cada
cambio. El estado actual y los pendientes están en el
[issue de estado](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/20).

Cada versión publicada se reconoce por el sello de `sw.js`: el sitio en vivo
está al día cuando su `sw.js` tiene el mismo sello que `main`.

## 2026-11-15

- **Música más larga** (#42): cada una de las 15 piezas suena en cuatro
  partes, como una canción (el tema, la respuesta una tercera arriba, el tema
  más agudo y un respiro), y tarda de 63 a 111 segundos en repetirse (antes,
  de 16 a 28).
- **Una música para cada mundo del jardín** (#41): campirana en el huerto,
  suave en el bosque, con pasos grandes entre dinosaurios, flotante en el
  espacio, como olas en el mar, de rancho en la granja, con sabor árabe en el
  desierto y dulce entre flores. Más tranquilas que las de la Aventura;
  cambian al guardar otro mundo.
- **Volumen de la música** (#40): en Ajustes, de 0 a 10 (5, el de antes). Se
  oye al momento mientras se desliza y se recuerda; subirlo con la música
  apagada la enciende.
- **Una música para cada mundo de la Aventura** (#39): alegre con los
  brócolis, saltarina con los monstruos, misteriosa con los fantasmas, menor y
  apurada con los zombis, «espacial» con los aliens y lenta, como olas, en el
  mar. Todas al mismo volumen.
- **Mejor en el teléfono, y con música** (#38), tras jugarlo el titular en su móvil:
  - el teclado de la Aventura tiene la distribución de un teléfono (1 2 3 / 4 5 6 / 7 8 9 / ⌫ 0 ✨), como el del juego; antes iba en cuatro columnas;
  - tocar ya no mueve la pantalla: sin zoom por doble toque, y los teclados, las opciones y la arena no desplazan la página;
  - **música de fondo** original, tranquila en el jardín y con ritmo en la Aventura; baja mientras habla la voz, se calla al cambiar de app y se apaga en Ajustes («🎶 Música»).
- **Cabecera del menú y misión del día más claras** (#37):
  - la cabecera es del niño: su nombre, sus estrellas y dos botones («Cambiar de jugador», «Mi mundo y mi personaje»); «Para las personas adultas» pasa al final del menú, como en la bienvenida;
  - la semana de la misión dice qué es («Tu semana: cada ✓ es un día con la misión cumplida»), marca «Hoy» y deja vacíos los días sin misión (antes, un «·» que parecía un botón).
- **Revisión de usabilidad** (#36), tras recorrer cada pantalla en tableta y teléfono:
  - «Ajustes» ya no tapa las cabeceras (estrellas de la partida, corazones y puntos del nivel);
  - el menú, por secciones: tablas, «Juegos y retos» y «Tu progreso»; los subtítulos, en la letra del juego;
  - la respuesta se dice justo debajo de las opciones, no bajo la ayuda;
  - el aviso de que equivocarse no quita nada sale solo al empezar la partida;
  - en fracciones, retos y problemas, el girasol se hace pequeño y las opciones suben;
  - «Descubre la tabla» dice «4 × 3 = 12: 3 veces 4»: antes decía «3 filas de 4: 4 × 3», al revés que la ayuda;
  - en el teléfono, un nivel de la Aventura cabe entero (antes había que desplazarse para teclear mientras los enemigos avanzaban);
  - al terminar un nivel se quita el teclado, y las estrellas son doradas;
  - cada pantalla empieza arriba;
  - «¡Comenzar a jugar!» en lugar de «¡Comenzar Aventura!», que se confundía con La Aventura;
  - «Tabla del 6» en lugar de «Bancal del 6» en el jardín.
- **🐢 Sin prisa en la Aventura** (#35): los enemigos van a la mitad de
  velocidad y se paran en fila antes de llegar, esperando la respuesta; no
  se pierden corazones por tardar. Avance y estrellas cuentan igual, sin
  premio por rapidez. Por jugador; la vista para adultos lo dice.
- **Aprende la letra de cada niño** (#34): si lee mal, «🤔 ¿Leí mal?
  Enséñame» pide el número con teclas y guarda esas cifras como modelos del
  jugador; desde entonces las lee bien. En el juego y en la Aventura. La
  vista para adultos dice qué aprendió y permite olvidarlo.
- **Escribir con el dedo también en el juego** (#33): al responder escribiendo
  se puede usar el dedo en lugar del teclado de la pantalla. Lo leído se ve y
  solo cuenta al tocar «Listo». Cada jugador elige, y se guarda en su jardín
  y en la copia de seguridad.
- **Presentación más viva** (#32):
  - cada mundo tiene su paisaje de fondo (colinas de su color y adornos que flotan);
  - cada pantalla entra con un fundido corto y las tablas del menú aparecen una tras otra;
  - los botones tienen relieve, se hunden al tocarlos y dejan una onda;
  - el color de la barra del navegador pasa de rosa a verde.

  «Menos movimiento» lo apaga todo.

## 2026-11-14

- **✍️ Escribir con el dedo en La Aventura** (#31): un tercer modo para
  responder, además de teclear y elegir. El juego reconoce las cifras sin
  internet y las muestra; solo se lanza al tocar «¡Lanzar!», así que una
  mala lectura no cuesta un corazón. El modo elegido se recuerda.
- **🐾 La Aventura** (#30): un animalito con su varita contra enemigos con
  operaciones, en 6 mundos (brócolis, monstruos, fantasmas, zombis, aliens y
  criaturas del mar) de menor a mayor dificultad, con 3 niveles y un jefe
  cada uno. Puntos, estrellas y avance guardados por jugador, e imagen para
  compartir el puntaje.
- **Fracciones y retos en la vista para adultos** (#29): aciertos por clase,
  cuál cuesta más y dónde practicarla sola; cuentan como días de práctica.
- **Fracciones por clase** (#28): al tocar «🍕 Fracciones» se elige todo
  mezclado o una sola clase (de un número, equivalentes, comparar, sumar y
  restar, distinto denominador), con 10 preguntas de esa clase.
- **Sumar fracciones con distinto denominador** (#27), dentro de
  «🍕 Fracciones»: 1/2 + 1/4 y 1/2 + 1/3, pasándolas al común (hasta 12), con
  la opción falsa de sumar arriba y abajo y una tira vacía en el común para
  contar. La partida queda en 3 de un número, 2 equivalentes, 1 comparar, 2
  con el mismo denominador y 2 con distinto.
- **Sumar y restar fracciones con el mismo denominador** (#26), dentro de
  «🍕 Fracciones»: 2/7 + 3/7 y 5/8 − 2/8, con la opción falsa de sumar
  también los de abajo y tiras en la ayuda. La partida queda en 3 de un
  número, 2 equivalentes, 2 comparar y 3 de sumar o restar.
- **Fracciones equivalentes y comparar fracciones** (#25), dentro de
  «🍕 Fracciones»: «¿Cuál es igual a 1/2?» y «¿Cuál es la más grande?», con
  tiras del mismo largo en la ayuda y las opciones falsas de los errores
  típicos (sumar lo mismo arriba y abajo; creer que 1/5 > 1/3).
- **🍕 Fracciones de un número** (#24), para 4.º a 6.º: 1/4 de 24 y 3/4 de
  24, con el rectángulo repartido en partes iguales y las opciones falsas
  de los errores típicos. No cuenta para el mapa ni el jardín.
- **🧩 Retos de lógica** (#23). Una partida nueva que pide pensar con las
  tablas: ¿cuál da más?, el número misterioso, ¿qué número falta?, partir una
  multiplicación y el intruso. No cuenta para el mapa ni el jardín.
- **Tres mundos más** (#22): espacio 🚀, fondo del mar 🐠 y granja 🐄. Ya
  son ocho mundos para elegir.

## 2026-11-13

- **Cuidar el progreso** (#21). En «Para las personas adultas»:
  - una copia de seguridad que se guarda como archivo y se recupera en el
    mismo dispositivo o en otro, sin servidor ni cuentas;
  - en iPad o iPhone sin instalar, un aviso de cómo instalarlo, porque Safari
    borra lo de un sitio que pasa 7 días sin abrirse;
  - el juego pide al navegador que conserve los datos.

  Correcciones de una revisión independiente del código:
  - dos niños sin nombre acababan en el mismo jardín;
  - una copia con fechas inexistentes bloqueaba la vista para adultos;
  - en la victoria, Enter no activaba los botones;
  - se aceptaban copias sin jardines, que lo borraban todo;
  - un fallo a medias al recuperar perdía datos (ahora no cambia nada);
  - datos dañados daban estrellas negativas o rompían la misión;
  - textos de la vista para adultos;
  - el permiso para conservar los datos ahora se pide en la vista para
    adultos, no al abrir el juego.
- **Para todos: presentación neutra y mundos** (#19).
  - Colores verde, cielo y tierra en lugar del rosa protagonista.
  - Cinco mundos a elegir (huerto, bosque, selva de dinosaurios, desierto y
    jardín de flores) y 12 personajes.
  - El vivero suma premios más variados.
- **La ayuda parte de lo que ya se sabe** (#18).
  - Ejemplo: «7 × 7 = 49, entonces 7 × 8 es una vez más 7».
  - Arreglo aparte: cuatro pruebas dependían de la fecha real.
- **Mantenimiento:** postcss-selector-parser pasa a 6.1.5, un parche de
  seguridad que solo afecta a la construcción (#11).
- **Un jardín por niño en el mismo dispositivo y vista para adultos** (#17).
  «Cambiar de jugador» ya no borra nada.
- **Descubrir cada tabla antes de practicarla** (#16).

## 2026-11-07 y 08

- **Dividir como multiplicar al revés, y problemas cortos** (#15).
- **Estrellas que se gastan en el vivero y misión del día** (#14).

## 2026-11-03

- **El jardín que crece con lo aprendido** (#13).
  - 7 × 8 y 8 × 7 son la misma planta: 54 en total.
  - Nueva pantalla «Mi jardín».
  - Las flores que no se repasan se marchitan.
- **Tablas del 1 al 9, responder escribiendo y florecer al saberla de
  memoria** (#12).

## 2026-10

- **CI local** (#10, #9, #8). Por falta de presupuesto de GitHub Actions, la
  compuerta es `npm run comprobar` y el flujo solo se lanza a mano.
- **Practicar lo que falta y victoria con lo aprendido** (#7).
- **Didáctica** (#6): ayuda en rectángulo, trucos por tabla y mapa de lo que
  ya se sabe.
- **Voz con tres velocidades** (#4, #5).
- **Dependabot mantiene Tailwind en la versión 3** (#3).
- **Primera versión con pruebas** (#1): aprendizaje, experiencia de uso,
  audio, modo sin internet y CI.
