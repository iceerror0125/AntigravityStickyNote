import * as vscode from 'vscode';
import { CustomPanelViewProvider } from './CustomPanelViewProvider';
import { StorageService } from './services/StorageService';
import { NoteService } from './services/NoteService';

export function activate(context: vscode.ExtensionContext) {
    const storageService = new StorageService(context);
    const noteService = new NoteService(storageService);
    const provider = new CustomPanelViewProvider(context.extensionUri, storageService, noteService);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            CustomPanelViewProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Command: Change Background Color
    context.subscriptions.push(
        vscode.commands.registerCommand('customPanel.changeBackgroundColor', async () => {
            const color = await vscode.window.showInputBox({
                prompt: 'Enter a CSS color (e.g., #ff6600, rgba(255,100,0,0.8), steelblue)',
                placeHolder: '#1e1e2e',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Please enter a valid CSS color';
                    }
                    return null;
                }
            });
            if (color) {
                provider.setBackgroundColor(color.trim());
            }
        })
    );

    // Command: Clear Text
    context.subscriptions.push(
        vscode.commands.registerCommand('customPanel.clearText', () => {
            provider.clearText();
        })
    );

    // Command: Reset Settings
    context.subscriptions.push(
        vscode.commands.registerCommand('customPanel.resetSettings', () => {
            provider.resetSettings();
        })
    );
}

export function deactivate() {}
