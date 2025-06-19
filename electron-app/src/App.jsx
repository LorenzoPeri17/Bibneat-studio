import { useState, useEffect, useRef } from 'react';
import './App.css';

function highlightNonAscii(text) {
  return text.replace(/([\u0080-\uFFFF])/g, '<span class="non-ascii">$1</span>');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function App() {
  const [bibText, setBibText] = useState('');
  const [entryText, setEntryText] = useState('');
  const [arxivId, setArxivId] = useState('');
  const [doi, setDoi] = useState('');
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef();
  const wasmRef = useRef(null);

  const bibDbRef = useRef(null); // Holds the bibneat database object
  const parserRef = useRef(null); // Holds the Parser object
  const printerRef = useRef(null); // Holds the Printer object
  const apiCallRef = useRef(null); // Holds the ApiCaller object
  const fieldFilterRef = useRef(null); // Holds the FieldFilter  object
  const fieldNormalizerRef = useRef(null); // Holds the FieldNormalizer  object

  // Load WASM on mount
  useEffect(() => {
    loadScript('/wasm/bibneat.js').then(() => {
      if (typeof window.createBibneatModule !== 'function') {
        setMessage('Global createBibneatModule not found!');
        return;
      }
      window.createBibneatModule({ locateFile: () => '/wasm/bibneat.wasm' }).then(instance => {
        wasmRef.current = instance;
        setWasmLoaded(true);
        const db = new wasmRef.current.BibDB();
        bibDbRef.current = db;
        printerRef.current = new wasmRef.current.Printer(db);
        parserRef.current = new wasmRef.current.Parser(db, false);
        apiCallRef.current = new wasmRef.current.ApiCaller(db, 15, 20, false);
        fieldFilterRef.current = new wasmRef.current.FieldFilter(db);
        fieldNormalizerRef.current = new wasmRef.current.FieldNormalizer(db);
        setMessage('Bibneat studio set up and ready to go!');
      }).catch(() => {
        setMessage('Failed to instantiate WASM.');
      });
    }).catch(() => {
      setMessage('Failed to load bibneat.js');
    });
  }, []);

  // Load a .bib file
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    if (wasmRef.current) {
      try {
        parserRef.current.parseString(text);
        setBibText(printerRef.current.toString());
        setMessage('Bibliography loaded!');
      } catch (err) {
        setMessage('Failed to parse .bib file :(');
      }
    } else {
      setBibText(text);
    }
  };

  // Add entry from textarea
  const handleAddEntry = () => {
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    try {
      parserRef.current.parseString(entryText);
      setBibText(printerRef.current.toString());
      setMessage('Entry added!');
    } catch (err) {
      setMessage('Failed to add entry :(');
    }
    setEntryText('');
  };

  // Add entry from arXiv
  const handleAddArxiv = () => {
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    if (!arxivId) return;
    try {
      // const replaceWithDoi = false;
      // apiCallRef.current.getArXivImmediate(arxivId, replaceWithDoi);
      // setBibText(printerRef.current.toString());
      setMessage('Still building! Hold on!');
    } catch (err) {
      setMessage('Failed to add entry from arXiv :(');
    }
    
    setArxivId('');
  };

  // Add entry from DOI
  const handleAddDoi = () => {
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    if (!doi) return;
    try {
      setMessage('Still building! Hold on!');
    } catch (err) {
      setMessage('Failed to add entry from DOI :(');
    }
    setDoi('');
  };

  // Export .bib file
  const handleExport = () => {
    if (!bibDbRef.current) return setMessage('Nothing to export!');
    const bibOut = printerRef.current.toString();
    if (!bibOut) return setMessage('Nothing to export!');
    const blob = new Blob([bibOut], { type: 'text/plain' });
    const exporter = document.createElement('a');
    exporter.href = URL.createObjectURL(blob);
    exporter.download = fileName ? `neat_${fileName}` : 'bibneat.bib';
    exporter.click();
    setMessage('Exported!');
  };

  // Action buttons
  const handleAction = (action) => {
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    if (!bibDbRef.current) return setMessage('Load or create a bibliography first!');
    try {
      switch (action) {
        case 'merge':
          bibDbRef.current.merge();
          setMessage('Merged!');
          break;
        case 'normalize':
          bibDbRef.current.normalizeUnicode();
          setMessage('Unicode normalized!');
          break;
        case 'filter':
          bibDbRef.current.filterFields();
          setMessage('Fields filtered!');
          break;
        case 'check':
          bibDbRef.current.checkEntries();
          setMessage('Checked arXiv/DOI!');
          break;
        case 'preamble':
          fieldNormalizerRef.current.addUTF8Preamble();
          setMessage('Encoding preamble added!');
          break;
        default:
          break;
      }
      setBibText(printerRef.current.toString());
    } catch (err) {
      setMessage('Action failed.');
    }
  };

  return (
    <div className="app-container">
      <aside className="side-panel">
        <h2>Add Entry</h2>
        <textarea
          placeholder="Paste BibTeX entry here"
          value={entryText}
          onChange={e => setEntryText(e.target.value)}
          rows={6}
        />
        <button disabled={!wasmLoaded || !entryText} onClick={handleAddEntry}>Add Entry</button>
        <hr />
        <input
          type="text"
          placeholder="arXiv ID or URL"
          value={arxivId}
          onChange={e => setArxivId(e.target.value)}
        />
        <button disabled={!wasmLoaded || !arxivId} onClick={handleAddArxiv}>Add from arXiv</button>
        <input
          type="text"
          placeholder="DOI or doi.org URL"
          value={doi}
          onChange={e => setDoi(e.target.value)}
        />
        <button disabled={!wasmLoaded || !doi} onClick={handleAddDoi}>Add from DOI</button>
      </aside>
      <main className="main-panel">
        <h2>Bibliography</h2>
        <input
          type="file"
          accept=".bib"
          style={{ marginBottom: 12 }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <div
          className="bib-viewer"
          dangerouslySetInnerHTML={{ __html: highlightNonAscii(bibText) }}
        />
        <button style={{ marginTop: 16 }} onClick={handleExport}>Export .bib</button>
        {message && <div style={{marginTop: 12, color: '#7a7fff'}}>{message}</div>}
      </main>
      <aside className="side-panel actions">
        <h2>Actions</h2>
        <button onClick={() => handleAction('merge')}>Merge Files</button>
        <button onClick={() => handleAction('normalize')}>Clean/Normalize Unicode</button>
        <button onClick={() => handleAction('filter')}>Filter Fields</button>
        <button onClick={() => handleAction('check')}>Check arXiv/DOI</button>
        <button onClick={() => handleAction('preamble')}>Add Encoding Preamble</button>
      </aside>
    </div>
  );
}

export default App;
