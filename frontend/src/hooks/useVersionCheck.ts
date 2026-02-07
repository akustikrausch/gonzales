import { useEffect, useRef } from "react";
import { useStatus } from "./useApi";

/**
 * Expected frontend version - must match backend version.
 * When the backend returns a different version, we trigger a hard reload
 * to ensure the browser fetches fresh assets.
 */
const FRONTEND_VERSION = "3.9.3";

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
      console.log(
        `[Gonzales] Version mismatch: frontend=${FRONTEND_VERSION}, backend=${status.version}. Reloading...`
      );
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
