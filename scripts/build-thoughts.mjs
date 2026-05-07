#!/usr/bin/env node
// Generates /public/thoughts/index.html and /public/thoughts/<slug>.html from data/thoughts.json.
// Each post can either mirror full content (post.body) or stub-out to its source platform.

import { readFile, writeFile, mkdir, readdir, unlink, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dataPath = join(root, "data", "thoughts.json");
const outDir = join(root, "public", "thoughts");

const SOURCES = {
  medium: { label: "medium", verb: "Read on Medium" },
  linkedin: { label: "linkedin", verb: "Read on LinkedIn" },
  substack: { label: "substack", verb: "Read on Substack" },
  twitter: { label: "twitter", verb: "Read on X" },
};

const SITE = "https://livinmathew.com";

// HTML escape — used for everything except `body` (already HTML).
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// YYYY-MM-DD → "12 Apr 2026"
function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function navHTML(active) {
  const link = (href, label, key) =>
    `<a href="${href}" class="${active === key ? "text-fg" : "hover:text-fg transition-colors"}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `
    <nav class="sticky top-0 z-40 bg-bg/80 backdrop-blur border-b border-line" aria-label="Primary">
      <div class="container-wide flex items-center justify-between h-14">
        <a href="../index.html" class="font-mono text-sm tracking-tight" aria-label="Home">
          <span class="text-fg">livin</span><span class="text-subtle">.mathew</span>
        </a>
        <div class="hidden md:flex items-center gap-7 text-sm text-muted">
          ${link("../index.html#work", "Work", "work")}
          ${link("../index.html#experience", "Experience", "experience")}
          ${link("../index.html#stack", "Stack", "stack")}
          ${link("../projects.html", "Projects", "projects")}
          ${link("../thoughts/", "Thoughts", "thoughts")}
          ${link("../about.html", "About", "about")}
        </div>
        <div class="flex items-center gap-3">
          <a href="../LivinMathewResume.pdf" target="_blank" rel="noopener" class="btn btn-ghost h-9 px-3 text-xs">
            Resume
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/><path d="M5 21h14"/></svg>
          </a>
          <button id="mobile-menu-btn" class="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-md border border-line text-muted hover:text-fg" aria-expanded="false" aria-controls="mobile-menu" aria-label="Toggle menu">
            <svg id="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
            <svg id="close-icon" class="hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
          </button>
        </div>
      </div>
      <div id="mobile-menu" class="hidden md:hidden border-t border-line">
        <div class="container-wide py-3 flex flex-col text-sm">
          <a href="../index.html#work" class="py-2 text-muted hover:text-fg">Work</a>
          <a href="../index.html#experience" class="py-2 text-muted hover:text-fg">Experience</a>
          <a href="../index.html#stack" class="py-2 text-muted hover:text-fg">Stack</a>
          <a href="../projects.html" class="py-2 text-muted hover:text-fg">Projects</a>
          <a href="../thoughts/" class="py-2 ${active === "thoughts" ? "text-fg" : "text-muted hover:text-fg"}"${active === "thoughts" ? ' aria-current="page"' : ""}>Thoughts</a>
          <a href="../about.html" class="py-2 text-muted hover:text-fg">About</a>
        </div>
      </div>
    </nav>`;
}

function footerHTML() {
  return `
    <footer class="border-t border-line py-10 mt-10">
      <div class="container-wide flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
        <div>
          <p class="font-mono text-xs">
            <span class="text-fg">livin</span><span class="text-subtle">.mathew</span>
            <span class="text-subtle"> · cochin, in</span>
          </p>
          <p class="mt-2 label-mono">© <span id="year">2026</span> Livin Mathew.</p>
        </div>
        <div class="flex items-center gap-5 text-muted">
          <a href="https://github.com/livin21" target="_blank" rel="noopener" aria-label="GitHub" class="hover:text-fg transition-colors">github</a>
          <a href="https://linkedin.com/in/livin21" target="_blank" rel="noopener" aria-label="LinkedIn" class="hover:text-fg transition-colors">linkedin</a>
          <a href="https://medium.com/@livinmathew" target="_blank" rel="noopener" aria-label="Medium" class="hover:text-fg transition-colors">medium</a>
          <a href="mailto:reach.livin@gmail.com" aria-label="Email" class="hover:text-fg transition-colors">email</a>
        </div>
      </div>
    </footer>`;
}

function scriptsHTML() {
  return `
    <script>
      (function () {
        const btn = document.getElementById("mobile-menu-btn");
        const menu = document.getElementById("mobile-menu");
        const menuIcon = document.getElementById("menu-icon");
        const closeIcon = document.getElementById("close-icon");
        if (!btn || !menu) return;
        btn.addEventListener("click", () => {
          const open = !menu.classList.contains("hidden");
          menu.classList.toggle("hidden");
          menuIcon.classList.toggle("hidden");
          closeIcon.classList.toggle("hidden");
          btn.setAttribute("aria-expanded", String(!open));
        });
        menu.querySelectorAll("a").forEach((a) =>
          a.addEventListener("click", () => {
            menu.classList.add("hidden");
            menuIcon.classList.remove("hidden");
            closeIcon.classList.add("hidden");
            btn.setAttribute("aria-expanded", "false");
          }),
        );
      })();
      const yearEl = document.getElementById("year");
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    </script>`;
}

function pageShell({ title, description, canonical, ogImage, ogType = "website", body, active }) {
  return `<!doctype html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />

    <title>${esc(title)}</title>
    <meta name="title" content="${esc(title)}" />
    <meta name="description" content="${esc(description)}" />
    <meta name="author" content="Livin Mathew" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#0A0A0A" />

    <meta property="og:type" content="${esc(ogType)}" />
    <meta property="og:url" content="${esc(canonical)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(ogImage)}" />
    <meta property="og:image:alt" content="Livin Mathew" />

    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${esc(canonical)}" />
    <meta property="twitter:title" content="${esc(title)}" />
    <meta property="twitter:description" content="${esc(description)}" />
    <meta property="twitter:image" content="${esc(ogImage)}" />

    <link rel="canonical" href="${esc(canonical)}" />
    <link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png" />
    <link rel="shortcut icon" href="../favicon.ico" />
    <link rel="manifest" href="../manifest.json" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

    <link href="../style.css" rel="stylesheet" />
  </head>

  <body>
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:btn focus:btn-primary">Skip to content</a>
${navHTML(active)}
    <main id="main">
${body}
    </main>
${footerHTML()}
${scriptsHTML()}
  </body>
</html>
`;
}

function postCardHTML(p) {
  const src = SOURCES[p.source] ?? { label: p.source };
  const href = p.body ? `./${esc(p.slug)}.html` : esc(p.source_url || `./${p.slug}.html`);
  const externalAttrs = p.body ? "" : ` target="_blank" rel="noopener"`;
  const tagChips = (p.tags ?? []).slice(0, 3).map((t) => `<span class="chip">${esc(t)}</span>`).join("");
  return `
        <li>
          <a href="${href}"${externalAttrs} class="block group p-6 md:p-8 border-b border-line hover:bg-surface transition-colors">
            <div class="flex flex-col md:flex-row md:items-baseline md:gap-8">
              <span class="label-mono shrink-0 md:w-32 mb-2 md:mb-0">${esc(fmtDate(p.date))}</span>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg md:text-xl font-semibold text-fg group-hover:text-accent transition-colors mb-1.5">
                  ${esc(p.title)}
                </h3>
                <p class="text-sm text-muted leading-relaxed mb-3 max-w-2xl">${esc(p.excerpt)}</p>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="chip">${esc(src.label)}</span>
                  ${tagChips}
                </div>
              </div>
              <span class="font-mono text-xs text-subtle md:pt-1 mt-3 md:mt-0 shrink-0 group-hover:text-fg transition-colors">${p.body ? "→" : "↗"}</span>
            </div>
          </a>
        </li>`;
}

function indexBody(posts) {
  const cards = posts.map(postCardHTML).join("");
  return `
      <section class="container-wide pt-20 md:pt-28 pb-12">
        <p class="eyebrow mb-6">Thoughts · writing</p>
        <h1 class="text-4xl md:text-6xl font-semibold tracking-tightest leading-[0.95] mb-6">
          Thoughts<span class="text-accent">.</span>
        </h1>
        <p class="text-lg md:text-xl text-muted max-w-2xl leading-snug">
          Notes on what I'm learning while building production GenAI: multi-agent RAG, evaluation,
          serverless architecture, and the infrastructure decisions that quietly compound.
          Cross-posted from Medium and LinkedIn.
        </p>
      </section>

      <section class="container-wide pb-20">
        <div class="border-t border-line">
          <ul>
            ${cards}
          </ul>
        </div>
        ${posts.length === 0 ? `<p class="text-muted py-10">Nothing here yet. <a href="https://medium.com/@livinmathew" target="_blank" rel="noopener" class="link-underline">Catch up on Medium</a> meanwhile.</p>` : ""}
      </section>`;
}

function postBody(p) {
  const src = SOURCES[p.source] ?? { label: p.source, verb: `Read on ${p.source}` };
  const tagChips = (p.tags ?? []).map((t) => `<span class="chip">${esc(t)}</span>`).join("");

  if (p.body) {
    // Full mirror
    return `
      <article>
        <header class="container-narrow pt-20 md:pt-24 pb-10">
          <a href="./" class="label-mono hover:text-fg transition-colors">← All thoughts</a>
          <p class="eyebrow mt-8 mb-5">${esc(src.label)} · ${esc(fmtDate(p.date))}</p>
          <h1 class="text-3xl md:text-5xl font-semibold tracking-tightest leading-[1.05] mb-5">
            ${esc(p.title)}<span class="text-accent">.</span>
          </h1>
          <p class="text-lg md:text-xl text-muted leading-snug max-w-2xl">${esc(p.excerpt)}</p>
          <div class="mt-8 flex flex-wrap items-center gap-1.5">
            ${tagChips}
          </div>
        </header>

        <div class="container-narrow pb-12">
          <div class="prose">
            ${p.body}
          </div>
        </div>

        <div class="container-narrow border-t border-line py-10">
          <a href="${esc(p.source_url)}" target="_blank" rel="noopener" class="arrow-link text-sm">${esc(src.verb)}&nbsp;</a>
          <p class="label-mono mt-2">Originally on ${esc(src.label)}.</p>
        </div>

        <div class="container-narrow pb-20">
          <a href="./" class="arrow-link text-sm">More thoughts&nbsp;</a>
        </div>
      </article>`;
  }

  // Stub — link out
  return `
      <article>
        <header class="container-narrow pt-20 md:pt-24 pb-10">
          <a href="./" class="label-mono hover:text-fg transition-colors">← All thoughts</a>
          <p class="eyebrow mt-8 mb-5">${esc(src.label)} · ${esc(fmtDate(p.date))}</p>
          <h1 class="text-3xl md:text-5xl font-semibold tracking-tightest leading-[1.05] mb-5">
            ${esc(p.title)}<span class="text-accent">.</span>
          </h1>
          <p class="text-lg md:text-xl text-muted leading-snug max-w-2xl">${esc(p.excerpt)}</p>
        </header>

        <div class="container-narrow pb-12">
          <div class="border-y border-line py-10">
            <p class="label-mono mb-2">Full post lives on ${esc(src.label)}</p>
            <a href="${esc(p.source_url)}" target="_blank" rel="noopener" class="btn btn-primary mt-2">
              ${esc(src.verb)}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
            </a>
          </div>
          <div class="mt-8 flex flex-wrap items-center gap-1.5">
            ${tagChips}
          </div>
        </div>

        <div class="container-narrow border-t border-line pt-8 pb-20">
          <a href="./" class="arrow-link text-sm">More thoughts&nbsp;</a>
        </div>
      </article>`;
}

async function rmGenerated(dir) {
  try {
    const items = await readdir(dir);
    await Promise.all(
      items
        .filter((f) => f.endsWith(".html"))
        .map((f) => unlink(join(dir, f))),
    );
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

async function main() {
  const raw = await readFile(dataPath, "utf8");
  const posts = JSON.parse(raw);
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  await mkdir(outDir, { recursive: true });
  await rmGenerated(outDir);

  // Index
  const indexHTML = pageShell({
    title: "Thoughts — Livin Mathew",
    description: "Notes on building production GenAI: multi-agent RAG, evaluation frameworks, serverless architecture. Cross-posted from Medium and LinkedIn.",
    canonical: `${SITE}/thoughts/`,
    ogImage: `${SITE}/assets/ProfilePic.png`,
    body: indexBody(posts),
    active: "thoughts",
  });
  await writeFile(join(outDir, "index.html"), indexHTML, "utf8");

  // Posts
  for (const p of posts) {
    const html = pageShell({
      title: `${p.title} — Livin Mathew`,
      description: p.excerpt,
      canonical: p.body ? `${SITE}/thoughts/${p.slug}.html` : p.source_url,
      ogImage: `${SITE}/assets/ProfilePic.png`,
      ogType: "article",
      body: postBody(p),
      active: "thoughts",
    });
    await writeFile(join(outDir, `${p.slug}.html`), html, "utf8");
  }

  console.log(`thoughts: ${posts.length} post(s) + index → ${outDir.replace(root + "/", "")}`);
}

main().catch((e) => {
  console.error("thoughts build failed:", e);
  process.exit(1);
});
