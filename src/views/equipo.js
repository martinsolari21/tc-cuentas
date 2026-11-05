// Pestaña Equipo: dueño del auto, aportes al presupuesto y personal.
import { CATS, OWNERS } from "../constants.js";
import { esc } from "../format.js";
import { sum, teamCfg, totalExpense } from "../calc.js";

export function viewEquipo({ S, t, m }) {
  const c = teamCfg(S, t.id);
  const gt = totalExpense(S, t.id);
  const B = sum(CATS.g, (k) => c.bud[k] || 0);
  const pc = sum(c.staff, (s) => s.pago + s.viat);
  const ps = sum(c.aport, (a) => a.pct);
  return '<div class="card"><h2>Dueño del auto</h2><select data-change="setOwner">' + OWNERS.map((o) => '<option value="' + o + '"' + (c.owner === o ? " selected" : "") + ">" + (o || "Sin definir") + "</option>").join("") + "</select></div>"
    + '<div class="card"><h2>Aportes al presupuesto</h2><div class="row"><input id="apn" placeholder="Quién aporta (piloto, sponsor, equipo…)"><input id="app" type="number" min="0" max="100" placeholder="% del presupuesto"><button class="p" data-act="addAp">Agregar</button></div>'
    + (c.aport.length
      ? '<div class="sc"><table><tr><th>Aportante</th><th class="n">%</th><th class="n">Del presupuesto</th><th class="n">Del gasto real</th><th></th></tr>'
        + c.aport.map((a) => "<tr><td>" + esc(a.name) + '</td><td class="n">' + a.pct + '%</td><td class="n">' + (B ? m(B * a.pct / 100) : "–") + '</td><td class="n">' + m(gt * a.pct / 100) + '</td><td class="n"><button class="g" data-act="delIn" data-v="aport" data-i="' + a.id + '">✕</button></td></tr>').join("")
        + '</table></div><div class="' + (ps === 100 ? "ok" : "ko") + '"><small>Suma de aportes: ' + ps + "%" + (ps === 100 ? "" : " (debería sumar 100%)") + "</small></div>"
      : "")
    + "</div>"
    + '<div class="card"><h2>Personal</h2><div class="row"><input id="stn" placeholder="Nombre"><input id="str" placeholder="Rol (mecánico, motorista…)"><input id="stp" type="number" min="0" placeholder="Pago por carrera ARS"><input id="stv" type="number" min="0" placeholder="Viático por carrera ARS"><button class="p" data-act="addSt">Agregar</button></div>'
    + (c.staff.length
      ? '<div class="sc"><table><tr><th>Nombre</th><th>Rol</th><th class="n">Pago</th><th class="n">Viático</th><th class="n">Total/carrera</th><th></th></tr>'
        + c.staff.map((s) => "<tr><td>" + esc(s.name) + "</td><td>" + esc(s.rol || "–") + '</td><td class="n">' + m(s.pago) + '</td><td class="n">' + m(s.viat) + '</td><td class="n">' + m(s.pago + s.viat) + '</td><td class="n"><button class="g" data-act="delIn" data-v="staff" data-i="' + s.id + '">✕</button></td></tr>').join("")
        + '<tr><th colspan="4">Costo de personal por carrera' + (c.total ? " · temporada (" + c.total + ")" : "") + '</th><th class="n">' + m(pc) + (c.total ? " · " + m(pc * c.total) : "") + "</th><th></th></tr></table></div>"
      : "")
    + "</div>"
    + '<div class="card danger"><h2>Zona de peligro</h2><p class="mu small">Borra el equipo con todos sus movimientos, carreras, pendientes, contratos, inventario y configuración. Descargá una copia antes desde Reportes.</p><button class="danger-btn" data-act="delTeam">Eliminar equipo</button></div>';
}
