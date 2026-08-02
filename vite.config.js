import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function htmlEnv(env) {
  return {
    name: "orree-html-env",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        let out = html.replace(/%(VITE_[A-Z0-9_]+)%/g, (_, key) => env[key] ?? "");
        if (!env.VITE_FB_DOMAIN_VERIFICATION) {
          out = out.replace(/\s*<meta name="facebook-domain-verification"[^>]*>/g, "");
        }
        return out;
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react(), htmlEnv(env)],
    build: {
      target: "es2020",
      cssCodeSplit: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
                return "vendor-react";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
            }
          },
        },
      },
    },
  };
});
