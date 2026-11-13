// Local resume studio: edit the .tex files, see the PDF rebuild on every save.
// Zero npm dependencies - plain Node + the pdflatex already used by CI.
// Run: npm run dev   then open http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
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
    execFile('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', name + '.tex'],
      { cwd: path.join(ROOT, group), timeout: 60000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
        const log = String(stdout || '');
        const pages = (log.match(/Output written on .*\((\d+) pages?/) || [])[1];
        if (err || !pages) {
          // Show the first real error line to make fixing easy.
          const firstErr = log.split('\n').findIndex(l => l.startsWith('!'));
          const tail = firstErr >= 0 ? log.split('\n').slice(firstErr, firstErr + 12).join('\n') : log.slice(-1500);
          return resolve({ ok: false, log: tail || 'pdflatex failed to run - is TeX installed? (see README)' });
        }
        fs.mkdirSync(path.join(ROOT, 'pdf'), { recursive: true });
        fs.renameSync(path.join(ROOT, group, name + '.pdf'), path.join(ROOT, 'pdf', group + '-' + name + '.pdf'));
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/api/state') {
      const pdfs = {};
      const dir = path.join(ROOT, 'pdf');
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
      const abs = path.join(ROOT, 'pdf', name);
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
