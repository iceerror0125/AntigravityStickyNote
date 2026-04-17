import { useState, useRef } from 'react';
import './index.css';

import { useExtensionState } from './hooks/useExtensionState';
import { Toolbar } from './components/Toolbar';
import { TextArea } from './components/TextArea';
import type { TextAreaRef } from './components/TextArea';
import { NotesDrawer } from './components/NotesDrawer';

import { vscode } from './utils/vscode';
import type { EditorFormats } from './types';

function App() {
  const { 
    bgColor, fgColor, fontFamily, fontSize, savedThemes, savedNotes, 
    isDrawerOpen, initialContent, updateSetting, updateSettings, toggleDrawer 
  } = useExtensionState();

  const [activeFormats, setActiveFormats] = useState<EditorFormats>({ 
    bold: false, italic: false, underline: false, strikethrough: false 
  });
  
  const [charCount, setCharCount] = useState(0);
  const textAreaRef = useRef<TextAreaRef>(null);
  const version = "0.0.13"; // Standard semantic API versioning

  const handleApplyFormat = (command: string) => {
    textAreaRef.current?.applyFormat(command);
  };

  const handleSaveNote = () => {
    const content = textAreaRef.current?.getContent();
    if (content && content.trim().length > 0) {
      vscode.postMessage({ type: 'saveAsNote', content });
    }
  };

  const handleClearPad = () => {
    vscode.postMessage({ type: 'clearText' });
  };

  return (
    <div className="panel-container" style={{ backgroundColor: bgColor }}>
      <Toolbar 
        bgColor={bgColor} 
        fgColor={fgColor} 
        fontFamily={fontFamily} 
        fontSize={fontSize} 
        savedThemes={savedThemes} 
        activeFormats={activeFormats}
        updateSetting={updateSetting}
        updateSettings={updateSettings}
        onApplyFormat={handleApplyFormat}
        onSaveNote={handleSaveNote}
        onClearPad={handleClearPad}
        onToggleDrawer={() => toggleDrawer(true)}
      />

      <TextArea 
        ref={textAreaRef}
        initialContent={initialContent}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fgColor={fgColor}
        onCharCountChange={setCharCount}
        onFormatChange={setActiveFormats}
      />

      <div className="status-bar">
          <span>Antigravity Notes</span>
          <div style={{ display: 'flex', gap: 16 }}>
              <span>{charCount} characters</span>
              <span style={{ opacity: 0.4 }}>v{version}</span>
          </div>
      </div>

      <NotesDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => toggleDrawer(false)}
        savedNotes={savedNotes}
      />
    </div>
  );
}

export default App;
