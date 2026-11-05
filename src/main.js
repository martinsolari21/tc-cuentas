// Punto de entrada: carga el estado, dibuja la pantalla y despacha las acciones.
import { today } from "./clock.js";
import { esc, money } from "./format.js";
import { find, teamMoves, teamRaces, totals } from "./calc.js";
import { loadState } from "./state.js";
import { readSaved, writeSaved } from "./storage.js";
import { actions, importBackup } from "./actions.js";
import { bottomNav, hintHTML, moveSheet, pageTitle, viewMas } from "./views/shell.js";
import { viewMovimientos, viewResumen } from "./views/resumen.js";
import { viewCarreras } from "./views/carreras.js";
import { viewPendientes } from "./views/pendientes.js";
import { viewContratos } from "./views/contratos.js";
import { viewInventario } from "./views/inventario.js";
import { viewPresupuesto } from "./views/presupuesto.js";
import { viewEquipo } from "./views/equipo.js";
import { viewReportes } from "./views/reportes.js";
import { applyUpdate, askPersist, initPWA, install, pwa } from "./pwa.js";

const VIEWS = {
  res: viewResumen, mov: viewMovimientos, car: viewCarreras, pen: viewPendientes, mas: viewMas,
  con: viewContratos, inv: viewInventario, pre: viewPresupuesto, eq: viewEquipo, rep: viewReportes,
};

let S;
const $ = (id) => document.getElementById(id);
const fmt = () => (n) => money(n, S.disp, S.fxref);

export function start() {
  const saved = readSaved();
  S = loadState(saved.data, saved.ui);
  document.addEventListener("click", onEvent);
  document.addEventListener("change", onEvent);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.sheet) { actions.closeSheet(S); render(); } });
  initPWA(render);
  if (pwa.installed) askPersist(render);
  render();
}

function onEvent(e) {
  const attr = e.type === "click" ? "data-act" : "data-change";
  const el = e.target.closest("[" + attr + "]");
  if (!el) return;
  const name = el.getAttribute(attr);
  if (name === "hint") return updateHint();
  if (name === "impF") return importBackup(S, el.files[0], () => { writeSaved(S); render(); });
  if (name === "appUpdate") return applyUpdate();
  if (name === "appInstall") return install(render);
  if (name === "appPersist") return askPersist(render);
  const prevView = S.view;
  const next = actions[name](S, el, { m: fmt() });
  if (next === "save") writeSaved(S);
  if (next) render();
  if (next && S.view !== prevView) window.scrollTo(0, 0);
}

function render() {
  renderNetwork();
  $("tb").innerHTML = S.teams.map((t) => '<button class="chip-btn' + (t.id === S.sel ? " on" : "") + '" data-act="pick" data-i="' + t.id + '"' + (t.id === S.sel ? ' aria-pressed="true"' : "") + ">" + esc(t.name) + "</button>").join("")
    || '<span class="mu">Creá tu primer equipo para empezar.</span>';
  const t = find(S.teams, S.sel);
  const main = $("main");
  const chrome = !!t;
  $("bottom").hidden = !chrome;
  $("fab").hidden = !chrome;
  document.body.classList.toggle("has-nav", chrome);
  if (!t) {
    main.innerHTML = '<div class="empty big"><span class="flag xl" aria-hidden="true"></span><b>Empezá creando tu equipo</b><span class="mu">Tocá “+ Equipo”, poné el nombre y el piloto. Después cargás carreras, gastos e ingresos.</span></div>';
    $("sheet").innerHTML = "";
    document.querySelector(".addteam").open = true;
    return;
  }

  renderDisplayControls();
  const ctx = { S, t, m: fmt(), races: teamRaces(S, t.id), ref: today(), tot: totals(teamMoves(S, t.id)), pwa };
  const view = VIEWS[S.view] || viewResumen;
  main.innerHTML = updateBanner() + pageTitle(S.view) + view(ctx);
  $("bottom").innerHTML = bottomNav(ctx);
  const sheet = $("sheet");
  sheet.innerHTML = moveSheet(ctx);
  sheet.className = S.sheet ? "open" : "";
  document.body.classList.toggle("sheet-open", !!S.sheet);
  updateHint();
}

/** Aviso "Sin señal" en la barra superior: la app sigue andando y guarda en el teléfono. */
function renderNetwork() {
  let el = $("net");
  if (!el) {
    document.querySelector(".top").insertAdjacentHTML("afterbegin", '<span id="net" class="net" role="status" title="Sin conexión: todo se guarda en este dispositivo"></span>');
    el = $("net");
  }
  el.textContent = pwa.online ? "" : "Sin señal";
  el.hidden = pwa.online;
}

function updateBanner() {
  return pwa.update ? '<div class="card update" role="status"><span><b>Hay una versión nueva</b><br><span class="mu small">Tus datos no se tocan.</span></span><button class="p" data-act="appUpdate">Actualizar</button></div>' : "";
}

/** Moneda de visualización y cotización de referencia, en la barra superior. */
function renderDisplayControls() {
  if (!$("dp")) {
    document.querySelector(".top").insertAdjacentHTML("beforeend",
      '<label class="sr-only" for="dp">Mostrar montos en</label><select id="dp" data-change="setDisp"><option>ARS</option><option>USD</option></select>'
      + '<label class="sr-only" for="fr">Cotización de referencia</label><input id="fr" type="number" min="0" inputmode="decimal" placeholder="Cotiz. USD ref." data-change="setFx">');
  }
  $("dp").value = S.disp;
  $("fr").value = S.fxref || "";
  $("fr").hidden = S.disp !== "USD";
}

/** Aviso de presupuesto restante según la carrera elegida en el formulario de movimiento. */
function updateHint() {
  const rid = $("r").value;
  S.race = rid;
  $("hint").innerHTML = hintHTML({ S, rid, m: fmt() });
}
