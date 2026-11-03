import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

// Each <!-- illos:name --> comment in index.html becomes the inline SVG from illos/name.svg,
// so the animated assets read the page's colours (the --illos-* variables in src/style.css).
// It runs after Vite's own HTML pass, so the assets' inline styles reach the page untouched.
const inlineIllos = {
  name: "inline-illos",
  transformIndexHtml: {
    order: "post",
    handler: (html) =>
      html.replace(/<!--\s*illos:([\w-]+)\s*-->/g, (_, name) =>
        readFileSync(new URL(`./illos/${name}.svg`, import.meta.url), "utf8").trim()
      ),
  },
};

export default defineConfig({
  plugins: [inlineIllos],
  server: { port: 4872, strictPort: true },
  preview: { port: 4872, strictPort: true },
});
