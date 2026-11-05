# Dependencias incluidas en el proyecto

Se sirven desde la app (no desde un CDN) para que funcione sin señal y sin mandar
pedidos a servicios externos.

| Archivo | Origen | Versión | Licencia |
|---------|--------|---------|----------|
| `jspdf.umd.min.js` | cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1 (SRI sha512 verificado contra la API de cdnjs) | 2.5.1 | MIT |
| `../assets/fonts/barlow-*.woff2`, `barlow-condensed-*.woff2` | Google Fonts, subconjunto latin | v13 | SIL Open Font License 1.1 (`../assets/fonts/OFL.txt`) |

Para actualizar alguna: reemplazar el archivo, correr `npm run sw:version` y los tests.
