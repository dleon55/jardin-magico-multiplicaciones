# Plan de evolución

Cómo pasar de un buen juego de tablas a uno de calidad comparable a los
líderes, y después a una plataforma de aprendizaje. El seguimiento vive en
GitHub: cada fase es un **hito** (un issue padre) y cada tarea es una
sub-tarea suya, así que GitHub muestra el avance de cada hito.

| Hito | Issue | Qué logra |
|------|-------|-----------|
| 1 · Calidad que se ve y se oye | [#45](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/45) | Arte propio, mascota, celebraciones, sonido y bienvenida guiada |
| 2 · Un solo camino y mejor enseñanza | [#46](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/46) | Menos dispersión, diagnóstico, confusiones típicas, ayuda que se toca |
| 3 · Plataforma | [#47](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/47) | Cuentas, salón, retos entre compañeros, más temas (requiere decisiones) |

El estado del día a día sigue en el
[issue de estado #20](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/20).

## De dónde sale

Se comparó el juego con los líderes del género: Khan Academy Kids, Duolingo,
Prodigy, DragonBox, Times Tables Rock Stars y Reflex.

**Lo que ya está a la altura, o por encima:**
- la enseñanza: descubrir antes de practicar, ayuda que parte de lo que se sabe,
  repaso espaciado, florecer por soltura y no por un solo acierto;
- la accesibilidad (WCAG 2.1 AA medida con axe);
- funciona sin internet y sin cuentas.

**Lo que falta:**
1. **Arte:** todo son emojis del sistema. Se ven distintos en cada teléfono y
   no tienen estilo propio.
2. **Personaje:** no hay una mascota que reaccione, anime y guíe.
3. **Celebraciones:** son pobres. Acertar, subir de nivel y florecer merecen
   un momento.
4. **Sonido:** es sintético y plano; la voz es la del sistema.
5. **Entrada:** el niño cae en un formulario y luego en un menú lleno de
   opciones.
6. **Dispersión:** hay muchas entradas sueltas y varias monedas. No queda
   claro «qué hago ahora».

La Fase 1 ataca los cinco primeros, la Fase 2 el sexto, y la Fase 3 abre la
plataforma.

## Fase 1 · Calidad que se ve y se oye (#45)

| # | Tarea | Issue | Depende de |
|---|-------|-------|------------|
| F1.1 | Guía de estilo visual ([`ESTILO.md`](ESTILO.md)) | [#48](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/48) | — |
| F1.2 | La mascota, con expresiones | [#52](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/52) | F1.1 |
| F1.3 | Héroes de la Aventura en SVG | [#53](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/53) | F1.1 |
| F1.4 | Enemigos y jefes en SVG | [#54](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/54) | F1.1 |
| F1.5 | Paisajes: 8 mundos y 6 arenas | [#55](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/55) | F1.1 |
| F1.6 | Iconos propios de la interfaz | [#56](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/56) | F1.1 |
| F1.7 | Plantas por estado y mundo | [#57](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/57) | F1.1 |
| F1.8 | Celebraciones animadas | [#49](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/49) | F1.2 |
| F1.9 | Sonidos por capas | [#50](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/50) | — |
| F1.10 | Bienvenida guiada con la mascota | [#58](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/58) | F1.2 |
| F1.11 | Voz grabada (opcional) | [#51](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/51) | decisión del titular |

**Orden de trabajo:** F1.1 → F1.2 → F1.8 → F1.10, que es el camino que más se
nota. Después F1.3 a F1.7 (arte, un PR por tarea) y F1.9. La F1.11 espera a
que el titular decida si vale la pena grabar voces.

## Fase 2 · Un solo camino y mejor enseñanza (#46)

| # | Tarea | Issue | Depende de |
|---|-------|-------|------------|
| F2.1 | Un solo camino: botón «Seguir» | [#59](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/59) | Hito 1 |
| F2.2 | Una moneda y una meta diaria | [#60](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/60) | — |
| F2.3 | Diagnóstico inicial corto | [#61](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/61) | F2.1 |
| F2.4 | Confusiones típicas | [#62](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/62) | — |
| F2.5 | Ayuda manipulable | [#63](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/63) | — |
| F2.6 | Estatus por soltura | [#64](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/64) | F1.7 |
| F2.7 | Informe para adultos imprimible | [#65](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/65) | F2.4 |

## Fase 3 · Plataforma (#47)

| # | Tarea | Issue | Depende de |
|---|-------|-------|------------|
| F3.1 | **Decisión:** arquitectura, sostenimiento y privacidad | [#66](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/66) | titular |
| F3.2 | Cuentas y sincronización | [#68](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/68) | F3.1 |
| F3.3 | Modo salón para docentes | [#69](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/69) | F3.1 |
| F3.4 | Retos amables entre compañeros | [#70](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/70) | F3.1 (en línea) |
| F3.5 | Más temas alineados a la SEP | [#71](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/71) | Hito 2 |
| F3.6 | Métricas respetuosas y pruebas con niños | [#72](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/72) | F3.1 (métricas) |
| F3.7 | Aviso de privacidad y consentimiento | [#67](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/67) | F3.1, titular |

Lo que no necesita servidor puede avanzar antes de la decisión:
- más temas (F3.5);
- turnos en el mismo dispositivo (parte de F3.4);
- pruebas con niños (parte de F3.6).

## Decisiones que son del titular

Estas no las puede tomar quien programa:

1. **Servidor y costo** (F3.1): seguir sin servidor o pagar uno, y quién lo
   mantiene.
2. **Modelo de sostenimiento** (F3.1): gratuito, donativo o licencia para
   escuelas. Nunca publicidad para niños.
3. **Datos de menores** (F3.1, F3.7): qué se guarda y con qué consentimiento,
   según la LFPDPPP.
4. **Voz grabada** (F1.11): quién graba, con qué permiso de uso y cuánto pesa
   descargarla.
5. **Pruebas con niños** (F3.6): con quién y con qué permiso de sus familias.

## Cómo se trabaja cada tarea

Igual que hasta ahora:
- una rama y un PR por tarea;
- pruebas automáticas y comprobación de mutaciones (romper el código a
  propósito para ver que la prueba falla);
- la compuerta local `npm run comprobar`, porque no hay presupuesto de GitHub
  Actions;
- README y CHANGELOG al día;
- verificar el sitio en vivo por el sello de `sw.js`;
- marcar la tarea en su issue y en #20.

Reglas que no cambian con el arte nuevo:
- **sin internet:** todo el arte va dentro del juego (SVG en línea), sin
  descargas externas;
- **accesible:** contraste AA y arte decorativo oculto al lector de pantalla;
  lo importante, en texto;
- **táctil:** 44 px y nada fuera de la pantalla, en vertical y acostado;
- **«Menos movimiento»** apaga toda animación nueva;
- **original:** personajes y mundos propios, sin parecerse a los de otro
  juego;
- **ligero:** el arte nuevo de la Fase 1 suma, en total, unos 300 KB como
  mucho.

## Riesgos

| Riesgo | Cómo se mitiga |
|--------|----------------|
| El arte hecho a mano en SVG queda desigual | Guía de estilo con reglas medibles (grosor de contorno, paleta, proporciones) y una hoja de muestra para comparar |
| La página se vuelve pesada o lenta en teléfonos modestos | Presupuesto de peso por tarea; SVG reutilizado con `<symbol>`; medir en un teléfono de gama baja |
| Animaciones que distraen de la operación | La operación siempre es lo más legible; animaciones cortas (< 1 s) y apagables |
| La Fase 3 se queda sin decisión | F3.1 prepara opciones concretas con costo; mientras, avanza lo que no necesita servidor |
| Romper el progreso guardado de los niños | Migraciones probadas para cada cambio de datos (héroe guardado, monedas) |
