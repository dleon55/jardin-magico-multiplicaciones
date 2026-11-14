# Historial de cambios

Lo que cambió en el juego, de lo más nuevo a lo más antiguo, con el PR de cada
cambio. El estado actual y los pendientes están en el
[issue de estado](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/20).

Cada versión publicada se reconoce por el sello de `sw.js`: el sitio en vivo
está al día cuando su `sw.js` tiene el mismo sello que `main`.

## 2026-11-14

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
