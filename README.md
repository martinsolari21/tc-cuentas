# TC Cuentas

App para llevar las cuentas de un equipo de Turismo Carretera: gastos e ingresos, carreras con presupuesto, multas, contratos de auspicio, inventario de neumáticos y motores, proyección de temporada, moneda ARS/USD y reportes.

Es una página sin servidor: HTML + CSS + módulos de JavaScript, sin build. Los datos se guardan en el `localStorage` del navegador (clave `tc-cuentas`) y se pueden exportar e importar como copia JSON desde la pestaña Reportes.

## Cómo correrla

```bash
npm install      # una vez (jsdom, para los tests)
npm run dev      # sirve la carpeta en http://localhost:5173
npm test         # tests
npm run check    # verifica la sintaxis de src/
```

Hay que abrirla con `npm run dev`: al usar módulos, abrir `index.html` con doble clic ya no funciona.

## Sin señal

Es una PWA: la primera vez que se abre con señal queda guardada en el dispositivo y después funciona sin conexión (carga de gastos, PDF, todo). Se puede instalar en el celular desde Más → Usar sin señal (en iPhone: Compartir → Agregar a inicio). Para eso tiene que estar publicada en un sitio con `https://`.

Después de cambiar archivos de la app: `npm run sw:version`.

## Estructura

```
index.html          esqueleto de la página
sw.js               service worker (uso sin señal)
manifest.webmanifest  datos para instalar la app
assets/             fuentes e íconos
vendor/             jsPDF (incluido, sin CDN)
src/main.js         arranque y render
src/actions.js      acciones del usuario
src/calc.js         cálculos
src/views/          una vista por pestaña
src/styles.css      estilos (modo claro y oscuro)
tests/              tests (node --test + jsdom)
docs/REQUISITOS.md  qué hace hoy, qué falta y bugs conocidos
CLAUDE.md           contexto y reglas para trabajar con Claude Code
```

## Trabajar con Claude Code

```bash
cd tc-cuentas
claude
```

Claude Code lee `CLAUDE.md` solo.
