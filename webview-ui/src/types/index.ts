export interface SavedNote {
  id: string;
  title: string;
  content: string;
  preview: string;
}

export interface SavedTheme {
  bg: string;
  fg: string;
}

export interface EditorFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}
