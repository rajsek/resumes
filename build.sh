#!/usr/bin/env bash
# Build resume PDFs on your own computer.
#
#   ./build.sh                        build all 12 resumes into pdf/
#   ./build.sh 2-page/fullstack       build just one (folder/name, .tex optional)
#   ./build.sh watch 2-page/fullstack live preview: rebuilds it every time you save
#                                     any .tex file, so the PDF refreshes as you edit
#
# Needs pdflatex (any TeX Live / MacTeX / MiKTeX install). On Windows, run this
# in the "Git Bash" window that comes with Git for Windows.
set -uo pipefail
cd "$(dirname "$0")"

build_one() {
  local target="${1%.tex}"
  local group="${target%%/*}" name="${target##*/}"
  if [ ! -f "$group/$name.tex" ]; then
    echo "No such resume: $group/$name.tex" >&2
    echo "Choices: 1-page or 2-page, then fullstack, ui-heavy, ai-fullstack, ai-ui-heavy, ai or ai-security" >&2
    return 1
  fi
  mkdir -p pdf
  (cd "$group" && pdflatex -interaction=nonstopmode -halt-on-error "$name.tex" > /dev/null)
  mv "$group/$name.pdf" "pdf/$group-$name.pdf"
  echo "built pdf/$group-$name.pdf"
}

build_all() {
  for group in 1-page 2-page; do
    for f in "$group"/*.tex; do
      build_one "${f%.tex}" || return 1
    done
  done
}

watch() {
  local target="${1%.tex}"
  local out="pdf/${target/\//-}.pdf"
  build_one "$target" || exit 1
  echo ""
  echo "Watching. Open $out in a PDF viewer that reloads on change"
  echo "(VS Code's PDF tab, Skim on Mac, SumatraPDF on Windows)."
  echo "Every save of a .tex file rebuilds it. Ctrl+C to stop."
  while true; do
    sleep 2
    if find shared "${target%/*}" -name '*.tex' -newer "$out" 2>/dev/null | grep -q .; then
      echo "change detected, rebuilding..."
      build_one "$target" || echo "build failed - fix the error above and save again"
    fi
  done
}

case "${1:-all}" in
  all)    build_all ;;
  watch)  [ -n "${2:-}" ] || { echo "Say which resume to watch, e.g.: ./build.sh watch 2-page/fullstack" >&2; exit 1; }
          watch "$2" ;;
  *)      build_one "$1" ;;
esac
