# Plan de proyecto

El Jardín Mágico de las Multiplicaciones: de un buen juego de tablas a uno de
calidad comparable a los líderes, y después a una plataforma de aprendizaje.

**Actualizado: 22 de noviembre de 2026.**
- El estado del día a día está en el
  [issue de estado #20](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/20).
- El detalle de cada cambio, con su PR, está en el [CHANGELOG](../CHANGELOG.md).

## Resumen

| Hito | Issue | Avance | Estado |
|------|-------|--------|--------|
| 1 · Calidad que se ve y se oye | [#45](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/45) | **10 de 11** | Casi cerrado: el guion de la voz está listo ([`GUION-VOZ.md`](GUION-VOZ.md)); faltan la grabación y el permiso, del titular |
| 2 · Un solo camino y mejor enseñanza | [#46](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/46) | **7 de 7** | **Cerrado** el 16 de noviembre |
| 3 · Plataforma | [#47](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/47) | **Todo lo que no necesita servidor, hecho** | Los cinco temas nuevos (#71 cerrado), turnos en un aparato, guía de pruebas y opciones de plataforma. Lo demás espera las decisiones del titular (#66, #72) |
| 4 · El mundo vivo (nueva presentación) | [#117](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/117) | **7 de 7** | **Completo** el 22 de noviembre: el mundo como inicio (#118), Lumi que crece (#120), los tres tonos (#122), «Enséñale a Lumi» (#124), la Expedición de hoy (#126), los retos con código (#128) y el progreso en un solo lugar (#130) |
| 5 · Pulido de la presentación nueva | [#137](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/137) | **8 de 9** | **En curso**, sin dependencias externas. Hecho: inicio simple (#133), lo nuevo para adultos (#135), la compuerta más rápida (#138), Brote sin leer (#139), la bienvenida con el mundo y el tono (#140), los ajustes para adultos (#141), el QR de los retos (#142) y un mundo más vivo (#143). Sigue: el presupuesto de peso |

**Cifras al día:**
- 58 PRs fusionados desde que empezó el plan (#73 a #143), cada uno verificado en el sitio publicado.
- La compuerta de calidad (`npm run comprobar`) tiene **1586 pruebas en verde**, en escritorio y tableta.
- Cada cambio pasó una **comprobación de mutaciones**: romper el código a propósito y ver que una prueba falla.
- El juego, en varios archivos desde #96: `index.html` pesa 453 KB, más el arte, el sonido, los datos, los estilos propios y un archivo por tema en `js/`. Sin dependencias externas, y funciona sin internet.

## Objetivos cumplidos

### Hito 1 · Calidad que se ve y se oye

| Tarea | Issue | PR | Qué quedó |
|-------|-------|----|-----------|
| F1.1 Guía de estilo | #48 | #73 | [`ESTILO.md`](ESTILO.md): colores como variables, reglas medibles del dibujo, movimiento, iconos |
| F1.2 Mascota | #52 | #74 | **Lumi**, con 6 caras, en la bienvenida, la partida y la victoria |
| F1.8 Celebraciones | #49 | #75 | Racha con globo de Lumi, florecer con brillo y bono, victoria con ritmo, confeti propio |
| F1.10 Bienvenida guiada | #58 | #76 | Pasos con Lumi hasta la primera tabla (5 al principio; 7 desde #140, con el tono y el mundo); se puede saltar |
| Lumi en los temas nuevos | #45 | #111 | En los 8 temas nuevos, Lumi lleva un objeto del tema, lo presenta con una frase y da un truco al segundo fallo seguido |
| F1.3 Héroes | #53 | #77 | 8 héroes SVG con tres poses (quieto, lanzando, golpeado) |
| F1.4 Enemigos y jefes | #54 | #77 | 6 enemigos y sus jefes con corona; «pof» al vencer |
| F1.5 Paisajes | #55 | #78 | 8 fondos de mundo y 6 arenas por capas (unos 15 KB) |
| F1.6 Iconos | #56 | #79 | 28 iconos propios en lugar de emojis de interfaz |
| F1.7 Plantas | #57 | #80, #82 | Forma por estado, florecido por mundo con un color por tabla, animación de lo que cambió |
| F1.9 Sonidos por capas | #50 | #81 | Un efecto por momento, en la escala de la música, con volumen igualado |
| F1.11 Voz grabada | #51 | — | **Pendiente del titular** |

### Hito 2 · Un solo camino y mejor enseñanza (cerrado)

| Tarea | Issue | PR | Qué quedó |
|-------|-------|----|-----------|
| F2.1 Seguir | #59 | #83 | Un botón propone lo que toca: regar, el mundo recién abierto, terminar la tabla, descubrir otra, repasar o un reto |
| F2.2 Una moneda y una meta | #60 | #84 | La estrella, solo para la moneda; meta de hoy: acertar 10 |
| F2.4 Confusiones típicas | #62 | #85, #91 | Reconoce cuatro patrones de error, los nombra y practica juntos los que se cruzan |
| F2.3 Diagnóstico inicial | #61 | #86 | «¿Qué tablas ya sabes?»: siembra como «casi» lo que ya sabe y «Seguir» empieza por lo que falta |
| F2.5 Ayuda manipulable | #63 | #88 | Poner y quitar filas, partir con un toque (7 × 8 = 5 × 8 + 2 × 8), girar; flechas y total en voz, sin dar la respuesta |
| F2.6 Estatus por soltura | #64 | #89 | Semilla, arbolito, árbol y árbol con frutos por tabla, en el mapa y el jardín; respeta «Sin prisa»; se celebra al subir |
| F2.7 Informe imprimible | #65 | #91 | Una hoja carta para adultos, con una idea concreta para casa; se imprime o guarda como PDF, sin servidor |
| Camino jardín + Aventura | #46 | #92 | «Mi camino»: 15 tramos; cada mundo se abre al saberse sus tablas; nadie pierde lo jugado |

### Hito 3 · Plataforma (lo que no necesita servidor)

| Tarea | Issue | PR | Qué quedó |
|-------|-------|----|-----------|
| F3.1 Opciones de plataforma | #66 | #90 | [`DECISION-PLATAFORMA.md`](DECISION-PLATAFORMA.md): cuatro opciones con costo, riesgo y recomendación. **Falta la decisión del titular** |
| F3.6 Guía de pruebas con niños | #72 | #90 | [`PRUEBAS-CON-NINOS.md`](PRUEBAS-CON-NINOS.md): permiso, ocho tareas, hoja de registro, de la observación al issue. **Las sesiones son del titular** |
| F3.5 Primer tema nuevo: división con residuo | #71 | #93 | «17 ÷ 5 = 3, y sobran 2», con errores típicos explicados, ayuda visual y registro para adultos |
| F3.4 Turnos en el mismo aparato | #70 | #94 | «En equipo»: dos o tres niños se turnan; cada respuesta crece en el jardín de quien contesta; meta común, sin comparar |
| Separar el juego en archivos | — | #96 | Arte, sonido, datos y estilos fuera de `index.html` (569 → 445 KB); una prueba vigila la lista sin internet y el orden de carga |
| F3.5 Múltiplos y divisores | #71 | #97 | Múltiplo, divisor y «en dos tablas a la vez»; la ayuda muestra las tablas como filas |
| F3.5 Perímetro y área | #71 | #98 | Área, perímetro y un lado desde el área; la ayuda es el rectángulo de las tablas en cuadritos |
| F3.5 Decimales y dinero | #71 | #99 | Sumar precios llevando el peso, el cambio, varias cosas iguales y comparar decimales |
| F3.5 Porcentajes | #71 | #100 | El tanto por ciento, descuentos y fracción ↔ porcentaje, con 100 cuadritos |
| F1.11 Guion de la voz | #51 | #101 | [`GUION-VOZ.md`](GUION-VOZ.md): 50 frases con nombre de archivo, cómo grabar y modelo de permiso |
| F3.5b Fracciones decimales | #102 | #103 | Fracción ↔ decimal, comparar y sumar décimos; la ayuda es una tira de 10 o 100 cuadritos |
| F3.5c Medidas de tiempo | #105 | #106 | Leer el reloj, qué hora será, cuánto dura y horas a minutos; el reloj es un dibujo propio y la ayuda, bloques de 5 minutos |
| F3.5d El calendario | #108 | #109 | Días y semanas, qué día será, los meses y días entre fechas; un mes dibujado y los nudillos. El informe pasa a dos columnas en «Otros temas» |

**Calidad que se mantuvo en todo el camino:**
- accesibilidad WCAG 2.1 AA medida con axe en cada pantalla nueva;
- botones de 44 px;
- nada fuera de la pantalla en un teléfono vertical (360 × 640) ni acostado (740 × 360);
- «Menos movimiento» apaga toda animación nueva;
- sin internet.

## Hito 4 · El mundo vivo

El juego enseñaba bien pero se presentaba como una lista de botones. Este hito
lo convierte en un mundo que crece con lo aprendido, para niñas y niños de 6 a
12 años. Decisiones del titular: los lugares se abren con el avance, y el tono
lo elige quien juega.

| Parte | Estado | Qué es |
|-------|--------|--------|
| 4.1 El mundo como inicio | **Hecho** (#118) | Cinco lugares que despiertan con las tablas; la lista de siempre queda en Ajustes |
| 4.2 Lumi crece contigo | **Hecho** (#120) | De semilla a árbol en flor con 2, 4, 6 y 8 tablas; nunca encoge |
| 4.3 Tres tonos | **Hecho** (#122) | Brote, Explora y Pro: el mismo mundo para 6, 9 y 12 años; lo elige quien juega. Pro mide tiempos contra la marca propia |
| 4.4 Enséñale a Lumi | **Hecho** (#124) | Lumi se equivoca con los errores típicos y quien juega la corrige; rondas de cinco dudas |
| 4.5 Expedición de hoy | **Hecho** (#126) | Dos paradas (tablas y «Enséñale a Lumi») y un banderín por día en el mundo |
| 4.6 Retos con código | **Hecho** (#128) | Diez multiplicaciones en un código de seis signos o un enlace, sin cuentas, servidor ni nombres |
| 4.7 El progreso en un solo lugar | **Hecho** (#130) | «Mi progreso»: camino, jardín, mapa y vivero resumidos en una pantalla; cada tarjeta abre el detalle |

## Hito 5 · Pulido de la presentación nueva

El Hito 4 cambió la presentación. Este hito la pule con lo que no depende de
nadie más: ni decisión de plataforma, ni grabaciones, ni pruebas con niños.
Seguimiento en [#137](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/137).

| Parte | Estado | Objetivo | Cómo se implementa | Hecho cuando |
|-------|--------|----------|--------------------|--------------|
| Inicio simple | **Hecho** (#133) | Menos cosas antes del mapa | La Expedición ocupa el lugar de «Seguir»; meta compacta tras el mundo | En teléfono, el mundo asoma sin desplazarse |
| Lo nuevo, para adultos | **Hecho** (#135) | Que quien acompaña vea lo nuevo | Clave `actividad` por jardín; líneas en la vista de adultos y el informe | El informe sigue en una hoja |
| 5.1 Compuerta más rápida | **Hecho** (#138) | Acortar cada entrega | Un proceso por núcleo en `playwright.config.mjs` (`PROCESOS=2` vuelve a lo de antes) | Medido en 4 núcleos: de 28 a 23 minutos. El tiempo está repartido en 1 580 pruebas de unos 2 segundos, sin un punto caliente; para bajar más habría que dejar de repetir en tableta las pruebas de pura lógica |
| 5.2 Brote sin leer | **Hecho** (#139) | Que 6 años jueguen sin leer | En tono Brote: cada pantalla nueva se dice en voz al abrirse; partidas y rondas más cortas; menos botones bajo el mundo | Una prueba recorre el inicio, «Enséñale a Lumi», la Expedición y «Mi progreso» en Brote y comprueba lo dicho y lo corto |
| 5.3 La bienvenida presenta el mundo y el tono | **Hecho** (#140) | Que el primer día se entienda el mundo | Un paso de la guía pregunta el tono (tres fichas) y otro muestra el mundo con un lugar despierto y uno dormido | La guía sigue cabiendo en teléfono vertical y acostado, y se puede saltar |
| 5.4 Ajustes para adultos | **Hecho** (#141) | Que el atajo del menú no esté a mano de quien juega, y que «Cuándo practica» sea completo | «Menú en lista» pasa a la pantalla de adultos; `actividad` guarda los días y «Cuándo practica» los cuenta | Las pruebas que usan la lista siguen pasando; un día con solo un reto cuenta como practicado |
| 5.5 Retos para el salón | **Hecho** (#142) | Mandar un reto sin teclear | Código QR dibujado por el propio juego (sin bibliotecas) con el enlace del reto, para proyectar o imprimir | Un lector escrito aparte vuelve a sacar el enlace del QR dibujado, y las matrices se comprobaron con un lector independiente fuera del repositorio |
| 5.6 Un mundo más vivo | **Hecho** (#143) | Que el mundo no sea un dibujo fijo | Animaciones pequeñas solo con `transform` (apagadas con «Menos movimiento»), un sonido al entrar a un lugar y un detalle que cambia con la racha | Accesibilidad y «Menos movimiento» en verde; sin trabajo en reposo |
| 5.7 Presupuesto de peso | Sigue | Que el juego no se vuelva pesado | Medir la carga con el procesador frenado y fijar topes de tamaño por archivo en una prueba | La prueba falla si un archivo pasa su tope |

**Fuera de este hito** (necesitan a la persona dueña): retos con otros temas
que cambien el formato del código se deciden tras ver cómo se usan los
actuales; voz grabada (#51); plataforma (#66); pruebas con niñas y niños (#72).

## Pendientes

### De Claude (orden de trabajo)

| # | Tarea | Issue | Depende de | Notas |
|---|-------|-------|------------|-------|
| 0 | **Hito 5**: las siete partes que faltan, en el orden de su tabla | [#137](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/137) | Nada | Una parte por PR, sin esperar a nadie |
| 1 | Reproducir la voz grabada, con la sintética de respaldo | [#51](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/51) | **Las grabaciones y el permiso del titular** | El guion dice qué archivo suena en cada momento |
| 2 | Salón por archivos (opción B de la plataforma) | #66 | **Decisión del titular** | Solo si elige A + B: la docente junta los archivos de su salón en su aparato |
| 3 | Convertir en issues los hallazgos de las pruebas con niños | #72 | **Las sesiones del titular** | Con la plantilla de la guía |
| 4 | Lo que se decida con servidor: cuentas, salón en vivo, privacidad, métricas | #66, #67 | **Decisión del titular** | Solo con la opción C o D |

**Fuera del Hito 5, todo lo demás depende de una decisión o una tarea del
titular.** Ya hay ocho temas nuevos: los cinco de #71, las fracciones decimales
(#102), las medidas de tiempo (#105) y el calendario (#108). Si se quieren
más, se abre un issue nuevo y se hacen con el mismo método.

### Del titular (no los puede hacer Claude)
- [ ] **Decidir la plataforma** (#66): A, B, C o D, con el documento delante. Bloquea cuentas, salón en vivo, retos en línea, métricas y privacidad.
- [ ] **Probar con niños** (#72): 3 a 5 niños de 8 a 11 años, con la guía. Ahora también vale probar la presentación nueva (Hito 4): el mundo, los tonos, «Enséñale a Lumi», la Expedición, los retos y «Mi progreso».
- [ ] **Voz grabada** (#51): quién graba y con qué permiso de uso.
- [ ] **Probar en un teléfono modesto** la Aventura con 3 enemigos.
- [ ] **Probar en iPad y con lector de pantalla real** (VoiceOver o TalkBack).
- [ ] **Escuchar las muestras de sonido** (#50).
- [ ] **Revisar legalmente el aviso de privacidad** (#67), cuando se redacte.
- [ ] **Borrar las ramas fusionadas** (más de 60) y activar «Automatically delete head branches»: Claude no tiene permiso para borrar ramas.

## Cronograma

Son estimaciones. El ritmo hasta ahora fue de 3 a 4 tareas por día de
trabajo, cada una con su PR verificado. Lo que depende del titular no tiene
fecha propia: se indica qué queda bloqueado mientras tanto.

```mermaid
gantt
    title Plan del Jardín Mágico (estimado)
    dateFormat  YYYY-MM-DD
    axisFormat  %d %b
    section Hito 1
    Arte, mascota, sonido, bienvenida (10 tareas)  :done,    h1, 2026-11-15, 2d
    Guion de la voz                                :done,    h1g, 2026-11-18, 1d
    Voz grabada (titular)                          :         h1v, 2026-11-23, 7d
    section Hito 2
    Las 7 tareas y el camino                       :done,    h2, 2026-11-16, 1d
    section Hito 3 sin servidor
    Opciones de plataforma y guía de pruebas       :done,    h3a, 2026-11-16, 1d
    División con residuo y turnos                  :done,    h3b, 2026-11-16, 1d
    Separar arte y datos en archivos               :done,    h3s, 2026-11-17, 1d
    Más temas (múltiplos, área, decimales, %)      :done,    h3t, 2026-11-17, 2d
    Tres temas más (décimos, tiempo, calendario)   :done,    h3u, 2026-11-18, 1d
    Pruebas con niños (titular)                    :         h3n, 2026-11-23, 14d
    section Hito 4
    Lumi en los temas y revisión visual            :done,    h4a, 2026-11-18, 3d
    Mundo, Lumi que crece, tonos y Enséñale a Lumi :done,    h4b, 2026-11-21, 1d
    Expedición, retos con código y Mi progreso     :done,    h4c, 2026-11-21, 2d
    section Hito 5 (sin dependencias)
    Inicio simple y lo nuevo para adultos          :done,    h5a, 2026-11-22, 1d
    Compuerta rápida, Brote sin leer y bienvenida  :active,  h5b, 2026-11-22, 2d
    Ajustes para adultos y retos con QR            :         h5c, after h5b, 1d
    Mundo más vivo y presupuesto de peso           :         h5d, after h5c, 1d
    section Hito 3 con servidor (si se decide)
    Decisión de plataforma (titular)               :crit,    h3d, 2026-11-23, 10d
    Salón por archivos (opción B)                  :         h3b2, after h3d, 5d
    Cuentas y sincronización (opción C)            :         h3e, after h3d, 7d
    Aviso de privacidad y métricas                 :         h3g, after h3e, 5d
```

| Semana | Claude | Titular |
|--------|--------|---------|
| 16 al 22 de noviembre | **Hecho:** separar en archivos, los temas que faltaban, el guion de la voz y el Hito 4 entero (la presentación nueva) | Probar lo nuevo en el teléfono; leer el documento de plataforma |
| 23 al 29 de noviembre | **Hito 5** entero (siete partes); después, lo que pidan las decisiones o las pruebas del titular | **Decidir la plataforma**; grabar la voz; empezar pruebas con niños, con la presentación nueva |
| 30 de noviembre al 13 de diciembre | Lo que salga de las pruebas con niños; salón por archivos si se elige B | Terminar las pruebas con niños |
| Desde el 14 de diciembre | Si se elige C: cuentas, salón en vivo, privacidad y métricas | Revisión legal del aviso de privacidad |

## Dependencias

```mermaid
graph LR
    H2[Hito 2 ✅] --> F35[F3.5 Cinco temas ✅]
    SEP[Separar arte y datos ✅] --> F35
    T1{{Titular: plataforma}} --> F31[F3.1 Decisión]
    DOC[DECISION-PLATAFORMA.md ✅] --> F31
    F31 --> B[Salón por archivos]
    F31 --> F32[F3.2 Cuentas]
    F32 --> F33[F3.3 Salón en vivo]
    F31 --> F34[F3.4 Retos en línea]
    F31 --> F36[F3.6 Métricas]
    F31 --> F37[F3.7 Privacidad]
    T3{{Titular: niños}} --> HALL[Hallazgos → issues]
    GUIA[PRUEBAS-CON-NINOS.md ✅] --> HALL
    T2{{Titular: voz}} --> F111[F1.11 Voz grabada]
```

## Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación | Estado |
|--------|-------|---------|------------|--------|
| La Fase 3 se queda sin decisión de plataforma | Alta | Alto | Documento de opciones con costo y recomendación (#90); mientras, avanza lo que no necesita servidor (ya: división con residuo y turnos) | Abierto: espera al titular |
| No se prueba con niños reales y se decide a ciegas | Media | Alto | Guía de observación lista (#90); cada hallazgo se vuelve un issue | Abierto: espera al titular |
| La página se vuelve pesada o lenta en teléfonos modestos | Media | Medio | Arte generado con piezas reutilizables (15 KB de paisajes, 28 iconos en un solo juego de símbolos); animaciones solo con `transform`; prueba de peso | Mitigado; falta medir en un teléfono real |
| Romper el progreso guardado de los niños | Baja | Alto | Migraciones probadas en cada cambio de datos (misiones → meta, héroe guardado, «vistos») | Mitigado |
| Pruebas que no prueban nada (pasan aunque el código esté roto) | Media | Alto | Comprobación de mutaciones en cada PR. Ya destapó aserciones negativas que esperaban algo que desaparece solo; se corrigieron | Mitigado |
| Pruebas que dependen de la fecha real o del azar | Media | Medio | Fechas relativas a hoy; datos fijos donde importa. Una prueba fallaba solo cuando salía 3 × 1 y se corrigió (#91) | Mitigado |
| Un solo archivo grande es difícil de mantener y pesa en teléfonos modestos | Media | Medio | Separado en #96: arte, sonido, datos y estilos en archivos aparte (index.html, 445 KB). Pruebas que vigilan el tamaño de cada archivo, la lista para usar sin internet y el orden de carga | Mitigado |
| La compuerta tarda y frena cada entrega | Alta | Medio | Un proceso por núcleo (#138): de 28 a 23 minutos; mientras se desarrolla solo corren las pruebas afectadas. Al ir más cargada la máquina salió una prueba que dependía del tiempo, y se corrigió | Mitigado en parte |
| Sin presupuesto de GitHub Actions: la compuerta depende de correrla en local | Alta | Medio | `npm run comprobar` antes de cada fusión, sin excepción; el resultado se escribe en cada PR | Mitigado |
| Arte desigual o que se parezca a otro juego | Baja | Medio | Guía de estilo con reglas medibles; todo dibujado desde cero | Mitigado |
| Datos de menores (LFPDPPP) si se añade servidor | Media | Alto | Hoy no sale nada del dispositivo. Con servidor: datos mínimos, alias, consentimiento y derechos ARCO (F3.7), revisión legal del titular | Abierto |
| Ramas fusionadas acumuladas (más de 60) | Alta | Bajo | Script de limpieza listo; el titular las borra o activa el borrado automático | Abierto |
| Un mundo cerrado de la Aventura frustra a quien quería jugar | Media | Medio | El primer mundo está abierto desde el primer día; lo ya jugado nunca se cierra; el cierre dice qué tabla falta | Mitigado; confirmar en pruebas con niños |
| El informe imprimible crece con cada tema y pasa de una hoja | Media | Bajo | Una línea por tema (#100); la prueba de «una hoja carta» siembra todas las clases de todos los temas, así que avisa si un tema nuevo la desborda | Mitigado |

## Cómo se trabaja cada tarea

Cada tarea pasa por las mismas ocho etapas, y no se fusiona si una falla:

| Etapa | Qué se hace | Cómo se sabe que está |
|-------|-------------|------------------------|
| 1. Análisis | Leer el código que se va a tocar y medir antes de proponer | Se sabe qué hay y qué falta, con datos |
| 2. Diseño | Decidir pantalla, textos y datos con el alcance mínimo que cumple el objetivo | Las decisiones que se pueden cambiar quedan anotadas en el PR |
| 3. Desarrollo | Una rama por tarea; sin dependencias externas | El juego construye y el sello cambia |
| 4. Pruebas | Una especificación nueva, en escritorio y tableta, con accesibilidad (axe) y tamaños táctiles | Las pruebas nuevas y las afectadas pasan |
| 5. Verificación | Capturas en teléfono, la compuerta entera (`npm run comprobar`) y mutaciones | Compuerta en verde; cada mutación muere, o se quita el código que sobraba |
| 6. Integración | PR con lo hecho, lo decidido y los resultados; fusión | PR fusionado en `main` |
| 7. Despliegue | GitHub Pages publica `main` | El sello de `sw.js` publicado es el de `main` |
| 8. Cierre | README, CHANGELOG, este plan y #20 al día | El issue de la tarea queda marcado |

**Para ir rápido sin perder calidad:**
- mientras se desarrolla, solo se corren las pruebas afectadas; la compuerta entera, una vez por PR;
- la compuerta corre de fondo mientras se preparan las mutaciones;
- una tarea, un PR: los cambios pequeños se revisan y se deshacen fácil;
- lo que una mutación muestra como redundante se quita, no se justifica.

**Reglas que no cambian:**
- sin internet;
- accesible (WCAG 2.1 AA);
- táctil (44 px, nada fuera de la pantalla);
- «Menos movimiento» lo apaga todo;
- arte y personajes originales;
- nada de publicidad ni de datos de los niños fuera del dispositivo sin decisión del titular.
