// Reloj de la app. Los tests lo fijan con setNow para que "hoy" sea siempre el mismo día.
let nowFn = () => Date.now();

export function setNow(fn) { nowFn = fn; }
export function now() { return nowFn(); }

const pad = (n) => String(n).padStart(2, "0");

/** Fecha de hoy como AAAA-MM-DD, en la hora local del dispositivo. */
export function today() {
  const d = new Date(nowFn());
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
