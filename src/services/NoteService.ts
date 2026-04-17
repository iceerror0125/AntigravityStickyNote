import { SavedNote } from '../models/SavedNote';
import { StorageService } from './StorageService';

export class NoteService {
    constructor(private storageService: StorageService) {}

    public getNotes(): SavedNote[] {
        return this.storageService.getSavedNotes();
    }

    public autoSaveCurrentTextAsNote(content: string): void {
        const notes = this.getNotes();
        // Only auto-save if content differs from the last note
        if (notes.length > 0) {
            const lastNote = notes[notes.length - 1];
            if (lastNote.content === content) {
                return; // Skip duplicate
            }
        }
        this.saveNote(content);
    }

    public saveNote(content: string, title?: string): void {
        const notes = this.getNotes();
        // Extract preview efficiently from parsing only the first 10,000 chars to avoid CPU block:
        const chunk = content.substring(0, 10000);
        // Strip out base64 data strings cleanly if present in chunk, then strip tags
        let plainText = chunk.replace(/data:image\/[^;]+;base64,[^"]+/g, '');
        plainText = plainText.replace(/<[^>]*>?/g, '').trim();
        if (plainText.length === 0 && content.length === 0) { return; }

        const preview = plainText.substring(0, 50) + (plainText.length > 50 || content.length > 10000 ? '...' : '');
        const now = new Date();
        const defaultTitle = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

        const note: SavedNote = {
            id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: title || defaultTitle,
            content: content,
            createdAt: now.toISOString(),
            preview: preview
        };

        notes.push(note);

        // Keep max 20 notes
        while (notes.length > 20) {
            notes.shift();
        }

        this.storageService.updateSavedNotes(notes);
    }

    public deleteNote(noteId: string): void {
        let notes = this.getNotes();
        notes = notes.filter(n => n.id !== noteId);
        this.storageService.updateSavedNotes(notes);
    }

    public deleteAllNotes(): void {
        this.storageService.updateSavedNotes([]);
    }
}
