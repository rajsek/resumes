# Resumes

Private home for Raja Sekar D's resumes. One shared fact base, ten resumes built from it:
a 1-page and a 2-page version for each of five role flavors.

## Which resume when

| Flavor | Use for |
| --- | --- |
| fullstack | Full-stack / Staff Engineer roles |
| ui-heavy | Frontend-leaning roles |
| ai-fullstack | Roles mixing AI work with full-stack depth |
| ai-ui-heavy | Roles mixing AI work with frontend craft |
| ai | Applied AI application / developer-agent roles |

For AI-related applications, start with **ai-fullstack**: it pairs recent AI agent work
with established software delivery experience. Use **ai-ui-heavy** for frontend roles
on AI products, and **ai** when the job emphasizes LLM applications or developer agents.
These versions describe applied software engineering, not model-training experience.

Send the 2-page by default; the 1-page where a strict one-pager is asked for.
Built PDFs land in `pdf/` after every save (see below).

## Layout

- `shared/` - the single source of truth: header, summaries, skills, experience,
  projects, security research, awards, certifications, education.
  **Edit facts here.** One edit updates all ten resumes.
- `1-page/`, `2-page/` - ten small files that only pick and order the shared blocks
  (which summary, which skills order, full or short sections).
- `pdf/` - the latest built PDFs, named like `2-page-fullstack.pdf`.
- `archive/` - the old Overleaf versions, kept frozen for history (phone number removed).
  Not maintained; new work happens in `shared/`.

## This repo is the single master

All resume edits happen here. Git history is the version history - every old
version is recoverable from the commits. Overleaf is only an optional place to
open a .tex file; it is not synced and nothing there is newer than this repo.

## Editing and versions

Edit right here on GitHub (works on a phone too): open a file, pencil icon, save.
Every save is a commit, so the full history of every file is under the
**History** button - that is the "see previous versions" view, with line-by-line diffs.

After each save, a GitHub Action rebuilds all ten PDFs into `pdf/` (takes a few minutes).
The build fails loudly if a 1-page resume spills past one page or a 2-page one past two.

## Work on your computer (edit and see the PDF live)

The easy route is the built-in app, **Resume Studio**: a local web page where you
pick a resume, edit its text, and the PDF rebuilds itself on every save.

Two routes, both supported: install TeX on the machine, or run everything in Docker.

### 1. Install the tools once

- **Node.js** (runs the app): from https://nodejs.org - the LTS version, Next/Next/Finish.
- **A TeX engine** (turns the .tex into PDFs) - pick ONE:
  - **Mac:** MacTeX from https://www.tug.org/mactex/mactex-download.html
    (one big download, includes everything - pdflatex, fonts, latexmk).
    Smaller alternative: BasicTeX, then once in Terminal:
    `sudo tlmgr install latexmk collection-latexrecommended collection-fontsrecommended`
  - **Windows:** MiKTeX from https://miktex.org/download. During setup choose
    "Install missing packages automatically: Yes" - it then fetches anything a
    build needs (lmodern fonts etc.) by itself.
  - **Linux:** `sudo apt install texlive-latex-base texlive-latex-recommended texlive-fonts-recommended latexmk`
  - **Or skip TeX entirely and use Docker** (he has Docker Desktop):
    with Docker Desktop running, do everything with one command from the repo folder:
    `npm run dev:docker`
    The first run builds the image (a few minutes, one time; TeX is baked into it -
    a slim set with only the packages these resumes use). Then open
    http://localhost:3000 as usual. Later runs start in seconds. Stop with Ctrl+C.
    Your files stay in the repo folder - the container just borrows them.
    (On Windows, run it from Command Prompt; on Mac/Linux any terminal works.)

### Native Tectonic option (macOS, no full TeX installation)

Resume Studio also supports an explicitly selected [Tectonic](https://tectonic-typesetting.github.io/) executable.
`LATEX_COMPILER` defaults to `pdflatex`; set it to `tectonic` or its absolute path
for Tectonic. The first build downloads TeX support files and can take several minutes;
warm builds use the cache. Warm the cache with the compiler before starting the app
if the first build exceeds the app's 60-second build timeout.

For the project-local runtime prepared during this review, run from the repo root:

```bash
PORT=3001 \
LATEX_COMPILER="$PWD/.tools/tectonic" \
TECTONIC_CACHE_DIR="$PWD/.tools/tectonic-cache" \
RESUME_PDF_DIR="$PWD/.preview" \
node server.js
```

Open http://localhost:3001. The executable and cache in `.tools/` are local, ignored
by Git, and not included in a fresh clone. `RESUME_PDF_DIR` changes where the app
builds and serves PDFs (default: `pdf/`); `.preview/` keeps existing PDFs untouched.
The local runtime is Tectonic 0.17.0 for Apple Silicon macOS.

If the app reports that `pdflatex` is missing, installing npm packages will not fix
it: TeX is a separate executable. Select Tectonic as above, install TeX, or use the
Docker route. A running Node server retains its startup environment; restart it
after installing TeX or changing compiler settings.

### 2. Get this repo and start the app

    git clone https://github.com/rajsek/resumes.git
    cd resumes
    npm install
    npm run dev

Then open http://localhost:3000 - you should see the Resume Studio page with the
file list on the left, text in the middle, and the PDF on the right.

### 3. Use it

1. Pick the resume in the dropdown (e.g. `2-page/fullstack`).
2. Click a file under **Shared facts** (that is where the real content lives).
3. Edit, then save with **Ctrl+S** (Cmd+S on Mac) or the Save button.
4. The PDF on the right rebuilds in a second or two. Red errors show under the
   preview if the LaTeX has a mistake - fix and save again.
5. **Download PDF** saves the current resume's PDF. Every resume gets its own
   PDF in `pdf/`, same names as the GitHub build.

No app wanted? `./build.sh` still works: `./build.sh` builds all ten,
`./build.sh watch 2-page/fullstack` rebuilds on every save (see the table below).

## Which file makes which PDF

| Edit this file | Get this PDF |
| --- | --- |
| `1-page/fullstack.tex` | `pdf/1-page-fullstack.pdf` |
| `1-page/ui-heavy.tex` | `pdf/1-page-ui-heavy.pdf` |
| `1-page/ai-fullstack.tex` | `pdf/1-page-ai-fullstack.pdf` |
| `1-page/ai-ui-heavy.tex` | `pdf/1-page-ai-ui-heavy.pdf` |
| `1-page/ai.tex` | `pdf/1-page-ai.pdf` |
| `2-page/fullstack.tex` | `pdf/2-page-fullstack.pdf` |
| `2-page/ui-heavy.tex` | `pdf/2-page-ui-heavy.pdf` |
| `2-page/ai-fullstack.tex` | `pdf/2-page-ai-fullstack.pdf` |
| `2-page/ai-ui-heavy.tex` | `pdf/2-page-ai-ui-heavy.pdf` |
| `2-page/ai.tex` | `pdf/2-page-ai.pdf` |

Facts (jobs, bullets, skills, awards) live in `shared/*.tex` and feed all ten.

## Standing rules

- No phone number anywhere. Contact is email only: raji.sekard@gmail.com.
- Facts only from confirmed data: 14+ years (Sep 2012 start), Technical Lead, Bengaluru,
  PSM I (Feb 2024) + OCI Foundations Associate, 2026 AI work (LangChain triage agent,
  AI advocacy, Codex skill), BNY Mellon Cyber Steward (2021), Meta HoF 2015 + 2022
  ($25k, IDOR + reverse engineering - never "RCE").
- Human wording: "Led", not "Spearheaded".
- Compile check locally before pushing big changes: `./build.sh`
  (see "Work on your computer" above; Overleaf also works for a quick check).

## AI resume review (November 2026)

The active resumes prioritize the TypeScript/LangChain triage agent, shared Codex
workflows, enterprise engineering and recent developer tools. The one-page versions
keep security recognition in the awards section; the two-page versions add two
selected research examples rather than the full disclosure history.

Current hiring examples used to calibrate the positioning:

- [OpenAI: Full-Stack Software Engineer, Applied Foundations](https://openai.com/careers/full-stack-software-engineer-applied-foundations-san-francisco/) emphasizes frontend/backend systems, architecture and delivery.
- [Anthropic: Applied AI Engineer, Enterprise](https://job-boards.greenhouse.io/anthropic/jobs/5057647008-0) asks for Python or TypeScript, agent development, evaluations, MCP and production deployment.

These are skill benchmarks, not a location-specific shortlist or a claim that every
requirement is already met.

### Evidence that would strengthen the next revision

- Triage agent: number of reports reviewed, measured precision/recall or agreement
  with human reviewers, duplicate detection results, triage time before/after.
- Adoption: number of users/teams, usage frequency and time saved by the Codex skill.
- Deployment: where the agent runs, who uses it, model/provider, access boundaries,
  failure handling, latency and cost, if measured and safe to disclose.
- Existing BNY metrics: define what improved by 50%, measurement period and baseline;
  retain the deployment/release percentages only if you can substantiate them.

### Skills to demonstrate before adding them

1. LLM evaluations: a labeled triage dataset, held-out cases and regression checks
   comparing correctness, latency and cost. This is the closest extension of existing work.
2. Retrieval/RAG: demonstrate repository retrieval, access controls and retrieval quality
   before claiming RAG proficiency.
3. Tool integration/MCP: demonstrate a working integration with scoped permissions
   and traceable tool results.
4. LangGraph: add it after implementing and testing a workflow that benefits from
   state, checkpoints or human review. A framework name alone adds little evidence.

LangGraph, RAG and LLM evaluation were previously marked as learning. They are not
listed as hands-on skills in the revised resumes. No Python, model-training,
fine-tuning, AI deployment scale or unmeasured AI impact claims have been added.
