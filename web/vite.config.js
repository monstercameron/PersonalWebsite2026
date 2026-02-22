import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_DEV_HOST = "0.0.0.0";
const DEFAULT_DEV_PORT = 4000;
const DEFAULT_DEV_STRICT_PORT = true;
const DEFAULT_API_PROXY_TARGET = "http://localhost:8787";

/**
 * @param {string} value
 * @param {number} fallback
 * @returns {number}
 */
function parseIntWithDefault(value, fallback) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return fallback;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

/**
 * @param {string} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
function parseBoolWithDefault(value, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devHost = String(env.WEB_DEV_HOST || DEFAULT_DEV_HOST).trim() || DEFAULT_DEV_HOST;
  const devPort = parseIntWithDefault(env.WEB_DEV_PORT, DEFAULT_DEV_PORT);
  const devStrictPort = parseBoolWithDefault(env.WEB_DEV_STRICT_PORT, DEFAULT_DEV_STRICT_PORT);
  const apiProxyTarget = String(env.WEB_API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET).trim() || DEFAULT_API_PROXY_TARGET;

  return {
    plugins: [react()],
    build: {
      target: "es2020",
      sourcemap: false,
      manifest: true,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id || !id.includes("node_modules")) {
              return undefined;
            }
            if (id.includes("html2canvas") || id.includes("jspdf")) {
              return "vendor-pdf";
            }
            return undefined;
          }
        }
      }
    },
    server: {
      host: devHost,
      port: devPort,
      strictPort: devStrictPort,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
