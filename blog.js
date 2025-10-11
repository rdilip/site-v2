// blog.js
// Compact blog list with collapsible posts, Markdown + KaTeX (inline, $$, AMS).
//
// REQUIRED (in <head>, before this file, with defer):
//   <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js"></script>
//   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css">
//   <script src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js"></script>
//   <script src="blog.js" defer></script>

// ---------------------------
// Config: newest-first
// ---------------------------
const blogPosts = [
  '10102025_raw_coord_precision.md',
  '10052025_intro_genbio.md',
  '100425_everything_ode.md',
];

// ---------------------------
// Marked config (avoid mangling underscores etc.)
// ---------------------------
if (window.marked) {
  marked.setOptions({
    gfm: true,
    breaks: false,
    mangle: false,
    headerIds: false,
  });
}

// ---------------------------
// Front matter (YAML-lite)
// ---
// title: My Post
// date: 2025-10-01
// ---
// ---------------------------
function parseFrontMatter(md) {
  const fm = md.match(/^---\s*([\s\S]*?)\s*---\s*\n?/);
  if (!fm) return { meta: {}, body: md };

  const raw = fm[1];
  const meta = {};
  raw.split('\n').forEach(line => {
    const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/);
    if (m) meta[m[1].trim()] = m[2].trim();
  });
  const body = md.slice(fm[0].length);
  return { meta, body };
}

// ---------------------------
// Extract title (H1) and optional date heading (next heading).
// We strip these from the body so they don't render twice.
// If front-matter has title/date, those take precedence.
// ---------------------------
function extractTitleAndDateFromBody(mdBody) {
  let body = mdBody;

  // 1) Title = first H1 '# ...'
  let title = null;
  const h1Match = body.match(/^\s*#\s+(.+)\s*$/m);
  if (h1Match) {
    title = h1Match[1].trim();
    // remove that heading line
    body = body.replace(h1Match[0], '').trim();
  }

  // 2) Date = next heading (## ... or deeper)
  let date = null;
  const hNext = body.match(/^\s*#{2,6}\s+(.+?)\s*$/m);
  if (hNext) {
    date = hNext[1].trim();
    // remove that heading line too (so it doesn't appear in expanded content)
    body = body.replace(hNext[0], '').trim();
  }

  return { title, date, body };
}

// ---------------------------
// Math handling: protect display/AMS blocks from Markdown,
// then hydrate and render with KaTeX.
// Placeholders use rare Unicode brackets so Markdown won't transform them.
// ---------------------------
function extractBlockMath(md) {
  const blocks = [];
  let i = 0;

  // $$ ... $$ (multi-line, not escaped)
  md = md.replace(/(^|[^\\])\$\$([\s\S]+?)\$\$/g, (m, pre, body) => {
    const key = `⟪KXBLOCK:${i++}⟫`;
    blocks.push({ key, tex: body.trim() });
    return pre + key;
  });

  // AMS envs: align, align*, aligned, gather, gather*, equation, equation*, multline, multline*
  md = md.replace(
    /\\begin\{(align\*?|aligned|gather\*?|equation\*?|multline\*?)\}([\s\S]+?)\\end\{\1\}/g,
    (m, env, body) => {
      const key = `⟪KXBLOCK:${i++}⟫`;
      const tex = `\\begin{${env}}${body}\\end{${env}}`;
      blocks.push({ key, tex });
      return key;
    }
  );

  return { mdWithoutBlocks: md, blocks };
}

function hydrateBlockMath(containerEl, blocks) {
  if (!blocks.length) return;

  let html = containerEl.innerHTML;
  for (const { key, tex } of blocks) {
    const mount = `<span class="katex-mount" data-math="${encodeURIComponent(tex)}"></span>`;
    html = html.split(key).join(mount);
  }
  containerEl.innerHTML = html;

  containerEl.querySelectorAll('.katex-mount').forEach(el => {
    const tex = decodeURIComponent(el.getAttribute('data-math') || '');
    try {
      window.katex.render(tex, el, { displayMode: true, throwOnError: false });
    } catch (e) {
      console.warn('KaTeX display render error:', e, tex);
      el.textContent = tex; // fallback
    }
    el.classList.remove('katex-mount');
  });
}

function renderKaTeXScope(rootEl) {
  if (typeof renderMathInElement !== 'function') {
    console.warn('KaTeX auto-render not found');
    return;
  }
  renderMathInElement(rootEl, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\begin{equation}", right: "\\end{equation}", display: true },
      { left: "\\begin{align}", right: "\\end{align}", display: true },
      { left: "\\begin{aligned}", right: "\\end{aligned}", display: true },
      { left: "\\begin{gather}", right: "\\end{gather}", display: true },
    ],
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
    throwOnError: false,
  });
}

// ---------------------------
// Page switching (exported)
// ---------------------------
function showPage(e, pageId) {
  if (e) e.preventDefault();

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');

  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (e?.currentTarget) e.currentTarget.classList.add('active');

  if (pageId === 'blog') loadBlogPosts();
}
window.showPage = showPage;

// ---------------------------
// Blog loader (compact list + collapsible content)
// ---------------------------
async function loadBlogPosts() {
  const container = document.getElementById('blog-posts');
  if (!container) return;
  container.innerHTML = '';

  if (blogPosts.length === 0) {
    container.innerHTML =
      '<div class="blog-post"><div class="markdown-content"><p>No posts yet. Check back soon!</p></div></div>';
    return;
  }

  let loaded = 0;

  for (const file of blogPosts) {
    try {
      const res = await fetch(`./posts/${file}`, { cache: 'no-store' });
      if (!res.ok) {
        console.warn(`Could not load ${file}: ${res.status}`);
        continue;
      }
      const mdRaw = await res.text();

      // Parse meta + body
      const { meta, body } = parseFrontMatter(mdRaw);

      // Extract title/date from body (strip them), but meta overrides
      const td = extractTitleAndDateFromBody(body);
      const title =
        (meta.title && meta.title.trim()) ||
        td.title ||
        file.replace(/\.md$/, '').replace(/[-_]/g, ' ');
      const date = (meta.date && meta.date.trim()) || td.date || '';

      // PRE-EXTRACT math blocks before Markdown
      const { mdWithoutBlocks, blocks } = extractBlockMath(td.body);

      // Markdown -> HTML + sanitize
      const html = DOMPurify.sanitize(marked.parse(mdWithoutBlocks));

      // Build compact post
      const post = document.createElement('div');
      post.className = 'blog-post';

      // Title as a button for a11y + easy toggling
      // Title as a button for a11y + easy toggling
      const buttonId = `post-toggle-${loaded}`;
      post.innerHTML = `
  <h3 class="post-title">
    <button id="${buttonId}" class="post-toggle" aria-expanded="false"
      aria-controls="${buttonId}-content"
      style="all:unset; cursor:pointer; display:flex; align-items:center; gap:0.4rem;">
      <span class="triangle" style="display:inline-block; transition:transform 0.2s;">▸</span>
      <span>${title}</span>
    </button>
  </h3>
  ${date ? `<div class="date" style="font-size:0.85rem; color:#666; margin:0.25rem 0 0.5rem;">${date}</div>` : ''}
  <div id="${buttonId}-content" class="markdown-content" hidden>
    ${html}
  </div>
`;
      container.appendChild(post);

      // Render math
      const scope = post.querySelector('.markdown-content') || post;
      hydrateBlockMath(scope, blocks);
      renderKaTeXScope(scope);

      // Toggle behavior
      const toggle = post.querySelector(`#${buttonId}`);
      const content = post.querySelector(`#${buttonId}-content`);
      const triangle = post.querySelector(`#${buttonId} .triangle`);
      if (toggle && content && triangle) {
        toggle.addEventListener('click', () => {
          const expanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', String(!expanded));

          if (expanded) {
            content.setAttribute('hidden', '');
            triangle.style.transform = 'rotate(0deg)';
          } else {
            content.removeAttribute('hidden');
            triangle.style.transform = 'rotate(90deg)';
          }
        });
      }

      loaded++;
    } catch (err) {
      console.warn(`Error loading ${file}:`, err);
    }
  }

  if (loaded === 0) {
    container.innerHTML =
      '<div class="blog-post"><div class="markdown-content"><p>Posts are being prepared. Check back soon!</p></div></div>';
  }
}

// ---------------------------
// Bootstrapping
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {
  const blogPage = document.getElementById('blog');
// Bootstrapping (always load on notes.html)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBlogPosts);
} else {
  loadBlogPosts();
}

});
