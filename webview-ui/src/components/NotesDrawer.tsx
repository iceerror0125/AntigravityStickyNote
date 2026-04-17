import React from 'react';
import { vscode } from '../utils/vscode';
import type { SavedNote } from '../types';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedNotes: SavedNote[];
}

export const NotesDrawer: React.FC<NotesDrawerProps> = React.memo(({ isOpen, onClose, savedNotes }) => {
  return (
    <>
      <div className={`notes-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`notes-drawer ${isOpen ? 'open' : ''}`}>
        <div className="notes-drawer-header">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 2}}><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg> 
            Archives
          </h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="toolbar-btn danger-btn" onClick={() => { if(savedNotes.length > 0) vscode.postMessage({ type: 'deleteAllNotes' }); }} title="Clear Archive">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button className="toolbar-btn" onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        
        <div className="notes-list">
          {savedNotes.length === 0 ? (
             <div className="notes-empty">
                <div className="notes-empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                  </svg>
                </div>
                <p className="primary-msg">No archives yet</p>
                <p className="secondary-msg">Notes you save will securely appear here</p>
            </div>
          ) : (
             [...savedNotes].reverse().map((note) => (
               <div key={note.id} className="note-item" onClick={() => { vscode.postMessage({ type: 'loadNote', noteId: note.id }); onClose(); }}>
                 <div className="note-item-title">
                   <span>{note.title}</span>
                   <button className="note-delete-btn" title="Delete archive" onClick={(e) => { e.stopPropagation(); vscode.postMessage({ type: 'deleteNote', noteId: note.id }); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                   </button>
                 </div>
                 <div className="note-item-preview">{note.preview}</div>
               </div>
             ))
          )}
        </div>
      </div>
    </>
  );
});
