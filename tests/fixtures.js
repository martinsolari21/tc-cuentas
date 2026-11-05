// Datos de ejemplo para los tests. "Hoy" en los tests es 2026-03-10 (ver NOW).
export const NOW = "2026-03-10T15:00:00Z";

export function sampleState() {
  return {
    teams: [
      { id: "tA", name: "Equipo Ford", pilot: "Juan Pérez" },
      { id: "tB", name: "Equipo Chevrolet", pilot: "" },
    ],
    moves: [
      { id: "m1", team: "tA", type: "g", cat: "Combustible", amt: 2000000, race: "r1", date: "2026-02-14", note: "Nafta" },
      { id: "m2", team: "tA", type: "g", cat: "Neumáticos", amt: 3000000, race: "r1", date: "2026-02-14", note: "" },
      { id: "m3", team: "tA", type: "g", cat: "Hospedaje", amt: 800000, cur: "ARS", usd: 0, fx: 0, race: "r1", date: "2026-02-13", note: "", vt: "Factura A", vn: "0001-00001234", vp: "Hotel Viedma", vc: "30-12345678-9", vi: 138842 },
      { id: "m4", team: "tA", type: "g", cat: "Motor", amt: 4500000, cur: "USD", usd: 3000, fx: 1500, race: "r2", date: "2026-02-28", note: "Reconstrucción", vt: "", vn: "", vp: "", vc: "", vi: 0 },
      { id: "m5", team: "tA", type: "g", cat: "Viáticos", amt: 1200000, race: "r2", date: "2026-03-01", note: "" },
      { id: "m6", team: "tA", type: "g", cat: "Combustible de traslado", amt: 600000, race: "r2", date: "2026-03-01", note: "" },
      { id: "m7", team: "tA", type: "g", cat: "Personal", amt: 900000, race: "", date: "2026-03-05", note: "Sueldos <marzo>" },
      { id: "m8", team: "tA", type: "i", cat: "Auspicio", amt: 8000000, race: "", date: "2026-02-01", note: "Cuota 1 · YPF", ci: "i1" },
      { id: "m9", team: "tA", type: "i", cat: "Premio", amt: 500000, race: "r1", date: "2026-02-16", note: "" },
      { id: "m10", team: "tB", type: "g", cat: "Combustible", amt: 100000, race: "", date: "2026-03-02", note: "" },
    ],
    races: [
      { id: "r1", team: "tA", name: "Fecha 1 · Viedma", date: "2026-02-15", budget: 10000000, sede: "Viedma", km: 1000, fase: "Etapa Regular", res: "5°" },
      { id: "r2", team: "tA", name: "Fecha 2 · El Calafate", date: "2026-03-01", budget: 5000000, sede: "El Calafate", km: 2500, fase: "Etapa Regular", res: "" },
      { id: "r3", team: "tA", name: "Fecha 3 · Rafaela", date: "2026-03-22", budget: 0 },
    ],
    pend: [
      { id: "p1", team: "tA", kind: "p", amt: 750000, cat: "Repuestos", party: "Taller Gómez", due: "2026-03-05", race: "r2", note: "", fine: null },
      { id: "p2", team: "tA", kind: "f", amt: 400000, cat: "Multa", party: "", due: "2026-03-14", race: "r1", note: "Largada", fine: { who: "Piloto", art: "32", notif: "2026-02-12", st: "pend" } },
      { id: "p3", team: "tA", kind: "c", amt: 300000, cat: "Premio", party: "ACTC", due: "2026-04-30", race: "", note: "", fine: null },
    ],
    cons: [
      {
        id: "c1", team: "tA", sponsor: "YPF", num: "A-12", total: 24000000, from: "2026-01-01", to: "2026-12-31", deliv: "Logo en capot",
        inst: [
          { id: "i1", date: "2026-02-01", amt: 8000000, paid: true },
          { id: "i2", date: "2026-03-01", amt: 8000000, paid: false },
          { id: "i3", date: "2026-04-01", amt: 8000000, paid: false },
        ],
      },
    ],
    tires: [
      { id: "t1", team: "tA", race: "r1", nw: 6, rs: 0, cost: 3000000 },
      { id: "t2", team: "tA", race: "r2", nw: 8, rs: 6, cost: 4000000 },
    ],
    parts: [
      { id: "x1", team: "tA", kind: "Motor", ident: "Motor 3", races: 2, state: "En uso", cost: 15000000, rebuild: "2026-01-20" },
      { id: "x2", team: "tA", kind: "Repuesto", ident: "Caja", races: 0, state: "En reserva", cost: 2000000, rebuild: "" },
    ],
    cfg: {
      tA: {
        bud: { Combustible: 5000000, "Neumáticos": 2500000, Motor: 10000000, Personal: 3000000 },
        total: 14, owner: "Equipo",
        aport: [{ id: "a1", name: "Piloto", pct: 60 }, { id: "a2", name: "YPF", pct: 30 }],
        staff: [{ id: "s1", name: "Carlos", rol: "Mecánico", pago: 300000, viat: 50000 }],
      },
    },
    sel: "tA", type: "g", view: "res", race: "", edit: null, disp: "ARS", fxref: 0,
  };
}

// Copia guardada por la primera etapa del prototipo: sin pendientes, contratos, inventario ni cfg.
export function stage1State() {
  return {
    teams: [{ id: "tA", name: "Equipo Viejo", pilot: "" }],
    moves: [{ id: "m1", team: "tA", type: "g", cat: "Combustible", amt: 50000, race: "r1", date: "2025-11-02", note: "" }],
    races: [{ id: "r1", team: "tA", name: "Fecha 12", date: "2025-11-02", budget: 100000 }],
    sel: "tA", type: "g", view: "car", race: "",
  };
}
