# TC Cuentas — contexto para Claude Code

App de gestión de cuentas para equipos de Turismo Carretera (TC, Argentina). Idioma de la interfaz: español rioplatense. Moneda base: pesos argentinos (ARS), con soporte de USD por movimiento. Se usa sobre todo desde el celular, en el autódromo, así que debe verse bien en pantallas chicas y tener modo claro y oscuro.

## Estado actual

Página única sin build ni framework, sin servidor: HTML + CSS + módulos ES nativos. Nació como un Artifact de Claude en tres etapas; en noviembre de 2026 se refactorizó a módulos sin cambiar el comportamiento (verificado con tests que comparan contra el prototipo original).

Lo que hace hoy: equipos con piloto, movimientos de ingreso y gasto (editables), carreras con presupuesto, sede, km y fase, multas y pagos/cobros pendientes con vencimientos, contratos de auspicio con cuotas, inventario de neumáticos y de motores/repuestos, presupuesto por categoría, proyección de temporada, estructura del equipo (dueño del auto, aportes, personal), comprobantes manuales, moneda ARS/USD, exportación CSV y PDF, copia de seguridad JSON.

## Comandos

- `npm install` — una vez, instala jsdom (solo para los tests)
- `npm run dev` — servidor local en http://localhost:5173 (los módulos ES no andan abriendo `index.html` con doble clic)
- `npm test` — todos los tests
- `npm run check` — chequeo de sintaxis de `src/`

## Estructura

```
src/main.js          arranque, render() único y despacho de eventos (data-act / data-change)
src/actions.js       una función por acción del usuario; devuelve "save" o "draw"
src/state.js         estado inicial y migrate() de datos guardados y copias viejas
src/storage.js       localStorage
src/calc.js          cálculos puros (presupuesto, proyección, cuotas, alertas…)
src/format.js        moneda es-AR, fechas, CSV, ids
src/clock.js         "hoy" (los tests lo fijan)
src/constants.js     categorías, fases, estados, referencias del reglamento
src/export.js        CSV, PDF (jsPDF por CDN) y copia JSON
src/views/*.js       una vista por pestaña + shell.js (encabezado, formulario, pestañas) y ui.js
tests/caracterizacion.test.js  comportamiento fijado; corre contra el original y el nuevo
tests/equivalencia.test.js     mismos escenarios en ambos: pantalla y datos guardados iguales
tests/calc.test.js             unitarios de cálculos, formato y migración
tests/arreglos.test.js         cambios de comportamiento intencionales
tests/legacy/                  copia congelada del prototipo original (no editar)
```

Para agregar una acción: función en `actions.js` y un botón con `data-act="nombre"` (o un campo con `data-change`). Para agregar una pestaña: vista en `src/views/`, entrada en `TABS` (`views/shell.js`) y en `VIEWS` (`main.js`).

## Modelo de datos (objeto `S`, guardado en localStorage `tc-cuentas`)

- `version` — versión de la estructura (hoy 1). Cambiar la estructura = subir `DATA_VERSION` y agregar el paso en `migrate()`.
- `teams[]` `{id, name, pilot}`
- `moves[]` `{id, team, type:"i"|"g", cat, amt (en ARS), cur, usd, fx, race, date, note, vt, vn, vp, vc, vi, ci?}`
- `races[]` `{id, team, name, date, budget, sede, km, fase, res}`
- `pend[]` pagos, cobros y multas pendientes. No cuentan como gasto ni ingreso hasta marcarlos pagados; al hacerlo generan un `move`.
- `cons[]` contratos con `inst[]` (cuotas). Cobrar una cuota crea un `move` de Auspicio con `ci` apuntando a la cuota.
- `tires[]`, `parts[]` inventarios.
- `cfg[teamId]` `{bud:{categoría:monto}, total, owner, aport[], staff[]}`
- Estado de UI: `sel`, `type`, `view`, `race`, `edit`, `disp`, `fxref` (hoy se guarda junto con los datos; ver bugs conocidos).

## Bugs conocidos (heredados, todavía sin arreglar)

Están fijados por los tests de caracterización a propósito; al arreglar uno, mover su test a `tests/arreglos.test.js`. Lista completa en `docs/REQUISITOS.md`: fecha de hoy en UTC, importar mezcla en vez de reemplazar, estado de UI dentro de los datos, cuotas a fin de mes, huérfanos al borrar un equipo.

## Reglas que no se negocian

- **No perder datos del usuario.** Cualquier cambio en la estructura de `S` necesita migración desde lo ya guardado en `localStorage` y desde copias JSON viejas.
- **No inventar reglas impositivas ni valores del reglamento de la ACTC.** IVA, retenciones y ganancias son campos manuales; no calcular impuestos automáticamente. Los datos del reglamento (por ejemplo, 6 neumáticos nuevos y 6 resellados por fecha) son referencias que el usuario debe verificar, y la app solo avisa, no bloquea.
- La interfaz se mantiene en español rioplatense y los montos con formato `es-AR`.
- La app guarda CUIT y datos de terceros: tratarlos como datos personales y no enviarlos a ningún servicio externo sin decisión explícita.

## Hoja de ruta

1. ~~Refactor y tests~~ (hecho). Siguiente: arreglar los bugs conocidos.
2. Persistencia robusta: pasar de `localStorage` a IndexedDB, con exportación e importación versionada.
3. Uso sin internet como PWA instalable, porque la señal en el autódromo suele ser mala.
4. Backend con base de datos y cuentas: usuarios, roles (administrador, piloto, contador) y sincronización entre dispositivos. Elegir stack con el usuario.
5. Solo si equipos reales la usan: pensar en producto (precio, revisión fiscal con un contador, normativa de datos personales).
