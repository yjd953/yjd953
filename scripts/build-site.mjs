import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const notes = [
  {
    number: "01",
    slug: "agent-reliability",
    source: "posts/agent-reliability.md",
    title: "From Demo to Production: Four Reliability Pillars for Agents",
    pageTitle: "Agent Reliability — Dale Yang",
    category: "Agent systems",
    language: "EN",
    detail: "4 principles",
    description:
      "Explicit state, contract-first tools, layered evaluation, and operational control.",
  },
  {
    number: "02",
    slug: "tool-use-checklist",
    source: "posts/tool-use-checklist.md",
    title: "A Practical Tool-Use Checklist",
    category: "Tooling",
    language: "EN",
    detail: "5 checks",
    description:
      "A compact release checklist for tool contracts, safety, execution, and verification.",
  },
  {
    number: "03",
    slug: "backend-interview-guide",
    source: "posts/backend-interview-guide.md",
    title: "后端开发八股文指南",
    category: "Backend",
    language: "ZH",
    detail: "90 topics",
    description:
      "Java、Go、JVM、Redis、MySQL、MQ、网络与分布式系统，九个模块、90 个高频知识点。",
  },
];

marked.setOptions({
  gfm: true,
  breaks: false,
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function headingId(value, counts) {
  const plain = value
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .trim()
    .toLowerCase();
  const base =
    plain
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function renderMarkdown(markdown) {
  const counts = new Map();
  let html = marked
    .parse(markdown)
    .replace(/href="#([^"]+)"/g, 'href="#section-$1"');

  html = html.replace(
    /<h([1-6])>([\s\S]*?)<\/h\1>/g,
    (_, level, content) =>
      `<h${level} id="section-${headingId(content, counts)}">${content}</h${level}>`,
  );

  return html.replace(
    /<table>([\s\S]*?)<\/table>/g,
    '<div class="table-scroll"><table>$1</table></div>',
  );
}

function documentShell({
  title,
  description,
  body,
  bodyClass,
  assetPrefix = "",
  lang = "en",
}) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f1f1ee">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${assetPrefix}assets/site.css">
</head>
<body class="${bodyClass}">
  <div class="reading-progress" id="readingProgress" aria-hidden="true"></div>
${body}
  <script src="${assetPrefix}assets/site.js" defer></script>
</body>
</html>
`;
}

function renderIndex() {
  const rows = notes
    .map(
      (note) => `
        <a class="note-row" href="notes/${note.slug}.html">
          <span class="note-number">${note.number}</span>
          <span class="note-copy">
            <span class="note-meta">${note.category} / ${note.language} / ${note.detail}</span>
            <strong>${note.title}</strong>
            <span class="note-description">${note.description}</span>
          </span>
          <span class="note-arrow" aria-hidden="true">↗</span>
        </a>`,
    )
    .join("");

  const body = `
  <header class="site-header">
    <a class="wordmark" href="./" aria-label="Dale Yang home">DY<span>.</span></a>
    <nav aria-label="Primary">
      <a href="#writing">Writing</a>
      <a href="https://github.com/yjd953">GitHub</a>
    </nav>
  </header>

  <main>
    <section class="index-intro">
      <p class="kicker">Dale Yang / Agent engineer</p>
      <h1>Engineering<br>notes<span>.</span></h1>
      <p class="intro-copy">
        Notes on the runtime around language models, plus a growing backend
        reference. Written to be useful after the demo is over.
      </p>
    </section>

    <section class="writing-index" id="writing" aria-labelledby="writingTitle">
      <div class="section-label">
        <h2 id="writingTitle">Writing</h2>
        <span>${String(notes.length).padStart(2, "0")} notes</span>
      </div>
      <div class="note-list">${rows}
      </div>
    </section>

    <section class="activity-strip" aria-labelledby="activityTitle">
      <div class="section-label">
        <h2 id="activityTitle">Open source activity</h2>
        <a href="https://github.com/yjd953">View profile ↗</a>
      </div>
      <img src="assets/github-snake.svg" alt="GitHub contribution history">
    </section>
  </main>

  <footer class="site-footer">
    <span>Dale Yang</span>
    <span>Beijing / 2026</span>
  </footer>`;

  return documentShell({
    title: "Dale Yang — Engineering Notes",
    description:
      "Engineering notes on reliable agents, tool use, evaluation, and backend systems.",
    body,
    bodyClass: "index-page",
  });
}

function renderArticle(note, content) {
  const body = `
  <header class="site-header">
    <a class="wordmark" href="../" aria-label="Back to writing index">DY<span>.</span></a>
    <nav aria-label="Primary">
      <a href="../">All notes</a>
      <a href="https://github.com/yjd953">GitHub</a>
    </nav>
  </header>

  <main class="article-layout">
    <header class="article-masthead">
      <a class="back-link" href="../">← All notes</a>
      <p class="kicker">${note.number} / ${note.category} / ${note.language}</p>
      <h1>${note.title}</h1>
      <p class="article-deck">${note.description}</p>
    </header>

    <article class="prose">
      ${content}
    </article>
  </main>

  <footer class="site-footer article-footer">
    <a href="../">Dale Yang / Engineering notes</a>
    <a href="https://github.com/yjd953/yjd953/blob/main/${note.source}">View source ↗</a>
  </footer>`;

  return documentShell({
    title: note.pageTitle ?? `${note.title} — Dale Yang`,
    description: note.description,
    body,
    bodyClass: "article-page",
    assetPrefix: "../",
    lang: note.language === "ZH" ? "zh-CN" : "en",
  });
}

await mkdir(join(root, "notes"), { recursive: true });
await writeFile(join(root, "index.html"), renderIndex());

for (const note of notes) {
  const markdown = (await readFile(join(root, note.source), "utf8"))
    .replace(/^#\s+.+\n+/, "")
    .replace(/\n\[Back to notes\]\(\.\.\/\)\s*$/i, "");
  await writeFile(
    join(root, "notes", `${note.slug}.html`),
    renderArticle(note, renderMarkdown(markdown)),
  );
}

console.log(`Built index and ${notes.length} article pages.`);
