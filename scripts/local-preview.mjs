// Production preview for restricted Windows workspaces where esbuild cannot
// enumerate parent directories while bundling vite.config.ts. Rollup still
// builds the same React application; no filesystem permissions are bypassed.
import { build, loadEnv, preview } from "vite";
import react from "@vitejs/plugin-react";

const env = loadEnv("production", process.cwd(), "");
await build({ configFile: false, plugins: [react()] });
if (!process.argv.includes("--build-only")) {
  const server = await preview({
    configFile: false,
    preview: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api/v1": {
          target:
            env.VITE_FASTAPI_URL ||
            env.VITE_API_BASE_URL ||
            "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        "/api": {
          target: env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        "/health": {
          target:
            env.VITE_FASTAPI_URL ||
            env.VITE_API_BASE_URL ||
            "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
  });
  server.printUrls();
}
