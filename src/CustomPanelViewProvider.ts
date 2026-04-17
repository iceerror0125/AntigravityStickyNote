import * as vscode from 'vscode';
import { StorageService } from './services/StorageService';
import { NoteService } from './services/NoteService';
import { HtmlProvider } from './views/HtmlProvider';

export class CustomPanelViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'customPanel.notepad';

    private _view?: vscode.WebviewView;
    private _messageHandlers: Record<string, (message: any) => void> = {};
    private _settingsCache: Record<string, any> = {};
    private _hasSessionInitialized = false;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _storageService: StorageService,
        private readonly _noteService: NoteService
    ) {
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        const version = this._getVersion();
        webviewView.webview.html = HtmlProvider.getHtmlForWebview(webviewView.webview, version, this._extensionUri);

        this._initializeState(webviewView);
        this._setupMessageListener(webviewView);
        this._setupLifecycleListeners(webviewView);
    }

    private _initializeState(webviewView: vscode.WebviewView): void {
        const existingText = this._storageService.getText();
        
        if (!this._hasSessionInitialized) {
            this._hasSessionInitialized = true;
            if (existingText && existingText.trim().length > 0) {
                this._noteService.autoSaveCurrentTextAsNote(existingText);
            }

            // Reset text for the new window session
            this._storageService.updateText('');

            // Initialize cache and enforce default background color
            this._settingsCache = this._storageService.getSettings();
            this._settingsCache.bgColor = '#969696';
            this._storageService.updateSettings(this._settingsCache);
        } else {
            // Restore from existing session (e.g. if panel is moved across sidebars)
            this._settingsCache = this._storageService.getSettings();
        }
    }

    private _registerMessageHandlers() {
        this._messageHandlers['webviewReady'] = (message) => {
            const savedNotes = this._noteService.getNotes().map(n => ({ id: n.id, title: n.title, preview: n.preview, createdAt: n.createdAt }));
            const existingText = this._storageService.getText();
            this._view?.webview.postMessage({
                type: 'restoreSettings',
                ...this._settingsCache,
                textContent: existingText,
                savedNotes: savedNotes
            });
        };
        this._messageHandlers['saveSettings'] = (message) => {
            const { type, ...updates } = message;
            this._settingsCache = { ...this._settingsCache, ...updates };
            this._storageService.updateSettings(this._settingsCache);
        };
        this._messageHandlers['saveText'] = (message) => {
            this._storageService.updateText(message.value);
        };
        this._messageHandlers['saveAsNote'] = (message) => {
            this._noteService.saveNote(message.content, message.title);
            this._sendNotesToWebview();
        };
        this._messageHandlers['autoSaveAsNote'] = (message) => {
            this._noteService.autoSaveCurrentTextAsNote(message.content);
            this._sendNotesToWebview();
        };
        this._messageHandlers['loadNote'] = (message) => {
            const notes = this._noteService.getNotes();
            const note = notes.find(n => n.id === message.noteId);
            if (note) {
                this._view?.webview.postMessage({ type: 'loadNoteContent', content: note.content });
                this._storageService.updateText(note.content);
            }
        };
        this._messageHandlers['deleteNote'] = (message) => {
            this._noteService.deleteNote(message.noteId);
            this._sendNotesToWebview();
        };
        this._messageHandlers['deleteAllNotes'] = () => {
            this._noteService.deleteAllNotes();
            this._sendNotesToWebview();
        };
        this._messageHandlers['requestNotes'] = () => {
            this._sendNotesToWebview();
        };
        this._messageHandlers['clearText'] = () => {
            this.clearText();
        };
    }

    private _setupMessageListener(webviewView: vscode.WebviewView): void {
        this._registerMessageHandlers();
        webviewView.webview.onDidReceiveMessage(message => {
            const handler = this._messageHandlers[message.type];
            if (handler) {
                handler(message);
            } else {
                console.warn(`[CustomPanel] Unhandled message type: ${message.type}`);
            }
        });
    }

    private _setupLifecycleListeners(webviewView: vscode.WebviewView): void {
        webviewView.onDidDispose(() => {
            const currentText = this._storageService.getText();
            if (currentText && currentText.trim().length > 0) {
                this._noteService.autoSaveCurrentTextAsNote(currentText);
            }
            this._view = undefined;
        });
    }

    private _sendNotesToWebview(): void {
        this._view?.webview.postMessage({
            type: 'updateNotes',
            // Send only metadata to avoid freezing VS Code with massive payload
            savedNotes: this._noteService.getNotes().map(n => ({ id: n.id, title: n.title, preview: n.preview, createdAt: n.createdAt }))
        });
    }

    public setBackgroundColor(color: string) {
        this._settingsCache = { ...this._settingsCache, bgColor: color };
        this._storageService.updateSettings(this._settingsCache);
        this._view?.webview.postMessage({
            type: 'setBackgroundColor',
            value: color
        });
    }

    public clearText() {
        this._storageService.updateText('');
        this._view?.webview.postMessage({
            type: 'clearText'
        });
    }

    public resetSettings() {
        const defaultSettings = {
            bgColor: '#969696',
            fontSize: 13,
            fontFamily: 'monospace',
            fontColor: '#ffffff'
        };
        this._settingsCache = { ...this._settingsCache, ...defaultSettings };
        this._storageService.updateSettings(this._settingsCache);

        this._view?.webview.postMessage({
            type: 'resetSettings',
            ...defaultSettings
        });
    }

    private _getVersion(): string {
        try {
            const ext = vscode.extensions.getExtension('antigravity.custom-panel-extension');
            return ext?.packageJSON?.version ?? '0.0.0';
        } catch {
            return '0.0.0';
        }
    }
}
