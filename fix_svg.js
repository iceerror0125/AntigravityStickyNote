const fs = require('fs');
const p = 'c:/Users/vh/Projects/CustomExtension/src/views/HtmlProvider.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/<svg>/g, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">');
c = c.replace(/<svg style="width:14px; height:14px; stroke:rgba\(255,255,255,0\.5\); fill:none;">/g, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:14px; height:14px; stroke:rgba(255,255,255,0.5); fill:none;">');
c = c.replace(/<svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;">/g, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;">');
c = c.replace(/<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;">/g, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;">');

c = c.replace('background: transparent;\n            border: none;\n            color: var(--vscode-foreground);', 'background: var(--glass-bg);\n            border: 1px solid var(--glass-border);\n            color: var(--vscode-foreground);');

fs.writeFileSync(p, c);
