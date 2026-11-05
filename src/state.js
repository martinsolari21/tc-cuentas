// Estado de la app y migración de datos guardados.
//
// La forma de los datos está documentada en CLAUDE.md. Regla: nunca perder datos del
// usuario. Cualquier cambio de estructura sube DATA_VERSION y agrega un paso en migrate().
import { DATA_VERSION } from "./constants.js";

export function emptyState() {
  return { teams: [], moves: [], races: [], sel: null, type: "g", view: "res", race: "" };
}

/**
 * Completa un estado guardado por cualquier versión anterior (incluidas las copias de
 * la etapa 1, sin pendientes ni contratos) con lo que le falta. Modifica y devuelve `S`.
 */
export function migrate(S) {
  // Sin versión = prototipo original (etapas 1 a 3). Agregar campos faltantes.
  S.pend = S.pend || [];
  S.cons = S.cons || [];
  S.tires = S.tires || [];
  S.parts = S.parts || [];
  S.cfg = S.cfg || {};
  S.disp = S.disp || "ARS";
  S.fxref = S.fxref || 0;
  S.version = DATA_VERSION;
  return S;
}

/** Estado inicial a partir del texto guardado (o null). Nunca tira error. */
export function loadState(raw) {
  let S = emptyState();
  try {
    if (raw) {
      const o = JSON.parse(raw);
      if (o && o.teams) S = Object.assign(S, o);
    }
  } catch (e) { /* datos ilegibles: se arranca vacío */ }
  migrate(S);
  S.edit = null;
  if (!S.sel && S.teams.length) S.sel = S.teams[0].id;
  return S;
}

/** ¿Parece una copia de TC Cuentas? */
export function isBackup(o) { return !!(o && Array.isArray(o.teams) && Array.isArray(o.moves)); }
