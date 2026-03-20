import * as vscode from 'vscode';

export class CustomPanelViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'customPanel.notepad';

    private _view?: vscode.WebviewView;
    private _context: vscode.ExtensionContext;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        context: vscode.ExtensionContext
    ) {
        this._context = context;
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

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Restore saved settings and text content
        const savedSettings = this._context.globalState.get<Record<string, any>>('customPanel.settings');
        const savedText = this._context.globalState.get<string>('customPanel.text');

        if (savedSettings || savedText) {
            setTimeout(() => {
                webviewView.webview.postMessage({
                    type: 'restoreSettings',
                    ...savedSettings,
                    textContent: savedText
                });
            }, 100);
        }

        // Listen for messages from webview
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.type === 'saveSettings') {
                const { type, ...settings } = message;
                this._context.globalState.update('customPanel.settings', settings);
            } else if (message.type === 'saveText') {
                this._context.globalState.update('customPanel.text', message.value);
            }
        });
    }

    public setBackgroundColor(color: string) {
        this._view?.webview.postMessage({
            type: 'setBackgroundColor',
            value: color
        });
    }

    public clearText() {
        this._view?.webview.postMessage({
            type: 'clearText'
        });
    }

    public resetSettings() {
        this._view?.webview.postMessage({
            type: 'resetSettings',
            bgColor: '#1a1b2e',
            fontSize: 13,
            fontFamily: 'monospace',
            fontColor: '#ffffff'
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();

        return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Custom Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
            color: var(--vscode-foreground);
            background: transparent;
            overflow: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .panel-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            border-radius: 6px;
            overflow: hidden;
            transition: background-color 0.4s ease;
        }

        /* ===== Toolbar ===== */
        .toolbar {
            display: flex;
            flex-direction: column;
            gap: 2px;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            flex-shrink: 0;
        }

        .toolbar-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
        }

        .toolbar-group {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .toolbar-separator {
            width: 1px;
            height: 18px;
            background: rgba(255, 255, 255, 0.12);
            margin: 0 2px;
        }

        .toolbar-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            border: none;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.06);
            color: var(--vscode-foreground);
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 13px;
        }

        .toolbar-btn:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .toolbar-btn.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        /* Input Styles */
        select, input[type="number"] {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--vscode-foreground);
            border-radius: 3px;
            font-size: 11px;
            padding: 2px 4px;
            outline: none;
        }

        .font-select { width: 85px; }
        .size-input { width: 45px; }

        /* Color Controls */
        .color-control {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            opacity: 0.8;
        }

        .color-well {
            width: 20px;
            height: 20px;
            padding: 0;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px;
            background: none;
            cursor: pointer;
            outline: none;
        }

        .color-well::-webkit-color-swatch-wrapper {
            padding: 0;
        }

        .color-well::-webkit-color-swatch {
            border: none;
            border-radius: 3px;
        }

        .hex-input {
            width: 58px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            border-radius: 3px;
            font-size: 10px;
            padding: 2px 4px;
            outline: none;
            text-transform: uppercase;
        }
        
        .hex-input::placeholder {
            color: rgba(255,255,255,0.3);
        }

        /* ===== Text Area ===== */
        .text-area-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
        }

        .text-area {
            flex: 1;
            width: 100%;
            padding: 12px;
            background: transparent;
            border: none;
            outline: none;
            line-height: 1.6;
            overflow-y: auto;
            word-wrap: break-word;
            white-space: pre-wrap;
            transition: font-size 0.2s ease, color 0.2s ease;
        }

        .text-area:empty::before {
            content: 'Write here...';
            color: rgba(255, 255, 255, 0.3);
            pointer-events: none;
        }

        /* Saved Colors Controls */
        .saved-colors {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .saved-color-swatch {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.4);
            cursor: pointer;
            transition: transform 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .saved-color-swatch:hover {
            transform: scale(1.2);
            border-color: #fff;
        }

        .add-color-btn {
            width: 20px !important;
            height: 20px !important;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            line-height: 1;
            padding: 0;
            margin-left: 4px;
        }

        /* ===== Status Bar ===== */
        .status-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px;
            background: rgba(0, 0, 0, 0.1);
            font-size: 10px;
            opacity: 0.6;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
        }

        /* Custom Scrollbar */
        .text-area::-webkit-scrollbar { width: 8px; }
        .text-area::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="panel-container" id="panelContainer">
        <div class="toolbar">
            <div class="toolbar-row">
                <div class="toolbar-group">
                    <select id="fontFamily" class="font-select">
                        <option value="monospace">Monospace</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="'Segoe UI', system-ui">System UI</option>
                        <option value="'Courier New', Courier, monospace">Courier</option>
                    </select>
                    <input type="number" id="fontSize" class="size-input" min="8" max="72" value="13">
                </div>
                <div class="toolbar-group" style="margin-left: auto;">
                    <button class="toolbar-btn" id="btnBold" title="Bold (Ctrl+B)">𝐁</button>
                    <button class="toolbar-btn" id="btnItalic" title="Italic (Ctrl+I)"><i>I</i></button>
                    <button class="toolbar-btn" id="btnUnderline" title="Underline (Ctrl+U)"><u>U</u></button>
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-btn" style="position: relative; overflow: hidden;" title="Color Selected Text">
                        <span style="font-family: serif; font-weight: bold; pointer-events: none;">A</span>
                        <div id="inlineColorIndicator" style="position: absolute; bottom: 3px; left: 5px; right: 5px; height: 3px; background-color: #ff5500; pointer-events: none; border-radius: 1px;"></div>
                        <input type="color" id="inlineColorPicker" value="#ff5500" style="position: absolute; top:-5px; left:-5px; width:40px; height:40px; opacity: 0; cursor: pointer;">
                    </div>
                    <div class="toolbar-separator"></div>
                    <button class="toolbar-btn" id="btnClear" title="Clear">🗑</button>
                </div>
            </div>
            <div class="toolbar-row" style="padding-top: 0; background: rgba(0,0,0,0.1);">
                <div class="toolbar-group">
                    <div class="color-control">
                        <span>Bg:</span>
                        <input type="color" id="bgColorPicker" class="color-well" title="Pick Background Color">
                        <input type="text" id="bgColorHex" class="hex-input" spellcheck="false" maxlength="7" placeholder="#000000">
                    </div>
                    <div class="color-control" style="margin-left: 8px;">
                        <span>Text:</span>
                        <input type="color" id="fgColorPicker" class="color-well" title="Pick Text Color">
                        <input type="text" id="fgColorHex" class="hex-input" spellcheck="false" maxlength="7" placeholder="#FFFFFF">
                    </div>
                    <div class="toolbar-separator" style="margin: 0 8px;"></div>
                    <div class="saved-colors" id="savedColors"></div>
                    <button class="toolbar-btn add-color-btn" id="btnAddColor" title="Save current colors (Right-click swatch to remove)">+</button>
                </div>
            </div>
        </div>

        <div class="text-area-container">
            <div id="textArea" class="text-area" contenteditable="true" spellcheck="false"></div>
        </div>

        <div class="status-bar">
            <span id="charCount">0 chars</span>
            <span id="versionLabel" style="opacity:0.5;">v${this._getVersion()}</span>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        // Elements
        const panel = document.getElementById('panelContainer');
        const textArea = document.getElementById('textArea');
        const fontFamily = document.getElementById('fontFamily');
        const fontSize = document.getElementById('fontSize');
        const bgColorPicker = document.getElementById('bgColorPicker');
        const bgColorHex = document.getElementById('bgColorHex');
        const fgColorPicker = document.getElementById('fgColorPicker');
        const fgColorHex = document.getElementById('fgColorHex');
        const charCount = document.getElementById('charCount');
        const btnBold = document.getElementById('btnBold');
        const btnItalic = document.getElementById('btnItalic');
        const btnUnderline = document.getElementById('btnUnderline');
        const inlineColorPicker = document.getElementById('inlineColorPicker');
        const inlineColorIndicator = document.getElementById('inlineColorIndicator');
        const btnClear = document.getElementById('btnClear');
        const btnAddColor = document.getElementById('btnAddColor');
        
        let savedThemes = [];

        // Apply state (for reset only)
        function updateUI(state) {
            if (state.bgColor) {
                panel.style.backgroundColor = state.bgColor;
                bgColorPicker.value = state.bgColor;
                bgColorHex.value = state.bgColor;
            }
            if (state.fontColor) {
                textArea.style.color = state.fontColor;
                fgColorPicker.value = state.fontColor;
                fgColorHex.value = state.fontColor;
            }
            if (state.fontSize) {
                textArea.style.fontSize = state.fontSize + 'px';
                fontSize.value = state.fontSize;
            }
            if (state.fontFamily) {
                textArea.style.fontFamily = state.fontFamily;
                fontFamily.value = state.fontFamily;
            }
            if (state.textContent !== undefined) {
                textArea.innerHTML = state.textContent;
                updateCharCount();
            }
            if (state.savedThemes && Array.isArray(state.savedThemes)) {
                // Validate to avoid crash from older string-array saves
                savedThemes = state.savedThemes.filter(t => t && typeof t === 'object' && typeof t.bg === 'string');
                renderSavedThemes();
            }
        }

        function updateCharCount() {
            charCount.textContent = textArea.innerText.length + ' chars';
        }

        // ===== Rich Text Formatting =====
        function execFormat(command, value) {
            textArea.focus();
            document.execCommand(command, false, value || null);
        }

        function checkActiveFormats() {
            btnBold.classList.toggle('active', document.queryCommandState('bold'));
            btnItalic.classList.toggle('active', document.queryCommandState('italic'));
            btnUnderline.classList.toggle('active', document.queryCommandState('underline'));
            
            // Note: Document.queryCommandValue('foreColor') returns rgb() string, we wouldn't map it perfectly to hex without a helper,
            // so we skip active color feedback for simplicity, but basic selection works well.
        }

        // ===== Save Settings Helper =====
        function saveSettings() {
            vscode.postMessage({
                type: 'saveSettings',
                bgColor: bgColorPicker.value,
                fontColor: fgColorPicker.value,
                fontSize: parseInt(fontSize.value, 10),
                fontFamily: fontFamily.value,
                savedThemes: savedThemes
            });
        }

        function renderSavedThemes() {
            const container = document.getElementById('savedColors');
            container.innerHTML = '';
            savedThemes.forEach((theme, index) => {
                const swatch = document.createElement('div');
                swatch.className = 'saved-color-swatch';
                swatch.style.backgroundColor = theme.bg;
                swatch.title = \`Bg: \${theme.bg}, Text: \${theme.fg}\\nRight-click to remove\`;
                
                const inner = document.createElement('div');
                inner.style.width = '6px';
                inner.style.height = '6px';
                inner.style.borderRadius = '50%';
                inner.style.backgroundColor = theme.fg;
                swatch.appendChild(inner);
                
                swatch.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    savedThemes.splice(index, 1);
                    saveSettings();
                    renderSavedThemes();
                });

                swatch.addEventListener('click', () => {
                    panel.style.backgroundColor = theme.bg;
                    bgColorPicker.value = theme.bg;
                    bgColorHex.value = theme.bg;
                    
                    textArea.style.color = theme.fg;
                    fgColorPicker.value = theme.fg;
                    fgColorHex.value = theme.fg;
                    
                    saveSettings();
                });
                container.appendChild(swatch);
            });
        }

        // ===== Listeners =====
        textArea.addEventListener('input', () => {
            updateCharCount();
            vscode.postMessage({
                type: 'saveText',
                value: textArea.innerHTML
            });
        });

        textArea.addEventListener('mouseup', checkActiveFormats);
        textArea.addEventListener('keyup', checkActiveFormats);

        fontFamily.addEventListener('change', () => {
            textArea.style.fontFamily = fontFamily.value;
            saveSettings();
        });

        fontSize.addEventListener('input', () => {
            textArea.style.fontSize = fontSize.value + 'px';
            saveSettings();
        });

        function updateColorBg(color) {
            panel.style.backgroundColor = color;
            bgColorPicker.value = color;
            bgColorHex.value = color;
        }

        function updateColorFg(color) {
            textArea.style.color = color;
            fgColorPicker.value = color;
            fgColorHex.value = color;
        }

        bgColorPicker.addEventListener('input', (e) => {
            updateColorBg(e.target.value);
            saveSettings();
        });

        bgColorHex.addEventListener('change', (e) => {
            let val = e.target.value;
            if(!val.startsWith('#')) val = '#' + val;
            if(/^#[0-9A-Fa-f]{6}$/i.test(val) || /^#[0-9A-Fa-f]{3}$/i.test(val)) {
                // Ensure 6 chars for color picker input expectation
                if(val.length === 4) {
                    val = '#' + val[1]+val[1]+val[2]+val[2]+val[3]+val[3];
                }
                updateColorBg(val);
                saveSettings();
            } else {
                e.target.value = bgColorPicker.value; // revert
            }
        });

        fgColorPicker.addEventListener('input', (e) => {
            updateColorFg(e.target.value);
            saveSettings();
        });

        fgColorHex.addEventListener('change', (e) => {
            let val = e.target.value;
            if(!val.startsWith('#')) val = '#' + val;
            if(/^#[0-9A-Fa-f]{6}$/i.test(val) || /^#[0-9A-Fa-f]{3}$/i.test(val)) {
                if(val.length === 4) {
                    val = '#' + val[1]+val[1]+val[2]+val[2]+val[3]+val[3];
                }
                updateColorFg(val);
                saveSettings();
            } else {
                e.target.value = fgColorPicker.value; // revert
            }
        });

        btnAddColor.addEventListener('click', () => {
            const theme = { bg: bgColorPicker.value, fg: fgColorPicker.value };
            // Check if exact theme already exists
            const exists = savedThemes.some(t => {
                if (!t || !t.bg || !t.fg) return false;
                return t.bg.toLowerCase() === theme.bg.toLowerCase() && t.fg.toLowerCase() === theme.fg.toLowerCase();
            });
            if (!exists) {
                savedThemes.push(theme);
                if (savedThemes.length > 8) {
                    savedThemes.shift();
                }
                renderSavedThemes();
                saveSettings();
            }
        });

        // Formatting buttons
        btnBold.addEventListener('click', () => execFormat('bold'));
        btnItalic.addEventListener('click', () => execFormat('italic'));
        btnUnderline.addEventListener('click', () => execFormat('underline'));

        inlineColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            inlineColorIndicator.style.backgroundColor = color;
            execFormat('foreColor', color);
            
            // A bit of a workaround because picking color steals focus
            vscode.postMessage({
                type: 'saveText',
                value: textArea.innerHTML
            });
        });

        btnClear.addEventListener('click', () => {
            textArea.innerHTML = '';
            updateCharCount();
            vscode.postMessage({
                type: 'saveText',
                value: ''
            });
        });

        // Keyboard shortcuts
        textArea.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        execFormat('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        execFormat('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        execFormat('underline');
                        break;
                }
            }
        });

        // Messages from extension
        window.addEventListener('message', event => {
            const msg = event.data;
            if (msg.type === 'resetSettings') {
                updateUI(msg);
                saveSettings();
            }
            if (msg.type === 'restoreSettings') {
                updateUI(msg);
            }
            if (msg.type === 'clearText') {
                textArea.innerHTML = '';
                updateCharCount();
                vscode.postMessage({
                    type: 'saveText',
                    value: ''
                });
            }
        });

        // Initialize default UI
        updateColorBg('#1a1b2e');
        updateColorFg('#ffffff');
    </script>
</body>
</html>`;
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

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
