import { useEffect, useRef } from "react";
import { useStatus } from "./useApi";

/**
 * Expected frontend version - must match backend version.
 * When the backend returns a different version, we trigger a hard reload
 * to ensure the browser fetches fresh assets.
 */
const FRONTEND_VERSION = "3.10.1";

/**
 * Hook that checks if the frontend version matches the backend version.
 * If there's a mismatch (e.g., after an update), it triggers a hard reload
 * to clear cached assets and load the new version.
 */
export function useVersionCheck() {
  const { data: status } = useStatus();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!status?.version || hasChecked.current) return;

    hasChecked.current = true;

    if (status.version !== FRONTEND_VERSION) {
      // Use sessionStorage to prevent infinite reload loops.
      // HA Ingress proxy or Nabu Casa service worker may cache old assets
      // even after reload, causing the mismatch to persist.
      const reloadKey = `gonzales_reload_${status.version}`;

      if (sessionStorage.getItem(reloadKey)) {
        // Already tried reloading for this version - proxy cache is stale
        console.warn(
          `[Gonzales] Version mismatch persists: frontend=${FRONTEND_VERSION}, backend=${status.version}. Proxy cache may be stale - try a hard refresh (Ctrl+Shift+R).`
        );
        return;
      }

      console.log(
        `[Gonzales] Version mismatch: frontend=${FRONTEND_VERSION}, backend=${status.version}. Reloading...`
      );

      sessionStorage.setItem(reloadKey, "1");

      // Clear service worker caches if any
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      // Hard reload to bypass browser cache
      window.location.reload();
    }
  }, [status?.version]);
}
