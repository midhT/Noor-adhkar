'use strict';
// Static checks: ambience is gone, accent colours remain, fluid-motion pieces are present and cheap.
const fs = require('fs'), assert = require('assert');
const read = p => fs.readFileSync(p, 'utf8');
const theme = read('www/theme.css'), accent = read('www/accent.js'), quran = read('www/quran-reader.css') + read('www/quran-reader.js');
assert(!/ambient|ambience/i.test(theme + accent + quran), 'no ambience layer anywhere in the app');
assert(!/background-attachment:\s*fixed/.test(theme), 'no fixed-attachment page wash (repaints on every scroll frame)');
assert(accent.includes("'--accent'") && accent.includes("'--on-accent'"), 'accent colour feature is intact');
assert(theme.includes('.nav-pill') && read('www/motion.js').includes('nav-pill'), 'tab pill morph is present');
assert(theme.includes('.screen.leaving') && read('www/app.js').includes('function leaveScreen'), 'leaving screens cross-fade');
assert(!/backdrop-filter:\s*blur/.test(quran), 'player uses no backdrop blur');
assert(quran.includes('prefers-reduced-motion') && theme.includes('body.lite .screen.leaving'), 'reduced motion / Smooth mode switch the morphs off');
console.log('Fluid motion and ambience-removal checks passed.');
