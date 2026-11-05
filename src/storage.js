// Lectura y escritura en localStorage. Si el navegador no deja guardar, la app sigue andando.
import { STORAGE_KEY } from "./constants.js";

export function readSaved() {
  try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
}

export function writeSaved(S) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* sin espacio o bloqueado */ }
}
