# Resumes

Private home for Raja Sekar D's resumes. One shared fact base, twelve resumes built from it:
a 1-page and a 2-page version for each of six role flavors.

## Which resume when

| Flavor | Focus and review feedback |
| --- | --- |
| fullstack | React/Node integration, Kubernetes and BNY modernization. Strong delivery evidence; deeper backend feature ownership would strengthen it. |
| ui-heavy | React/Oracle JET interoperability, components, architecture RFCs and mentoring. Most direct fit for established frontend experience. |
| ai-fullstack | LangChain agent plus application integration and cloud delivery. Strong bridge into AI application engineering; agent usage/evaluation facts remain to be supplied. |
| ai-ui-heavy | Component architecture, agent development and UI engineering workflows. For frontend roles on AI products; does not imply a shipped AI chat interface. |
| ai | Agent development, reusable Codex workflows and developer enablement. Emphasizes applied tooling rather than model training or research. |
| ai-security | Responsible disclosure, access-control findings and published security/debugging tools alongside AI engineering. Transition profile; no RCE/XSS or model-security claims. |

For AI-related applications, start with **ai-fullstack**: it pairs recent AI agent work
with established software delivery experience. Use **ai-ui-heavy** for frontend roles
on AI products, and **ai** when the job emphasizes LLM applications or developer agents.
These versions describe applied software engineering, not model-training experience.

Use **ai-security** to connect existing AI agent work, security research and developer-tool
engineering. It targets a transition into security-focused AI application engineering; it
does not claim model training, AI red teaming or production LLM security experience.

Send the 2-page by default; the 1-page where a strict one-pager is asked for.
Built PDFs land in `pdf/` after every save (see below).

## Layout

- `shared/` - the single source of truth: header, summaries, skills, experience,
  projects, security research, awards, certifications, education.
  **Edit facts here.** One edit updates all twelve resumes.
- `1-page/`, `2-page/` - twelve small files that only pick and order the shared blocks
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

After each save, a GitHub Action rebuilds all twelve PDFs into `pdf/` (takes a few minutes).
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

No app wanted? `./build.sh` still works: `./build.sh` builds all twelve,
`./build.sh watch 2-page/fullstack` rebuilds on every save (see the table below).

## Which file makes which PDF

| Edit this file | Get this PDF |
| --- | --- |
| `1-page/fullstack.tex` | `pdf/1-page-fullstack.pdf` |
| `1-page/ui-heavy.tex` | `pdf/1-page-ui-heavy.pdf` |
| `1-page/ai-fullstack.tex` | `pdf/1-page-ai-fullstack.pdf` |
| `1-page/ai-ui-heavy.tex` | `pdf/1-page-ai-ui-heavy.pdf` |
| `1-page/ai.tex` | `pdf/1-page-ai.pdf` |
| `1-page/ai-security.tex` | `pdf/1-page-ai-security.pdf` |
| `2-page/fullstack.tex` | `pdf/2-page-fullstack.pdf` |
| `2-page/ui-heavy.tex` | `pdf/2-page-ui-heavy.pdf` |
| `2-page/ai-fullstack.tex` | `pdf/2-page-ai-fullstack.pdf` |
| `2-page/ai-ui-heavy.tex` | `pdf/2-page-ai-ui-heavy.pdf` |
| `2-page/ai.tex` | `pdf/2-page-ai.pdf` |
| `2-page/ai-security.tex` | `pdf/2-page-ai-security.pdf` |

Facts (jobs, bullets, skills, awards) live in `shared/*.tex` and feed all twelve.

## Standing rules

- Contact: +91 97908 89185 (confirmed November 2026) and raji.sekard@gmail.com. Maintain both in the shared header.
- Facts only from confirmed data: 14+ years (Sep 2012 start), Technical Lead, Bengaluru,
  PSM I (Feb 2024) + OCI Foundations Associate, 2026 AI work (LangChain triage agent,
  AI advocacy, Codex skill), BNY Mellon Cyber Steward (2021), Meta HoF 2015 + 2022
  ($25k, IDOR + reverse engineering - never "RCE").
- Human wording: "Led", not "Spearheaded".
- Compile check locally before pushing big changes: `./build.sh`
  (see "Work on your computer" above; Overleaf also works for a quick check).

## AI resume review (November 2026)

The six profiles select different Oracle and BNY contribution blocks, not just different
summaries or keyword order. One-page versions prioritize selected contributions;
two-page versions expand published tool descriptions, research and technical community work.
Only the named, published WebSocket Workbench and VBCS Variable Inspector are selected as projects. All versions keep Meta recognition in awards, once per resume;
summaries prioritize their target role. The two-page versions
include two selected research examples rather than the full disclosure history; the
one-page ai-security profile also includes compact research evidence.

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

## Tailoring boundaries (November 2026)

The two supplied reference PDFs guide section depth and page density. Their older
locations, RCE/XSS claims and unconfirmed Oracle metrics are not copied. The mobile
number was separately confirmed by the candidate in November 2026.
BNY outcomes, architecture ownership/RFCs/mentoring, US$25,000 total rewards and
the BNY disclosure affecting 50k+ employees were confirmed by the candidate.
The website also supports Node.js backend changes, the TCS WebRTC proof of concept
and the listed Null Chennai session topics.

These are six role-specific base resumes, not claims to satisfy any particular
OpenAI, Anthropic, Sarvam AI or other job description. A specific vacancy still
requires matching its actual responsibilities and evidence. Compensation targets
and notice period are recruiting preferences, not resume achievements.

## Local review highlights

Click **Highlight changes** in Resume Studio to mark added/changed words in the
selected built resume against its PDF in the current Git HEAD commit. The caption
shows the baseline commit. Removed words are counted, not drawn; a new resume is
fully highlighted. Text comparison ignores casing, surrounding sentence punctuation and line-wrap
hyphenation; numbers and numeric signs remain significant. This is a wording review rather than a layout diff.

Highlights are browser overlays on temporary page images. The Download button
always serves the clean PDF from `pdf/`; no highlights are written to TeX or PDF.
Save and build after editing to refresh the review.

Review mode needs Git plus Poppler (`pdftotext` and `pdftoppm`) on the server PATH.
macOS: `brew install poppler`; Debian/Ubuntu: `sudo apt install poppler-utils git`.
The Docker image includes these tools. Restart Resume Studio after updating its
server code; existing PDFs can still be downloaded if review tools are missing.

## ATS feedback revision (November 2026)

All 12 variants use Professional Summary, Skills, Professional Experience,
Projects, Awards, Certifications and Education headings. Role-specific summaries,
skills and contribution selections remain distinct. Phone and email are visible
in the document body with clickable links; project store links remain intact.

The content revision removes repetitive bullet labels, uses direct action verbs,
clarifies grammar and numerical scope, and retains only confirmed results.
No employer, skill, achievement or metric from the other person's reference PDF
was copied. The design stays single-column with selectable text and no contact icons.

This revision does not establish a third-party ATS score. The checker must be rerun
on the exported PDF, and vacancy-specific tailoring requires its job description.
Locked categories and aggregate scores do not identify exact defects. No dates or
career history were hidden to pursue an age-bias score.

The expanded Enhancv report identified the KRDS and TCS bullets, repeated
"reported"/"published", an unrecognized Skills section and a missing phone number.
The revision uses the exact Skills heading and a labeled international phone number,
merges the AXA contribution into one bullet with its confirmed 1,000+ account scope,
and retains the named TCS applications without a forced application count. The
two-page versions briefly include the WebRTC prototype within the same bullet. These describe existing scope, not newly
claimed business outcomes. Repetition was reduced without changing disclosure facts.
The five spelling findings remain hidden by the checker; no specific external
spelling verdict or new score is claimed. Its generic-layout warning does not
demonstrate a parsing failure, so the single-column layout is retained.

### Human wording pass

The candidate asked for plain descriptions of actual work rather than wording
written to satisfy a numeric checker. The AXA account and content-publishing work
is one contribution; the WebRTC prototype is a short part of the TCS bullet in
two-page versions. No business result or metric was invented for either.
Experience wording uses direct terms such as built, wrote, updated and helped
build, while retaining confirmed ownership and measured BNY results.

Summaries now emphasize current Oracle work in plain language. Historical BNY
results stay in experience rather than leading the introduction. The six summaries
keep distinct role focuses without changing the underlying career facts.
