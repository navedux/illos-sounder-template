import { mountShader } from "../illos/shader-runtime.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Illos.dev: each animated asset loops while it is on screen and pauses when it is not. The Shader field moves in
// WebGL under each SVG; under reduced motion, or without WebGL, the SVG's still frame shows instead.
if (!reduce) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.style.setProperty("--illos-play", e.isIntersecting ? "running" : "paused");
  });
  for (const el of document.querySelectorAll("[data-illos]")) {
    el.style.setProperty("--illos-play", "paused");
    io.observe(el);
    mountShader(el);
  }
}

// The bar gets a hairline once the page scrolls.
const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu.
const burger = document.querySelector(".burger");
const sheet = document.getElementById("sheet");
const setMenu = (open) => {
  sheet.hidden = !open;
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
burger.addEventListener("click", () => setMenu(sheet.hidden));
sheet.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) { setMenu(false); burger.focus(); } });
matchMedia("(min-width: 901px)").addEventListener("change", () => setMenu(false));

// Copy buttons: the install line, and the code in whichever tab is open.
const status = document.querySelector("[data-copy-status]");
for (const btn of document.querySelectorAll(".copy")) {
  let timer;
  btn.addEventListener("click", async () => {
    const text = btn.dataset.copy ?? document.querySelector(".pane:not([hidden]) [data-code]").textContent;
    try { await navigator.clipboard.writeText(text); } catch { return; }
    btn.classList.add("is-done");
    if (status) status.textContent = "Copied";
    clearTimeout(timer);
    timer = setTimeout(() => { btn.classList.remove("is-done"); if (status) status.textContent = ""; }, 1600);
  });
}

// Language tabs: click, or arrow keys, Home and End once a tab has focus.
const tabs = [...document.querySelectorAll('[role="tab"]')];
const select = (tab, focus) => {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  }
  if (focus) tab.focus();
};
tabs.forEach((t, i) => {
  t.addEventListener("click", () => select(t));
  t.addEventListener("keydown", (e) => {
    const n = tabs.length;
    const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to !== undefined) { e.preventDefault(); select(tabs[to], true); }
  });
});

// Usage estimate. Each slider steps through round numbers; the first 1M vectors and 100K queries are free.
const VECTORS = [1e6, 2e6, 5e6, 1e7, 2.5e7, 5e7, 1e8, 2.5e8, 5e8, 1e9];
const QUERIES = [1e5, 2.5e5, 5e5, 1e6, 2e6, 5e6, 1e7, 2.5e7, 5e7, 1e8];
const PER_M_VECTORS = 0.8;
const PER_M_QUERIES = 4;
const short = (n) => (n >= 1e9 ? `${n / 1e9}B` : n >= 1e6 ? `${n / 1e6}M` : `${n / 1e3}K`);
const words = (n) => (n >= 1e9 ? `${n / 1e9} billion` : n >= 1e6 ? `${n / 1e6} million` : `${n / 1e3} thousand`);
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const estimate = (vectors, queries) => {
  const store = (Math.max(0, vectors - 1e6) / 1e6) * PER_M_VECTORS;
  const query = (Math.max(0, queries - 1e5) / 1e6) * PER_M_QUERIES;
  return { store, query, total: store + query };
};
console.assert(estimate(2.5e7, 2e6).total.toFixed(2) === "26.80" && estimate(1e6, 1e5).total === 0, "estimate");

const v = document.getElementById("vectors");
const q = document.getElementById("queries");
const out = (id, text) => { document.getElementById(id).textContent = text; };
const update = () => {
  const vectors = VECTORS[v.value];
  const queries = QUERIES[q.value];
  const { store, query, total } = estimate(vectors, queries);
  for (const [input, n, unit] of [[v, vectors, "vectors"], [q, queries, "queries"]]) {
    input.style.setProperty("--p", `${(input.value / input.max) * 100}%`);
    input.setAttribute("aria-valuetext", `${words(n)} ${unit}`);
  }
  out("vectors-out", short(vectors));
  out("queries-out", short(queries));
  out("cost-store", usd.format(store));
  out("cost-query", usd.format(query));
  out("total", usd.format(total));
};
v.addEventListener("input", update);
q.addEventListener("input", update);
update();
