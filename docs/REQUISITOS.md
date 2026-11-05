# Requisitos de TC Cuentas

Estado: ✅ hecho en el prototipo · 🟡 hecho con limitaciones · ⬜ pendiente.

## Etapa 1 — Control diario

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 1 | Editar movimientos y carreras | ✅ | Los contratos solo permiten editar fecha y monto de cada cuota. |
| 2 | Multas y sanciones | ✅ | Quién la recibe, artículo, notificación, vencimiento a 30 días por defecto, estado pendiente o apelada, aviso de vencimiento. |
| 3 | Contratos de auspicio | 🟡 | Cuotas mensuales iguales editables, cobro que genera ingreso. El contrato en sí no se edita. Las cuotas no aparecen en la pestaña Pendientes. |
| 4 | Cobros y pagos pendientes | ✅ | No cuentan hasta marcarlos pagados o cobrados. |

## Etapa 2 — Detalle operativo

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 5 | Rubros de costo adicionales | ✅ | Carpa, canon de motorista y chasista, amortiguadores, hospedaje, viáticos, combustible de traslado, seguro, administrativos. |
| 6 | Datos de carrera, costo por km | 🟡 | Costo por km = gasto total / km. Logística por km = combustible de traslado + hospedaje + viáticos. Definiciones a validar con el usuario. |
| 7 | Inventario de neumáticos | 🟡 | Avisa si pasan de 6 nuevos o 6 resellados; no bloquea. Si se carga como gasto, editar el registro no actualiza el gasto. |
| 8 | Inventario de motores y repuestos | ✅ | Con contador de carreras +1/−1 y +1 masivo a los "En uso". |

## Etapa 3 — Profesionalización

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 9 | Presupuesto real vs presupuestado por categoría | 🟡 | Presupuesto de temporada por categoría, no por carrera. |
| 10 | Proyección de temporada | ✅ | Gasto actual + promedio por carrera × carreras restantes. |
| 11 | Moneda ARS/USD | 🟡 | Se carga con cotización; el monto se guarda en ARS. Los formularios de otras pestañas siguen en ARS. |
| 12 | Estructura del equipo | 🟡 | Dueño del auto, aportes por porcentaje, personal. Aportes y personal no se editan, solo se agregan y borran. |
| 13 | Comprobantes | ✅ | Tipo, número, proveedor/cliente, CUIT, IVA manual. Sin cálculo ni validación fiscal. |
| 14 | Reportes y exportación | 🟡 | CSV de movimientos y PDF resumen (sin gráficos). |
| 15 | Persistencia y copia de seguridad | 🟡 | localStorage + exportar/importar JSON manual. |

## Pendientes conocidos

- Al eliminar un equipo quedan huérfanos sus pendientes, contratos, inventarios y configuración.
- **"Hoy" se calcula en UTC.** Después de las 21 h (hora argentina) los movimientos se guardan con la fecha de mañana y los avisos de vencimiento se corren un día.
- **Importar una copia mezcla en vez de reemplazar.** Si la copia no trae `pend`, `cons`, `tires`, `parts` o `cfg` (copias de etapas viejas), quedan los datos actuales de esas listas.
- **El estado de la interfaz se guarda con los datos** (`edit`, `view`, `type`, `race`) y viaja en las copias JSON.
- **Cuotas a fin de mes:** una cuota del 31/01 pasa al 03/03 en vez del 28/02.
- Editar un registro de neumáticos cargado como gasto no actualiza ese gasto.
- Falta validación de entradas (montos negativos, fechas incoherentes, CUIT con formato inválido).
- Sin accesibilidad revisada (etiquetas, foco, contraste).
- Sin uso offline real.

Resuelto en el refactor: migración versionada (`version` en los datos, `migrate()` en `src/state.js`), tests, y el error al tocar "Guardar" en el formulario de movimiento fuera de la pestaña Resumen.

## Próximos requisitos (no implementados)

- Cuentas de usuario, roles y permisos.
- Base de datos en la nube y sincronización entre dispositivos.
- PWA instalable con trabajo sin conexión.
- Adjuntar comprobantes (fotos o PDF).
- Edición completa de contratos, aportantes y personal.
- Presupuesto por carrera y categoría.
- Importar movimientos desde CSV o planilla.

## Fuera de alcance por ahora

- Cálculo automático de impuestos (IVA, retenciones, Ganancias): requiere criterio de un contador.
- Facturación electrónica y conexión con ARCA.
