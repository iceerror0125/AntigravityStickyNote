"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
require("./index.css");
const vscode = acquireVsCodeApi();
function App() {
    const [bgColor, setBgColor] = (0, react_1.useState)('#1e1e2e');
    const [fgColor, setFgColor] = (0, react_1.useState)('#ffffff');
    const [fontFamily, setFontFamily] = (0, react_1.useState)("'Inter', sans-serif");
    const [fontSize, setFontSize] = (0, react_1.useState)(14);
    const [charCount, setCharCount] = (0, react_1.useState)(0);
    const [savedThemes, setSavedThemes] = (0, react_1.useState)([]);
    const [savedNotes, setSavedNotes] = (0, react_1.useState)([]);
    const [isDrawerOpen, setIsDrawerOpen] = (0, react_1.useState)(false);
    const [version] = (0, react_1.useState)("0.0.13"); // Hardcoded for simplified React demo, could be passed dynamically
    const textAreaRef = (0, react_1.useRef)(null);
    const [activeFormats, setActiveFormats] = (0, react_1.useState)({ bold: false, italic: false, underline: false });
    (0, react_1.useEffect)(() => {
        // Listen for messages from extension
        const messageHandler = (event) => {
            const msg = event.data;
            if (msg.type === 'resetSettings' || msg.type === 'restoreSettings') {
                if (msg.bgColor)
                    setBgColor(msg.bgColor);
                if (msg.fontColor)
                    setFgColor(msg.fontColor);
                if (msg.fontSize)
                    setFontSize(msg.fontSize);
                if (msg.fontFamily)
                    setFontFamily(msg.fontFamily);
                if (msg.textContent !== undefined && textAreaRef.current) {
                    textAreaRef.current.innerHTML = msg.textContent;
                    updateCharCount(msg.textContent);
                }
                if (msg.savedThemes && Array.isArray(msg.savedThemes)) {
                    setSavedThemes(msg.savedThemes.filter((t) => t && t.bg));
                }
                if (msg.savedNotes && Array.isArray(msg.savedNotes)) {
                    setSavedNotes(msg.savedNotes);
                }
                if (msg.type === 'restoreSettings') {
                    const backup = localStorage.getItem('customPanelCrashBackup');
                    if (backup && backup.trim().length > 0) {
                        vscode.postMessage({ type: 'autoSaveAsNote', content: backup });
                    }
                    localStorage.removeItem('customPanelCrashBackup');
                }
            }
            if (msg.type === 'clearText') {
                if (textAreaRef.current)
                    textAreaRef.current.innerHTML = '';
                updateCharCount('');
                backupLocally('');
                vscode.postMessage({ type: 'saveText', value: '' });
            }
            if (msg.type === 'loadNoteContent') {
                if (textAreaRef.current)
                    textAreaRef.current.innerHTML = msg.content;
                updateCharCount(msg.content);
            }
            if (msg.type === 'updateNotes') {
                setSavedNotes(msg.savedNotes || []);
            }
        };
        window.addEventListener('message', messageHandler);
        const handleBeforeUnload = () => {
            const content = textAreaRef.current?.innerHTML || '';
            if (content && textAreaRef.current?.innerText.trim().length) {
                vscode.postMessage({ type: 'saveText', value: content });
            }
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleBeforeUnload();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('message', messageHandler);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
    const updateCharCount = (html) => {
        // Basic text length estimation mimicking innerText size
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const count = temp.innerText.trim().replace(/\n/g, '').length;
        setCharCount(count);
    };
    const backupLocally = (content) => {
        if (content) {
            localStorage.setItem('customPanelCrashBackup', content);
        }
        else {
            localStorage.removeItem('customPanelCrashBackup');
        }
    };
    const saveSettings = (overrides = {}) => {
        vscode.postMessage({
            type: 'saveSettings',
            bgColor,
            fontColor: fgColor,
            fontSize,
            fontFamily,
            savedThemes,
            ...overrides
        });
    };
    const handleInput = () => {
        if (!textAreaRef.current)
            return;
        const content = textAreaRef.current.innerHTML;
        updateCharCount(content);
        backupLocally(content);
        vscode.postMessage({ type: 'saveText', value: content });
    };
    const execFormat = (command, value) => {
        textAreaRef.current?.focus();
        document.execCommand(command, false, value);
        checkActiveFormats();
    };
    const applyFormatAndUpdate = (command) => {
        execFormat(command);
        handleInput();
    };
    const checkActiveFormats = () => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline')
        });
    };
    const addTheme = () => {
        const exists = savedThemes.some(t => t.bg.toLowerCase() === bgColor.toLowerCase() && t.fg.toLowerCase() === fgColor.toLowerCase());
        if (!exists) {
            const newThemes = [...savedThemes, { bg: bgColor, fg: fgColor }];
            if (newThemes.length > 8)
                newThemes.shift();
            setSavedThemes(newThemes);
            saveSettings({ savedThemes: newThemes });
        }
    };
    const removeTheme = (index) => {
        const newThemes = [...savedThemes];
        newThemes.splice(index, 1);
        setSavedThemes(newThemes);
        saveSettings({ savedThemes: newThemes });
    };
    const applyTheme = (theme) => {
        setBgColor(theme.bg);
        setFgColor(theme.fg);
        saveSettings({ bgColor: theme.bg, fontColor: theme.fg });
    };
    return (<div className="panel-container" style={{ backgroundColor: bgColor }}>
      <div className="toolbar">
        <div className="toolbar-row">
          <div className="toolbar-group">
            <select className="font-select" value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); saveSettings({ fontFamily: e.target.value }); }}>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="'JetBrains Mono', monospace">Monospace</option>
              <option value="'Georgia', serif">Serif</option>
              <option value="system-ui">System UI</option>
            </select>
            <input type="number" className="size-input" min={10} max={72} value={fontSize} onChange={(e) => { setFontSize(parseInt(e.target.value) || 14); saveSettings({ fontSize: parseInt(e.target.value) }); }}/>
          </div>

          <div className="toolbar-group">
            <button className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`} onClick={() => applyFormatAndUpdate('bold')} title="Bold">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
            </button>
            <button className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`} onClick={() => applyFormatAndUpdate('italic')} title="Italic">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
            </button>
            <button className={`toolbar-btn ${activeFormats.underline ? 'active' : ''}`} onClick={() => applyFormatAndUpdate('underline')} title="Underline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
            </button>
          </div>

          <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
            <button className="toolbar-btn" onClick={() => {
            const content = textAreaRef.current?.innerHTML;
            if (content && textAreaRef.current?.innerText.trim().length) {
                vscode.postMessage({ type: 'saveAsNote', content });
            }
        }} title="Save Note">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            </button>
            <button className="toolbar-btn" onClick={() => { setIsDrawerOpen(true); vscode.postMessage({ type: 'requestNotes' }); }} title="Notes Archive">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>
            <div className="toolbar-separator"></div>
            <button className="toolbar-btn danger-btn" onClick={() => {
            if (textAreaRef.current)
                textAreaRef.current.innerHTML = '';
            updateCharCount('');
            backupLocally('');
            vscode.postMessage({ type: 'saveText', value: '' });
        }} title="Clear Pad">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <div className="toolbar-row secondary">
          <div className="toolbar-group">
             <div className="color-control">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'rgba(255,255,255,0.5)', fill: 'none' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <input type="color" className="color-well" value={bgColor} onChange={(e) => { setBgColor(e.target.value); saveSettings({ bgColor: e.target.value }); }}/>
                  <input type="text" className="hex-input" spellCheck={false} maxLength={7} value={bgColor} onChange={(e) => { setBgColor(e.target.value); saveSettings({ bgColor: e.target.value }); }}/>
              </div>
              <div className="toolbar-separator"></div>
              <div className="color-control">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'rgba(255,255,255,0.5)', fill: 'none' }}><path d="M4 20h16M12 4l-8 12h16L12 4z"/></svg>
                  <input type="color" className="color-well" value={fgColor} onChange={(e) => { setFgColor(e.target.value); saveSettings({ fontColor: e.target.value }); }}/>
                  <input type="text" className="hex-input" spellCheck={false} maxLength={7} value={fgColor} onChange={(e) => { setFgColor(e.target.value); saveSettings({ fontColor: e.target.value }); }}/>
              </div>
          </div>
          <div className="toolbar-group" style={{ paddingLeft: 12, border: 'none', background: 'transparent' }}>
             <div className="saved-colors">
               {savedThemes.map((theme, i) => (<div key={i} className="saved-color-swatch" style={{ backgroundColor: theme.bg }} onClick={() => applyTheme(theme)} onContextMenu={(e) => { e.preventDefault(); removeTheme(i); }}>
                   <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.fg }}></div>
                 </div>))}
             </div>
             <button className="toolbar-btn" style={{ borderRadius: '50%', width: 24, height: 24 }} onClick={addTheme} title="Save Theme Palette">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
             </button>
          </div>
        </div>
      </div>

      <div className="text-area-container">
        <div ref={textAreaRef} className="text-area" contentEditable spellCheck={false} onInput={handleInput} onMouseUp={checkActiveFormats} onKeyUp={checkActiveFormats} style={{ fontFamily, fontSize, color: fgColor }}></div>
      </div>

      <div className="status-bar">
          <span>Antigravity Notes</span>
          <div style={{ display: 'flex', gap: 16 }}>
              <span>{charCount} characters</span>
              <span style={{ opacity: 0.4 }}>v{version}</span>
          </div>
      </div>

      <div className={`notes-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
      <div className={`notes-drawer ${isDrawerOpen ? 'open' : ''}`}>
          <div className="notes-drawer-header">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> 
                Archives
              </h3>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="toolbar-btn danger-btn" onClick={() => { if (savedNotes.length > 0)
        vscode.postMessage({ type: 'deleteAllNotes' }); }} title="Clear Archive">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                  <button className="toolbar-btn" onClick={() => setIsDrawerOpen(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
              </div>
          </div>
          <div className="notes-list">
            {savedNotes.length === 0 ? (<div className="notes-empty">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6z"/>
                      <path d="M14 2v6h6"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                  <p>No archives yet.</p>
              </div>) : ([...savedNotes].reverse().map((note) => (<div key={note.id} className="note-item" onClick={() => { vscode.postMessage({ type: 'loadNote', noteId: note.id }); setIsDrawerOpen(false); }}>
                   <div className="note-item-title">
                     <span>{note.title}</span>
                     <button className="note-delete-btn" title="Delete archive" onClick={(e) => { e.stopPropagation(); vscode.postMessage({ type: 'deleteNote', noteId: note.id }); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                     </button>
                   </div>
                   <div className="note-item-preview">{note.preview}</div>
                 </div>)))}
          </div>
      </div>
    </div>);
}
exports.default = App;
//# sourceMappingURL=App.js.map