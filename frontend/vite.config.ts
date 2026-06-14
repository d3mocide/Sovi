import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Sovi",
        short_name: "Sovi",
        description: "Your numbers. Your stack. Your control.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        runtimeCaching: [{
          urlPattern: /^\/api\/.*/,
          handler: "NetworkFirst",
          options: { cacheName: "api-cache", networkTimeoutSeconds: 3 }
        }]
      }
    })
  ],
  resolve: {
    alias: {
      "@sovi/payoff": path.resolve(__dirname, "../shared/payoff/src/index.ts")
    }
  },
  server: {
    proxy: {
      "/api": { target: "http://localhost:8000", rewrite: (p) => p.replace(/^\/api/, "") }
    }
  }
});
