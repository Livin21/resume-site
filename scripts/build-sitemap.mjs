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
  { path: "/about", priority: "0.7", changefreq: "yearly" },
  { path: "/projects", priority: "0.8", changefreq: "monthly" },
  { path: "/thoughts/", priority: "0.8", changefreq: "weekly" },
  { path: "/flotilla/", priority: "0.8", changefreq: "monthly" },
  { path: "/case-studies/centric-plm", priority: "0.7", changefreq: "yearly" },
  { path: "/case-studies/sage-rag", priority: "0.7", changefreq: "yearly" },
];

// Sitemap locs are the extensionless URLs Cloudflare actually serves 200 for; the file on
// disk still has its .html (or index.html for a directory), which is what mtime needs.
const fileFor = (urlPath) => (urlPath.endsWith("/") ? `${urlPath}index.html` : `${urlPath}.html`);

async function exists(relPath) {
  try { await stat(join(root, "public", relPath.replace(/^\//, ""))); return true; }
  catch { return false; }
}

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
    const file = fileFor(p.path);
    // A sitemap entry for a page that does not exist is reported by search engines as an error.
    // /case-studies/centric-plm was listed here while 404ing, so the list states intent and the
    // build decides what is real.
    if (!(await exists(file))) {
      console.warn(`sitemap: skipping ${p.path} — ${file} not found`);
      continue;
    }
    const lastmod = await fileMtime(file);
    entries.push({ loc: `${SITE}${p.path}`, lastmod, changefreq: p.changefreq, priority: p.priority });
  }

  for (const post of posts) {
    entries.push({
      loc: `${SITE}/thoughts/${post.slug}`,
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
