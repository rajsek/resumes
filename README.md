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

## Editing and versions

Edit right here on GitHub (works on a phone too): open a file, pencil icon, save.
Every save is a commit, so the full history of every file is under the
**History** button - that is the "see previous versions" view, with line-by-line diffs.

After each save, a GitHub Action rebuilds all ten PDFs into `pdf/` (takes a few minutes).
The build fails loudly if a 1-page resume spills past one page or a 2-page one past two.

## Standing rules

- No phone number anywhere. Contact is email only: raji.sekard@gmail.com.
- Facts only from confirmed data: 14+ years (Sep 2012 start), Technical Lead, Bengaluru,
  PSM I (Feb 2024) + OCI Foundations Associate, 2026 AI work (LangChain triage agent,
  AI advocacy, Codex skill), BNY Mellon Cyber Steward (2021), Meta HoF 2015 + 2022
  ($25k, IDOR + reverse engineering - never "RCE").
- Human wording: "Led", not "Spearheaded".
- Compile check locally before pushing big changes:
  `cd 2-page && pdflatex fullstack.tex` (any LaTeX install works; Overleaf too).
