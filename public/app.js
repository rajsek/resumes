const html = htm.bind(React.createElement);
const { useState, useEffect, useRef, useCallback } = React;

function App() {
  const [state, setState] = useState(null);
  const [target, setTarget] = useState('2-page/fullstack');
  const [openFile, setOpenFile] = useState(null);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState({ kind: '', text: '' });
  const [errlog, setErrlog] = useState('');
  const [previewTick, setPreviewTick] = useState(0);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    fetch('/api/state').then(r => r.json()).then(s => {
      setState(s);
      open('2-page/fullstack.tex');
    });
  }, []);

  const open = (p) => {
    fetch('/api/file?path=' + encodeURIComponent(p)).then(r => r.json()).then(d => {
      setOpenFile(p); setContent(d.content); setDirty(false);
    });
  };

  const build = useCallback(async (t) => {
    setStatus({ kind: '', text: 'Building ' + t + ' ...' });
    setErrlog('');
    const r = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: t }) }).then(r => r.json());
    if (r.ok) {
      setStatus({ kind: 'ok', text: r.pdf + ' - ' + r.pages + (r.pages === 1 ? ' page' : ' pages') });
      setPreviewTick(Date.now());
    } else {
      setStatus({ kind: 'err', text: 'Build failed - see the error below' });
      setErrlog(r.log || 'unknown error');
    }
  }, []);

  const save = useCallback(async () => {
    if (!openFile) return;
    await fetch('/api/file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: openFile, content: contentRef.current }) });
    setDirty(false);
    build(target); // every save rebuilds the resume you are previewing
  }, [openFile, target, build]);

  // Ctrl+S / Cmd+S saves
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [save]);

  if (!state) return 'Loading...';
  const pdfName = target.replace('/', '-') + '.pdf';
  const shared = state.files.filter(f => f.startsWith('shared/'));
  const mine = state.files.filter(f => f.startsWith(target.split('/')[0] + '/'));

  return html`
    <header>
      <h1>Resume Studio</h1>
      <select value=${target} onChange=${e => { setTarget(e.target.value); setPreviewTick(0); setErrlog(''); setStatus({kind:'',text:''}); }}>
        ${state.targets.map(t => html`<option value=${t.target}>${t.target}</option>`)}
      </select>
      <button onClick=${() => build(target)}>Build</button>
      <button onClick=${save}>Save${dirty ? ' *' : ''}</button>
      <a href=${'/pdf/' + pdfName} download=${pdfName} style=${{marginLeft:'4px'}}><button>Download PDF</button></a>
      <span id="status" class=${status.kind}>${status.text}</span>
    </header>
    <main>
      <div id="files">
        <h2>Shared facts</h2>
        ${shared.map(f => html`<button key=${f} class=${'f' + (f === openFile ? ' active' : '')} onClick=${() => open(f)}>${f.replace('shared/', '')}</button>`)}
        <h2>This resume</h2>
        ${mine.map(f => html`<button key=${f} class=${'f' + (f === openFile ? ' active' : '')} onClick=${() => open(f)}>${f}</button>`)}
      </div>
      <div id="editor">
        <textarea value=${content}
          onChange=${e => { setContent(e.target.value); setDirty(true); }}
          spellcheck="false"></textarea>
      </div>
      <div id="previewWrap">
        <pre id="errlog" style=${{display: errlog ? 'block' : 'none'}}>${errlog}</pre>
        <iframe id="preview" src=${'/pdf/' + pdfName + '?t=' + previewTick}></iframe>
      </div>
    </main>
  `;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
