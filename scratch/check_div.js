const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/DrawingManager.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// A simple stack-based JSX tag parser to find unclosed tags
function findUnclosedTags(code) {
    const regex = /<\/?([a-zA-Z0-9_:]+)(?:\s+[^>]*?)?(\/?)>/g;
    const stack = [];
    let match;
    let lines = code.split('\n');

    // Helper to get line number from character index
    function getLineNumber(index) {
        let count = 0;
        for (let i = 0; i < lines.length; i++) {
            count += lines[i].length + 1; // +1 for newline
            if (count > index) return i + 1;
        }
        return lines.length;
    }

    // Strip comments to avoid matching commented-out tags
    // Block comments
    let cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
    // Line comments
    cleanCode = cleanCode.replace(/\/\/.*$/gm, m => ' '.repeat(m.length));
    // JSX comments {/* ... */}
    cleanCode = cleanCode.replace(/\{\/\*[\s\S]*?\*\/\}/g, m => ' '.repeat(m.length));

    // Simple regex matching tag structure
    const tagRegex = /<(\/)?([a-zA-Z0-9_:]+)([^>]*?)>/g;

    while ((match = tagRegex.exec(cleanCode)) !== null) {
        const fullTag = match[0];
        const isClosing = !!match[1];
        const tagName = match[2];
        const attrs = match[3];
        const isSelfClosing = attrs.endsWith('/') || fullTag.endsWith('/>');
        const index = match.index;
        const line = getLineNumber(index);

        // Ignore certain tags that are standard or self-closing
        if (isSelfClosing) continue;
        // Ignore standard html self-closing tags if written without trailing slash
        if (['img', 'input', 'br', 'hr', 'link', 'meta'].includes(tagName.toLowerCase())) continue;

        if (isClosing) {
            if (stack.length === 0) {
                console.log(`Error: Extra closing tag </${tagName}> at line ${line}`);
            } else {
                const last = stack.pop();
                if (last.name !== tagName) {
                    console.log(`Mismatched tag at line ${line}: Closed </${tagName}> but expected </${last.name}> (opened at line ${last.line})`);
                }
            }
        } else {
            stack.push({ name: tagName, line: line });
        }
    }

    if (stack.length > 0) {
        console.log("Unclosed tags remaining on stack:");
        stack.forEach(t => {
            console.log(`  <${t.name}> opened at line ${t.line}`);
        });
    } else {
        console.log("All tags matched successfully!");
    }
}

findUnclosedTags(content);
