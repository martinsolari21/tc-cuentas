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

Hay que abrirla con `npm run dev`: al usar módulos, abrir `index.html` con doble clic ya no funciona. Hace falta internet solo para cargar jsPDF (informe en PDF) desde un CDN.

## Estructura

```
index.html          esqueleto de la página
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
