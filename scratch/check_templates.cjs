const fs = require('fs');

const catalogContent = fs.readFileSync('c:/Users/ndens/mavi-core/src/utils/appStoreCatalog.jsx', 'utf-8');
const appStoreContent = fs.readFileSync('c:/Users/ndens/mavi-core/src/components/AppStore.jsx', 'utf-8');

// Match template ids in catalog
const catalogMatches = [...catalogContent.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);

// Match template ids in AppStore.jsx
const appStoreMatches = [...appStoreContent.matchAll(/templateId === ['"]([^'"]+)['"]/g)].map(m => m[1]);

console.log('Catalog templates count:', catalogMatches.length);
console.log('AppStore handled count:', appStoreMatches.length);

const missingInAppStore = catalogMatches.filter(id => !appStoreMatches.includes(id));
console.log('Missing in AppStore install handler:', missingInAppStore);
