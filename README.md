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
| ai | AI-first roles |

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

Everything below is free. Pick your system:

1. **Install the tools once**
   - **Mac:** install MacTeX from https://www.tug.org/mactex/ (big download, one time),
     then install Git with `git --version` (it offers to install itself if missing).
   - **Windows:** install Git from https://git-scm.com/download/win, then MiKTeX from
     https://miktex.org/download (say yes when it offers to install missing packages).
   - **Linux:** `sudo apt install git texlive-latex-base texlive-latex-recommended texlive-fonts-recommended`
2. **Get this repo.** In a terminal (on Windows: right-click a folder -> "Git Bash Here"):
   `git clone https://github.com/rajsek/resumes.git` then `cd resumes`
3. **Build every PDF:** `./build.sh` - all ten PDFs appear in `pdf/`.
4. **Live preview while you edit:** `./build.sh watch 2-page/fullstack`
   then open `pdf/2-page-fullstack.pdf` in a viewer that reloads on change
   (VS Code's PDF tab, Skim on Mac, SumatraPDF on Windows). Every time you save a
   .tex file, the PDF rebuilds itself in a second or two - edit, save, see.
5. Edit facts in `shared/` (one edit updates all ten). Edit `1-page/` or `2-page/`
   only to change what a specific version includes.

Prefer clicking over commands? **VS Code + the LaTeX Workshop extension** also works:
open the repo folder, open any .tex file, and it builds on every save with a live
PDF preview next to your text. (`build.sh` is not needed in that setup; LaTeX
Workshop's own build button produces the same PDFs.)

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
