// Exportación: CSV de movimientos, informe PDF (jsPDF desde CDN) y copia JSON.
import { csvq, fd } from "./format.js";
import { dataOf } from "./state.js";
import { ofTeam, raceName, spent, sum, teamCfg, teamRaces, totalExpense, totalIncome } from "./calc.js";

/** Descarga un archivo generado en el navegador. */
export function download(name, data) {
  const type = /\.pdf$/.test(name) ? "application/pdf" : /\.csv$/.test(name) ? "text/csv;charset=utf-8" : "application/json";
  const blob = data instanceof window.Blob ? data : new window.Blob([data], { type });
  const a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(a.href), 1000);
}

const slug = (name) => name.replace(/\W+/g, "-");

export const CSV_HEADER = ["Fecha", "Tipo", "Categoría", "Carrera", "Monto ARS", "Moneda", "Monto USD", "Cotización", "Nota", "Comprobante", "Número", "Proveedor/Cliente", "CUIT", "IVA ARS"];

/** Texto CSV (separado por ;, con BOM para Excel) de los movimientos del equipo. */
export function movesCSV(S, team) {
  const rows = ofTeam(S.moves, team).sort((a, b) => (a.date > b.date ? 1 : -1)).map((x) =>
    [x.date, x.type === "i" ? "Ingreso" : "Gasto", x.cat, raceName(S, x.race), String(x.amt).replace(".", ","), x.cur || "ARS", x.usd || "", x.fx || "", x.note, x.vt, x.vn, x.vp, x.vc, x.vi || ""].map(csvq).join(";"));
  return "﻿" + [CSV_HEADER.map(csvq).join(";")].concat(rows).join("\r\n");
}

export function exportCSV(S, t, ref) {
  download("movimientos-" + slug(t.name) + "-" + ref + ".csv", movesCSV(S, t.id));
}

export function exportPDF(S, t, m, ref) {
  const J = window.jspdf;
  if (!J) { window.alert("No se pudo cargar el generador de PDF."); return; }
  const d = new J.jsPDF();
  let y = 16;
  const ln = (s, b) => {
    if (y > 280) { d.addPage(); y = 16; }
    d.setFont("helvetica", b ? "bold" : "normal");
    d.setFontSize(b ? 12 : 10);
    d.text(String(s), 14, y);
    y += b ? 8 : 6;
  };
  const I = totalIncome(S, t.id), G = totalExpense(S, t.id), by = {};
  ofTeam(S.moves, t.id).forEach((x) => { if (x.type === "g") by[x.cat] = (by[x.cat] || 0) + x.amt; });
  const pend = ofTeam(S.pend, t.id);

  ln("Informe - " + t.name + (t.pilot ? " (" + t.pilot + ")" : ""), 1);
  ln("Fecha: " + fd(ref) + " · Valores en " + (S.disp === "USD" && S.fxref > 0 ? "USD (cotiz. " + S.fxref + ")" : "ARS"));
  y += 3;
  ln("Resumen de temporada", 1);
  ln("Ingresos: " + m(I));
  ln("Gastos: " + m(G));
  ln("Balance: " + m(I - G));
  ln("Por pagar: " + m(sum(pend.filter((x) => x.kind !== "c"), (x) => x.amt)) + " · Por cobrar: " + m(sum(pend.filter((x) => x.kind === "c"), (x) => x.amt)));
  y += 3;
  ln("Gastos por categoria", 1);
  Object.keys(by).sort((a, b) => by[b] - by[a]).forEach((k) => { const b = teamCfg(S, t.id).bud[k]; ln(k + ": " + m(by[k]) + (b ? " (presup. " + m(b) + ")" : "")); });
  y += 3;
  ln("Gastos por carrera", 1);
  teamRaces(S, t.id).forEach((r) => { const s = spent(S, t.id, r.id); ln(r.name + (r.sede ? " - " + r.sede : "") + ": " + m(s) + (r.budget ? " (presup. " + m(r.budget) + ")" : "") + (r.km ? " · " + m(s / r.km) + "/km" : "")); });
  download("informe-" + slug(t.name) + "-" + ref + ".pdf", d.output("arraybuffer"));
}

export function exportJSON(S, ref) {
  download("tc-cuentas-copia-" + ref + ".json", JSON.stringify(dataOf(S)));
}
