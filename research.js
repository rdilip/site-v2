// research.js
// Research project pages with distinct URLs, Markdown + KaTeX.
//
// Each research post lives in ./research/<slug>.md
// Listing page: research.html
// Individual post: research.html?post=<slug>

// ---------------------------
// Config: list research post filenames (newest first)
// To add a new post, create a .md file in research/ and add its filename here.
// Front matter fields: title, date, description
// ---------------------------
const researchPosts = [
  'apt.md',
  'kanzi.md',
];

// ---------------------------
// Marked config
// ---------------------------
try {
  if (window.marked && marked.use) {
    marked.use({ gfm: true, breaks: false });
  } else if (window.marked && marked.setOptions) {
    marked.setOptions({ gfm: true, breaks: false });
  }
} catch (e) {
  console.warn('marked config error (non-fatal):', e);
}

// ---------------------------
// Front matter parser
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
  return { meta, body: md.slice(fm[0].length) };
}

// ---------------------------
// Math handling: protect blocks from Markdown parser,
// then hydrate with KaTeX after HTML is generated.
// ---------------------------
function extractBlockMath(md) {
  const blocks = [];
  let i = 0;

  md = md.replace(/(^|[^\\])\$\$([\s\S]+?)\$\$/g, (m, pre, body) => {
    const key = `\u27EA RXBLOCK:${i++}\u27EB`;
    blocks.push({ key, tex: body.trim() });
    return pre + key;
  });

  md = md.replace(
    /\\begin\{(align\*?|aligned|gather\*?|equation\*?|multline\*?)\}([\s\S]+?)\\end\{\1\}/g,
    (m, env, body) => {
      const key = `\u27EA RXBLOCK:${i++}\u27EB`;
      blocks.push({ key, tex: `\\begin{${env}}${body}\\end{${env}}` });
      return key;
    }
  );

  return { md, blocks };
}

function hydrateBlockMath(el, blocks) {
  if (!blocks.length) return;
  let html = el.innerHTML;
  for (const { key, tex } of blocks) {
    const mount = `<span class="katex-mount" data-math="${encodeURIComponent(tex)}"></span>`;
    html = html.split(key).join(mount);
  }
  el.innerHTML = html;

  el.querySelectorAll('.katex-mount').forEach(el => {
    const tex = decodeURIComponent(el.getAttribute('data-math') || '');
    try {
      window.katex.render(tex, el, { displayMode: true, throwOnError: false });
    } catch (e) {
      console.warn('KaTeX display render error:', e, tex);
      el.textContent = tex;
    }
    el.classList.remove('katex-mount');
  });
}

function renderKaTeX(rootEl) {
  if (typeof renderMathInElement !== 'function') return;
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
// Router: check URL for ?post=slug
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const postSlug = params.get('post');

  if (postSlug) {
    loadResearchPost(postSlug);
  } else {
    loadResearchListing();
  }
});

// ---------------------------
// Link pills: parse "Label | url_or_status, ..." from front matter
// ---------------------------
const PILL_ICONS = {
  'demo':  'fa-solid fa-arrow-up-right-from-square',
  'paper': 'fa-solid fa-file-lines',
  'code':  'fa-brands fa-github',
};

function parseResearchLinks(linksStr) {
  return linksStr.split(',').map(entry => {
    const parts = entry.split('|').map(s => s.trim());
    if (parts.length < 2) return '';
    const label = parts[0];
    const target = parts[1];
    const isUrl = /^https?:\/\//.test(target);
    const iconClass = PILL_ICONS[label.toLowerCase()] || 'fa-solid fa-link';

    if (isUrl) {
      return `<a href="${target}" target="_blank" rel="noopener" class="research-pill">
        <i class="${iconClass}"></i> ${label}
      </a>`;
    } else {
      return `<span class="research-pill disabled">
        <i class="${iconClass}"></i> ${label} <span class="pill-status">${target}</span>
      </span>`;
    }
  }).join('');
}

// ---------------------------
// Individual post view
// ---------------------------
async function loadResearchPost(slug) {
  const listingView = document.getElementById('research-listing');
  const postView = document.getElementById('research-post');
  if (listingView) listingView.style.display = 'none';
  if (postView) postView.style.display = 'block';

  const contentEl = document.getElementById('research-post-content');
  const titleEl = document.getElementById('research-post-title');
  const dateEl = document.getElementById('research-post-date');

  try {
    const res = await fetch(`./research/${slug}.md`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mdRaw = await res.text();

    const { meta, body } = parseFrontMatter(mdRaw);

    const title = (meta.title && meta.title.trim()) || slug.replace(/[-_]/g, ' ');
    const date = (meta.date && meta.date.trim()) || '';

    if (titleEl) titleEl.textContent = title;
    if (dateEl) {
      dateEl.textContent = date;
      if (!date) dateEl.style.display = 'none';
    }
    document.title = `${title} — Rohit Dilip`;

    // Render link pills
    const linksEl = document.getElementById('research-post-links');
    if (linksEl && meta.links) {
      linksEl.innerHTML = parseResearchLinks(meta.links);
    }

    // Extract math blocks before markdown parsing
    const { md: mdClean, blocks } = extractBlockMath(body);

    // Markdown → HTML → sanitize
    const parseMd = marked.parse || marked;
    const html = DOMPurify.sanitize(parseMd(mdClean));

    if (contentEl) {
      contentEl.innerHTML = html;
      hydrateBlockMath(contentEl, blocks);
      renderKaTeX(contentEl);

      // Syntax highlighting
      if (window.hljs) {
        contentEl.querySelectorAll('pre code').forEach(block => {
          hljs.highlightElement(block);
        });
      }
    }
  } catch (err) {
    console.error('Error loading research post:', err);
    if (contentEl) {
      contentEl.innerHTML = `<p>Could not load this research post.</p><p style="font-size:0.8rem;color:var(--text-muted);">Error: ${err.message}. If you're opening this file directly, try serving it with a local server (e.g., <code>python3 -m http.server</code>).</p>`;
    }
  }
}

// ---------------------------
// Listing view
// ---------------------------
async function loadResearchListing() {
  const listingView = document.getElementById('research-listing');
  const postView = document.getElementById('research-post');
  if (listingView) listingView.style.display = 'block';
  if (postView) postView.style.display = 'none';
}
