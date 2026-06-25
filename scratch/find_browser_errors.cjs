const fs = require('fs');

const transcriptPath = 'C:\\Users\\ndens\\.gemini\\antigravity-ide\\brain\\393a5415-900c-46d4-8c58-b70c004628a2\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.type === 'RUN_COMMAND' || obj.type === 'CAPTURE_BROWSER_CONSOLE_LOGS' || obj.type === 'BROWSER_SUBAGENT') {
            // Check if content or output contains console logs
            const text = obj.content || obj.output || '';
            if (text.includes('ReferenceError') || text.includes('uncaught') || text.includes('Error') || text.includes('fail')) {
                console.log(`--- STEP ${obj.step_index} (${obj.type}) ---`);
                console.log(text.substring(0, 2000));
            }
        }
        if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
                if (tc.name === 'browser_subagent') {
                    console.log(`--- SUBAGENT CALL ---`);
                    console.log(JSON.stringify(tc, null, 2));
                }
            }
        }
    } catch (e) {}
}
