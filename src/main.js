// Punto de entrada: carga el estado, dibuja la pantalla y despacha las acciones.
import { today } from "./clock.js";
import { esc, money } from "./format.js";
import { find, teamMoves, teamRaces, totals } from "./calc.js";
import { loadState } from "./state.js";
import { readSaved, writeSaved } from "./storage.js";
import { actions, importBackup } from "./actions.js";
import { alertsCard, header, hintHTML, moveForm, tabs } from "./views/shell.js";
import { viewResumen } from "./views/resumen.js";
import { viewCarreras } from "./views/carreras.js";
import { viewPendientes } from "./views/pendientes.js";
import { viewContratos } from "./views/contratos.js";
import { viewInventario } from "./views/inventario.js";
import { viewPresupuesto } from "./views/presupuesto.js";
import { viewEquipo } from "./views/equipo.js";
import { viewReportes } from "./views/reportes.js";

const VIEWS = {
  res: viewResumen, car: viewCarreras, pen: viewPendientes, con: viewContratos,
  inv: viewInventario, pre: viewPresupuesto, eq: viewEquipo, rep: viewReportes,
};

let S;
const $ = (id) => document.getElementById(id);
const fmt = () => (n) => money(n, S.disp, S.fxref);

export function start() {
  const saved = readSaved();
  S = loadState(saved.data, saved.ui);
  document.addEventListener("click", onEvent);
  document.addEventListener("change", onEvent);
  render();
}

function onEvent(e) {
  const attr = e.type === "click" ? "data-act" : "data-change";
  const el = e.target.closest("[" + attr + "]");
  if (!el) return;
  const name = el.getAttribute(attr);
  if (name === "hint") return updateHint();
  if (name === "impF") return importBackup(S, el.files[0], () => { writeSaved(S); render(); });
  const next = actions[name](S, el, { m: fmt() });
  if (next === "save") writeSaved(S);
  if (next) render();
}

function render() {
  $("tb").innerHTML = S.teams.map((t) => '<button class="' + (t.id === S.sel ? "p" : "") + '" data-act="pick" data-i="' + t.id + '">' + esc(t.name) + "</button>").join("")
    || '<span class="mu">Creá tu primer equipo para empezar.</span>';
  const t = find(S.teams, S.sel);
  const main = $("main");
  if (!t) { main.innerHTML = ""; return; }

  renderDisplayControls();
  const ctx = { S, t, m: fmt(), races: teamRaces(S, t.id), ref: today(), tot: totals(teamMoves(S, t.id)) };
  const view = VIEWS[S.view] || viewResumen;
  main.innerHTML = alertsCard(ctx) + header(ctx) + moveForm(ctx) + tabs(ctx) + view(ctx);
  updateHint();
}

/** Selector de moneda de visualización y cotización de referencia, arriba a la derecha. */
function renderDisplayControls() {
  if (!$("dp")) {
    document.querySelector(".top").insertAdjacentHTML("beforeend",
      '<span class="row"><select id="dp" data-change="setDisp"><option>ARS</option><option>USD</option></select>'
      + '<input id="fr" type="number" min="0" placeholder="Cotiz. USD ref." style="max-width:130px" data-change="setFx"></span>');
  }
  $("dp").value = S.disp;
  $("fr").value = S.fxref || "";
}

/** Aviso de presupuesto restante según la carrera elegida en el formulario de movimiento. */
function updateHint() {
  const rid = $("r").value;
  S.race = rid;
  $("hint").innerHTML = hintHTML({ S, rid, m: fmt() });
}

