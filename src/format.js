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

// Las cuentas de fechas se hacen en UTC sobre fechas sin hora, así no dependen de la zona horaria.
const DAY = 864e5;
const parts = (d) => d.split("-").map(Number);
const utc = (d) => { const [y, m, dd] = parts(d); return Date.UTC(y, m - 1, dd); };
const iso = (t) => new Date(t).toISOString().slice(0, 10);

export function addDays(d, n) { return iso(utc(d) + n * DAY); }

/** Suma meses; si el día no existe en el mes destino, usa el último (31/01 + 1 mes = 28/02). */
export function addMonths(d, k) {
  const [y, m, dd] = parts(d);
  const last = new Date(Date.UTC(y, m - 1 + k + 1, 0)).getUTCDate();
  return iso(Date.UTC(y, m - 1 + k, Math.min(dd, last)));
}

/** Días que faltan hasta la fecha (negativo si ya pasó). */
export function daysLeft(d, ref = today()) { return Math.round((utc(d) - utc(ref)) / DAY); }

export function csvq(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }

export function newId() { return now().toString(36) + Math.random().toString(36).slice(2, 6); }
