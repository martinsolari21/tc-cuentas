// Lectura y escritura en localStorage. Si el navegador no deja guardar, la app sigue andando.
import { STORAGE_KEY, UI_STORAGE_KEY } from "./constants.js";
import { dataOf, uiOf } from "./state.js";

const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin espacio o bloqueado */ } };

export function readSaved() { return { data: get(STORAGE_KEY), ui: get(UI_STORAGE_KEY) }; }

export function writeSaved(S) {
  set(STORAGE_KEY, JSON.stringify(dataOf(S)));
  set(UI_STORAGE_KEY, JSON.stringify(uiOf(S)));
}
