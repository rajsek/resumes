const html = htm.bind(React.createElement);
const { useState, useEffect, useRef, useCallback } = React;

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function App() {
  const [state, setState] = useState(null);       // {files, targets, pdfs}
  const [target, setTarget] = useState('2-page/fullstack');
  const [openFile, setOpenFile] = useState(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);     // {ok, pdf, pages, log, at}
  const [tick, setTick] = useState(0);            // cache-bust for the preview
  const contentRef = useRef(content);
  contentRef.current = content;

  const pdfName = target.replace('/', '-') + '.pdf';
  const pdfInfo = state && state.pdfs[pdfName];   // {mtime, pages?} when built
  const dirty = content !== savedContent;

  useEffect(() => {
    fetch('/api/state').then(r => r.json()).then(s => {
      setState(s);
      open('2-page/fullstack.tex');
    });
  }, []);

  const open = (p) => {
    setOpenFile(null);
    fetch('/api/file?path=' + encodeURIComponent(p)).then(r => r.json()).then(d => {
      setOpenFile(p); setContent(d.content); setSavedContent(d.content);
    });
  };

  const build = useCallback(async (t) => {
    setBusy(true);
    const r = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: t }) }).then(r => r.json());
    setBusy(false);
    setResult({ ...r, at: Date.now() });
    if (r.ok) {
      setTick(Date.now());
      // refresh pdf metadata
      fetch('/api/state').then(x => x.json()).then(setState);
    }
  }, []);

  const save = useCallback(async () => {
    if (!openFile || contentRef.current === savedContent) return;
    await fetch('/api/file', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: openFile, content: contentRef.current }) });
    setSavedContent(contentRef.current);
    build(target); // every save rebuilds the resume being previewed
  }, [openFile, savedContent, target, build]);

  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [save]);

  if (!state) return html`<div id="loading">Setting type...</div>`;

  const shared = state.files.filter(f => f.startsWith('shared/'));
  const group = target.split('/')[0];
  const mine = state.files.filter(f => f.startsWith(group + '/'));

  let status;
  if (busy) status = html`<span class="dot busy"></span> Building ${pdfName}...`;
  else if (result && !result.ok) status = html`<span class="dot"></span> Build failed - the preview keeps the last good PDF`;
  else if (result && result.ok) status = html`<span class="dot"></span> Built ${result.pages} ${result.pages === 1 ? 'page' : 'pages'} at ${fmtTime(result.at)}`;
  else if (pdfInfo) status = html`Last built ${fmtTime(pdfInfo.mtime)}`;
  else status = html`Not built yet`;

  const statusKind = busy ? '' : (result ? (result.ok ? 'ok' : 'err') : '');

  return html`
    <header>
      <span class="wordmark">Resume <em>Studio</em></span>
      <select value=${target} aria-label="Resume to preview"
        onChange=${e => { setTarget(e.target.value); setResult(null); }}>
        ${state.targets.map(t => html`<option value=${t.target}>${t.target}</option>`)}
      </select>
      <button class="btn primary" disabled=${busy} onClick=${() => build(target)}>Build</button>
      <button class="btn" disabled=${busy || !dirty} onClick=${save}>${dirty ? 'Save and build' : 'Saved'}</button>
      <a href=${'/pdf/' + pdfName} download=${pdfName}><button class="btn" disabled=${!pdfInfo && !(result && result.ok)}>Download ${pdfName}</button></a>
      <span class="spacer"></span>
      <span id="status" class=${statusKind}>${status}</span>
    </header>
    <main>
      <div id="files">
        <h2>Shared facts</h2>
        <p class="hint">The real content. One edit here updates every resume.</p>
        ${shared.map(f => html`<button key=${f} class=${'f' + (f === openFile ? ' active' : '')} onClick=${() => open(f)}>${f.replace('shared/', '')}<span class="feeds">all 10</span></button>`)}
        <h2>${group} resumes</h2>
        <p class="hint">Each picks and orders shared blocks. One file, one PDF.</p>
        ${mine.map(f => html`<button key=${f} class=${'f' + (f === openFile ? ' active' : '')} onClick=${() => open(f)}>${f.replace(group + '/', '')}<span class="feeds">${f.replace('.tex', '').replace('/', '-')}.pdf</span></button>`)}
      </div>
      <div id="editor">
        ${openFile === null
          ? html`<div id="empty"><span class="big">Opening...</span></div>`
          : html`<textarea value=${content} spellcheck="false" aria-label="LaTeX source editor"
              onChange=${e => setContent(e.target.value)}></textarea>`}
        <div id="editorBar">
          ${dirty && html`<span class="dirty-dot" title="Unsaved changes"></span>`}
          <span class="path">${openFile || ''}</span>
          <span class="right">Ctrl+S saves and rebuilds</span>
        </div>
      </div>
      <div id="desk">
        ${result && !result.ok && html`
          <div id="errHead">LaTeX could not build this - the first error:</div>
          <pre id="errlog">${result.log}</pre>`}
        ${(!pdfInfo && !(result && result.ok))
          ? html`<div id="empty">
              <span class="big">${pdfName}</span>
              <span>This resume has not been built on this machine yet.</span>
              <button class="btn primary" disabled=${busy} onClick=${() => build(target)}>Build it</button>
            </div>`
          : html`<iframe id="preview" title="PDF preview" src=${'/pdf/' + pdfName + '?t=' + tick}></iframe>`}
        <div id="deskBar">
          <span class="path">${pdfName}</span>
          ${result && result.ok && html`<span class="pill">${result.pages} ${result.pages === 1 ? 'page' : 'pages'}</span>`}
        </div>
      </div>
    </main>
  `;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
