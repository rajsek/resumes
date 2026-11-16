// Local review images and word highlights. Never edits a resume PDF.
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);
const run = (cmd, args, cwd) => execFile(cmd, args, { cwd, timeout: 60000, maxBuffer: 24 * 1024 * 1024 });

function pagesFromXml(xml) {
  const decode = s => s.replace(/&(amp|lt|gt|quot|apos);/g, (_, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[k]);
  return [...xml.matchAll(/<page\s+width="([\d.]+)"\s+height="([\d.]+)"[^>]*>([\s\S]*?)<\/page>/g)].map((m, page) => ({
    width: Number(m[1]), height: Number(m[2]),
    words: [...m[3].matchAll(/<word\s+xMin="([\d.]+)"\s+yMin="([\d.]+)"\s+xMax="([\d.]+)"\s+yMax="([\d.]+)"[^>]*>([\s\S]*?)<\/word>/g)].map(w => ({
      text: decode(w[5]), rects: [{ page, x: +w[1], y: +w[2], width: w[3] - w[1], height: w[4] - w[2] }]
    }))
  }));
}

function tokens(pages) {
  const words = pages.flatMap(p => p.words);
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const word = { text: words[i].text, rects: [...words[i].rects] };
    // Join typesetter hyphenation so a new line wrap is not reported as an edit.
    while (word.text.endsWith('-') && words[i + 1] &&
      (words[i + 1].rects[0].page !== words[i].rects[0].page || words[i + 1].rects[0].y > words[i].rects[0].y + 3)) {
      word.text = word.text.slice(0, -1) + words[++i].text;
      word.rects.push(...words[i].rects);
    }
    word.key = word.text.normalize('NFKC').replace(/^[.,;:!?()[\]{}"“”‘’]+|[.,;:!?()[\]{}"“”‘’]+$/g, '').toLowerCase();
    if (word.key) out.push(word);
  }
  return out;
}

function addedWords(before, after) {
  // Longest common subsequence: unchanged words stay unmarked, including reflow.
  const cols = after.length + 1;
  const table = new Uint16Array((before.length + 1) * cols);
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      table[i * cols + j] = before[i].key === after[j].key
        ? 1 + table[(i + 1) * cols + j + 1]
        : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }
  const added = []; let removed = 0, i = 0, j = 0;
  while (i < before.length && j < after.length) {
    if (before[i].key === after[j].key) { i++; j++; }
    else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) { removed++; i++; }
    else added.push(after[j++]);
  }
  return { added: added.concat(after.slice(j)), removed: removed + before.length - i };
}

async function reviewPreview(root, pdfDir, target) {
  const name = target.replace('/', '-') + '.pdf';
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-review-'));
  try {
    const revision = (await run('git', ['rev-parse', 'HEAD'], root)).stdout.trim();
    const current = path.join(temp, 'current.pdf');
    await fs.copyFile(path.join(pdfDir, name), current);
    const committedPath = 'pdf/' + name;
    const tracked = (await run('git', ['ls-tree', '--name-only', revision, '--', committedPath], root)).stdout.trim();
    let before = [];
    if (tracked) {
      const baseline = path.join(temp, 'baseline.pdf');
      const result = await execFile('git', ['show', revision + ':' + committedPath], { cwd: root, encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 });
      await fs.writeFile(baseline, result.stdout);
      before = tokens(pagesFromXml((await run('pdftotext', ['-bbox', baseline, '-'], root)).stdout));
    }
    const pages = pagesFromXml((await run('pdftotext', ['-bbox', current, '-'], root)).stdout);
    if (!pages.length) throw new Error('No readable pages in the built PDF.');
    const changes = addedWords(before, tokens(pages));
    await run('pdftoppm', ['-scale-to', '1400', '-png', current, path.join(temp, 'page')], root);
    const images = (await fs.readdir(temp)).filter(f => /^page-\d+\.png$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    return {
      target, baseline: tracked ? revision.slice(0, 8) : null,
      added: changes.added.length, removed: changes.removed,
      pages: await Promise.all(pages.map(async (p, i) => ({
        width: p.width, height: p.height,
        image: 'data:image/png;base64,' + (await fs.readFile(path.join(temp, images[i]))).toString('base64'),
        highlights: changes.added.flatMap(w => w.rects).filter(r => r.page === i)
      })))
    };
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}
module.exports = { reviewPreview, pagesFromXml, tokens, addedWords };
