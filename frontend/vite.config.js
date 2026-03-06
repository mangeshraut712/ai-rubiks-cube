import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const backendHttpOrigin = process.env.VITE_BACKEND_ORIGIN || "http://localhost:8080";
const backendWsOrigin = backendHttpOrigin.startsWith("https://")
  ? backendHttpOrigin.replace("https://", "wss://")
  : backendHttpOrigin.replace("http://", "ws://");

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      manifest: {
        name: "Gemini Rubik's Tutor",
        short_name: "CubeTutor",
        description: "AI-powered Rubik's Cube tutoring with real-time voice and vision coaching",
        theme_color: "#4285f4",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-72x72.png",
            sizes: "72x72",
            type: "image/png"
          },
          {
            src: "/icon-96x96.png",
            sizes: "96x96",
            type: "image/png"
          },
          {
            src: "/icon-144x144.png",
            sizes: "144x144",
            type: "image/png"
          },
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icon-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: "module"
      }
    })
  ],
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three"],
          zustand: ["zustand", "immer"],
          framer: ["framer-motion"]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    hmr: {
      overlay: true
    },
    proxy: {
      "/ws": {
        target: backendWsOrigin,
        ws: true,
        changeOrigin: true,
        secure: false
      },
      "/health": {
        target: backendHttpOrigin,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    host: "0.0.0.0"
  },
  optimizeDeps: {
    include: ["react", "react-dom", "three"],
    exclude: ["@vitejs/plugin-react"]
  },
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@utils": "/src/utils",
      "@hooks": "/src/hooks",
      "@store": "/src/store"
    }
  },
  css: {
    devSourcemap: true
  }
});
