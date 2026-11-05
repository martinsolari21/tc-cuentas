// Todo lo que hace falta para usar la app sin señal e instalarla en el celular.
// En navegadores sin service worker (o en los tests) no hace nada y la app sigue andando.

/** Estado visible en Más → "Usar sin señal". */
export const pwa = {
  online: true,
  offlineReady: false, // la app quedó guardada en el dispositivo
  persisted: null, // el navegador se compromete a no borrar los datos (null = no se sabe)
  canInstall: false, // Android/Chrome: hay un aviso de instalación disponible
  installed: false, // ya se abre como app instalada
  ios: false, // iPhone/iPad: se instala desde Compartir
  update: false, // hay una versión nueva esperando
};

let installEvent = null;
let waiting = null;

/** Arranca todo. `changed` se llama cuando cambia algo del estado para redibujar. */
export function initPWA(changed) {
  const nav = window.navigator || {};
  pwa.online = nav.onLine !== false;
  pwa.installed = !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || nav.standalone === true;
  pwa.ios = /iphone|ipad|ipod/i.test(nav.userAgent || "") && !pwa.installed;

  window.addEventListener("online", () => { pwa.online = true; changed(); });
  window.addEventListener("offline", () => { pwa.online = false; changed(); });
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; pwa.canInstall = true; changed(); });
  window.addEventListener("appinstalled", () => { installEvent = null; pwa.canInstall = false; pwa.installed = true; changed(); });

  if (nav.storage && nav.storage.persisted) {
    nav.storage.persisted().then((p) => { pwa.persisted = p; changed(); }).catch(() => {});
  }

  if (!nav.serviceWorker || !/^https?:$/.test(window.location.protocol)) return;
  pwa.offlineReady = !!nav.serviceWorker.controller;
  nav.serviceWorker.register("sw.js").then((reg) => {
    const track = (w) => {
      if (!w) return;
      const check = () => {
        if (w.state === "installed") {
          if (nav.serviceWorker.controller) { waiting = w; pwa.update = true; } // versión nueva lista
          else pwa.offlineReady = true; // primera instalación
          changed();
        }
        if (w.state === "activated") { pwa.offlineReady = true; changed(); }
      };
      w.addEventListener("statechange", check);
      check();
    };
    if (reg.waiting && nav.serviceWorker.controller) { waiting = reg.waiting; pwa.update = true; changed(); }
    track(reg.installing);
    reg.addEventListener("updatefound", () => track(reg.installing));
    // Buscar versiones nuevas cada vez que vuelve la señal.
    window.addEventListener("online", () => reg.update().catch(() => {}));
  }).catch(() => {});
  let reloading = false;
  nav.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading || !waiting) return;
    reloading = true;
    window.location.reload();
  });
}

/** Pide al navegador que no borre los datos guardados aunque falte espacio. */
export function askPersist(changed) {
  const st = window.navigator && window.navigator.storage;
  if (!st || !st.persist) return;
  st.persist().then((p) => { pwa.persisted = p; changed(); }).catch(() => {});
}

export function applyUpdate() { if (waiting) waiting.postMessage("SKIP_WAITING"); }

export function install(changed) {
  if (!installEvent) return;
  installEvent.prompt();
  installEvent.userChoice.finally(() => { installEvent = null; pwa.canInstall = false; changed(); });
}
