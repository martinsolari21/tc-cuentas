# TC Cuentas — contexto para Claude Code

App de gestión de cuentas para equipos de Turismo Carretera (TC, Argentina). Idioma de la interfaz: español rioplatense. Moneda base: pesos argentinos (ARS), con soporte de USD por movimiento. Se usa sobre todo desde el celular, en el autódromo, así que debe verse bien en pantallas chicas y tener modo claro y oscuro.

## Estado actual

Página única sin build ni framework, sin servidor: HTML + CSS + módulos ES nativos. Nació como un Artifact de Claude en tres etapas; en noviembre de 2026 se refactorizó a módulos sin cambiar el comportamiento (verificado con tests que comparan contra el prototipo original), y después se rediseñó la interfaz.

## Diseño ("Box TC")

Estructura de app de finanzas con identidad de pista. Pensada primero para el celular.
- Barra superior oscura (marca, moneda de visualización) y fila de equipos como chips.
- Barra inferior: Inicio, Carreras, Movimientos, Pendientes (con contador) y Más (Contratos, Inventario, Presupuesto, Equipo, Reportes).
- Inicio: tarjeta oscura de balance con bandera a cuadros, "A resolver" (vencidos y por vencer en 7 días, con Pagado/Cobrada directo), próxima fecha, gastos por categoría y últimos movimientos.
- Botón "+" flotante que abre una hoja inferior para cargar o editar movimientos; moneda y comprobante van plegados.
- Formularios de alta plegados ("+ Nueva carrera", etc.); se abren solos al editar.
- Tipografía Barlow / Barlow Condensed (servida desde `assets/fonts/`, no desde Google); números tabulares; rojo TC como acento. Colores como variables en `styles.css`, con modo oscuro.
- Íconos SVG en línea (`views/icons.js`), sin librerías externas.

## Uso sin señal (PWA)

- `sw.js` (service worker) guarda la app completa en el dispositivo la primera vez que se abre con señal y después la sirve desde ahí: primero caché, después red. Los datos no pasan por el service worker (siguen en localStorage).
- **Regla:** la página no puede cargar nada de internet. Fuentes en `assets/fonts/`, jsPDF en `vendor/` (se carga recién al exportar un PDF). `tests/pwa.test.js` lo controla.
- **Después de cambiar cualquier archivo de la app correr `npm run sw:version`.** `VERSION` es un hash del contenido; si queda vieja, el test falla. Con una versión nueva, la app muestra "Hay una versión nueva · Actualizar" y no recarga sola.
- Archivo nuevo en `src/`, `assets/` o `vendor/` → agregarlo a `FILES` en `sw.js` (el test avisa si falta).
- `src/pwa.js`: registro, aviso "Sin señal", actualización, pedido de almacenamiento persistente e instalación. El estado se ve en Más → Usar sin señal.
- Íconos: `npm run icons` los regenera (`scripts/icons.js`); `manifest.webmanifest` describe la app instalable.
- Los service workers solo andan en `https://` o en `localhost`. Para usarla en el celular hay que publicarla en un hosting con HTTPS.
- El navegador integrado de la app de Claude no admite service workers: para probar sin señal usar Chrome o Edge (por ejemplo con puppeteer-core y `page.setOfflineMode(true)`).

Lo que hace hoy: equipos con piloto, movimientos de ingreso y gasto (editables), carreras con presupuesto, sede, km y fase, multas y pagos/cobros pendientes con vencimientos, contratos de auspicio con cuotas, inventario de neumáticos y de motores/repuestos, presupuesto por categoría, proyección de temporada, estructura del equipo (dueño del auto, aportes, personal), comprobantes manuales, moneda ARS/USD, exportación CSV y PDF, copia de seguridad JSON.

## Comandos

- `npm install` — una vez, instala jsdom (solo para los tests)
- `npm run dev` — servidor local en http://localhost:5173 (los módulos ES no andan abriendo `index.html` con doble clic)
- `npm test` — todos los tests
- `npm run check` — chequeo de sintaxis de `src/`
- `npm run sw:version` — recalcula la versión del service worker (obligatorio después de cambiar archivos de la app)
- `npm run icons` — regenera los íconos PNG

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
src/views/*.js       una vista por sección + shell.js (balance, barra inferior, Más, hoja de movimiento), ui.js e icons.js
tests/caracterizacion.test.js  comportamiento fijado; corre contra el original y el nuevo
tests/equivalencia.test.js     mismos escenarios en ambos: datos guardados y descargas iguales
tests/interfaz.test.js         barra inferior, botón +, hoja de movimiento, A resolver y Más
tests/calc.test.js             unitarios de cálculos, formato y migración
tests/arreglos.test.js         cambios de comportamiento intencionales
tests/legacy/                  copia congelada del prototipo original (no editar)
```

Para agregar una acción: función en `actions.js` y un botón con `data-act="nombre"` (o un campo con `data-change`). Para agregar una sección: vista en `src/views/`, entrada en `NAV` (barra inferior) o `MORE` (menú Más) en `views/shell.js`, y en `VIEWS` (`main.js`).

## Modelo de datos

En memoria hay un objeto `S` con datos y estado de interfaz. Se guarda separado: los datos en localStorage `tc-cuentas` (lo mismo que va en la copia JSON) y las preferencias de pantalla en `tc-cuentas-ui` (no viajan en las copias).

- `version` — versión de la estructura (hoy 2). Cambiar la estructura = subir `DATA_VERSION` y agregar el paso en `migrate()` (`src/state.js`), con test en `tests/calc.test.js`. Sin versión o v1 = datos y estado de interfaz juntos.
- `teams[]` `{id, name, pilot}`
- `moves[]` `{id, team, type:"i"|"g", cat, amt (en ARS), cur, usd, fx, race, date, note, vt, vn, vp, vc, vi, ci?}`
- `races[]` `{id, team, name, date, budget, sede, km, fase, res}`
- `pend[]` pagos, cobros y multas pendientes. No cuentan como gasto ni ingreso hasta marcarlos pagados; al hacerlo generan un `move`.
- `cons[]` contratos con `inst[]` (cuotas). Cobrar una cuota crea un `move` de Auspicio con `ci` apuntando a la cuota.
- `tires[]`, `parts[]` inventarios.
- `cfg[teamId]` `{bud:{categoría:monto}, total, owner, aport[], staff[]}`
- Preferencias de pantalla guardadas en `tc-cuentas-ui`: `sel`, `view`, `disp`, `fxref`. Estado pasajero, no se guarda: `type`, `race`, `edit`.
- Fechas: texto `AAAA-MM-DD`. "Hoy" es la fecha local del dispositivo (`clock.js`); las cuentas de fechas se hacen sin hora, en UTC (`format.js`).

## Cambios de comportamiento respecto del prototipo

Los tests de caracterización y equivalencia comparan contra el original solo lo que no cambió a propósito. Lo que cambió a propósito está en `tests/arreglos.test.js`: guardar desde cualquier pestaña, "hoy" en hora local, cuotas a fin de mes, datos separados de la interfaz, importar reemplaza todo y borrar un equipo borra todos sus datos. Al arreglar algo más, su test va ahí.

## Reglas que no se negocian

- **No perder datos del usuario.** Cualquier cambio en la estructura de `S` necesita migración desde lo ya guardado en `localStorage` y desde copias JSON viejas.
- **No inventar reglas impositivas ni valores del reglamento de la ACTC.** IVA, retenciones y ganancias son campos manuales; no calcular impuestos automáticamente. Los datos del reglamento (por ejemplo, 6 neumáticos nuevos y 6 resellados por fecha) son referencias que el usuario debe verificar, y la app solo avisa, no bloquea.
- La interfaz se mantiene en español rioplatense y los montos con formato `es-AR`.
- La app guarda CUIT y datos de terceros: tratarlos como datos personales y no enviarlos a ningún servicio externo sin decisión explícita.

## Hoja de ruta

1. ~~Refactor, tests y bugs heredados~~ (hecho). Quedan pendientes menores en `docs/REQUISITOS.md`.
2. Persistencia robusta: pasar de `localStorage` a IndexedDB, con exportación e importación versionada.
3. ~~Uso sin internet como PWA instalable~~ (hecho). Falta publicarla en un hosting con HTTPS para usarla en el celular.
4. Backend con base de datos y cuentas: usuarios, roles (administrador, piloto, contador) y sincronización entre dispositivos. Elegir stack con el usuario.
5. Solo si equipos reales la usan: pensar en producto (precio, revisión fiscal con un contador, normativa de datos personales).
