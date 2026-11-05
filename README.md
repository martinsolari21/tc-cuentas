# TC Cuentas

App para llevar las cuentas de un equipo de Turismo Carretera: gastos e ingresos, carreras con presupuesto, multas, contratos de auspicio, inventario de neumáticos y motores, proyección de temporada, moneda ARS/USD y reportes.

Hoy es un prototipo sin servidor: HTML + CSS + JavaScript puro. Los datos se guardan en el `localStorage` del navegador (clave `tc-cuentas`) y se pueden exportar e importar como copia JSON desde la pestaña Reportes.

## Cómo correrla

```bash
npm run dev      # sirve la carpeta en http://localhost:5173
npm run check    # verifica la sintaxis de src/app.js
```

También se puede abrir `index.html` directo en el navegador. Hace falta internet solo para cargar jsPDF (informe en PDF) desde un CDN.

## Estructura

```
index.html        esqueleto de la página
src/styles.css    estilos (modo claro y oscuro)
src/app.js        toda la lógica (ver deuda técnica en CLAUDE.md)
docs/REQUISITOS.md  qué hace hoy y qué falta
CLAUDE.md         contexto y reglas para trabajar con Claude Code
```

## Trabajar con Claude Code

```bash
cd tc-cuentas
claude
```

Claude Code lee `CLAUDE.md` solo. El primer prompt sugerido está al final de ese archivo.
