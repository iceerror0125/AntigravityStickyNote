# Custom Panel Extension

A customizable panel extension for Antigravity/VS Code that adds a resizable panel above the **Outline** view in the Explorer sidebar.

## Features

- 🎨 **Change Background Color**: Pick from 12 preset colors or use the color picker for any custom color
- ✍️ **Write Text**: Built-in text editor with character count
- 💾 **Auto-Save**: Text and color preferences are automatically saved across sessions
- 🔤 **Bold Toggle**: Toggle bold text formatting
- 🗑 **Clear Text**: Quickly clear all written text
- 🔄 **Reset Settings**: Reset everything to defaults

## Commands

| Command | Description |
|---------|-------------|
| `Custom Panel: Change Background Color` | Enter a CSS color to change the panel background |
| `Custom Panel: Clear Text` | Clear all text in the panel |
| `Custom Panel: Reset Settings` | Reset background color and text to defaults |

## Installation

1. Compile the extension:
   ```bash
   npm install
   npm run compile
   ```

2. Package as VSIX (optional):
   ```bash
   npx @vscode/vsce package
   ```

3. Install the `.vsix` file in Antigravity/VS Code via "Install from VSIX..."

## Development

```bash
npm install
npm run watch   # Auto-compile on changes
```

Press **F5** in VS Code/Antigravity to launch the Extension Development Host.
