import * as vscode from 'vscode';
import { SavedNote } from '../models/SavedNote';

export class StorageService {
    private static readonly KEY_NOTES = 'customPanel.savedNotes';
    private static readonly KEY_TEXT = 'customPanel.text';
    private static readonly KEY_SETTINGS = 'customPanel.settings';

    constructor(private context: vscode.ExtensionContext) {}

    public getSavedNotes(): SavedNote[] {
        return this.context.globalState.get<SavedNote[]>(StorageService.KEY_NOTES) || [];
    }

    public updateSavedNotes(notes: SavedNote[]): Thenable<void> {
        return this.context.globalState.update(StorageService.KEY_NOTES, notes);
    }

    public getText(): string {
        return this.context.globalState.get<string>(StorageService.KEY_TEXT) || '';
    }

    public updateText(text: string): Thenable<void> {
        return this.context.globalState.update(StorageService.KEY_TEXT, text);
    }

    public getSettings(): Record<string, any> {
        return this.context.globalState.get<Record<string, any>>(StorageService.KEY_SETTINGS) || {};
    }

    public updateSettings(settings: Record<string, any>): Thenable<void> {
        return this.context.globalState.update(StorageService.KEY_SETTINGS, settings);
    }
}
