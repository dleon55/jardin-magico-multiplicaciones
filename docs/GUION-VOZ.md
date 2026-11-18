# Guion de la voz grabada

Para el issue [#51](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/51).
**Estado: listo para grabar.** La grabación y el permiso de uso son del titular.
Cuando estén los archivos, Claude conecta la reproducción.

## La idea

Hoy todo lo dice la voz sintética del dispositivo, que a veces suena robótica.
Las **frases fijas** se graban con una voz de persona, idealmente con acento
mexicano. Son la bienvenida, los ánimos, las celebraciones y las
instrucciones.

**Lo variable sigue con la voz sintética:** los números, las operaciones
(«7 por 8 es 56»), los nombres de los niños y las cuentas de cada pregunta.
Grabar cada combinación serían miles de archivos.

Si un archivo falta o no se puede reproducir, el juego usa la voz sintética,
como hoy. Se puede grabar poco a poco.

## Cómo grabar

| | |
|---|---|
| Quién | Una persona adulta, con voz cálida y clara. Que hable a un niño de 8 años sin infantilizar |
| Dónde | Un cuarto pequeño con cortinas, ropa o cojines (menos eco). Lejos del refrigerador y de la calle |
| Con qué | Un teléfono moderno basta, a un palmo de la boca y un poco de lado (para que la «p» no sople) |
| Ritmo | Pausado y alegre, sin exagerar. Una toma por frase; si sale mal, se repite la frase entera |
| Silencio | Medio segundo antes y después de cada frase (luego se recorta) |
| Formato final | **MP3 mono, 48 kHz, 32 kbps**, con el volumen igualado entre todas (normalizar a −16 LUFS) |
| Nombre | Exactamente el de la columna «Archivo», dentro de una carpeta `voz/` |

Con unas 50 frases de 2 segundos, todo pesa unos 400 KB, y se guarda para
jugar sin internet como el resto del juego.

**Emojis y signos:** en la tabla, el texto de la frase va sin emojis. Se dice
tal cual; los signos de admiración marcan entusiasmo, no gritos.

## Las frases

### Bienvenida y primera vez (con Lumi)

| # | Archivo | Frase | Cuándo suena |
|---|---------|-------|--------------|
| 1 | `bienvenida-hola.mp3` | ¡Hola! Soy Lumi. Soy una semilla mágica. ¿Me ayudas a hacer crecer un jardín con las multiplicaciones? | Primer paso de la bienvenida guiada |
| 2 | `bienvenida-nombre.mp3` | ¿Cómo te llamas? Así sabré de quién es el jardín. Si no quieres, sigue sin escribirlo. | Paso del nombre |
| 3 | `bienvenida-mundo.mp3` | Elige tu mundo. Es donde crecerá tu jardín. Puedes cambiarlo cuando quieras. | Paso del mundo (sin nombre) |
| 4 | `bienvenida-personaje.mp3` | Elige tu personaje. Te acompañará en el jardín. | Paso del personaje |
| 5 | `bienvenida-practica.mp3` | Vamos a practicar. Dos por tres son dos filas de tres puntos. ¿Cuántos puntos hay? Toca la respuesta. | Pregunta de práctica |
| 6 | `bienvenida-bien.mp3` | ¡Eso es! Dos por tres, seis. | Acierto en la práctica |
| 7 | `bienvenida-casi.mp3` | ¡Casi! Cuenta los puntos: tres y tres. | Fallo en la práctica |
| 8 | `hola-jugar.mp3` | ¡Hola! Vamos a jugar con las matemáticas. | Al entrar al jardín (sin nombre) |
| 9 | `voz-activada.mp3` | Voz activada. | Al encender la voz en Ajustes |

### Aciertos y rachas

| # | Archivo | Frase | Cuándo suena |
|---|---------|-------|--------------|
| 10 | `acierto-espectacular.mp3` | ¡Espectacular! | Acierto (una de las cinco, al azar) |
| 11 | `acierto-excelente.mp3` | ¡Excelente trabajo! | Acierto |
| 12 | `acierto-correcto.mp3` | ¡Correcto! | Acierto |
| 13 | `acierto-super.mp3` | ¡Súper bien hecho! | Acierto |
| 14 | `acierto-jardin.mp3` | ¡Tu jardín va creciendo! | Acierto |
| 15 | `racha-3.mp3` | ¡Tres seguidas! | Tres aciertos seguidos |
| 16 | `racha-5.mp3` | ¡Cinco seguidas! ¡Imparable! | Cinco seguidos |
| 17 | `racha-8.mp3` | ¡Ocho seguidas! ¡Qué memoria! | Ocho seguidos |
| 18 | `florecio.mp3` | ¡Floreció! | Una multiplicación florece (antes de decirla con la voz sintética) |
| 19 | `meta-cumplida.mp3` | ¡Meta de hoy cumplida! | Al acertar 10 en el día |

### Al fallar (sin regañar)

| # | Archivo | Frase | Cuándo suena |
|---|---------|-------|--------------|
| 20 | `fallo-casi.mp3` | ¡Casi! | Fallo (antes de decir la respuesta con la voz sintética) |
| 21 | `fallo-vuelve.mp3` | Te la vuelvo a preguntar en un ratito. | Tras decir la respuesta correcta |
| 22 | `fallo-otra-vez.mp3` | ¡Casi! Inténtalo otra vez. | Al perder un nivel de la Aventura |
| 23 | `sin-prisa.mp3` | No hay prisa: piénsalo con calma. | Respuesta escrita pero lenta |

### Ayuda y pistas

| # | Archivo | Frase | Cuándo suena |
|---|---------|-------|--------------|
| 24 | `ayuda-abre.mp3` | Mira el dibujo: te ayuda a contar. | Al abrir la ayuda mágica |
| 25 | `ayuda-partir.mp3` | Toca una fila para partir el rectángulo. | Ayuda que se toca |
| 26 | `ayuda-girar.mp3` | Al girarlo son los mismos puntos: el orden no importa. | Al girar el rectángulo |
| 27 | `ayuda-desde-sabido.mp3` | Empieza por una que ya sabes. | Pista desde lo que ya se sabe |

### Seguir, diagnóstico y camino

| # | Archivo | Frase | Cuándo suena |
|---|---------|-------|--------------|
| 28 | `diagnostico.mp3` | ¿Qué tablas ya sabes? Responde sin prisa. | Al empezar el diagnóstico |
| 29 | `diagnostico-desde-cero.mp3` | ¡Empezamos desde el principio! | Resultado del diagnóstico sin tablas sabidas |
| 30 | `seguir-regar.mp3` | Algunas flores se marchitan: repásalas y revivirán. | «Seguir» propone regar |
| 31 | `seguir-nueva.mp3` | Una tabla nueva: vamos a descubrirla. | «Seguir» propone descubrir |
| 32 | `seguir-aventura.mp3` | ¡Ya sabes sus tablas! Se abrió un mundo nuevo en la Aventura. | Se abre un mundo |
| 33 | `descubrir-entera.mp3` | ¡Ya tienes la tabla entera! | Al terminar «Descubre la tabla» |

### Celebraciones grandes

| # | Archivo | Frase | Cuándo suena |
|---|---------|-------|--------------|
| 34 | `victoria.mp3` | ¡Increíble! Completaste la partida. | Victoria (el nombre y lo aprendido siguen con la voz sintética) |
| 35 | `victoria-equipo.mp3` | ¡Lo lograron juntos! | Victoria en equipo |
| 36 | `estatus-arbolito.mp3` | ¡Tu tabla ya es un arbolito! | Sube a arbolito |
| 37 | `estatus-arbol.mp3` | ¡Tu tabla ya es un árbol! | Sube a árbol |
| 38 | `estatus-frutos.mp3` | ¡Tu tabla ya es un árbol con frutos! | Sube a árbol con frutos |
| 39 | `vivero-llego.mp3` | ¡Llegó un amigo nuevo a tu jardín! | Compra en el vivero |
| 40 | `aventura-gano.mp3` | ¡Muy bien! | Gana un nivel de la Aventura (los puntos siguen con la voz sintética) |
| 41 | `aventura-jefe.mp3` | ¡Venciste al jefe! | Vence a un jefe |

### Temas nuevos (idea clave al terminar)

| # | Archivo | Frase | Cuándo suena |
|---|---------|-------|--------------|
| 42 | `idea-residuo.mp3` | Lo que sobra siempre es menos que el número entre el que divides. | Victoria de «Dividir con lo que sobra» |
| 43 | `idea-multiplos.mp3` | Un múltiplo de un número está en su tabla. | Victoria de «Múltiplos y divisores» |
| 44 | `idea-area.mp3` | El área son los cuadritos de adentro; el perímetro, la orilla. | Victoria de «Perímetro y área» |
| 45 | `idea-dinero.mp3` | Cien centavos son un peso. | Victoria de «Decimales y dinero» |
| 46 | `idea-porcentajes.mp3` | Un porcentaje es tantos de cada cien. | Victoria de «Porcentajes» |
| 47 | `idea-fracciones.mp3` | Para comparar fracciones, pásalas al mismo número de abajo. | Victoria de «Fracciones» |
| 48 | `idea-logica.mp3` | Pensar con las tablas, y no solo recordarlas, es saberlas de verdad. | Victoria de «Retos de lógica» |

### En equipo

| # | Archivo | Frase | Cuándo suena |
|---|---------|-------|--------------|
| 49 | `equipo-turno.mp3` | Te toca. | Cambio de turno (el nombre sigue con la voz sintética) |
| 50 | `equipo-elegir.mp3` | Elijan al menos a dos para jugar en equipo. | Aviso de la elección del equipo |

## Lo que no se graba

- **Números y operaciones:** «7 por 8 es 56», «¿Cuánto es 56 entre 8?».
- **Nombres:** «¡Hola, Ana!».
- **Explicaciones con cuentas:** «Diste 42, que es 6 × 7: la de al lado», o «El área es 7 × 4 = 28».
- **Las preguntas de los temas** (problemas, fracciones, dinero, porcentajes).

Todo eso cambia en cada pregunta y lo dice la voz sintética.

## Permiso de uso de la voz

Antes de publicar las grabaciones hace falta el permiso por escrito de quien
graba. Un modelo:

> Yo, **[nombre]**, grabé las frases de este guion para «El Jardín Mágico de
> las Multiplicaciones» y autorizo, sin pago *(o: a cambio de ___)*, que se
> publiquen y se usen **solo dentro de ese juego**: en el sitio, en sus copias
> instaladas y en sus actualizaciones. No autorizo otros usos, como anuncios o
> venderlas aparte.
>
> Puedo pedir que se retiren en futuras versiones avisando con 30 días.
>
> Nombre y firma: ____________________   Fecha: ________

Si la voz es de una persona menor de edad, firma también su madre, padre o
tutor.

## Después de grabar (lo hace Claude)

- [ ] Poner los archivos en `voz/` y añadirlos a la lista del service worker,
      para jugar sin internet.
- [ ] Que cada momento de la tabla suene con su archivo, con la voz sintética
      de respaldo si falta o falla.
- [ ] Respetar el ajuste de voz (apagada = nada suena) y la velocidad elegida.
- [ ] Pruebas de cada momento, y un tope de peso para la carpeta.
