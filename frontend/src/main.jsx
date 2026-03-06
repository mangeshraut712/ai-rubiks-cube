import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { router } from "./router.jsx";
import "./index.css";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

async function cleanupLocalPwaArtifacts() {
  if (!isLocalhost || typeof window === "undefined") {
    return;
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      const appCacheKeys = cacheKeys.filter((key) => {
        return (
          key === "google-fonts-cache" ||
          key === "gstatic-fonts-cache" ||
          key === "images-cache" ||
          key.startsWith("workbox-")
        );
      });

      await Promise.all(appCacheKeys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("[main] Failed to clear localhost PWA artifacts:", error);
  }
}

void cleanupLocalPwaArtifacts();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);
