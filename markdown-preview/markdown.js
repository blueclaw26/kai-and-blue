// Markdown Parser & Editor Logic — no external dependencies

const DEFAULT_CONTENT = `# Markdown Cheat Sheet

Welcome to the **Markdown Preview** app! Edit this text to see the preview update in real-time.

---

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4

---

## Text Formatting

This is **bold text** and this is *italic text*.

You can also use ~~strikethrough~~ for deleted text.

Combine them: ***bold and italic***.

---

## Links & Images

[Visit GitHub](https://github.com)

![Sample Image](https://via.placeholder.com/300x100/e0ddd8/333?text=Markdown+Preview)

---

## Code

Inline code: \`console.log("hello")\`

Fenced code block:

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("world"));
\`\`\`

---

## Lists

### Unordered
- First item
- Second item
- Third item

### Ordered
1. Step one
2. Step two
3. Step three

---

## Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

---

## Horizontal Rule

Three dashes make a line:

---

## Line Breaks

This line has
a single newline (becomes a <br>).

This is a new paragraph after a blank line.

---

Happy writing! ✍️
`;

// --- Markdown Parser ---

function parseMarkdown(src) {
  // Normalize line endings
  src = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  let html = '';
  const lines = src.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```(.*)$/.test(line)) {
      const lang = line.match(/^```(.*)$/)[1].trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const escaped = escapeHtml(codeLines.join('\n'));
      html += lang
        ? `<pre><code class="language-${escapeHtml(lang)}">${escaped}</code></pre>\n`
        : `<pre><code>${escaped}</code></pre>\n`;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line) || /^___+\s*$/.test(line)) {
      html += '<hr>\n';
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html += `<h${level}>${inlineFormat(headingMatch[2])}</h${level}>\n`;
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      html += `<blockquote><p>${inlineFormat(quoteLines.join('<br>'))}</p></blockquote>\n`;
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      html += '<ul>\n';
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        const content = lines[i].replace(/^[-*+]\s+/, '');
        html += `<li>${inlineFormat(content)}</li>\n`;
        i++;
      }
      html += '</ul>\n';
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      html += '<ol>\n';
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\d+\.\s+/, '');
        html += `<li>${inlineFormat(content)}</li>\n`;
        i++;
      }
      html += '</ol>\n';
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^```/.test(lines[i]) &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i]) &&
      !/^\*\*\*+\s*$/.test(lines[i]) &&
      !/^___+\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      html += `<p>${inlineFormat(paraLines.join('<br>'))}</p>\n`;
    }
  }

  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text) {
  // Images (before links)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // Inline code (before bold/italic to avoid conflicts)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

  return text;
}

// --- DOM Setup ---

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');

function updatePreview() {
  preview.innerHTML = parseMarkdown(editor.value);
}

// Real-time preview
editor.addEventListener('input', updatePreview);

// Tab key inserts spaces
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    updatePreview();
  }
});

// Copy HTML
copyBtn.addEventListener('click', () => {
  const html = parseMarkdown(editor.value);
  navigator.clipboard.writeText(html).then(() => {
    const orig = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => { copyBtn.textContent = orig; }, 1500);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = html;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const orig = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => { copyBtn.textContent = orig; }, 1500);
  });
});

// Clear
clearBtn.addEventListener('click', () => {
  editor.value = '';
  updatePreview();
  editor.focus();
});

// Initialize with default content
editor.value = DEFAULT_CONTENT;
updatePreview();
