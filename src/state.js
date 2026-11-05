// Estado de la app y migración de datos guardados.
//
// En memoria hay un solo objeto `S` con los datos y el estado de la interfaz. Al guardar
// se separan: los datos van a localStorage "tc-cuentas" (y a las copias JSON) y las
// preferencias de pantalla a "tc-cuentas-ui", que no viajan en las copias.
//
// Regla: nunca perder datos del usuario. Cualquier cambio de estructura sube
// DATA_VERSION y agrega un paso en migrate().
import { DATA_VERSION } from "./constants.js";

/** Lo que se guarda y se exporta. */
export const DATA_KEYS = ["teams", "moves", "races", "pend", "cons", "tires", "parts", "cfg"];
/** Preferencias de pantalla que se recuerdan en este dispositivo. */
export const UI_KEYS = ["sel", "view", "disp", "fxref"];

export function emptyState() {
  return {
    teams: [], moves: [], races: [], pend: [], cons: [], tires: [], parts: [], cfg: {},
    sel: null, type: "g", view: "res", race: "", edit: null, disp: "ARS", fxref: 0,
  };
}

/**
 * Convierte datos guardados por cualquier versión (prototipo de las etapas 1 a 3, v1 o v2)
 * en datos de la versión actual. No modifica `o`; devuelve un objeto nuevo.
 *  - sin versión / v1: datos y estado de interfaz juntos, con listas que pueden faltar.
 *  - v2: solo datos (DATA_KEYS + version).
 */
export function migrate(o) {
  const d = { version: DATA_VERSION };
  d.teams = o.teams || [];
  d.moves = o.moves || [];
  d.races = o.races || [];
  d.pend = o.pend || [];
  d.cons = o.cons || [];
  d.tires = o.tires || [];
  d.parts = o.parts || [];
  d.cfg = o.cfg || {};
  return d;
}

/** Preferencias de pantalla que trae un objeto guardado (solo las presentes y válidas). */
function pickUI(o) {
  const ui = {};
  if (!o || typeof o !== "object") return ui;
  if (typeof o.sel === "string") ui.sel = o.sel;
  if (typeof o.view === "string") ui.view = o.view;
  if (o.disp === "ARS" || o.disp === "USD") ui.disp = o.disp;
  if (o.fxref > 0) ui.fxref = o.fxref;
  return ui;
}

const parse = (raw) => { try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };

/** Si el equipo elegido no existe, elige el primero (o ninguno). */
export function fixSelection(S) {
  if (!S.teams.some((t) => t.id === S.sel)) S.sel = S.teams.length ? S.teams[0].id : null;
}

/** Estado inicial a partir de lo guardado (texto o null). Nunca tira error. */
export function loadState(rawData, rawUI) {
  const S = emptyState();
  const o = parse(rawData);
  if (o && o.teams) {
    Object.assign(S, migrate(o));
    // Antes de v2 la interfaz se guardaba junto con los datos.
    if (!(o.version >= 2)) Object.assign(S, pickUI(o));
  }
  Object.assign(S, pickUI(parse(rawUI)));
  fixSelection(S);
  return S;
}

/** Datos para guardar o exportar, sin estado de interfaz. */
export function dataOf(S) {
  const d = { version: DATA_VERSION };
  DATA_KEYS.forEach((k) => { d[k] = S[k]; });
  return d;
}

export function uiOf(S) {
  const u = {};
  UI_KEYS.forEach((k) => { u[k] = S[k]; });
  return u;
}

/** Reemplaza todos los datos por los de una copia. Mantiene las preferencias de pantalla. */
export function replaceData(S, o) {
  Object.assign(S, migrate(o));
  S.edit = null;
  S.race = "";
  fixSelection(S);
}

/** ¿Parece una copia de TC Cuentas? */
export function isBackup(o) { return !!(o && Array.isArray(o.teams) && Array.isArray(o.moves)); }
