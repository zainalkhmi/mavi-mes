const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\ACER\\.gemini\\antigravity-cli\\brain\\915d5264-ae11-42e4-8874-3ee84ebaff46\\.system_generated\\steps\\10\\content.md';
const content = fs.readFileSync(filePath, 'utf8');

// Use simple regex to find sections/headers or key phrases
const lines = content.split('\n');
console.log("Total lines:", lines.length);

// Let's print out lines containing text that look like headings or main sections
const headings = [];
const matches = content.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi);
if (matches) {
  matches.forEach(m => {
    // Strip HTML tags
    const text = m.replace(/<[^>]*>/g, '').trim();
    if (text) headings.push(text);
  });
}

console.log("FOUND HEADINGS:");
headings.slice(0, 50).forEach((h, i) => console.log(`${i+1}: ${h}`));
