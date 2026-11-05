// Arranca la app (original o refactorizada) dentro de un DOM falso (jsdom) y la maneja
// como lo haría un usuario: completa campos, dispara "change" y hace clic en botones.
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { NOW } from "./fixtures.js";

const root = new URL("../", import.meta.url);
const page = (f) => readFileSync(new URL(f, root), "utf8").replace(/<script\b[\s\S]*?<\/script>/g, "");
// La versión original se prueba con su index.html de entonces (botones con onclick en línea).
const HTML = { original: page("tests/legacy/index.legacy.html"), nuevo: page("index.html") };
const legacyCode = readFileSync(new URL("tests/legacy/app.legacy.js", root), "utf8");

export const IMPLS = process.env.IMPL ? process.env.IMPL.split(",") : ["original", "nuevo"];

export async function boot(impl, { state, raw, now }) {
  const dom = new JSDOM(HTML[impl], { runScripts: "dangerously", url: "http://localhost/", pretendToBeVisual: true });
  const win = dom.window, doc = win.document;
  const fixed = Date.parse(now);
  const io = { alerts: [], downloads: [], pdf: [], confirm: true, confirms: [] };

  if (raw != null) win.localStorage.setItem("tc-cuentas", raw);
  else if (state) win.localStorage.setItem("tc-cuentas", JSON.stringify(state));

  win.confirm = (q) => { io.confirms.push(q); return io.confirm; };
  win.alert = (q) => { io.alerts.push(q); };
  win.scrollTo = () => {};
  class FakeBlob { constructor(parts, o) { this.parts = parts; this.type = o && o.type; } }
  win.Blob = FakeBlob;
  let last = null;
  win.URL.createObjectURL = (b) => { last = b; return "blob:test"; };
  win.URL.revokeObjectURL = () => {};
  win.HTMLAnchorElement.prototype.click = function () {
    io.downloads.push({ name: this.download, type: last && last.type, data: last && last.parts.join("") });
  };
  win.jspdf = { jsPDF: class { setFont() {} setFontSize() {} addPage() { io.pdf.push("--página--"); } text(s) { io.pdf.push(s); } output() { return "PDF"; } } };

  if (impl === "original") {
    const RealDate = win.Date;
    class FixedDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(fixed); }
      static now() { return fixed; }
    }
    win.Date = FixedDate;
    win.eval(legacyCode);
  } else {
    Object.assign(globalThis, { window: win, document: doc, localStorage: win.localStorage });
    const clock = await import("../src/clock.js");
    clock.setNow(() => fixed);
    const { start } = await import("../src/main.js");
    start();
  }
  return makeDriver(win, io);
}

function makeDriver(win, io) {
  const doc = win.document;
  const byId = (id) => {
    const el = doc.getElementById(id);
    if (!el) throw new Error("No existe #" + id);
    return el;
  };
  const fire = (el, type) => el.dispatchEvent(new win.Event(type, { bubbles: true }));
  const label = (b) => b.textContent.replace(/\s+/g, " ").trim();
  function pick(list, text, where) {
    const found = [...list].filter((b) => label(b) === text);
    if (found.length !== 1) throw new Error(`Se esperaba 1 botón "${text}"${where ? " en " + where : ""}, hay ${found.length}`);
    return found[0];
  }
  return {
    win, doc, io,
    /** Escribe en un campo sin disparar change. */
    set(id, v) { const el = byId(id); if (el.type === "checkbox") el.checked = !!v; else el.value = v; return this; },
    /** Escribe y dispara change (para los campos con onchange). */
    change(id, v) { this.set(id, v); fire(byId(id), "change"); return this; },
    changeEl(el, v) { el.value = v; fire(el, "change"); return this; },
    fill(o) { for (const k in o) this.set(k, o[k]); return this; },
    /** Clic en el único botón con ese texto en todo el documento. */
    click(text) { pick(doc.querySelectorAll("button"), text).click(); return this; },
    /** Clic en el botón con ese texto dentro de la tarjeta que contiene #id. */
    clickNear(id, text) { pick(byId(id).closest(".card").querySelectorAll("button"), text, "#" + id).click(); return this; },
    /** Clic en el botón de la fila (tr o tarjeta) que contiene el texto. */
    clickIn(rowText, text, sel = "tr") {
      const rows = [...doc.querySelectorAll(sel)].filter((r) => r.textContent.includes(rowText) && r.querySelector("button"));
      const row = rows[rows.length - 1];
      if (!row) throw new Error("No hay fila con " + rowText);
      pick(row.querySelectorAll("button"), text, rowText).click();
      return this;
    },
    tab(name) { pick(doc.querySelectorAll(".tabs button"), name, "pestañas").click(); return this; },
    inputsIn(rowText, sel = "tr") {
      const row = [...doc.querySelectorAll(sel)].filter((r) => r.textContent.includes(rowText)).pop();
      return [...row.querySelectorAll("input")];
    },
    async importJSON(text) {
      const input = doc.querySelector('input[type="file"]');
      Object.defineProperty(input, "files", { value: [new win.File([text], "copia.json", { type: "application/json" })], configurable: true });
      // FileReader es asíncrono: esperar a que cambien los datos guardados o aparezca un aviso.
      const before = [win.localStorage.getItem("tc-cuentas"), io.alerts.length, io.confirms.length];
      fire(input, "change");
      const done = () => win.localStorage.getItem("tc-cuentas") !== before[0] || io.alerts.length > before[1] || (io.confirms.length > before[2] && !io.confirm);
      for (let t = 0; t < 400 && !done(); t++) await new Promise((r) => setTimeout(r, 5));
      await new Promise((r) => setTimeout(r, 5));
    },
    saved() { return JSON.parse(win.localStorage.getItem("tc-cuentas")); },
    text(sel = "#main") { return doc.querySelector(sel).textContent.replace(/\s+/g, " ").trim(); },
    snapshot() { return snapshot(doc); },
  };
}

/** Todo lo que el usuario ve y puede tocar, en forma comparable. */
export function snapshot(doc, { sinMoneda = false } = {}) {
  // sinMoneda: el original solo mostraba moneda y comprobante en la pestaña Resumen (bug:
  // en las demás pestañas "Guardar" fallaba). La versión nueva los muestra siempre, así que
  // para comparar con el original se ignoran esos campos.
  const skip = new Set(sinMoneda ? ["mc", "mx", "vt", "vn", "vp", "vc", "vi"] : []);
  const keep = (el) => !skip.has(el.id);
  const t = (el) => {
    if (skip.size && el.id === "main") {
      const c = el.cloneNode(true); // solo para el texto; los valores se leen del original
      skip.forEach((id) => { const e = c.querySelector("#" + id); if (e) e.remove(); });
      el = c;
    }
    return el.textContent.replace(/\s+/g, " ").trim();
  };
  const ctl = (el) => {
    let s = `${el.tagName.toLowerCase()}#${el.id || ""}[${el.type || ""}] ph=${el.placeholder || ""} v=${el.type === "file" ? "" : el.value}`;
    if (el.type === "checkbox") s += " chk=" + el.checked;
    if (el.disabled) s += " disabled";
    if (el.style.display === "none") s += " oculto";
    if (el.tagName === "SELECT") s += " opts=" + [...el.options].map((o) => o.textContent + (o.value !== o.textContent ? "=" + o.value : "")).join("|");
    return s;
  };
  const main = doc.getElementById("main");
  const fg = doc.getElementById("fg");
  return {
    equipos: t(doc.getElementById("tb")),
    arriba: [...doc.querySelectorAll(".top select, .top input")].map(ctl),
    texto: t(main),
    controles: [...main.querySelectorAll("input,select,textarea")].filter(keep).map(ctl),
    botones: [...main.querySelectorAll("button")].map((b) => t(b) + (b.className ? "." + b.className : "")),
    colores: [...main.querySelectorAll(".ok,.ko")].map((e) => e.className + ":" + t(e)),
    barras: [...main.querySelectorAll(".pb i,.br i,.tk")].map((e) => e.className + ":" + e.style.width + e.style.left),
    multa: fg ? fg.style.display : null,
  };
}

/** Quita los ids aleatorios (se reemplazan por #1, #2… según orden de aparición). */
export function normalizeIds(o) {
  const map = new Map();
  // Los ids nuevos son el reloj fijo de los tests en base 36 + 0 a 4 caracteres al azar.
  const re = new RegExp("\\b" + Date.parse(NOW).toString(36) + "[0-9a-z]{0,4}\\b", "g");
  const tok = (v) => (typeof v !== "string" ? v : v.replace(re, (id) => {
    if (!map.has(id)) map.set(id, "#" + (map.size + 1));
    return map.get(id);
  }));
  const walk = (x) => {
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === "object") {
      const r = {};
      for (const k of Object.keys(x)) r[tok(k)] = walk(x[k]);
      return r;
    }
    return tok(x);
  };
  return walk(JSON.parse(JSON.stringify(o)));
}

/** Estado guardado comparable: sin ids aleatorios ni número de versión. */
export function normalizeSaved(o) {
  const copy = { ...o };
  delete copy.version;
  return normalizeIds(copy);
}
