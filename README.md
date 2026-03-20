# Custom Panel Extension

A customizable panel extension for Antigravity/VS Code that adds a resizable notepad/panel above the **Outline** view in the Explorer sidebar.

## Features

- 🎨 **Theme Saving**: Pick a background and text color, then click `+` to save it as a theme. Click any saved theme swatch to apply it instantly!
- 🎨 **Inline Text Coloring**: Select any text and click the `A` inline color button to highlight or color specific words.
- 🖋️ **Direct Color Input**: Use the Native Color Picker or simply paste HEX codes directly into the text inputs.
- ✍️ **Write Text**: Built-in rich text editor with character count and font settings.
- 💾 **Auto-Save**: Text and color preferences are automatically saved across sessions.
- 🔤 **Formatting**: Toggle bold, italic, and underline text formatting.
- 🗑 **Clear Text**: Quickly clear all written text.
- 🔄 **Reset Settings**: Reset everything to defaults.

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
   npx vsce package
   ```

3. Install the `.vsix` file in Antigravity/VS Code via "Install from VSIX..."

## Development

```bash
npm install
npm run watch   # Auto-compile on changes
```

Press **F5** in VS Code/Antigravity to launch the Extension Development Host.
