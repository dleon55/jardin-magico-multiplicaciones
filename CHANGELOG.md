# Historial de cambios

Lo que cambió en el juego, de lo más nuevo a lo más antiguo, con el PR de cada
cambio. El estado actual y los pendientes están en el
[issue de estado](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/20).

Cada versión publicada se reconoce por el sello de `sw.js`: el sitio en vivo
está al día cuando su `sw.js` tiene el mismo sello que `main`.

## 2026-11-28

- **`index.html` partido, primera parte** (#154, Hito 7.7): ocho secciones del
  script principal salieron a `js/juego-*.js` (misión y vivero, fracciones y
  división, la ayuda que se toca, copias y actividad de adultos, la pantalla
  de retos, Lumi crece, la Aventura y los trazos). No cambia nada de lo que
  hace el juego. `index.html` pasa de 568 a 405 KB (de 140 a 99 comprimido);
  lo que se descarga en total queda igual.

## 2026-11-27

- **Listo para escuelas** (#153, Hito 7): lo que necesita una docente o una
  familia que no conoce el juego.
  - **Ayuda** en «Para las personas adultas»: seis preguntas que se abren al
    tocarlas (por dónde empezar, los tres tonos, cuándo florece una
    multiplicación, cómo usarlo con un grupo, varios jardines en un aparato,
    qué se guarda y dónde).
  - **Jardín de ejemplo**: un botón crea un jardín «Ejemplo» ya avanzado
    (tres tablas sabidas, una a medias, tropiezos y varios días de práctica)
    para ver el juego sin tocar el de nadie. Se borra como cualquier jardín.
  - La vista de adultos y el informe cuentan también **«Antes de
    multiplicar»** y el **repaso de la semana**.
  - `docs/PRUEBAS-CON-NINOS.md`, al día con el juego de hoy: once tareas.
  - `docs/para-escuelas.html`: carta de presentación y hoja para docentes con
    el código QR, para imprimir.

## 2026-11-26

- **Revisión de los Hitos 4 a 6** (#152): se recorrió todo lo nuevo como quien
  juega (31 estados, en teléfono, teléfono grande, acostado y tableta, en los
  tres tonos) midiendo desbordes, botones chicos, textos cortados y
  accesibilidad, y mirando las capturas. No había nada roto; se corrigieron
  siete detalles:
  - El botón de la expedición decía «Salir de expedición», que se lee como
    irse: ahora dice «Empezar la expedición».
  - En Brote sin voz, la flecha seguía señalando la expedición ya hecha.
  - Lumi decía «sabes las ocho tablas» junto a un mapa que dice «9 de 9»:
    ahora dice «todas las tablas».
  - En los retos, la explicación de qué es un reto se quita al jugar y al
    terminar.
  - Con el teléfono acostado, un reto y «Antes de multiplicar» se responden
    sin desplazarse: pregunta o dibujo a la izquierda, respuestas a la derecha.
  - Los personajes de la bienvenida y de «Mi mundo y mi personaje» medían 38 px
    de ancho en teléfonos angostos (venía de antes): ahora van de cinco en
    cinco y pasan de 44 px.

## 2026-11-23

- **Antes de multiplicar** (#151, Hito 6.7): un juego propio para el tono
  Brote, para quien aún no llega a las tablas.
  - Tres ideas que las preparan, con dibujo y para elegir entre tres: contar
    a saltos (de 2, 5, 10 o 3), grupos iguales (filas de puntos) y dobles.
  - Rondas de seis preguntas, una oportunidad cada una, dichas en voz. Las
    opciones falsas son los tropiezos de siempre, cada uno con su
    explicación.
  - Cada acierto da una estrella y cuenta para la meta del día; no toca el
    jardín ni el mapa. Vive en `js/semillero.js`.
- **Repaso de la semana** (#150, Hito 6.6): cuando ya se saben las ocho
  tablas, una vez por semana el inicio propone diez preguntas de todas
  mezcladas (el Desafío del Arcoíris).
  - Al ganarlo se anota la semana, hay 5 estrellas y el sol del mundo brilla
    con rayos hasta el lunes siguiente.
  - Complementa al riego: las flores ya se marchitaban si no se practican;
    el repaso se adelanta. Las semanas son de cada jardín y van en la copia.
- **Hoja para el salón** (#149, Hito 6.5): al terminar un reto, «Imprimir
  la hoja» arma una hoja carta con el QR, el código y el enlace para quien
  tiene aparato, y las diez preguntas con su renglón para quien no. Sin
  respuestas y sin datos de quien creó el reto. Se imprime o se guarda como
  PDF con el diálogo del navegador.
- **Brote sin voz** (#148, Hito 6.4): Brote se apoya en la voz; si está
  apagada o el aparato no tiene voz en español, una flecha señala el botón
  de la expedición. Sale también si se sabe tarde que no hay voz, y se queda
  quieta con «Menos movimiento». Explora y Pro no cambian.
- **Candado sencillo en la pantalla de adultos** (#147, Hito 6.3): para
  entrar a «Para las personas adultas» hay que mantener presionado un
  momento (1,5 s); un toque corto solo lo explica.
  - Con el teclado o un lector de pantalla se activa dos veces.
  - Se puede quitar desde dentro («Pedir mantener presionado») y se recuerda
    en el dispositivo.
- **Lumi se equivoca como quien juega** (#146, Hito 6.2): en «Enséñale a
  Lumi», Lumi repite los errores que quien juega ha tenido en las tablas (de
  lo que aún no florece), tomados de los tres más repetidos.
  - Al corregirla, la explicación depende de la confusión: la de al lado,
    sumar, las cifras al revés u otra de la misma tabla.
  - Entran en la ronda tanto como las tablas. No se dice de quién era el
    error, y corregir a Lumi no cambia lo guardado.

## 2026-11-22

- **Presupuesto de peso** (#144, Hito 5.7): sin cambios en el juego.
  - Una prueba pone tope a lo que se descarga la primera vez, comprimido
    como lo sirve el sitio: 165 KB para `index.html` y 270 KB de texto en
    total (hoy, 135 y 224), más las fuentes y los iconos.
  - `herramientas/medir-carga.mjs` mide la carga con el procesador frenado y
    red lenta. En el sitio publicado, con 4× y 4G lenta: listo en 1,9 s.
  - Se quitaron 12 capturas de pantalla sueltas (2,6 MB) que estaban en la
    raíz del repositorio desde la bienvenida guiada y se publicaban con el
    sitio; una prueba vigila que no vuelvan.
- **Un mundo más vivo** (#143, Hito 5.6):
  - El sol late, la niebla deriva, las zetas flotan y las flores y los
    banderines se mecen: despacio, solo con `transform`, y nada con «Menos
    movimiento».
  - Abrir un lugar tiene su sonido.
  - Con tres días seguidos cumpliendo la meta, sale un arcoíris en el cielo
    del mundo; al romperse la racha, se va.
- **Retos para el salón: código QR** (#142, Hito 5.5): al terminar un reto,
  «Mostrar código QR» abre en grande el QR de su enlace, con las tablas, la
  marca a vencer y el código escrito, para proyectarlo y abrirlo con la
  cámara.
  - El juego dibuja el QR por sí mismo (`js/qr.js`): sin bibliotecas y sin
    internet. Modo de bytes, corrección M, versiones 1 a 10 (hasta 213 bytes).
  - Se cierra con el botón o con Escape y el foco vuelve al botón.
- **Ajustes para adultos** (#141, Hito 5.4):
  - «Menú en lista» sale de Ajustes y pasa a la pantalla «Para las personas
    adultas», con su explicación: ya no está a mano de quien juega para
    saltarse los lugares dormidos.
  - «Cuándo practica» (en la vista de adultos y el informe) cuenta también
    los días en que solo se jugó «Enséñale a Lumi», una expedición o un reto.
- **La bienvenida presenta el mundo y el tono** (#140, Hito 5.3): la guía
  del primer día pasa de 5 a 7 pasos.
  - Un paso pregunta cómo se quiere jugar (Brote, Explora o Pro, con Explora
    marcado) y lo elegido queda en el jardín.
  - El último paso muestra el mundo en pequeño, con el huerto despierto y el
    bosque dormido, antes de ir a la primera tabla.
  - Sigue cabiendo sin desplazarse en teléfono vertical y acostado, y se
    puede saltar.
- **Brote sin leer** (#139, Hito 5.2): el tono Brote, para quien aún no lee.
  - Dice en voz lo que toca hoy (al entrar y al volver al inicio) y el
    resumen de «Mi progreso».
  - Las partidas son de 5 aciertos en vez de 10 (en equipo siguen en 10) y
    las rondas de «Enséñale a Lumi», de 3 dudas.
  - No ofrece los retos con código, que piden leer y escribir un código.
  - Explora y Pro no cambian.
- **Compuerta más rápida y plan del Hito 5** (#138): las pruebas corren con
  un proceso por núcleo (de 28 a 23 minutos en 4 núcleos; `PROCESOS=2`
  vuelve a lo de antes). Una prueba de animaciones dependía de la velocidad
  de la máquina y se corrigió. El plan (`docs/PLAN.md`) suma el Hito 5, el
  cronograma y las ocho etapas de cada tarea. Sin cambios en el juego.
- **Lo nuevo, a la vista de las personas adultas** (#135): «Enséñale a
  Lumi», la Expedición de hoy y los retos con código salen en la vista para
  adultos y en el informe imprimible.
  - Enséñale a Lumi: rondas, dudas resueltas y cuántos errores de Lumi se
    notaron. Expedición: días completos y el último. Retos: aciertos, retos
    jugados y marcas superadas.
  - Como esas actividades no tocan el jardín, su cuenta se lleva aparte
    (clave `actividad`, de cada jardín, en la copia de seguridad). Empieza a
    contar desde esta versión.
- **Inicio simple** (#133): con el mundo a la vista, menos cosas antes del
  mapa.
  - La Expedición de hoy ocupa el lugar de «Seguir»: una sola propuesta
    arriba, con Lumi. Si lo que tocaba era la Aventura (un mundo recién
    abierto), la tarjeta lo ofrece en un botón aparte. En un jardín sin nada
    jugado sigue «Seguir», con el diagnóstico.
  - La meta del día va compacta (sin la semana) y después del mundo; el
    encabezado ya no lleva el lema.
  - En el teléfono, el título del mundo y el arranque del mapa se ven sin
    desplazarse. Con el «Menú en lista», todo queda como estaba.
- **Mi progreso** (#130, Hito 4.7): el camino, el jardín, el mapa de tablas
  y el vivero, resumidos en una sola pantalla.
  - Cada tarjeta dice lo suyo de un vistazo: tramos del camino con su barra,
    plantas por estado, una ficha por tabla (la sabes, empezada, nueva) y
    las estrellas con lo siguiente del vivero. Arriba, Lumi y su etapa;
    abajo, los banderines y la racha de metas.
  - Tocar una tarjeta abre la pantalla completa de siempre, y «Menú» vuelve
    a Mi progreso.
  - Con el mundo a la vista sustituye a los cuatro botones del inicio; con
    el «Menú en lista», esos botones siguen. No guarda nada nuevo.

## 2026-11-21

- **Retos con código** (#128, Hito 4.6): diez multiplicaciones que se
  mandan con un código de seis signos o un enlace (`?reto=CÓDIGO`).
  - Sin cuentas ni servidor: el código dice las tablas, las preguntas (una
    semilla) y la marca a vencer. No lleva nombres ni nada de quien lo creó.
  - Quien lo recibe juega las mismas diez preguntas, con las mismas
    opciones, una oportunidad cada una; al final se compara con la marca y
    recibe su propio código para la revancha.
  - El reto nuevo usa las tablas ya empezadas. «Copiar enlace» en todos
    lados y «Compartir» donde el aparato lo ofrece.
  - Cada acierto da una estrella y cuenta para la meta del día; no toca el
    jardín ni el mapa, y no guarda nada. Vive en `js/retos.js`.
- **Expedición de hoy** (#126, Hito 4.5): un recorrido corto en dos
  paradas que deja algo nuevo en el mundo.
  - Primera parada: lo que toca aprender (lo que propone «Seguir», pero
    siempre una partida de tablas, nunca la Aventura). Segunda: una ronda de
    «Enséñale a Lumi». La victoria de la primera ofrece la segunda.
  - Al completarla se planta un banderín en el mundo: uno por día, con 5
    estrellas la primera vez del día. Se puede repetir, y dejarla a medias
    no quita nada.
  - La tarjeta está sobre el mapa del mundo; con el menú en lista, «Seguir»
    queda como estaba. En un jardín sin nada jugado va primero el
    diagnóstico. Los banderines son de cada jardín y van en la copia.
- **Enséñale a Lumi** (#124, Hito 4.4): Lumi da su respuesta a una
  pregunta y quien juega dice si está bien; si no, le enseña la buena.
  - Lumi se equivoca con los errores típicos que el juego ya conoce (las
    opciones falsas de cada tema, con su explicación) y una de cada cuatro
    veces acierta, para que no baste decir siempre «no».
  - Las preguntas salen de lo que se tiene a la mano: las tablas empezadas
    y los temas de los lugares despiertos.
  - Rondas de cinco dudas. Cada una resuelta a la primera da una estrella y
    cuenta para la meta del día; no toca el jardín ni el mapa.
  - Está bajo el mundo y en la lista. Vive en `js/ensenar.js`.
- **Los tres tonos** (#122, Hito 4.3): el mismo juego para distintas
  edades. Lo elige quien juega, en la bienvenida o en «Mi mundo y mi
  personaje», y es de cada jardín.
  - **Brote:** rótulos de una palabra, más grandes y sin letra chica; Lumi
    más grande.
  - **Explora:** el de siempre. Es el que queda si no se elige.
  - **Pro:** el mundo de noche, letra sobria, «Correcto.» en lugar de
    felicitaciones con emojis, la precisión de lo respondido y el tiempo de
    cada partida contra la mejor marca propia (nunca contra otros). Con
    «Sin prisa» o en equipo no se mide el tiempo.
  - Los tonos no llevan la edad escrita: nadie tiene que sentirse «de
    kínder».
- **Lumi crece contigo** (#120, Hito 4.2): Lumi pasa de semilla a brote,
  plantita, arbolito y árbol en flor según las tablas del 2 al 9 que se
  saben (con 2, 4, 6 y 8).
  - Cada etapa le suma algo: hojitas, hojas grandes, frutos y una flor. Se
    ve en todas partes donde aparece Lumi, y más grande en el mundo.
  - Al crecer, lo dice una vez al volver al inicio, en texto y en voz.
  - El mundo dice en qué etapa va y cuántas tablas faltan para la siguiente.
  - Nunca encoge: se guarda la etapa más alta de cada jardín (va en la copia
    de seguridad). En la bienvenida, Lumi es semilla.
- **El mundo vivo, parte 1** (#118, Hito 4): el inicio deja de ser una
  lista de unos 20 botones y pasa a ser un mundo que se recorre.
  - Cinco lugares, de lo más fácil a lo más avanzado: Huerto de las tablas,
    Bosque de dividir, Río de los números, Jardín de las partes y Mercado y
    reloj. Tocar uno abre sus juegos, cada uno con su dibujo.
  - Los lugares despiertan con las tablas que se saben; dormidos, se ven
    bajo la niebla y dicen qué falta. Quien ya jugaba un tema lo conserva.
  - El camino florece con lo aprendido y Lumi está junto al último lugar
    despierto.
  - «Menú en lista», en Ajustes, deja la lista de siempre (sin nada
    dormido), para lectores de pantalla y personas adultas.
  - Vive en `js/mundo.js`. Las pruebas de siempre usan la lista; el mundo
    tiene las suyas (`pruebas/mundo-vivo.spec.mjs`).
- **Detalles de la revisión visual** (#116, tarea #114):
  - En «Mi jardín», en el teléfono, «Tabla del 1 · Semilla» y «Ver la tabla
    del 1» ya no se parten a la mitad: cada parte va entera y el enlace baja
    a la derecha si no cabe.
  - Las fichas de mundo de una fila miden lo mismo, y los 13 personajes van
    en dos renglones (7 y 6), sin uno solo abajo.
  - En equipo, con un solo jugador las tablas se ven en espera (borde
    punteado y «Primero marquen al menos a dos»); al tocarlas siguen diciendo
    qué falta.
  - Lo que se cuenta en el jardín es de cada mundo: «0 de 54 dinosaurios»,
    «estrellas», «peces»… Los nombres del avance de cada tabla (semilla,
    arbolito, árbol) se quedan iguales en todos los mundos, porque son los
    mismos que lee el adulto en el informe.
  - El bancal de la partida dice «Aquí crece lo que aciertes» mientras está
    vacío, se pinta del color de cada mundo (azul noche en el espacio, mar en
    el fondo del mar) y lo riega el personaje de quien juega.

## 2026-11-19

- **Lo que quedó de la revisión visual** (#115, tarea #114):
  - **Una sola regla para dibujar la multiplicación: a × b son a filas de
    b.** «Descubre la tabla» decía «7 × 3: 3 veces 7» con 3 filas de 7; ahora
    dice «3 × 7 = 21: 3 filas de 7», como la ayuda de la partida. La regla
    está en la guía de estilo.
  - El jardinero, el personaje con que se empieza, está en la lista de «Mi
    personaje» y aparece marcado. En equipo, a quien se suma le toca un
    personaje que nadie usa.
  - En la Aventura, lo cerrado se lee (borde punteado y candado, sin
    desvanecerse), las estrellas son más grandes y «Compartir mi puntaje»
    aparece solo con puntaje.
  - La vista para adultos: un tema por tarjeta, con una pastilla por clase
    (verde, ámbar o rosa según cómo va) y «Le cuesta más» aparte; los 14 días
    en dos semanas de 7; «Todo se guarda solo en este dispositivo» una vez.
  - En el vivero, sin estrellas se dice solo el precio, y los botones miden
    44 px de alto.
- **Revisión visual completa** (#113): 248 capturas de todas las pantallas
  en teléfono vertical, teléfono acostado y tableta. Lo que se veía roto:
  - en la Aventura acostada, «¡Lanzar!» se salía de su botón;
  - en el teléfono vertical, al escribir la respuesta, «Listo» quedaba
    debajo de la orilla: ahora el girasol se achica y el aviso verde se
    quita mientras se escribe;
  - en el menú acostado, «La Aventura», el Desafío y «Tu progreso» se
    encogían al ancho de su texto;
  - el gusanito de la barra de avance se salía por la izquierda;
  - en el teléfono acostado, el globo de Lumi tapaba la primera respuesta;
  - en las respuestas largas, el número de tecla se pegaba al texto
    («¹1, sobran 6» se leía «11»);
  - «7 filas de 1 puntos».

  Y lo mejorable: la ayuda se desplaza a la vista al abrirla, el botón de
  Ajustes ya no salta al abrirlo (y el panel se desplaza por dentro si no
  cabe), sin tarjetas sueltas a media anchura en «Juegos y retos», textos
  que ya no dejan una palabra sola en el renglón, y la frase con que Lumi
  presenta el tema ya no se repite escrita bajo las respuestas (queda para
  el lector de pantalla).
- **Lumi en los temas nuevos** (#111, Fase 1). En los ocho temas nuevos,
  Lumi lleva en la mano un objeto del tema (el reloj, el calendario, una
  moneda…), dibujado como ella, en la partida y en la victoria.
  - Al empezar, presenta el tema con una frase en su globo («¡La semana
    tiene 7 días!»).
  - Si se fallan dos seguidas, da un truco corto del tema («Cada 7 días, el
    mismo día»).
  - Las dos frases quedan también escritas, para el lector de pantalla.
  - En las tablas de multiplicar, Lumi sigue igual.

## 2026-11-18

- **El calendario** (#109, tarea #108): días y semanas, qué día será, los
  meses y los días entre dos fechas.
  - Las falsas son los errores típicos (semanas de 10 o de 5 días, contar
    el día de hoy, quedarse en diciembre, «todos los meses tienen 30»,
    25 − 3 = 22 entre meses), cada uno explicado al fallar.
  - Un mes dibujado con solo la primera semana numerada: el 15 se cuenta
    de 7 en 7, no se lee.
  - La ayuda: semanas en filas de 7, la columna del 1, los nudillos de los
    dos puños y el camino de una fecha a otra.
  - Vive en `js/calendario.js`. Las preguntas pueden pedir opciones largas
    (`pregunta.opcionesLargas`), para «miércoles» o «septiembre».

  De paso, con diez temas jugados el informe imprimible volvía a pasar de
  una hoja: ahora «Otros temas y la Aventura» va en dos columnas.
- **Medidas de tiempo** (#106, tarea #105): leer el reloj de manecillas,
  qué hora será, cuánto dura y horas a minutos.
  - Las falsas son los errores típicos (leer el número y no los minutos,
    cambiar las manecillas, «3:70», «75 minutos» de 3:40 a 4:15, «215» por
    2 horas y 15), cada uno explicado al fallar.
  - El reloj es un dibujo propio al lado de la pregunta; el lector de
    pantalla oye dónde están las manecillas, no la hora.
  - La ayuda es el reloj con los minutos, bloques de 5 minutos partidos en
    la hora en punto o cada hora en 12 bloques.
  - Vive en `js/tiempo.js`. Las preguntas pueden llevar un dibujo
    (`pregunta.dibujo`) y pedir opciones de tamaño mediano
    (`pregunta.opcionesMedianas`), para «135 min».
- **Fracciones decimales** (#103, tarea #102): décimos y centésimos, para
  unir las fracciones con el punto decimal.
  - Cuatro clases: fracción a decimal (3/10 → 0.3), decimal a fracción
    (0.25 → 25/100), comparar decimales con fracciones y sumar décimos que
    pasan del entero (0.6 + 0.5 = 1.1).
  - Las falsas son los errores típicos (3/10 = 0.03, 0.25 = 25/10,
    0.65 > 0.7, 0.6 + 0.5 = 0.11), cada uno explicado al fallar.
  - La ayuda es una tira de 10 partes o 100 cuadritos; al comparar, una
    tira por opción.
  - Vive en `js/decimales.js`.

  De paso, el botón de «🍕 Fracciones» tiene su propio `id`, como los demás
  temas: las pruebas lo buscaban por el texto «Fracciones», que ahora
  también está en «Fracciones decimales».
- **Porcentajes** (#100, tarea #71, quinto y último tema de la lista): el
  tanto por ciento de un número, descuentos y fracción ↔ porcentaje, con
  10, 20, 25, 50 y 75 %.
  - Las falsas son los errores típicos (el porcentaje como respuesta,
    restar, la mitad por la cuarta parte, pagar el descuento, «la cuarta
    parte es el 4 %»), cada uno explicado al fallar.
  - La ayuda pinta 100 cuadritos.
  - Vive en `js/porcentajes.js`.

  De paso, el informe imprimible volvía a pasar de una hoja con todos los
  temas jugados. Ahora el apartado «Otros temas y la Aventura» da una línea
  por tema («Fracciones: 30 de 50 bien») y el detalle por clase queda en la
  vista para adultos.
- **Decimales y dinero** (#99, tarea #71, cuarto tema nuevo): sumar precios,
  el cambio, varias cosas iguales y comparar decimales, con pesos y
  centavos.
  - Las falsas son los errores típicos (no llevar el peso, no pedir
    prestado, multiplicar solo los pesos, «más cifras es más grande»), cada
    uno explicado al fallar.
  - La ayuda muestra la cuenta en columnas, los saltos del cambio y tiras
    para los decimales.
  - Vive en `js/dinero.js`.

## 2026-11-17

- **Perímetro y área** (#98, tarea #71, tercer tema nuevo): área, perímetro
  y un lado desde el área, con huertos y patios en metros.
  - Las falsas son los errores típicos (área por perímetro, sumar lados,
    olvidar uno, restar en lugar de dividir), cada uno explicado al fallar.
  - La ayuda dibuja el rectángulo en cuadritos, el mismo de la ayuda de las
    tablas.
  - Vive en `js/area.js`.
- **Múltiplos y divisores** (#97, tarea #71, segundo tema nuevo): «¿Cuál
  es múltiplo de 6?», «¿Cuál es divisor de 24?» y «¿Qué número está en la
  tabla del 4 y en la del 6?».
  - Las falsas son errores típicos (divisor por múltiplo, a uno de la
    tabla, otra tabla, la suma…), cada uno explicado al fallar.
  - La ayuda muestra las tablas como filas de números.
  - Queda en la vista para adultos y en el informe.
  - Es el primer tema en su propio archivo, `js/multiplos.js`.
- **El juego, en varios archivos** (#96): `index.html` pasa de 569 a 445 KB.
  - Los estilos propios van a `juego.css`.
  - El arte (paisajes, Lumi, plantas y Aventura) va a `js/arte.js`.
  - El sonido va a `js/sonido.js`.
  - Los datos (mundos, personajes, héroes y mundos de la Aventura, trucos y
    colores del menú) van a `js/datos.js`.
  - Todo se guarda para jugar sin internet. Una prueba vigila la lista, el
    orden de carga, que nada se defina dos veces y que los archivos aparte
    solo declaren.
  - Tailwind lee también `js/`.
  - El juego no cambia.

## 2026-11-16

- **En equipo** (#94, tarea #70): dos o tres niños se turnan en el mismo
  aparato, sin servidor.
  - En cada turno se carga el jardín de quien contesta, así que su
    progreso, sus estrellas y su meta son suyos.
  - Entre todos riegan 10 plantas, sin comparar a nadie y sin mensajes
    entre niños.
- **Dividir con lo que sobra** (#93, tarea #71, primer tema nuevo de la
  Fase 3): «17 ÷ 5 = 3, y sobran 2».
  - Se elige entre cuatro respuestas, y las falsas son los errores típicos.
  - Al fallar, se explica cuál fue el error.
  - La ayuda dibuja las filas del divisor y lo que sobra aparte.
  - Queda en la vista para adultos y en el informe.
- **Mi camino** (#92, cierra el Hito 2 #46): un solo camino de 15 tramos
  une las tablas del jardín y los mundos de la Aventura.
  - Cada mundo se abre al saberse sus tablas (arbolito o más) y, como
    siempre, al vencer al jefe anterior. El primero está abierto desde el
    primer día.
  - «Seguir» propone el mundo recién abierto hasta jugarlo una vez.
  - Un mundo cerrado dice qué tablas faltan.
  - Lo ya jugado de un mundo no se cierra: nadie pierde su avance.
  - Varias pruebas que jugaban mundos avanzados ahora siembran antes sus
    tablas como sabidas.
- **Informe para imprimir** (#91, tarea #65): en la vista para adultos,
  cada jardín tiene «Imprimir o guardar el informe». Es una hoja carta con:
  - cómo va cada tabla, cuáles domina, lo que le cuesta y lo que se le
    cruza;
  - los días de práctica y la meta;
  - fracciones, retos y Aventura;
  - una idea concreta para casa.

  Se imprime o se guarda como PDF desde el navegador, sin servidor y solo
  con lo que ya está en el aparato.

  De paso, se corrigió un detalle de las confusiones (#85). Con un factor 1,
  sumar y «la de al lado» dan el mismo número: 3 + 1 = 4 = 4 × 1. Ahora se
  nombra la suma, que es lo probable. Una prueba de la respuesta escrita
  fallaba cada vez que salía 3 × 1 por esa frase intercalada; se corrigió.
- **Cada tabla crece por soltura** (#89, tarea #64): semilla, arbolito,
  árbol y árbol con frutos, con un dibujo distinto para cada uno, junto al
  número en el mapa y en cada bancal del jardín.
  - Sube con respuestas escritas con soltura en días distintos: 2 para el
    árbol y 3, con repaso reciente, para los frutos.
  - Con «Sin prisa» no cuenta el tiempo.
  - Al llegar a un estatus nuevo, la victoria lo celebra y lo dice. Lo que
    ya se tenía antes de esta versión no se celebra de golpe.
  - El jardín explica cómo se sube.
- **La ayuda se toca** (#88, tarea #63): con las multiplicaciones, el
  rectángulo de la ayuda deja de ser solo para mirar.
  - Se ponen y se quitan filas, de 1 a 10.
  - Tocar una fila parte el rectángulo ahí (7 × 8 = 5 × 8 + 2 × 8), cada
    parte de un color. «Partir» corta después de la quinta fila y «Juntar»
    lo deshace.
  - Al girarlo, filas y columnas se cambian también en un rectángulo ya
    tocado.
  - El total se escribe y se dice al momento: «6 × 8 = 48». El de la
    pregunta sale como «?», así que la ayuda no da la respuesta; partida, da
    cada parte para sumarlas.
  - Con teclado, sobre el rectángulo, se usan las flechas, y el lector de
    pantalla oye el total.
  - Acostado en el teléfono, el rectángulo va al lado del texto para que
    quepa entero.

  Al dividir, en los retos y en las fracciones, el dibujo sigue siendo solo
  para mirar.

  De paso, la prueba «los paisajes pesan poco» medía la página entera contra
  un tope fijo y fallaba con cualquier cambio ajeno. Ahora mide solo el
  código de los paisajes (unos 15 KB, con un tope de 30). Además, hay una
  alarma aparte si la página pasa de 600 KB.
- **¿Qué tablas ya sabes?** (#86, tarea #61): en un jardín nuevo, «Seguir»
  propone un diagnóstico corto y opcional. Son dos preguntas por tabla, se
  para al fallar dos seguidas y nunca pasa de 16. Lo que ya sabe se siembra
  como «casi», así no empieza por la del 2 quien ya se la sabe. Se puede
  saltar.
- **Confusiones típicas** (#85, tarea #62): al fallar, el juego reconoce si
  fue la de al lado («Diste 42, que es 6 × 7»), una suma en lugar de una
  multiplicación, las cifras al revés u otra de la misma tabla, y lo dice
  con cariño. Si se repite, pregunta juntas las dos que se cruzan. La vista
  para adultos muestra las más frecuentes. Ahora se guarda la respuesta
  equivocada de cada fallo.

  De paso, varias pruebas que miraban algo que desaparece solo (el globo de
  Lumi, el bono, el «pof» o un aviso) ahora lo miran en el momento, porque
  esperar a que desapareciera las hacía pasar siempre.
- **Una sola moneda y la meta de hoy** (#84, tarea #60):
  - la estrella es solo la moneda que se gasta en el vivero, y se gana en todos
    los juegos, también en la Aventura;
  - los aciertos de la partida llevan el icono de «listo» y los puntos de la
    Aventura, el de la chispa (antes, los tres usaban la estrella);
  - la misión que cambiaba cada día pasa a ser una sola meta: acertar 10
    respuestas hoy, en lo que se quiera. Lumi la celebra.

  Se conservan la semana y la racha, y una misión ya cumplida hoy cuenta como
  meta cumplida. La vista para adultos explica cómo se ganan las estrellas.
- **Seguir: un solo camino** (#83, tarea #59 de la Fase 2): un botón grande
  en el menú, con Lumi, propone lo que toca, en este orden:
  1. regar lo marchito;
  2. terminar la tabla empezada;
  3. descubrir la siguiente (2, 5, 3, 4, 9, 6, 7, 8 y 1);
  4. repasar lo casi;
  5. la Aventura o un reto.

  El resto del menú queda abajo, como «Juego libre». En el teléfono se ve sin
  desplazarse, en vertical y acostado.

## 2026-11-15

- **Leyenda de «Mi jardín» con dibujos** (#82): la leyenda de los estados
  muestra los mismos dibujos que las plantas, con lo florecido del mundo de
  quien juega; antes quedaban los emojis viejos.
- **Sonidos por capas** (#81, tarea #50): los pitidos de un tono se cambian
  por efectos de tres capas (ataque, cuerpo y brillo), todos de la escala
  pentatónica de do, como la música, y con el volumen igualado. Hay uno para
  cada momento:
  - entrar al jardín;
  - acertar;
  - equivocarse (suave y hacia arriba);
  - una racha;
  - florecer;
  - vencer a un enemigo;
  - el último golpe al jefe;
  - superar un nivel;
  - comprar;
  - el toque de los botones del menú.

  La melodía de entrada usaba un do sostenido, fuera de la escala.
- **Plantas dibujadas** (#80, tarea #57): las 54 plantas de «Mi jardín» son
  dibujos. El estado se distingue por la forma: semilla, brote, capullo,
  florecida y marchita. Lo florecido es propio de cada mundo, con un color
  por tabla. Lo que cambió desde la última visita se anima (crece, se
  marchita o revive), y en la partida cada acierto deja un capullo.
- **Iconos propios** (#79, tarea #56): la interfaz usa 28 iconos SVG
  propios, según la guía de estilo, en lugar de emojis que cambian con cada
  teléfono. Por ejemplo: volver, ajustes, estrellas, corazones, ayuda,
  borrar, lanzar, los modos de la Aventura, candado, corona y compartir.
  Los botones conservan su nombre para el lector de pantalla.
- **Paisajes dibujados** (#78, tarea #55): el fondo de los 8 mundos del
  jardín, el de la bienvenida y las 6 arenas de la Aventura son paisajes SVG
  por capas, en lugar de degradados con emojis sueltos. Por ejemplo, el
  huerto tiene zanahorias, el bosque tiene pinos, el castillo tiene luna y
  murciélagos, y el mar tiene algas y burbujas. Nubes, estrellas y burbujas
  se mueven despacio, y se quedan quietas con «Menos movimiento». Suman
  unos 15 KB.
- **Héroes y enemigos dibujados** (#77, tareas #53 y #54): los 8 héroes y
  los 6 enemigos de la Aventura son SVG propios, según la guía de estilo,
  en lugar de emojis:
  - el héroe respira, alza la varita al acertar y pone cara de golpe;
  - los enemigos caminan;
  - el jefe lleva corona y cejas fruncidas;
  - al vencer sale un «pof» de estrellas.

  El mismo dibujo está en la ficha para elegir héroe, en el mapa de mundos
  y en la imagen para compartir el puntaje. El héroe guardado de antes se
  reconoce igual.

  Arreglo de paso: en el teléfono, una operación larga («1/5 de 35») entraba
  cortada por la orilla; ahora entra entera.
- **Bienvenida guiada** (#76, tarea #58): la primera vez, en lugar de un
  formulario, Lumi guía en cinco pasos cortos:
  1. se presenta;
  2. pide el nombre;
  3. pide el mundo;
  4. pide el personaje;
  5. propone una práctica con 2 × 3 en puntos.

  Al terminar, lleva a descubrir la tabla del 2. Dice cada paso en voz alta y
  se puede saltar. No sale a quien ya jugó en el dispositivo. Cabe en el
  teléfono, en vertical y acostado.
- **Celebraciones** (#75, tarea #49): cada logro tiene su momento, de 600 ms
  o menos y sin retrasar la siguiente pregunta:
  - al acertar, el botón salta y las estrellas brincan;
  - con 3, 5 y 8 seguidas, Lumi lo dice en un globo y el aviso lo repite (el lector de pantalla lo oye una vez);
  - al florecer, la flor nace con brillo y el bono sale de las estrellas;
  - en la victoria, las estrellas salen una a una y el confeti son hojas, estrellas y semillas de colores, no emojis.

  Con «Menos movimiento», nada se mueve y el mensaje sigue.
- **Lumi, la mascota** (#74, tarea #52 del plan): una semilla mágica dibujada
  a mano en SVG, según la guía de estilo, con seis caras:
  - contenta;
  - pensando;
  - animando;
  - celebrando;
  - sorprendida;
  - durmiendo.

  Lumi aparece en tres lugares:
  - **la bienvenida:** reemplaza 🌱☀️ y se duerme si nadie toca;
  - **la barra de la partida:** celebra el acierto, se sorprende al florecer, anima tras un fallo y piensa con la ayuda abierta;
  - **la victoria:** reemplaza 👑🌻👑 y celebra.

  No ocupa espacio nuevo, así que la partida sigue cabiendo en un teléfono de
  360 × 640.
- **Plan de evolución y guía de estilo** (#73): `docs/PLAN.md` ordena lo que
  sigue en tres hitos (#45 calidad que se ve y se oye, #46 un solo camino y
  mejor enseñanza, #47 plataforma), con 25 tareas en issues. `docs/ESTILO.md`
  fija colores, letra, formas, reglas del dibujo y a Lumi, la mascota; los
  colores quedan como variables CSS. Se quitan unas capturas que se habían
  colado en el sitio con #44.
- **El teléfono acostado** (#44): se usa el ancho. En la partida, la pregunta
  a la izquierda y las respuestas o el teclado a la derecha; en la Aventura, la
  arena a la izquierda y el teclado a la derecha; en el menú, quién juega y la
  misión lado a lado. Antes, en horizontal, las respuestas quedaban a 650 px y
  el teclado de la Aventura a más de 900, en pantallas de 360 a 390 de alto.
- **Hecho para los dedos** (#43), tras medir cada pantalla en un teléfono:
  - todo lo que se toca mide al menos 44 × 44 px; antes «⬅ Menú» medía 52 × 20 en todas las pantallas y las tablas del mapa, 15 × 16;
  - la partida se juega sin desplazarse en un teléfono, hasta en uno de 360 × 640: antes las opciones quedaban debajo y el teclado de escribir a 870 px;
  - en la Aventura, los modos son botones de icono junto a la respuesta, para que el nivel siga cabiendo con botones más grandes;
  - en computadora, los botones ya no tiemblan cuando el ratón queda en su borde.
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
