const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/DrawingManager.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `                                             </MLightCadViewer>\n                                         </Suspense>\n                                                                              </Suspense>\n                                      )}`;

const replaceStr = `                                             </MLightCadViewer>
                                         </Suspense>
                                     )}`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetStr.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
    const updated = normalizedContent.replace(normalizedTarget, replaceStr.replace(/\r\n/g, '\n'));
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('REPLACED_CLEANLY');
} else {
    console.log('NOT_FOUND, attempting regex replace...');
    const regex = /<\/MLightCadViewer>\s*<\/Suspense>\s*<\/Suspense>\s*\)}/;
    const updated = normalizedContent.replace(regex, `</MLightCadViewer>\n                                         </Suspense>\n                                     )}`);
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('REGEX_REPLACED');
}
