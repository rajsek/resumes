const html = htm.bind(React.createElement);
const { useState, useEffect, useRef, useCallback } = React;

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function App() {
  const [state, setState] = useState(null);       // {files, targets, pdfs}
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState(null);
  const [notes, setNotes] = useState(null);       // duplication/override notes
  const [target, setTarget] = useState('2-page/fullstack');
  const [openFile, setOpenFile] = useState(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);     // {ok, pdf, pages, log, at}
  const [tick, setTick] = useState(0);            // cache-bust for the preview
  const contentRef = useRef(content);
  const openRequestRef = useRef(0);
  contentRef.current = content;

  const pdfName = target.replace('/', '-') + '.pdf';
  const pdfInfo = state && state.pdfs[pdfName];   // {mtime, pages?} when built
  const dirty = content !== savedContent;

  useEffect(() => {
    fetch('/api/state').then(r => r.json()).then(s => {
      setState(s);
      open('2-page/fullstack.tex');
    });
    fetch('/api/notes').then(r => r.json()).then(setNotes);
  }, []);

  const open = (p) => {
    if (openFile && contentRef.current !== savedContent &&
        !window.confirm('Discard unsaved changes and open another file?')) return;
    const request = ++openRequestRef.current;
    if (/^(1-page|2-page)\//.test(p)) {
      setTarget(p.replace(/\.tex$/, ''));
      setResult(null);
      setTick(Date.now());
    }
    setOpenFile(null);
    fetch('/api/file?path=' + encodeURIComponent(p)).then(r => r.json()).then(d => {
      if (request !== openRequestRef.current) return;
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

  useEffect(() => {
    if (!showReview) return;
    let active = true;
    setReview(null);
    fetch('/api/review?target=' + encodeURIComponent(target))
      .then(r => r.json()).then(data => { if (active) setReview({ ...data, target }); })
      .catch(() => { if (active) setReview({ target, error: 'Review preview could not load. Try again.' }); });
    return () => { active = false; };
  }, [showReview, target, tick]);

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
        onChange=${e => open(e.target.value + '.tex')}>
        ${state.targets.map(t => html`<option value=${t.target}>${t.target}</option>`)}
      </select>
      <button class="btn primary" disabled=${busy} onClick=${() => build(target)}>Build</button>
      <button class="btn" disabled=${busy || !dirty} onClick=${save}>${dirty ? 'Save and build' : 'Saved'}</button>
      <a href=${'/pdf/' + pdfName} download=${pdfName}><button class="btn" disabled=${!pdfInfo && !(result && result.ok)}>Download ${pdfName}</button></a>
      <button class="btn" aria-pressed=${showReview} onClick=${() => setShowReview(!showReview)}>${showReview ? 'Hide changes' : 'Highlight changes'}</button>
      <span class="spacer"></span>
      <span id="status" class=${statusKind}>${status}</span>
    </header>
    <main>
      <div id="files">
        <h2>Shared facts</h2>
        <p class="hint">One copy, shared by all resumes - nothing is duplicated. The tag shows what the selected resume takes from each file.</p>
        ${shared.map(f => {
          const use = notes && notes.shared[target] && notes.shared[target][f];
          const unused = use === 'not used';
          return html`<button key=${f} class=${'f' + (f === openFile ? ' active' : '')} onClick=${() => open(f)}>${f.replace('shared/', '')}<span class=${'feeds' + (unused ? ' unused' : ' used')}>${use || '...'}</span></button>`;
        })}
        <h2>${group} resumes</h2>
        <p class="hint">Each picks and orders shared blocks. One file, one PDF.</p>
        ${notes && notes.targets[target] && html`<p class="note">
          ${notes.targets[target].overrides.length
            ? html`<span class="warn">Overrides: ${notes.targets[target].overrides.join(', ')}. </span>`
            : 'Overrides nothing. '}
          ${notes.targets[target].duplicated
            ? html`<span class="warn">Has its own bullets - duplicated content. </span>`
            : 'Duplicates nothing. '}
          ${notes.targets[target].short.length
            ? 'Short blocks: ' + notes.targets[target].short.join(', ') + '.'
            : 'Full-length blocks throughout.'}
        </p>`}
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
          : showReview ? html`<div id="reviewPreview" aria-label="Local changes review">
              <p class="review-legend">Yellow: added or changed words. Downloads stay clean.<br />
                ${!review || review.target !== target ? 'Preparing review...' : review.error ? review.error :
                  (review.baseline ? 'Compared with committed PDF ' + review.baseline + '. ' : 'New resume: no committed PDF. ') +
                  review.added + ' added/changed words; ' + review.removed + ' removed words (not drawn).'}
                <br />Built PDF only; save and build to include edits.</p>
              ${review && review.target === target && !review.error && review.pages.map((p, i) => html`
                <div class="review-page" key=${i}>
                  <img src=${p.image} alt=${'Review of ' + pdfName + ', page ' + (i + 1)} />
                  ${p.highlights.map((h, n) => html`<span key=${n} class="review-mark" style=${{
                    left: (100 * h.x / p.width) + '%', top: (100 * h.y / p.height) + '%',
                    width: (100 * h.width / p.width) + '%', height: (100 * h.height / p.height) + '%'
                  }}></span>`)}
                </div>`)}
            </div>` : html`<iframe id="preview" title="PDF preview" src=${'/pdf/' + pdfName + '?t=' + tick}></iframe>`}
        <div id="deskBar">
          <span class="path">${pdfName}</span>
          ${result && result.ok && html`<span class="pill">${result.pages} ${result.pages === 1 ? 'page' : 'pages'}</span>`}
        </div>
      </div>
    </main>
  `;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
