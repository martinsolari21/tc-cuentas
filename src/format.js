// Formato de montos, fechas y texto. Funciones puras.
import { now, today } from "./clock.js";

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

/**
 * Formatea un monto guardado en ARS. Si se muestra en USD y hay cotización de
 * referencia, lo convierte dividiendo por esa cotización.
 */
export function money(n, disp = "ARS", fxref = 0) {
  const usd = disp === "USD" && fxref > 0;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: usd ? "USD" : "ARS", maximumFractionDigits: 0 }).format(usd ? n / fxref : n);
}

/** Monto en ARS de un movimiento cargado en otra moneda. */
export function toARS(amount, cur, fx) { return cur === "USD" ? amount * fx : amount; }

/** AAAA-MM-DD → DD/MM/AAAA */
export function fd(d) { return d ? d.split("-").reverse().join("/") : ""; }

export function addDays(d, n) {
  const x = new Date(d + "T12:00:00");
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

/** Comportamiento heredado: 31/01 + 1 mes desborda al 03/03. */
export function addMonths(d, k) {
  const x = new Date(d + "T12:00:00");
  x.setMonth(x.getMonth() + k);
  return x.toISOString().slice(0, 10);
}

/** Días que faltan hasta la fecha (negativo si ya pasó). */
export function daysLeft(d, ref = today()) {
  return Math.round((new Date(d + "T12:00:00") - new Date(ref + "T12:00:00")) / 864e5);
}

export function csvq(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }

export function newId() { return now().toString(36) + Math.random().toString(36).slice(2, 6); }
