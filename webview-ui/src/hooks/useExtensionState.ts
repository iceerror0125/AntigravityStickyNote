import { useState, useEffect, useCallback, useRef } from 'react';
import { vscode } from '../utils/vscode';
import type { SavedNote, SavedTheme } from '../types';

const SAVE_DEBOUNCE_MS = 500;

export function useExtensionState() {
  const [bgColor, setBgColor] = useState('#1e1e2e');
  const [fgColor, setFgColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");
  const [fontSize, setFontSize] = useState(14);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Debounce timer for settings persistence
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSettingsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'resetSettings' || msg.type === 'restoreSettings') {
        if (msg.bgColor) setBgColor(msg.bgColor);
        if (msg.fontColor) setFgColor(msg.fontColor);
        if (msg.fontSize) setFontSize(msg.fontSize);
        if (msg.fontFamily) setFontFamily(msg.fontFamily);
        
        if (msg.textContent !== undefined) {
          setInitialContent(msg.textContent);
        }
        
        if (msg.savedThemes && Array.isArray(msg.savedThemes)) {
          setSavedThemes(msg.savedThemes.filter((t: any) => t && t.bg));
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
        setInitialContent('');
      }

      if (msg.type === 'loadNoteContent') {
        setInitialContent(msg.content);
      }

      if (msg.type === 'updateNotes') {
        setSavedNotes(msg.savedNotes || []);
      }

      if (msg.type === 'setBackgroundColor') {
        if (msg.value) setBgColor(msg.value);
      }
    };

    window.addEventListener('message', messageHandler);
    
    // Request backend to send state now that we are ready
    vscode.postMessage({ type: 'webviewReady' });

    return () => window.removeEventListener('message', messageHandler);
  }, []);

  // Flush any pending settings on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        flushPendingSettings();
      }
    };
  }, []);

  const flushPendingSettings = () => {
    const pending = pendingSettingsRef.current;
    if (Object.keys(pending).length > 0) {
      vscode.postMessage({ type: 'saveSettings', ...pending });
      pendingSettingsRef.current = {};
    }
  };

  const debouncedSave = useCallback((overrides: Record<string, any>) => {
    // Accumulate all pending changes
    Object.assign(pendingSettingsRef.current, overrides);
    
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      flushPendingSettings();
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const updateSetting = useCallback((key: string, value: any) => {
    switch(key) {
      case 'bgColor': setBgColor(value); break;
      case 'fontColor': setFgColor(value); break;
      case 'fontFamily': setFontFamily(value); break;
      case 'fontSize': setFontSize(value); break;
      case 'savedThemes': setSavedThemes(value); break;
    }
    debouncedSave({ [key]: value });
  }, [debouncedSave]);

  // Batch update: apply multiple settings in one shot (e.g. theme apply)
  const updateSettings = useCallback((updates: Record<string, any>) => {
    for (const [key, value] of Object.entries(updates)) {
      switch(key) {
        case 'bgColor': setBgColor(value); break;
        case 'fontColor': setFgColor(value); break;
        case 'fontFamily': setFontFamily(value); break;
        case 'fontSize': setFontSize(value); break;
        case 'savedThemes': setSavedThemes(value); break;
      }
    }
    debouncedSave(updates);
  }, [debouncedSave]);

  const toggleDrawer = useCallback((isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
    if (isOpen) vscode.postMessage({ type: 'requestNotes' });
  }, []);

  return {
    bgColor, fgColor, fontFamily, fontSize, savedThemes, savedNotes, isDrawerOpen,
    initialContent, updateSetting, updateSettings, toggleDrawer
  };
}
