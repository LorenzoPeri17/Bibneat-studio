import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './App.css';

import {ApiHelper, RequestCode} from './utils/apiHelper';

// LogMessage component with popup functionality
const LogMessage = ({ message, type }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const logRef = useRef(null);
  const popupRef = useRef(null);
  const timerRef = useRef(null);

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = Math.max(300, rect.width * 1.5);
    
    // Calculate initial position
    let top = rect.top;
    let left = rect.left;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a delay of 500ms (half a second) before showing the popup
    timerRef.current = setTimeout(() => {
      // Update position right before showing to ensure it's current
      // This ensures we have the most accurate viewport size
      const viewportHeight = window.innerHeight;
      const estimatedPopupHeight = Math.min(300, message.length / 2); // Rough estimate
      
      // If popup would go below viewport, position it above the log message
      if (top + estimatedPopupHeight > viewportHeight - 20) {
        top = Math.max(10, top - estimatedPopupHeight - 10);
      }
      
      // Make sure left position doesn't push it off-screen
      if (left + width > window.innerWidth - 20) {
        left = window.innerWidth - width - 20;
      }
      
      setPopupPosition({
        top,
        left,
        width,
      });
      
      setShowPopup(true);
    }, 750);
  };

  const handleMouseLeave = () => {
    // Clear the timer if mouse leaves before popup is shown
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShowPopup(false);
  };
  
  // Clean up the timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Effect to adjust popup position after it's rendered
  useEffect(() => {
    if (showPopup && popupRef.current) {
      const popup = popupRef.current;
      const popupRect = popup.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Check if popup extends below viewport and adjust if needed
      if (popupRect.bottom > viewportHeight - 10) {
        const newTop = Math.max(10, viewportHeight - popupRect.height - 10);
        popup.style.top = `${newTop}px`;
      }
      
      // Check if popup extends past right edge
      if (popupRect.right > viewportWidth - 10) {
        const newLeft = Math.max(10, viewportWidth - popupRect.width - 10);
        popup.style.left = `${newLeft}px`;
      }
    }
  }, [showPopup]);

  return (
    <>
      <div
        ref={logRef}
        className={`log-message log-${type}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {message}
      </div>
      {showPopup && createPortal(
        <div 
          ref={popupRef}
          className={`log-popup log-${type}`}
          style={{
            top: `${popupPosition.top - 5}px`,
            left: `${popupPosition.left - 5}px`,
            width: `${popupPosition.width}px`
          }}
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
        >
          {message}
        </div>,
        document.body
      )}
    </>
  );
};

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
  const [normMode, setNormMode] = useState('canonical'); // 'canonical', 'compat', 'unicode2latex'
  
  const [arxivReplace, setArxivReplace] = useState(false);
  const [arxivFollow, setArxivFollow] = useState(false);
  const [doiReplace, setDoiReplace] = useState(false);
  const [immediateArxivFollow, setImmediateArxivFollow] = useState(true);

  const fileInputRef = useRef();
  const wasmRef = useRef(null);

  const bibDbRef = useRef(null); // Holds the bibneat database object
  const parserRef = useRef(null); // Holds the Parser object
  const printerRef = useRef(null); // Holds the Printer object
  const apiCallRef = useRef(null); // Holds the ApiCaller object
  const apiHelperRef = useRef(null); // Holds the ApiCaller object
  const fieldFilterRef = useRef(null); // Holds the FieldFilter  object
  const fieldNormalizerRef = useRef(null); // Holds the FieldNormalizer  object

  apiHelperRef.current = new ApiHelper();

  const [preambleAdded, setPreambleAdded] = useState(false);
  const [logs, setLogs] = useState([]); // {type: 'info'|'warn'|'error', msg: string}

  // Load WASM on mount
  useEffect(() => {
    loadScript('/wasm/bibneat.js').then(() => {
      if (typeof window.createBibneatModule !== 'function') {
        setMessage('Malformed bibneat module :(');
        return;
      }
      window.createBibneatModule({ locateFile: () => '/wasm/bibneat.wasm' }).then(instance => {
        wasmRef.current = instance;
        setWasmLoaded(true);
        resetDB();
        setMessage('Bibneat studio set up and ready to go!');
      }).catch(() => {
        setMessage('Failed to instantiate bibneat WASM :(');
      });
    }).catch(() => {
      setMessage('Failed to load bibneat :(');
    });
  }, []);

  const resetDB = () =>{
    const db = new wasmRef.current.BibDB();
    bibDbRef.current = db;
    printerRef.current = new wasmRef.current.Printer(db);
    parserRef.current = new wasmRef.current.Parser(db, false);
    apiCallRef.current = new wasmRef.current.JsApiHandler(db);
    fieldFilterRef.current = new wasmRef.current.FieldFilter(db);
    fieldNormalizerRef.current = new wasmRef.current.FieldNormalizer(db);
  };

  const refresh = () =>{
    setBibText(printerRef.current.toString());
  };

  const handleResetDB = () => {
    bibDbRef.current.delete();
    resetDB();
    clearLogs();
    setBibText("");
    setMessage('Good as new!');
  }

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
        addLog('Loaded file ' + file.name, 'info');
      } catch (err) {
        setMessage('Failed to parse .bib file :(');
        addLog('Failed to parse ' + file.name, 'error');
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
      addLog('Added entry!', 'info');
    } catch (err) {
      setMessage('Failed to add entry :(');
      addLog('Failed to add entry', 'error');
    }
    setEntryText('');
  };

  const handleImmediateFollow = async (maybeDOI) =>{
    if ( maybeDOI.keys().size() == 0) {return;}
    const index = maybeDOI.keys().get(0);
    const doi = maybeDOI.get(index);
    try{
      const prepDOI = apiCallRef.current.getPrepDOI(doi);
      const response = await apiHelperRef.current.fetchDOI(prepDOI);
      if (response.code !== RequestCode.FOUND) { return;}
      apiCallRef.current.setUnkeepFromIndex(index);
      apiCallRef.current.addFromDOIResponse(response.data);
      refresh();
    } catch (err) {
    }
  }

  // Add entry from arXiv
  const handleAddArxiv = async () => {
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    if (!arxivId) return;
    try {
      const prepId = apiCallRef.current.getPrepArXiv(arxivId);
      const response = await apiHelperRef.current.fetchArXiv(prepId);
      if (response.code !== RequestCode.FOUND) {
        setMessage('Could not found the arXiv entry you are looking for :(');
        addLog('Could not find arXiv entry: ' + arxivId, 'error');
        setArxivId('');
        return; 
      }
      const maybeDOI = apiCallRef.current.addFromArXivResponseAndGetDoi(response.data);
      if((maybeDOI.keys().size() > 0)){
        if((immediateArxivFollow)){
          await handleImmediateFollow(maybeDOI);
        addLog('ArXiv entry ' + arxivId + ' replaced with published version', 'info');
        } else{
          const index =  maybeDOI.keys().get(0);
          const doi = maybeDOI.get(index);
          const key = apiCallRef.current.getBibKeysFromIndex(index);
          addLog('Entry ' + key + ' has been published with DOI:\n'+doi+'\nPlease consider replacing with published version.', 'warn');
        }
      } else{
        addLog('Added arXiv entry: ' + arxivId, 'info');
      }
      maybeDOI.delete();
      setMessage('ArXiv entry added!');
      refresh();
    } catch (err) {
      setMessage('Failed to add entry from arXiv :(');
      addLog('Failed to add arXiv entry: ' + arxivId, 'error');
    }
    setArxivId('');
  };

  // Add entry from DOI
  const handleAddDoi = async () => {
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    if (!doi) return;
    try {
      const prepDOI = apiCallRef.current.getPrepDOI(doi);
      const response = await apiHelperRef.current.fetchDOI(prepDOI);
      if (response.code !== RequestCode.FOUND) {
          setMessage('Could not found the entry you are looking for :(');
          addLog('Could not find DOI entry: ' + doi, 'error');
          setDoi('');
          return; 
      }
      apiCallRef.current.addFromDOIResponse(response.data);
      setMessage('Entry added!');
      addLog('Added DOI entry: ' + doi, 'info');
    } catch (err) {
      setMessage('Failed to add entry from DOI :(');
      addLog('Failed to add DOI entry: ' + doi, 'error');
    }
    refresh();
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
    addLog('Exported bibliography', 'info');
  };

  const handleArxivFollow = async (maybeMapIndexDoi) => {
    const indexKeys = maybeMapIndexDoi.keys();
    const numEntries = indexKeys.size();
    var promises = [];
    for(var idx = 0; idx<numEntries; idx++){
      const index = indexKeys.get(idx);
      const doi = maybeMapIndexDoi.get(index);
      promises.push(apiHelperRef.current.fetchDOI(doi));
    }
    await Promise.all(promises).then((responses) => {
      const vecIdx = new wasmRef.current.Uint64Vector();
      const vecTex = new wasmRef.current.StringVector();
      for(var idx = 0; idx<numEntries; idx++){
        const response = responses.at(idx);
        const index = indexKeys.get(idx);
        const key = apiCallRef.current.getBibKeysFromIndex(index);
        if(response.code === RequestCode.FOUND){
          if(arxivReplace){
            vecIdx.push_back(index);
            vecTex.push_back(response.data);
            addLog('Entry ' + key + ' replaced with published version', 'info');
          } else {
            const doi = maybeMapIndexDoi.get(index);
            addLog('Entry ' + key + ' has been published with DOI:\n'+doi+'\nPlease consider replacing with published version.', 'warn');
          }
        }
      }
      if(arxivReplace) {
        apiCallRef.current.updateDOIFromResponse(vecIdx, vecTex);
      }
    });
  }

  const handleArxivCheck = async () => {
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    const mapIndexArxiv = apiCallRef.current.getArXivIds();
    const indexKeys = mapIndexArxiv.keys();
    const numEntries = indexKeys.size();
    var promises = [];
    for(var idx = 0; idx<numEntries; idx++){
      const index = indexKeys.get(idx);
      const arxivId = mapIndexArxiv.get(index);
      promises.push(apiHelperRef.current.fetchArXiv(arxivId));
    }
    await Promise.all(promises).then(async (responses) => {
      const vecIdx = new wasmRef.current.Uint64Vector();
      const vecTex = new wasmRef.current.StringVector();
      for(var idx = 0; idx<numEntries; idx++){
        const response = responses.at(idx);
        const index = indexKeys.get(idx);
        if(response.code === RequestCode.FOUND){
          vecIdx.push_back(index);
          vecTex.push_back(response.data);
        } else {
          const key = apiCallRef.current.getBibKeysFromIndex(index);
          addLog('Entry ' + key + ' not found on arxiv.org', 'error');
        }
      }
      const mapIndexDoi = apiCallRef.current.updateArXivFromResponseAndGetDOIs(vecIdx, vecTex, arxivReplace);
      if (arxivFollow){
        await handleArxivFollow(mapIndexDoi);
      }
    });
    setMessage('arxiv.org says hi :)');
    refresh();
  }

  const handleDOICheck = async () =>{
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    const mapIndexDoi = apiCallRef.current.getDOIs();
    const indexKeys = mapIndexDoi.keys();
    const numEntries = indexKeys.size();
    var promises = [];
    for(var idx = 0; idx<numEntries; idx++){
      const index = indexKeys.get(idx);
      const doi = mapIndexDoi.get(index);
      promises.push(apiHelperRef.current.fetchDOI(doi));
    }
    await Promise.all(promises).then((responses) => {
      const vecIdx = new wasmRef.current.Uint64Vector();
      const vecTex = new wasmRef.current.StringVector();
      for(var idx = 0; idx<numEntries; idx++){
        const response = responses.at(idx);
        const index = indexKeys.get(idx);
        if(response.code === RequestCode.FOUND){
          vecIdx.push_back(index);
          vecTex.push_back(response.data);
        } else {
          const key = apiCallRef.current.getBibKeysFromIndex(index);
          addLog('Entry ' + key + ' not found on doi.org', 'error');
        }
      }
      if(doiReplace){
        apiCallRef.current.updateDOIFromResponse(vecIdx, vecTex)
      }
    });
    setMessage('doi.org says hi :)');
    refresh();
  }

  // Action buttons
  const handleAction = (action) => {
    if (!wasmRef.current) return setMessage('WASM not loaded!');
    if (!bibDbRef.current) return setMessage('Load or create a bibliography first!');
    try {
      switch (action) {
        case 'normalize':
          if (normMode === 'canonical') {
            setMessage('Working on it!');
            fieldNormalizerRef.current.NFCNormalize();
            setMessage('Canonical normalization applied!');
            addLog('Canonical normalization applied!', 'info');
          } else if (normMode === 'compat') {
            setMessage('Working on it!');
            fieldNormalizerRef.current.NFKCNormalize();
            setMessage('Compatibility normalization applied!');
            addLog('Compatibility normalization applied!', 'info');
          } else if (normMode === 'unicode2latex') {
            setMessage('Working on it!');
            fieldNormalizerRef.current.uni2latex();
            setMessage('Unicode to LaTeX conversion applied!');
            addLog('Unicode to LaTeX conversion applied!', 'info');
          }
          setBibText(printerRef.current.toString());
          break;
        case 'filter':
          fieldFilterRef.current.keepBibTex();
          setBibText(printerRef.current.toString());
          setMessage('Non-BibTeX fields gone!');
          addLog('Non-BibTeX fields gone!', 'info');
          break;
        case 'preamble':
          fieldNormalizerRef.current.addUTF8Preamble();
          setPreambleAdded(true);
          setMessage('Encoding preamble added!');
          addLog('Encoding preamble added!', 'info');
          break;
        default:
          break;
      }
      setBibText(printerRef.current.toString());
    } catch (err) {
      setMessage('Action failed.');
      addLog('Action failed.', 'error');
    }
  };

  // Helper to add a log
  const addLog = (msg, type = 'info') => {
    setLogs(logs => [...logs.slice(-199), { msg, type }]); // keep last 200
  };
  const clearLogs = () => {
    setLogs(logs => []); // keep last 100
  }

  return (
    <div className="app-container">
      <aside className="side-panel">
        <h3>Add entries from bib file...</h3>
        <input
          type="file"
          accept=".bib"
          style={{ marginBottom: 12 }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <h3>...or give me the BibTeX directly</h3>
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
          placeholder="arXiv ID or arxiv.org URL"
          value={arxivId}
          onChange={e => setArxivId(e.target.value)}
        />
        <div className={`checkbox-container ${!arxivId ? 'disabled' : ''}`}>
          <input
            type="checkbox"
            id="arxiv-follow-checkbox"
            checked={immediateArxivFollow}
            onChange={e => setImmediateArxivFollow(e.target.checked)}
            disabled={!arxivId}
          />
          <label htmlFor="arxiv-follow-checkbox">
            Prefer published version if available
          </label>
        </div>
        <button disabled={!wasmLoaded || !arxivId} onClick={handleAddArxiv}>Add from arXiv</button>
        <hr />
        <input
          type="text"
          placeholder="DOI or doi.org URL"
          value={doi}
          onChange={e => setDoi(e.target.value)}
        />
        <button disabled={!wasmLoaded || !doi} onClick={handleAddDoi}>Add from DOI</button>
        <hr />
        <div className="logs-section">
          {logs.length === 0 && <div style={{color:'#888',fontSize:'0.95em'}}>No news! Good news?</div>}
          {logs.map((log, i) => (
            <LogMessage key={i} message={log.msg} type={log.type} />
          ))}
        </div>
      </aside>
      <main className="main-panel">
        <div className="bibliography-header">
          <h2>Bibliography</h2>
          <div className="action-buttons-container">
            <button className="export-button" onClick={handleExport}>Export to .bib file</button>
            <button className="reset-button" onClick={handleResetDB}>Reset Database</button>
          </div>
        </div>
        <div
          className="bib-viewer"
          dangerouslySetInnerHTML={{ __html: highlightNonAscii(bibText) }}
        />
        {message && <div style={{marginTop: 12, color: '#7a7fff'}}>{message}</div>}
      </main>
      <aside className="side-panel actions">
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Unicode Normalization</div>
          <div className="segmented-control">
            <button
              className={normMode === 'canonical' ? 'seg-selected' : ''}
              onClick={() => setNormMode('canonical')}
              type="button"
            >Canonical</button>
            <button
              className={normMode === 'compat' ? 'seg-selected' : ''}
              onClick={() => setNormMode('compat')}
              type="button"
            >Compatibility</button>
            <button
              className={normMode === 'unicode2latex' ? 'seg-selected' : ''}
              onClick={() => setNormMode('unicode2latex')}
              type="button"
            >Unicode2LaTeX</button>
          </div>
        </div>
        <button onClick={() => handleAction('normalize')}>Fix unicode</button>
        <button disabled={preambleAdded} onClick={() => handleAction('preamble')}>Add Encoding Preamble</button>
        <hr />
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>arXiv Check Mode</div>
          <div className={`switch-control ${arxivReplace ? 'right' : ''}`}>
            <button
              className={!arxivReplace ? 'active' : ''}
              onClick={() => {
                setArxivReplace(false);
                setArxivFollow(true);
              }}
              type="button"
            >Check</button>
            <button
              className={arxivReplace ? 'active' : ''}
              onClick={() => {
                setArxivReplace(true);
              }}
              type="button"
            >Replace</button>
          </div>
          <div className={`checkbox-container ${!arxivReplace ? 'disabled' : ''}`}>
            <input
              type="checkbox"
              id="arxiv-follow-pref-checkbox"
              checked={arxivFollow}
              onChange={e => {
                setArxivFollow(e.target.checked);
              }}
              disabled={!arxivReplace}
            />
            <label htmlFor="arxiv-follow-pref-checkbox">
              Prefer published version if available
            </label>
          </div>
        </div>
        <button onClick={() => handleArxivCheck()}>Check arXiv</button>
        <hr />
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>DOI Check Mode</div>
          <div className={`switch-control ${doiReplace ? 'right' : ''}`}>
            <button
              className={!doiReplace ? 'active' : ''}
              onClick={() => setDoiReplace(false)}
              type="button"
            >Check</button>
            <button
              className={doiReplace ? 'active' : ''}
              onClick={() => setDoiReplace(true)}
              type="button"
            >Replace</button>
          </div>
        </div>
        <button onClick={() => handleDOICheck()}>Check DOI</button>
        <hr />
        <button onClick={() => handleAction('filter')}>Remove non-BibTeX fields</button>
      </aside>
    </div>
  );
}

export default App;

