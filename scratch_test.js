const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\ACER\\.gemini\\antigravity-cli\\brain\\c1636281-c9e6-418f-a3bc-c58756611690\\.system_generated\\steps\\6\\content.md';
const content = fs.readFileSync(filePath, 'utf8');

// Strip HTML tags and entities
let textContent = content
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

fs.writeFileSync('C:\\Users\\ACER\\mavi-core\\scratch_clean.txt', textContent, 'utf8');
console.log("Cleaned text content length:", textContent.length);

