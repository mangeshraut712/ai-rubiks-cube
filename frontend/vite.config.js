import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const backendHttpOrigin = process.env.VITE_BACKEND_ORIGIN || "http://localhost:8080";
const backendWsOrigin = backendHttpOrigin.startsWith("https://")
  ? backendHttpOrigin.replace("https://", "wss://")
  : backendHttpOrigin.replace("http://", "ws://");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three", "three/examples/jsm/controls/OrbitControls.js"]
        }
      }
    },
    chunkSizeWarningLimit: 700
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/ws": {
        target: backendWsOrigin,
        ws: true,
        changeOrigin: true
      },
      "/health": {
        target: backendHttpOrigin,
        changeOrigin: true
      }
    }
  }
});
