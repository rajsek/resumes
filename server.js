// Local resume studio: edit the .tex files, see the PDF rebuild on every save.
// Zero npm dependencies - plain Node + pdflatex (CI) or explicitly selected Tectonic.
// Run: npm run dev   then open http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const COMPILER = process.env.LATEX_COMPILER || 'pdflatex';
const USE_TECTONIC = path.basename(COMPILER) === 'tectonic';
const PDF_DIR = path.resolve(process.env.RESUME_PDF_DIR || path.join(ROOT, 'pdf'));
const GROUPS = ['1-page', '2-page'];

// Only .tex files inside these folders can be read or written through the UI.
function texFile(p) {
  if (!p || p.includes('..')) return null;
  const rel = path.normalize(p).split(path.sep).join('/');
  if (!/^(shared|1-page|2-page)\/[A-Za-z0-9._-]+\.tex$/.test(rel)) return null;
  const abs = path.join(ROOT, rel);
  return abs.startsWith(ROOT) ? { rel, abs } : null;
}

function listFiles() {
  const files = [];
  for (const dir of ['shared', ...GROUPS]) {
    for (const f of fs.readdirSync(path.join(ROOT, dir)).sort()) {
      if (f.endsWith('.tex')) files.push(dir + '/' + f);
    }
  }
  return files;
}

function targets() {
  const out = [];
  for (const g of GROUPS) {
    for (const f of fs.readdirSync(path.join(ROOT, g)).sort()) {
      if (f.endsWith('.tex')) out.push({ target: g + '/' + f.replace(/\.tex$/, ''), pdf: g + '-' + f.replace(/\.tex$/, '') + '.pdf' });
    }
  }
  return out;
}

// One build at a time, in order.
let queue = Promise.resolve();
function build(target) {
  queue = queue.then(() => new Promise((resolve) => {
    const m = /^(1-page|2-page)\/([A-Za-z0-9._-]+)$/.exec(target || '');
    if (!m) return resolve({ ok: false, log: 'unknown resume: ' + target });
    const [, group, name] = m;
    if (!fs.existsSync(path.join(ROOT, group, name + '.tex'))) return resolve({ ok: false, log: 'unknown resume: ' + target });
    fs.mkdirSync(PDF_DIR, { recursive: true });
    const args = USE_TECTONIC
      ? ['-X', 'compile', '--print', '--untrusted', '--outdir', PDF_DIR, name + '.tex']
      : ['-interaction=nonstopmode', '-halt-on-error', '-output-directory=' + PDF_DIR, name + '.tex'];
    execFile(COMPILER, args,
      { cwd: path.join(ROOT, group), timeout: 60000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
        const log = [stdout, stderr].filter(Boolean).join('\n');
        if (err && err.code === 'ENOENT') {
          return resolve({ ok: false, log: COMPILER + ' is not installed or is not on the server PATH. Install TeX or set LATEX_COMPILER to a Tectonic executable before starting the server. See README.' });
        }
        const pages = (log.match(/Output written on .*\((\d+) pages?/) || [])[1];
        if (err || !pages) {
          // Show the first real error line to make fixing easy.
          const firstErr = log.split('\n').findIndex(l => l.startsWith('!'));
          const tail = firstErr >= 0 ? log.split('\n').slice(firstErr, firstErr + 12).join('\n') : log.slice(-1500);
          return resolve({ ok: false, log: tail || String(err && err.message || 'Compiler produced no page count. See README.') });
        }
        fs.renameSync(path.join(PDF_DIR, name + '.pdf'), path.join(PDF_DIR, group + '-' + name + '.pdf'));
        resolve({ ok: true, pdf: group + '-' + name + '.pdf', pages: Number(pages) });
      });
  }));
  return queue;
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '', size = 0;
    req.on('data', c => { size += c.length; if (size > 2e6) { reject(new Error('too large')); req.destroy(); } data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}


// --- duplication / override notes -----------------------------------------
// For every resume: which shared macros it uses (full vs short variants),
// whether it overrides any shared macro, and whether it carries its own
// bullets (duplicated content). Drives the per-file notes in the UI.
function label(macro) {
  let m = macro, variant = '';
  if (m.endsWith('Short')) { variant = 'short'; m = m.slice(0, -5); }
  else if (m.endsWith('Full')) { variant = 'full'; m = m.slice(0, -4); }
  m = m.replace('AwardsAndCerts', 'Awards + Certs');
  const flavors = [['AIFullstack', 'AI fullstack'], ['AIUI', 'AI UI'], ['Fullstack', 'fullstack'], ['UI', 'UI'], ['AI', 'AI']];
  for (const [k, v] of flavors) {
    if (m.startsWith('Summary') || m.startsWith('Skills')) {
      const rest = m.replace(/^(Summary|Skills)/, '');
      if (rest === k) return m.replace(/^(Summary|Skills)/, '$1: ') .replace(k, v) + (variant ? ' (' + variant + ')' : '');
    }
  }
  return m + (variant ? ' (' + variant + ')' : '');
}

function notes() {
  const infra = new Set(['entry', 'entrynodate', 'rsection', 'YOE', 'needspace']);
  const sharedDefs = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'shared')).sort()) {
    if (!f.endsWith('.tex')) continue;
    const src = fs.readFileSync(path.join(ROOT, 'shared', f), 'utf8');
    sharedDefs['shared/' + f] = [...src.matchAll(/\\newcommand\{\\([A-Za-z]+)\}/g)].map(m => m[1]);
  }
  const out = { targets: {}, shared: {} };
  for (const t of targets()) {
    const src = fs.readFileSync(path.join(ROOT, t.target + '.tex'), 'utf8');
    const used = new Set([...src.matchAll(/\\([A-Za-z]+)/g)].map(m => m[1]));
    const tn = {
      overrides: [...src.matchAll(/\\renewcommand\{\\([A-Za-z]+)\}/g)].map(m => m[1]),
      duplicated: /\\item/.test(src),
      short: [],
    };
    const per = {};
    for (const [file, defs] of Object.entries(sharedDefs)) {
      const content = defs.filter(d => !infra.has(d));
      const usedHere = content.filter(d => used.has(d));
      if (file === 'shared/preamble.tex' || file === 'shared/header.tex') {
        per[file] = src.includes(file.replace('shared/', '../shared/')) ? 'used' : 'not used';
      } else if (file === 'shared/experience.tex') {
        const jobs = usedHere.map(d => d.replace('Job', ''));
        per[file] = jobs.length === 4 ? 'all 4 jobs' : (jobs.length ? jobs.join(', ') : 'not used');
      } else {
        per[file] = usedHere.length ? usedHere.map(label).join(', ') : 'not used';
      }
      for (const d of usedHere) {
        if (d.endsWith('Short')) tn.short.push(label(d));
      }
    }
    out.targets[t.target] = tn;
    out.shared[t.target] = per;
  }
  return out;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/api/notes') {
      return send(res, 200, notes());
    }
    if (req.method === 'GET' && url.pathname === '/api/state') {
      const pdfs = {};
      const dir = PDF_DIR;
      if (fs.existsSync(dir)) {
        for (const f of fs.readdirSync(dir)) {
          if (f.endsWith('.pdf')) pdfs[f] = { mtime: fs.statSync(path.join(dir, f)).mtimeMs };
        }
      }
      return send(res, 200, { files: listFiles(), targets: targets(), pdfs });
    }
    if (req.method === 'GET' && url.pathname === '/api/file') {
      const f = texFile(url.searchParams.get('path'));
      if (!f || !fs.existsSync(f.abs)) return send(res, 404, { error: 'not found' });
      return send(res, 200, { path: f.rel, content: fs.readFileSync(f.abs, 'utf8') });
    }
    if (req.method === 'POST' && url.pathname === '/api/file') {
      const body = await readBody(req);
      const f = texFile(body.path);
      if (!f || !fs.existsSync(f.abs)) return send(res, 404, { error: 'not found' });
      fs.writeFileSync(f.abs, body.content, 'utf8');
      return send(res, 200, { saved: f.rel });
    }
    if (req.method === 'POST' && url.pathname === '/api/build') {
      const body = await readBody(req);
      return send(res, 200, await build(body.target));
    }
    if (req.method === 'GET' && url.pathname.startsWith('/pdf/')) {
      const name = path.basename(url.pathname);
      const abs = path.join(PDF_DIR, name);
      if (!fs.existsSync(abs)) return send(res, 404, { error: 'not built yet - pick Build' });
      return send(res, 200, fs.readFileSync(abs), 'application/pdf');
    }
    // Static files from public/
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const abs = path.join(ROOT, 'public', path.normalize(rel));
    if (!abs.startsWith(path.join(ROOT, 'public')) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      return send(res, 404, { error: 'not found' });
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    return send(res, 200, fs.readFileSync(abs), types[path.extname(abs)] || 'application/octet-stream');
  } catch (e) {
    return send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log('Resume studio running:  http://localhost:' + PORT);
  console.log('Pick a resume on the left, edit, save (Ctrl+S) - the PDF rebuilds itself.');
});
