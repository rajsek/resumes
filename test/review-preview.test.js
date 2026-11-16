const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { reviewPreview, tokens, addedWords } = require('../review-preview');
const word = (text, x, y) => ({ text, rects: [{ page: 0, x, y, width: 20, height: 10 }] });

test('marks inserted and replaced words, not retained wording', () => {
  const before = tokens([{ words: [word('Built', 1, 1), word('React', 25, 1), word('apps', 50, 1)] }]);
  const after = tokens([{ words: [word('Built', 1, 1), word('TypeScript', 25, 1), word('tools', 50, 1)] }]);
  const diff = addedWords(before, after);
  assert.deepEqual(diff.added.map(w => w.text), ['TypeScript', 'tools']);
  assert.equal(diff.removed, 2);
});

test('normalizes line-wrap hyphenation while retaining highlight rectangles', () => {
  const wrapped = tokens([{ words: [word('Type-', 50, 10), word('Script', 1, 22)] }]);
  const unwrapped = tokens([{ words: [word('TypeScript', 1, 10)] }]);
  assert.equal(wrapped[0].rects.length, 2);
  assert.equal(addedWords(wrapped, unwrapped).added.length, 0);
  assert.equal(addedWords([], wrapped).added[0].rects.length, 2);
});

test('identical committed PDF yields no marks and PDF bytes remain untouched', async () => {
  const root = path.resolve(__dirname, '..');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-review-test-'));
  try {
    const baseline = execFileSync('git', ['show', 'HEAD:pdf/1-page-fullstack.pdf'], { cwd: root });
    const pdf = path.join(temp, '1-page-fullstack.pdf');
    await fs.writeFile(pdf, baseline);
    const review = await reviewPreview(root, temp, '1-page/fullstack');
    assert.equal(review.added, 0);
    assert.equal(review.removed, 0);
    assert.equal(review.pages.length, 1);
    assert.equal(review.pages[0].highlights.length, 0);
    assert.match(review.pages[0].image, /^data:image\/png;base64,/);
    assert.deepEqual(await fs.readFile(pdf), baseline);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});

test('new resume without committed PDF is fully highlighted', async () => {
  const root = path.resolve(__dirname, '..');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-review-test-'));
  try {
    await fs.copyFile(path.join(root, 'pdf/1-page-fullstack.pdf'), path.join(temp, '1-page-new-review-test.pdf'));
    const review = await reviewPreview(root, temp, '1-page/new-review-test');
    assert.equal(review.baseline, null);
    assert(review.added > 0);
    assert.equal(review.removed, 0);
    assert(review.pages[0].highlights.length >= review.added);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});

test('numeric signs and decimal changes are significant', () => {
  const before = tokens([{ words: [word('25,000', 1, 1), word('1.5x', 25, 1)] }]);
  const after = tokens([{ words: [word('25,000+', 1, 1), word('15x', 25, 1)] }]);
  assert.equal(addedWords(before, after).added.length, 2);
});
