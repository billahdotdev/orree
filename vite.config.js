import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Replaces every %VITE_*% token in index.html with its env value, defaulting
 * to an empty string, and strips the Meta domain-verification <meta> entirely
 * when no token is configured.
 *
 * Vite's built-in HTML env replacement leaves unmatched tokens in place, so a
 * build without the vars shipped a literal
 *   <meta name="facebook-domain-verification" content="%VITE_FB_DOMAIN_VERIFICATION%">
 * to production. Harmless but sloppy, and it makes the "is verification
 * actually live?" question un-answerable by viewing source.
 */
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

// base "/" is correct for a custom domain on Cloudflare Pages (e.g. orree.bd)
// and for the default *.pages.dev URL. VITE_BASE_PATH is only needed when
// hosting under a sub-path (GitHub Pages project sites) — leave it unset.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    base: env.VITE_BASE_PATH || "/orree/",
    plugins: [react(), htmlEnv(env)],
    build: {
      target: "es2020",
      cssCodeSplit: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          // Split the dependencies that never change away from app code, so a
          // copy tweak in /admin doesn't invalidate React for every returning
          // visitor. Matters more than it looks on repeat 4G sessions.
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-icons": ["lucide-react"],
          },
        },
      },
    },
  };
});
