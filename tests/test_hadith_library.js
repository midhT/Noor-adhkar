const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'www/hadith-library.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'www/features-v404.css'), 'utf8');
for (const token of [
  'https://hadeethenc.com/api/v1',
  '/categories/roots/',
  '/hadeeths/list/',
  '/hadeeths/one/',
  "'ar'", "'en'", "'ur'",
  'AbortController', 'encodeURIComponent', 'textContent'
]) if (!js.includes(token)) throw new Error(`Missing Hadith integration safeguard/endpoint: ${token}`);
if (!html.includes('<script src="hadith-library.js"></script>')) throw new Error('Hadith module is not loaded');
if (!js.includes('not a complete digital edition') || !js.includes('not bundled')) throw new Error('Source scope and online-only disclaimer missing');
if (!css.includes('.hadith-result')) throw new Error('Hadith UI styles missing');
console.log('Hadith Library integration static checks passed.');
