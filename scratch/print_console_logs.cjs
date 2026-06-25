const fs = require('fs');

const transcriptPath = 'C:\\Users\\ndens\\.gemini\\antigravity-ide\\brain\\393a5415-900c-46d4-8c58-b70c004628a2\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        // Look for the browser subagent's steps or output
        if (obj.output && (obj.output.includes('console') || obj.output.includes('log') || obj.output.includes('error') || obj.output.includes('ReferenceError') || obj.output.includes('Uncaught'))) {
            console.log(`=== Step ${obj.step_index} output ===`);
            console.log(obj.output);
        }
        if (obj.content && (obj.content.includes('console') || obj.content.includes('log') || obj.content.includes('error') || obj.content.includes('ReferenceError') || obj.content.includes('Uncaught'))) {
            console.log(`=== Step ${obj.step_index} content ===`);
            console.log(obj.content);
        }
    } catch (e) {}
}
