const fs = require('fs');
let code = fs.readFileSync('src/components/AppBuilder.jsx', 'utf8');

// The lines to move
const toMove = [
    `    const [publishModal, setPublishModal] = useState({ isOpen: false, url: '' });`,
    `    const [proPrompt, setProPrompt] = useState({`,
    `        isOpen: false, title: '', message: '', initialValue: '', onConfirm: null`,
    `    });`,
    `    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);`,
    `    const loadApps = async () => {`,
    `        try {`,
    `            const data = await getAllFrontlineApps();`,
    `            setAppsList(data);`,
    `        } catch (err) {`,
    `            console.error('Failed to load apps:', err);`,
    `        }`,
    `    };`
];

// 1. Remove them from original positions
// publishModal
code = code.replace(`    const [publishModal, setPublishModal] = useState({ isOpen: false, url: '' });\n`, '');

// proPrompt
const proPromptRegex = /    const \[proPrompt, setProPrompt\] = useState\(\{\n        isOpen: false, title: '', message: '', initialValue: '', onConfirm: null\n    \}\);\n/;
code = code.replace(proPromptRegex, '');

// isCreateDrawerOpen
code = code.replace(`    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);\n`, '');

// loadApps
const loadAppsRegex = /    const loadApps = async \(\) => \{\n        try \{\n            const data = await getAllFrontlineApps\(\);\n            setAppsList\(data\);\n        \} catch \(err\) \{\n            console\.error\('Failed to load apps:', err\);\n        \}\n    \};\n/;
code = code.replace(loadAppsRegex, '');

// 2. Insert them before useAppBuilderProject
const blockToInsert = toMove.join('\n') + '\n\n';
code = code.replace(`    const {\n        handleCreateTemplateApp`, blockToInsert + `    const {\n        handleCreateTemplateApp`);

fs.writeFileSync('src/components/AppBuilder.jsx', code);
console.log('Moved state declarations and loadApps to the top!');
