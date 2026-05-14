# Repository Summary

This is **Rohit Dilip's personal academic website** — a static site for a Caltech researcher working on generative modeling for biology (protein structure prediction, flow matching, tokenization). The site is pure HTML/CSS/JS with no build system or framework.

## Site Structure

### Pages (3 HTML files)

| File | Purpose |
|------|---------|
| `index.html` | Homepage: bio, social links, projects list, publications list, and an embedded "Research Notes" blog section |
| `notes.html` | Standalone "Notes" page — same collapsible blog post list as the homepage blog section |
| `research.html` | Research project showcase — card-based listing with individual post views via `?post=<slug>` URL param |

All three pages share the same sticky header nav (`Home | Research | Notes`) but each has its own inline `<style>` block (no shared CSS file besides `styles.css` which exists but isn't imported by the HTML).

### JavaScript (3 files)

| File | Purpose |
|------|---------|
| `blog.js` | Powers the Notes page and the blog section on the homepage. Fetches markdown files from `posts/`, parses YAML front matter, renders with `marked.js` + `DOMPurify`, handles KaTeX math (display/inline/AMS environments), and creates collapsible accordion UI with triangle toggles. |
| `research.js` | Powers `research.html`. URL-based routing (`?post=slug`). Fetches markdown from `research/`, renders with same marked+KaTeX pipeline, shows link pills (Demo/Paper/Code) parsed from front matter `links` field. |
| `main.js` | Legacy/unused — defines a `PersonalSite` class with blog loading from a `blog/index.json` that doesn't exist. Not imported by any current HTML page. |

### Content

**Blog posts** (`posts/`): 7 markdown files with YAML front matter (`title`, `date`). Topics are technical research notes on generative biology:
- `11012025_fdiv.md` — f-divergences
- `10212025_gumbel.md` — Gumbel distribution
- `10172025_j2.md` — J2 (likely related to diffusion)
- `10112025_kabsch.md` — Kabsch algorithm (rigid alignment)
- `10102025_raw_coord_precision.md` — coordinate precision in bfloat16
- `10052025_intro_genbio.md` — intro to generative biology
- `100425_everything_ode.md` — ODE-based generative models

The post list is hardcoded in `blog.js` as the `blogPosts` array (newest first).

**Research posts** (`research/`): 2 markdown files with richer front matter (`title`, `date`, `description`, `links`):
- `apt.md` — Adaptive Protein Tokenization (Jan 2026)
- `kanzi.md` — Flow Autoencoders / Kanzi tokenizer (Dec 2025)

The post list is hardcoded in `research.js` as the `researchPosts` array.

**Images**: `posts/images/` (blog figures) and `research/images/` (research figures, PNG + PDF).

### Assets (`assets/`)

- `profile.jpg`, `ghibli_headshot.png` — profile photos (front/back of flippable avatar)
- `kanzi_all_authors.pdf`, `jovian.pdf` — paper PDFs linked from homepage
- `flow_matching.ipynb` — Jupyter notebook (likely supplementary)

### External Dependencies (CDN)

- `marked.js` — Markdown parsing
- `DOMPurify` — HTML sanitization
- `KaTeX` + auto-render — LaTeX math rendering
- `highlight.js` — Code syntax highlighting (on research.html and notes.html)
- Font Awesome 6 — Icons

## Key Patterns

1. **No build step**: Everything is static files served directly. Adding a post means creating a `.md` file and adding its filename to the array in `blog.js` or `research.js`.

2. **Math rendering pipeline**: Block math (`$$`, AMS environments) is extracted before markdown parsing using placeholder tokens (`⟪KXBLOCK:N⟫`), then hydrated back as KaTeX after HTML is generated. Inline math uses KaTeX auto-render.

3. **Front matter**: Simple YAML-lite parser (regex-based, not a full YAML library). Supports `title`, `date`, `description`, `links`.

4. **Profile photo**: Clickable coin-flip animation (CSS 3D transform) between real photo and Ghibli-style AI portrait.

5. **Styling**: Warm off-white backgrounds (`#fefcfb`, `#faf8f5`), Inter font, blue accent links (`#2563eb`). Research page uses Space Grotesk for headings and a slightly different color palette.

## How to Add Content

**New blog note**: Create `posts/<date>_<slug>.md` with front matter, add filename to `blogPosts` array in `blog.js`.

**New research post**: Create `research/<slug>.md` with front matter (including `links` for pill buttons), add filename to `researchPosts` array in `research.js`.
