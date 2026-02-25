"use client";

import { useEffect } from "react";

/**
 * Registers the service worker at "/sw.js" when the component mounts and renders no UI.
 *
 * Attempts to register a service worker for Progressive Web App functionality; if the browser
 * does not support service workers, no action is taken.
 *
 * @returns `null` (this component does not render any UI)
 */
export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✓ Service Worker registered");
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
