import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const site = process.env.ASTRO_SITE ?? "https://mibions.github.io";
const base = process.env.ASTRO_BASE ?? (isGitHubPages ? "/SugongByChungMinh" : "/");

export default defineConfig({
  site,
  base,
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "lucide-react"],
    },
  },
});
