import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, memo } from 'react';
import { vscode } from '../utils/vscode';
import type { EditorFormats } from '../types';

interface TextAreaProps {
  initialContent: string | null;
  fontFamily: string;
  fontSize: number;
  fgColor: string;
  onCharCountChange: (count: number) => void;
  onFormatChange: (formats: EditorFormats) => void;
}

export interface TextAreaRef {
  applyFormat: (command: string) => void;
  getContent: () => string;
}

const TEXT_SAVE_DEBOUNCE_MS = 400;

export const TextArea = memo(forwardRef<TextAreaRef, TextAreaProps>(({ 
  initialContent, fontFamily, fontSize, fgColor, onCharCountChange, onFormatChange 
}, ref) => {
  const textAreaRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFormatsRef = useRef<EditorFormats>({ bold: false, italic: false, underline: false, strikethrough: false });

  useImperativeHandle(ref, () => ({
    applyFormat: (command: string) => {
      textAreaRef.current?.focus();
      document.execCommand(command, false);
      checkActiveFormats();
      handleInput();
    },
    getContent: () => textAreaRef.current?.innerHTML || ''
  }));

  useEffect(() => {
    if (initialContent !== null && textAreaRef.current) {
      if (textAreaRef.current.innerHTML !== initialContent) {
        textAreaRef.current.innerHTML = initialContent;
        updateCharCount();
      }
    }
  }, [initialContent]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Flush any pending save immediately
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const content = textAreaRef.current?.innerHTML || '';
      if (content && textAreaRef.current?.textContent?.trim().length) {
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
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Flush on unmount
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (activeFormatTimerRef.current) {
        clearTimeout(activeFormatTimerRef.current);
      }
    };
  }, []);

  const updateCharCount = useCallback(() => {
    if (!textAreaRef.current) return;
    const text = textAreaRef.current.textContent || '';
    const count = text.trim().replace(/\n/g, '').length;
    onCharCountChange(count);
  }, [onCharCountChange]);

  const backupLocally = (content: string) => {
    try {
      if (content) {
        localStorage.setItem('customPanelCrashBackup', content);
      } else {
        localStorage.removeItem('customPanelCrashBackup');
      }
    } catch (e) {
      console.warn('Local backup failed (likely storage quota exceeded)', e);
    }
  };

  const handleInput = () => {
    if (!textAreaRef.current) return;
    
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      const content = textAreaRef.current?.innerHTML || '';
      updateCharCount();
      backupLocally(content);
      vscode.postMessage({ type: 'saveText', value: content });
      saveTimerRef.current = null;
    }, TEXT_SAVE_DEBOUNCE_MS);
  };

  const activeFormatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkActiveFormats = () => {
    if (activeFormatTimerRef.current) {
      clearTimeout(activeFormatTimerRef.current);
    }
    activeFormatTimerRef.current = setTimeout(() => {
      try {
        const bold = document.queryCommandState('bold');
        const italic = document.queryCommandState('italic');
        const underline = document.queryCommandState('underline');
        const strikethrough = document.queryCommandState('strikeThrough');

        const prev = activeFormatsRef.current;
        if (prev.bold !== bold || prev.italic !== italic || prev.underline !== underline || prev.strikethrough !== strikethrough) {
          const newFormats = { bold, italic, underline, strikethrough };
          activeFormatsRef.current = newFormats;
          onFormatChange(newFormats);
        }
      } catch (e) {
        // Ignored
      }
    }, 150);
  };

  return (
    <div className="text-area-container">
      <div 
        ref={textAreaRef} 
        className="text-area" 
        contentEditable 
        spellCheck={false} 
        onInput={handleInput}
        onMouseUp={checkActiveFormats}
        onKeyUp={checkActiveFormats}
        style={{ fontFamily, fontSize, color: fgColor }}
      ></div>
    </div>
  );
}));
