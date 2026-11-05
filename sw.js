// Service worker de TC Cuentas: guarda la app completa en el dispositivo para que
// funcione sin señal. Los datos del usuario NO pasan por acá (viven en localStorage).
//
// VERSION se calcula a partir del contenido de FILES: después de cambiar cualquier
// archivo de la app, correr `npm run sw:version` (un test avisa si quedó desactualizada).
// Así cada cambio publica una versión nueva y la app ofrece "Actualizar".
const VERSION = "7b47db61acd1";
const CACHE = "tc-cuentas-" + VERSION;

// "./" es la página (index.html). No se lista "index.html" aparte: muchos servidores lo
// redirigen a "./" y una respuesta redirigida no sirve para abrir la app.
const FILES = [
  "./",
  "manifest.webmanifest",
  "assets/fonts.css",
  "assets/fonts/barlow-400.woff2",
  "assets/fonts/barlow-500.woff2",
  "assets/fonts/barlow-600.woff2",
  "assets/fonts/barlow-condensed-500.woff2",
  "assets/fonts/barlow-condensed-600.woff2",
  "assets/fonts/barlow-condensed-700.woff2",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon.svg",
  "src/actions.js",
  "src/calc.js",
  "src/clock.js",
  "src/constants.js",
  "src/export.js",
  "src/format.js",
  "src/main.js",
  "src/pwa.js",
  "src/state.js",
  "src/storage.js",
  "src/styles.css",
  "src/views/carreras.js",
  "src/views/contratos.js",
  "src/views/equipo.js",
  "src/views/icons.js",
  "src/views/inventario.js",
  "src/views/pendientes.js",
  "src/views/presupuesto.js",
  "src/views/reportes.js",
  "src/views/resumen.js",
  "src/views/shell.js",
  "src/views/ui.js",
  "vendor/jspdf.umd.min.js",
];

/** Copia sin la marca de "redirigida" (Chrome no deja usar esas para abrir una página). */
async function clean(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener("install", (e) => {
  // cache: "reload" evita guardar una copia vieja del caché HTTP del navegador.
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map(async (f) => {
    const res = await fetch(new Request(f, { cache: "reload" }));
    if (!res.ok) throw new Error("No se pudo guardar " + f);
    await c.put(f, await clean(res));
  }))));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("tc-cuentas-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// La app pide pasar a la versión nueva cuando el usuario toca "Actualizar".
self.addEventListener("message", (e) => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });

// Primero el caché (anda sin señal y no espera a una red lenta); si no está, la red.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (req.mode === "navigate") return (await cache.match("./")) || fetch(req);
    return (await cache.match(req, { ignoreSearch: true })) || fetch(req);
  })());
});
