// Reloj de la app. Los tests lo fijan con setNow para que "hoy" sea siempre el mismo día.
let nowFn = () => Date.now();

export function setNow(fn) { nowFn = fn; }
export function now() { return nowFn(); }

/** Fecha de hoy como AAAA-MM-DD. Comportamiento heredado: usa UTC. */
export function today() { return new Date(nowFn()).toISOString().slice(0, 10); }
