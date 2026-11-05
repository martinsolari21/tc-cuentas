// Acciones del usuario. Cada una recibe el estado y el elemento que la disparó
// (con sus data-*), modifica el estado y devuelve qué hacer después:
//   "save" → guardar y redibujar · "draw" → solo redibujar · nada → no hacer nada.
import { today } from "./clock.js";
import { addDays, newId, toARS } from "./format.js";
import { find, ofTeam, splitInstallments, teamCfg } from "./calc.js";
import { isBackup, replaceData } from "./state.js";
import { onKindChange } from "./views/pendientes.js";
import { exportCSV, exportJSON, exportPDF } from "./export.js";

const $ = (id) => document.getElementById(id);
const v = (id) => $(id).value;
const txt = (id) => $(id).value.trim();
const num = (id) => parseFloat($(id).value);
const cur = (S) => find(S.teams, S.sel);
const top = () => window.scrollTo(0, 0);

/** Guarda `o` sobre el registro que se está editando (si `kind` coincide) o lo agrega como nuevo. */
function upsert(S, list, kind, o) {
  if (S.edit && S.edit.k === kind) { Object.assign(find(list, S.edit.id), o); S.edit = null; }
  else list.push(Object.assign({ id: newId(), team: S.sel }, o));
}

function startEdit(S, k, id, view) { S.edit = { k, id }; S.view = view; return "draw"; }

export const actions = {
  // ---- Equipos ----
  addTeam(S) {
    const name = txt("tn");
    if (!name) return;
    const t = { id: newId(), name, pilot: txt("tp") };
    S.teams.push(t);
    S.sel = t.id;
    S.race = "";
    $("tn").value = "";
    $("tp").value = "";
    return "save";
  },
  pick(S, el) { S.sel = el.dataset.i; S.race = ""; return "save"; },
  delTeam(S) {
    const t = cur(S);
    if (!t || !window.confirm("¿Eliminar " + t.name + " y todos sus datos?")) return;
    for (const k of ["moves", "races", "pend", "cons", "tires", "parts"]) S[k] = S[k].filter((x) => x.team !== t.id);
    delete S.cfg[t.id];
    S.teams = S.teams.filter((x) => x.id !== t.id);
    S.sel = S.teams.length ? S.teams[0].id : null;
    S.edit = null;
    S.race = "";
    return "save";
  },

  // ---- Navegación ----
  setType(S, el) { S.type = el.dataset.v; return "draw"; },
  setView(S, el) { S.edit = null; S.sheet = false; S.view = el.dataset.v; return "draw"; },
  /** Abre la hoja de movimiento vacía (el botón +). */
  openSheet(S) { if (S.edit && S.edit.k === "m") S.edit = null; S.sheet = true; return "draw"; },
  closeSheet(S) { if (S.edit && S.edit.k === "m") S.edit = null; S.sheet = false; return "draw"; },
  cancel(S) { if (S.edit && S.edit.k === "m") S.sheet = false; S.edit = null; return "draw"; },
  setDisp(S, el) { S.disp = el.value; return "save"; },
  setFx(S, el) { S.fxref = parseFloat(el.value) || 0; return "save"; },

  // ---- Movimientos ----
  addMove(S) {
    const a = num("a");
    if (!(a > 0)) return;
    const usd = v("mc") === "USD", fx = num("mx") || 0;
    if (usd && !(fx > 0)) { window.alert("Ingresá la cotización para cargar en USD."); return; }
    const o = {
      type: S.type, cat: v("c"), amt: toARS(a, usd ? "USD" : "ARS", fx), cur: usd ? "USD" : "ARS", usd: usd ? a : 0, fx: usd ? fx : 0,
      race: v("r"), date: v("d") || today(), note: txt("nt"),
      vt: v("vt"), vn: txt("vn"), vp: txt("vp"), vc: txt("vc"), vi: num("vi") || 0,
    };
    S.race = o.race;
    upsert(S, S.moves, "m", o);
    S.sheet = false;
    return "save";
  },
  delMove(S, el) { S.moves = S.moves.filter((x) => x.id !== el.dataset.i); return "save"; },
  editMove(S, el) {
    const x = find(S.moves, el.dataset.i);
    S.edit = { k: "m", id: x.id };
    S.type = x.type;
    S.race = x.race || "";
    S.sheet = true;
    return "draw";
  },
  /** "Completar con el restante" del aviso de presupuesto. */
  fill(S, el) { $("a").value = Math.max(Number(el.dataset.v), 0); },

  // ---- Carreras ----
  addRace(S) {
    const name = txt("rn");
    if (!name) return;
    const b = num("rb");
    upsert(S, S.races, "r", { name, date: v("rd"), budget: b > 0 ? b : 0, sede: txt("rs"), km: num("rk") || 0, fase: v("rf"), res: txt("rr") });
    return "save";
  },
  setBud(S, el) { const b = parseFloat(el.value); find(S.races, el.dataset.i).budget = b > 0 ? b : 0; return "save"; },
  delRace(S, el) {
    const i = el.dataset.i;
    if (!window.confirm("¿Eliminar la carrera? Sus movimientos quedan como Sin carrera.")) return;
    S.races = S.races.filter((x) => x.id !== i);
    S.moves.forEach((x) => { if (x.race === i) x.race = ""; });
    if (S.race === i) S.race = "";
    return "save";
  },
  useRace(S, el) { S.race = el.dataset.i; S.type = "g"; S.edit = null; S.sheet = true; return "draw"; },
  editRace(S, el) { return startEdit(S, "r", el.dataset.i, "car"); },

  // ---- Pendientes ----
  pkch() { onKindChange(document); },
  fineNotified(S, el) { if (el.value) $("pd").value = addDays(el.value, 30); },
  addPend(S) {
    const a = num("pa"), k = v("pk");
    if (!(a > 0)) return;
    upsert(S, S.pend, "p", {
      kind: k, amt: a, cat: k === "f" ? "Multa" : v("pcat"), party: txt("pp"), due: v("pd"), race: v("pr"), note: txt("pn"),
      fine: k === "f" ? { who: v("fw"), art: txt("fa"), notif: v("fn"), st: v("fs") } : null,
    });
    return "save";
  },
  /** Marca un pendiente como pagado/cobrado: se convierte en movimiento con fecha de hoy. */
  markPaid(S, el) {
    const p = find(S.pend, el.dataset.i), f = p.fine;
    S.moves.push({
      id: newId(), team: p.team, type: p.kind === "c" ? "i" : "g", cat: p.cat, amt: p.amt, race: p.race || "", date: today(),
      note: [f && "Multa a " + f.who + (f.art ? " (art. " + f.art + ")" : ""), p.party, p.note].filter(Boolean).join(" · "),
    });
    S.pend = S.pend.filter((y) => y.id !== p.id);
    return "save";
  },
  editPend(S, el) { startEdit(S, "p", el.dataset.i, "pen"); top(); return "draw"; },
  delPend(S, el) {
    if (!window.confirm("¿Eliminar este pendiente?")) return;
    S.pend = S.pend.filter((y) => y.id !== el.dataset.i);
    return "save";
  },

  // ---- Contratos ----
  addCon(S) {
    const sponsor = txt("cs"), total = num("ct");
    if (!sponsor || !(total > 0)) return;
    const n = parseInt(v("cq")) || 1;
    const inst = splitInstallments(total, n, v("c1") || v("cf") || today()).map((q) => ({ id: newId(), date: q.date, amt: q.amt, paid: false }));
    S.cons.push({ id: newId(), team: S.sel, sponsor, num: txt("cn"), total, from: v("cf"), to: v("cu"), deliv: txt("cd"), inst });
    return "save";
  },
  setInst(S, el) {
    const k = find(find(S.cons, el.dataset.c).inst, el.dataset.i), f = el.dataset.f;
    k[f] = f === "amt" ? parseFloat(el.value) || 0 : el.value;
    return "save";
  },
  /** Cobrar una cuota crea un ingreso de Auspicio; deshacer lo borra. */
  payInst(S, el) {
    const C = find(S.cons, el.dataset.c), k = find(C.inst, el.dataset.i);
    if (!k.paid) {
      k.paid = true;
      S.moves.push({ id: newId(), team: C.team, type: "i", cat: "Auspicio", amt: k.amt, race: "", date: today(), note: "Cuota " + (C.inst.indexOf(k) + 1) + " · " + C.sponsor, ci: k.id });
    } else {
      k.paid = false;
      S.moves = S.moves.filter((x) => x.ci !== k.id);
    }
    return "save";
  },
  delCon(S, el) {
    if (!window.confirm("¿Eliminar el contrato? Los cobros ya registrados se mantienen como ingresos.")) return;
    S.cons = S.cons.filter((x) => x.id !== el.dataset.i);
    return "save";
  },

  // ---- Inventario ----
  addTire(S) {
    const nw = parseInt(v("inw")) || 0, rs = parseInt(v("irs")) || 0, c = num("ic") || 0;
    if (!nw && !rs) return;
    const o = { race: v("ir"), nw, rs, cost: c };
    const isNew = !(S.edit && S.edit.k === "t");
    upsert(S, S.tires, "t", o);
    if (isNew && $("ik").checked && c > 0) S.moves.push({ id: newId(), team: S.sel, type: "g", cat: "Neumáticos", amt: c, race: o.race, date: today(), note: nw + " nuevos, " + rs + " resellados" });
    return "save";
  },
  addPart(S) {
    const ident = txt("xi");
    if (!ident) return;
    upsert(S, S.parts, "x", { kind: v("xk"), ident, races: parseInt(v("xr")) || 0, state: v("xs"), cost: num("xc") || 0, rebuild: v("xd") });
    return "save";
  },
  editTire(S, el) { return startEdit(S, "t", el.dataset.i, "inv"); },
  editPart(S, el) { return startEdit(S, "x", el.dataset.i, "inv"); },
  delTire(S, el) {
    if (!window.confirm("¿Eliminar este registro?")) return;
    S.tires = S.tires.filter((x) => x.id !== el.dataset.i);
    return "save";
  },
  delPart(S, el) {
    if (!window.confirm("¿Eliminar este ítem?")) return;
    S.parts = S.parts.filter((x) => x.id !== el.dataset.i);
    return "save";
  },
  bump(S, el) { const p = find(S.parts, el.dataset.i); p.races = Math.max(0, p.races + Number(el.dataset.v)); return "save"; },
  /** +1 carrera a todo lo que está "En uso". */
  closeRace(S) { ofTeam(S.parts, S.sel).forEach((p) => { if (p.state === "En uso") p.races++; }); return "save"; },

  // ---- Presupuesto y equipo ----
  setCB(S, el) { teamCfg(S, S.sel).bud[el.dataset.c] = parseFloat(el.value) || 0; return "save"; },
  setTot(S, el) { teamCfg(S, S.sel).total = parseInt(el.value) || 0; return "save"; },
  setOwner(S, el) { teamCfg(S, S.sel).owner = el.value; return "save"; },
  addAp(S) {
    const name = txt("apn"), pct = num("app");
    if (!name || !(pct > 0)) return;
    teamCfg(S, S.sel).aport.push({ id: newId(), name, pct });
    return "save";
  },
  addSt(S) {
    const name = txt("stn");
    if (!name) return;
    teamCfg(S, S.sel).staff.push({ id: newId(), name, rol: txt("str"), pago: num("stp") || 0, viat: num("stv") || 0 });
    return "save";
  },
  delIn(S, el) { const c = teamCfg(S, S.sel), k = el.dataset.v; c[k] = c[k].filter((x) => x.id !== el.dataset.i); return "save"; },

  // ---- Reportes ----
  exCSV(S) { exportCSV(S, cur(S), today()); },
  exPDF(S, el, ctx) { exportPDF(S, cur(S), ctx.m, today()); },
  exJSON(S) { exportJSON(S, today()); },
};

/** Importa una copia JSON. Asíncrona: llama a `done` cuando el estado cambió. */
export function importBackup(S, file, done) {
  if (!file) return;
  const r = new window.FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result);
      if (!isBackup(o)) throw new Error("copia inválida");
      if (!window.confirm("Esto reemplaza TODOS los datos actuales por los de la copia. ¿Continuar?")) return;
      replaceData(S, o);
      done();
    } catch (e) {
      window.alert("El archivo no es una copia válida de TC Cuentas.");
    }
  };
  r.readAsText(file);
}
