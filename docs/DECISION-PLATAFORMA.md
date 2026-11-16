# Decisión de plataforma: arquitectura, sostenimiento y privacidad

Para el issue [#66](https://github.com/dleon55/jardin-magico-multiplicaciones/issues/66).
**Estado: pendiente de decisión del titular.** Este documento reúne las
opciones, lo que cuesta cada una, sus riesgos y una recomendación. La
decisión se anota al final.

> Los costos son aproximados, en dólares estadounidenses, a noviembre de
> 2026. Hay que confirmarlos en la página de precios de cada proveedor el día
> que se decida. Lo legal es una orientación, no asesoría: antes de guardar
> datos de niños en un servidor, se necesita una revisión legal (#67).

## Dónde estamos

- El juego es **una sola página sin servidor**, publicada en GitHub Pages
  (gratis).
- **Funciona sin internet** después de la primera visita.
- **Todo se guarda en el aparato**, en el almacenamiento del navegador:
  - varios jardines por aparato, uno por niño;
  - copia de seguridad en un archivo que se guarda y se vuelve a cargar;
  - una vista para adultos.
- **No sale ningún dato del aparato.** No hay cuentas, correos, publicidad
  ni analítica.

Es la opción más barata y más segura para los datos de los niños. Lo que no
permite:
- ver el avance de un niño en dos aparatos a la vez (en casa y en la escuela);
- que una docente vea a todo su salón sin tener los aparatos en la mano;
- retos en línea entre compañeros.

## Las cuatro decisiones

### 1. ¿Servidor sí o no?

| Opción | Qué es | Costo al mes | Trabajo de mantenimiento | Riesgo principal |
|--------|--------|--------------|--------------------------|------------------|
| **A. Sin servidor (lo de hoy)** | Todo en el aparato; copia por archivo | 0 | Casi nada | No sincroniza entre aparatos; si se borran los datos del navegador sin copia, se pierde el jardín |
| **B. Sin servidor + salón por archivos** | Como A. La docente junta en su aparato los archivos que le pasan las familias (o un código QR) y ve el salón ahí mismo | 0 | Bajo | Pasar archivos es manual; no es «en vivo» |
| **C. Servicio administrado** (p. ej. Supabase o Firebase) | Cuentas de adulto y sincronización; los datos viven en la nube del proveedor | 0 en el plan gratuito; con uso real, unos 25 (Supabase Pro) o pago por uso (Firebase) | Medio: copias, permisos, actualizar dependencias, atender incidentes | Datos de menores fuera del aparato, y en otro país: aviso de privacidad, consentimiento, contrato con el proveedor, transferencia internacional |
| **D. Servidor propio** (un VPS) | Igual que C, pero hecho y operado por nosotros | 5 a 20 del servidor, más horas de quien lo opera | Alto: seguridad, parches, copias, disponibilidad | Todo lo de C, más la responsabilidad entera de la seguridad |

**C** y **D** obligan además a:
- conectarse para sincronizar (el juego seguiría funcionando sin internet,
  pero sincronizaría al volver la conexión);
- tener un aviso de privacidad y un proceso para los derechos ARCO (acceso,
  rectificación, cancelación y oposición);
- borrar los datos cuando se pida.

### 2. ¿Cómo se sostiene?

| Modelo | A favor | En contra |
|--------|---------|-----------|
| **Gratuito** | Llega a todos; con A o B cuesta 0 | Con C o D alguien paga el servidor |
| **Donativo** | Mantiene el acceso libre | Ingreso incierto |
| **Licencia para escuelas** | Ingreso estable; las escuelas pagan el modo salón | Pide factura, soporte y un contrato con cada escuela |
| **Freemium** (lo básico gratis, salón de pago) | Las familias no pagan | Hay que cuidar que lo gratis no se sienta incompleto |
| **Publicidad** | — | **Descartada.** Nunca publicidad dirigida a niños |

### 3. Datos de menores

Si se elige C o D, como mínimo:
- **Datos mínimos.**
  - El niño se identifica con un alias y su avance.
  - Sin correo, sin fecha de nacimiento exacta, sin foto ni escuela del niño.
  - La cuenta es del adulto.
- **Consentimiento** de quien ejerce la patria potestad o la tutela, antes de
  crear la cuenta del niño.
- **Retención.** Se borra todo tras 12 meses sin uso, o cuando se pida.
- **Dónde viven los datos.** El proveedor y su región; si están fuera de
  México, es una transferencia internacional que el aviso debe explicar.
- **Marco legal.**
  - En México, la Ley Federal de Protección de Datos Personales en Posesión
    de los Particulares (la reformada en 2025).
  - Si hubiera usuarios fuera: COPPA en Estados Unidos y el RGPD en la Unión
    Europea, que piden un consentimiento parental verificable.
  - Confirmar con asesoría legal (#67).

Con A o B, nada sale del aparato. Basta un aviso breve que lo diga y explique
cómo borrar los datos.

### 4. Alcance: ¿familias o también salones?

| Alcance | Con A | Con B | Con C/D |
|---------|-------|-------|---------|
| Familias | Ya funciona | Ya funciona | Sincroniza entre aparatos |
| Salón, un aparato por turno | Turnos en el mismo aparato (#70) | Igual | Igual |
| Salón, cada niño en su aparato | La docente no ve el avance | Lo ve juntando archivos | Lo ve en vivo; meta común del grupo (#70) |

## Qué desbloquea cada opción

| Tarea | A | B | C/D |
|-------|---|---|-----|
| F3.2 Cuentas y sincronización | No | No | Sí |
| F3.3 Modo salón | Parcial (turnos) | Sí, por archivos | Sí, en vivo |
| F3.4 Retos entre compañeros | Solo turnos locales | Meta común por archivos | Meta común en vivo |
| F3.6 Métricas | No | No | Solo agregadas y anónimas |
| F3.7 Aviso de privacidad | Breve | Breve | Completo, con revisión legal |
| F3.5 Más temas | Sí | Sí | Sí |

## Recomendación

**Seguir con A y añadir B**, y dejar C para cuando haya una escuela concreta
que lo pida.

Por qué:
- A ya funciona, cuesta 0 y no expone datos de niños.
- B da a una docente lo esencial (ver a su salón) sin servidor ni
  consentimientos nuevos, y se puede hacer en una o dos semanas.
- C sale caro sobre todo en obligaciones, no en dinero: aviso, consentimiento,
  derechos ARCO, contrato con el proveedor e incidentes. Vale la pena cuando
  alguien concreto lo necesite y alguien se haga cargo del servicio.
- Si llega ese momento, lo preferible es C con un proveedor administrado, no
  D: la seguridad de un servidor propio es la parte más difícil de hacer bien.

Mientras tanto, sin decidir nada, ya se puede avanzar con lo que no necesita
servidor:
- más temas (#71);
- turnos en el mismo aparato (#70);
- la guía de pruebas con niños ([PRUEBAS-CON-NINOS.md](PRUEBAS-CON-NINOS.md)).

## Decisión del titular

*(Por llenar.)*

- [ ] Servidor: A / B / C (proveedor: ______) / D
- [ ] Modelo de sostenimiento: ______
- [ ] Alcance: familias / familias y salones
- [ ] Quién paga y mantiene el servicio (si C o D): ______
- [ ] Fecha de la decisión: ______

Cuando se tome, se actualiza este documento y [`PLAN.md`](PLAN.md), y se
desbloquean las tareas que correspondan.
