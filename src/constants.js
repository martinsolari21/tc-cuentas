// Listas fijas de la app. El orden de las categorías es el que se ve en los formularios.
export const STORAGE_KEY = "tc-cuentas";
export const DATA_VERSION = 1;

export const CATS = {
  i: ["Auspicio", "Premio", "Aporte", "Otro ingreso"],
  g: [
    "Combustible", "Neumáticos", "Motor", "Repuestos", "Personal", "Traslado", "Inscripción", "Otro gasto",
    "Multa",
    "Alquiler de carpa", "Canon de motorista", "Canon de chasista", "Alquiler de amortiguadores",
    "Hospedaje", "Viáticos", "Combustible de traslado", "Seguro", "Gastos administrativos",
  ],
};

export const FASES = ["Etapa Regular", "Copa de Oro", "Carrera especial", "Otra"];
/** Categorías que suman a la "logística por km" de una carrera. */
export const LOG = ["Combustible de traslado", "Hospedaje", "Viáticos"];
export const EST = ["En uso", "En reserva", "En reconstrucción", "Descartado"];
export const VOUCHERS = ["Factura A", "Factura B", "Factura C", "Recibo", "Ticket", "Otro"];
export const OWNERS = ["", "Piloto", "Equipo", "Otro"];
export const FINE_WHO = ["Piloto", "Titular de equipo", "Motorista"];
export const PEND_LABEL = { p: "Pago", c: "Cobro", f: "Multa" };

/** Referencia del reglamento (a verificar por el usuario): solo se avisa, no se bloquea. */
export const TIRE_REF = 6;
