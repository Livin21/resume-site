#!/usr/bin/env node
// Generates /public/sitemap.xml from data/thoughts.json + a static page list.
// Run after build-thoughts.mjs so generated pages are reflected.

import { readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const SITE = "https://livinmathew.com";

const today = new Date().toISOString().slice(0, 10);

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "monthly" },
  { path: "/about.html", priority: "0.7", changefreq: "yearly" },
  { path: "/projects.html", priority: "0.8", changefreq: "monthly" },
  { path: "/thoughts/", priority: "0.8", changefreq: "weekly" },
  { path: "/case-studies/centric-plm.html", priority: "0.7", changefreq: "yearly" },
  { path: "/case-studies/sage-rag.html", priority: "0.7", changefreq: "yearly" },
];

async function fileMtime(relPath) {
  try {
    const s = await stat(join(root, "public", relPath.replace(/^\//, "")));
    return s.mtime.toISOString().slice(0, 10);
  } catch {
    return today;
  }
}

async function main() {
  const raw = await readFile(join(root, "data", "thoughts.json"), "utf8");
  const posts = JSON.parse(raw);

  const entries = [];

  for (const p of STATIC_PAGES) {
    const lastmod = p.path === "/" ? await fileMtime("/index.html") : await fileMtime(p.path === "/thoughts/" ? "/thoughts/index.html" : p.path);
    entries.push({ loc: `${SITE}${p.path}`, lastmod, changefreq: p.changefreq, priority: p.priority });
  }

  for (const post of posts) {
    entries.push({
      loc: `${SITE}/thoughts/${post.slug}.html`,
      lastmod: post.date,
      changefreq: "yearly",
      priority: "0.6",
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  await writeFile(join(root, "public", "sitemap.xml"), xml, "utf8");
  console.log(`sitemap: ${entries.length} url(s) → public/sitemap.xml`);
}

main().catch((e) => {
  console.error("sitemap build failed:", e);
  process.exit(1);
});
