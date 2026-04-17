// Singleton wrapper for the VS Code Webview API.
// The API was acquired in the inline bootstrap script (HtmlProvider.ts)
// and stored on window.__vscodeApi. We simply read it here.
// This avoids ANY chance of calling acquireVsCodeApi() twice.

class VSCodeAPIWrapper {
    private readonly vscodeApi: any;
    
    constructor() {
        const api = (window as any).__vscodeApi;
        if (api) {
            this.vscodeApi = api;
        } else {
            // Fallback mock for standalone browser dev mode
            console.warn('[VSCodeAPIWrapper] No __vscodeApi found on window. Using mock.');
            this.vscodeApi = {
                postMessage: (msg: unknown) => console.log('[Mock] postMessage:', msg),
            };
        }
    }

    public postMessage(message: unknown) {
        this.vscodeApi.postMessage(message);
    }
}

export const vscode = new VSCodeAPIWrapper();
