import React from 'react';
import type { SavedTheme, EditorFormats } from '../types';

interface ToolbarProps {
  bgColor: string;
  fgColor: string;
  fontFamily: string;
  fontSize: number;
  savedThemes: SavedTheme[];
  activeFormats: EditorFormats;
  updateSetting: (key: string, value: any) => void;
  updateSettings: (updates: Record<string, any>) => void;
  onApplyFormat: (command: string) => void;
  onSaveNote: () => void;
  onClearPad: () => void;
  onToggleDrawer: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = React.memo(({
  bgColor, fgColor, fontFamily, fontSize, savedThemes,
  activeFormats, updateSetting, updateSettings, onApplyFormat,
  onSaveNote, onClearPad, onToggleDrawer
}) => {

  const addTheme = () => {
    const exists = savedThemes.some(t => {
      const bgMatch = t.bg && bgColor && t.bg.toLowerCase() === bgColor.toLowerCase();
      const fgMatch = t.fg && fgColor ? t.fg.toLowerCase() === fgColor.toLowerCase() : (!t.fg && !fgColor);
      return bgMatch && fgMatch;
    });
    if (!exists) {
      const newThemes = [...savedThemes, { bg: bgColor || '#1e1e2e', fg: fgColor || '#ffffff' }];
      if (newThemes.length > 8) newThemes.shift();
      updateSetting('savedThemes', newThemes);
    }
  };

  const removeTheme = (index: number) => {
    const newThemes = [...savedThemes];
    newThemes.splice(index, 1);
    updateSetting('savedThemes', newThemes);
  };

  const applyTheme = (theme: SavedTheme) => {
    updateSettings({ bgColor: theme.bg, fontColor: theme.fg });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="toolbar-group">
          <select className="font-select" value={fontFamily} onChange={(e) => updateSetting('fontFamily', e.target.value)}>
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'JetBrains Mono', monospace">Monospace</option>
            <option value="'Georgia', serif">Serif</option>
            <option value="system-ui">System UI</option>
          </select>
          <input type="number" className="size-input" min={10} max={72} value={fontSize} onChange={(e) => updateSetting('fontSize', parseInt(e.target.value) || 14)} />
        </div>

        <div className="toolbar-group">
          <button className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`} onClick={() => onApplyFormat('bold')} title="Bold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
          </button>
          <button className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`} onClick={() => onApplyFormat('italic')} title="Italic">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
          </button>
          <button className={`toolbar-btn ${activeFormats.underline ? 'active' : ''}`} onClick={() => onApplyFormat('underline')} title="Underline">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
          </button>
          <button className={`toolbar-btn ${activeFormats.strikethrough ? 'active' : ''}`} onClick={() => onApplyFormat('strikeThrough')} title="Strikethrough">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
          </button>
        </div>

        <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
          <button className="toolbar-btn" onClick={onSaveNote} title="Save Note">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>
          <button className="toolbar-btn" onClick={onToggleDrawer} title="Notes Archive">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
          </button>
          <div className="toolbar-separator"></div>
          <button className="toolbar-btn danger-btn" onClick={onClearPad} title="Clear Pad">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <div className="toolbar-row secondary">
        <div className="toolbar-group">
           <div className="color-control">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{width: 14, height: 14, stroke: 'rgba(255,255,255,0.5)', fill: 'none'}}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                <input type="color" className="color-well" value={bgColor} onChange={(e) => updateSetting('bgColor', e.target.value)} />
                <input type="text" className="hex-input" spellCheck={false} maxLength={7} value={bgColor} onChange={(e) => updateSetting('bgColor', e.target.value)} />
            </div>
            <div className="toolbar-separator"></div>
            <div className="color-control">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{width: 14, height: 14, stroke: 'rgba(255,255,255,0.5)', fill: 'none'}}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                <input type="color" className="color-well" value={fgColor} onChange={(e) => updateSetting('fontColor', e.target.value)} />
                <input type="text" className="hex-input" spellCheck={false} maxLength={7} value={fgColor} onChange={(e) => updateSetting('fontColor', e.target.value)} />
            </div>
        </div>
        <div className="toolbar-group" style={{ paddingLeft: 12, border: 'none', background: 'transparent' }}>
           <div className="saved-colors">
             {savedThemes.map((theme, i) => (
               <div key={i} className="saved-color-swatch" style={{ backgroundColor: theme.bg }} onClick={() => applyTheme(theme)} onContextMenu={(e) => { e.preventDefault(); removeTheme(i); }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.fg }}></div>
               </div>
             ))}
           </div>
           <button className="toolbar-btn" style={{ borderRadius: '50%', width: 24, height: 24 }} onClick={addTheme} title="Save Theme Palette">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
           </button>
        </div>
      </div>
    </div>
  );
});
