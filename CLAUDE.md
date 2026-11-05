# TC Cuentas — contexto para Claude Code

App de gestión de cuentas para equipos de Turismo Carretera (TC, Argentina). Idioma de la interfaz: español rioplatense. Moneda base: pesos argentinos (ARS), con soporte de USD por movimiento. Se usa sobre todo desde el celular, en el autódromo, así que debe verse bien en pantallas chicas y tener modo claro y oscuro.

## Estado actual

Prototipo de una sola página, sin build ni framework, sin servidor. Nació como un Artifact de Claude y se construyó en tres etapas encima de una base simple. Funciona, pero no fue probado exhaustivamente en un navegador.

Lo que hace hoy: equipos con piloto, movimientos de ingreso y gasto (editables), carreras con presupuesto, sede, km y fase, multas y pagos/cobros pendientes con vencimientos, contratos de auspicio con cuotas, inventario de neumáticos y de motores/repuestos, presupuesto por categoría, proyección de temporada, estructura del equipo (dueño del auto, aportes, personal), comprobantes manuales, moneda ARS/USD, exportación CSV y PDF, copia de seguridad JSON.

## Comandos

- `npm run dev` — servidor local en http://localhost:5173
- `npm run check` — chequeo de sintaxis de `src/app.js`

No hay tests todavía.

## Modelo de datos (objeto global `S`, guardado en localStorage `tc-cuentas`)

- `teams[]` `{id, name, pilot}`
- `moves[]` `{id, team, type:"i"|"g", cat, amt (en ARS), cur, usd, fx, race, date, note, vt, vn, vp, vc, vi, ci?}`
- `races[]` `{id, team, name, date, budget, sede, km, fase, res}`
- `pend[]` pagos, cobros y multas pendientes. No cuentan como gasto ni ingreso hasta marcarlos pagados; al hacerlo generan un `move`.
- `cons[]` contratos con `inst[]` (cuotas). Cobrar una cuota crea un `move` de Auspicio con `ci` apuntando a la cuota.
- `tires[]`, `parts[]` inventarios.
- `cfg[teamId]` `{bud:{categoría:monto}, total, owner, aport[], staff[]}`
- Estado de UI: `sel`, `type`, `view`, `race`, `edit`, `disp`, `fxref`.

## Deuda técnica (primera tarea recomendada)

El código se armó en tres etapas apilando parches, y eso dejó problemas reales:

1. **Funciones definidas varias veces.** `addMove` y `addRace` aparecen tres veces en `src/app.js`; vale la última. Las versiones anteriores son código muerto.
2. **`draw` y `post` se envuelven varias veces** (`var _d=draw; draw=function(){...}`). Cada etapa agregó un envoltorio que inyecta pestañas y formularios en el HTML ya dibujado. Es frágil: el orden importa y los campos nuevos se insertan por selectores.
3. **Todo es HTML en strings** con `onclick` en línea y variables globales.
4. **`m()` (formato de moneda) está redefinida** para soportar USD.

Recomendación: refactorizar a módulos (estado, almacenamiento, vistas por pestaña, formato) con un único `render` limpio, y agregar tests de los cálculos (presupuesto, proyección, cuotas, conversión de moneda) **antes** de agregar funciones nuevas. Una migración a Vite o a un framework liviano es razonable, pero no es obligatoria.

## Reglas que no se negocian

- **No perder datos del usuario.** Cualquier cambio en la estructura de `S` necesita migración desde lo ya guardado en `localStorage` y desde copias JSON viejas.
- **No inventar reglas impositivas ni valores del reglamento de la ACTC.** IVA, retenciones y ganancias son campos manuales; no calcular impuestos automáticamente. Los datos del reglamento (por ejemplo, 6 neumáticos nuevos y 6 resellados por fecha) son referencias que el usuario debe verificar, y la app solo avisa, no bloquea.
- La interfaz se mantiene en español rioplatense y los montos con formato `es-AR`.
- La app guarda CUIT y datos de terceros: tratarlos como datos personales y no enviarlos a ningún servicio externo sin decisión explícita.

## Hoja de ruta

1. Refactor y tests (ver deuda técnica).
2. Persistencia robusta: pasar de `localStorage` a IndexedDB, con exportación e importación versionada.
3. Uso sin internet como PWA instalable, porque la señal en el autódromo suele ser mala.
4. Backend con base de datos y cuentas: usuarios, roles (administrador, piloto, contador) y sincronización entre dispositivos. Elegir stack con el usuario.
5. Solo si equipos reales la usan: pensar en producto (precio, revisión fiscal con un contador, normativa de datos personales).

## Primer prompt sugerido

> Leé CLAUDE.md y docs/REQUISITOS.md. Haceme un plan para refactorizar src/app.js sin cambiar el comportamiento: separar estado, almacenamiento, formato y una vista por pestaña, y eliminar las funciones duplicadas y los envoltorios de draw/post. Antes de tocar nada, escribí tests para los cálculos (presupuesto, proyección, cuotas, moneda). Mostrame el plan y esperá mi aprobación.
