'use strict';
// Static checks: ambience is gone, accent colours remain, fluid-motion pieces are present and cheap.
const fs = require('fs'), assert = require('assert');
const read = p => fs.readFileSync(p, 'utf8');
const theme = read('www/theme.css'), accent = read('www/accent.js'), quran = read('www/quran-reader.css') + read('www/quran-reader.js');
assert(!/ambient|ambience/i.test(theme + accent + quran), 'no ambience layer anywhere in the app');
assert(!/background-attachment:\s*fixed/.test(theme), 'no fixed-attachment page wash (repaints on every scroll frame)');
assert(accent.includes("'--accent'") && accent.includes("'--on-accent'"), 'accent colour feature is intact');
assert(theme.includes('.nav-pill') && read('www/motion.js').includes('nav-pill'), 'tab pill morph is present');
assert(/\.bottom-nav\s*\{[^}]*backdrop-filter:blur\(24px\)/s.test(theme), 'bottom navigation uses the requested Liquid Glass treatment');
assert(theme.includes('.screen.leaving') && read('www/app.js').includes('function leaveScreen'), 'leaving screens cross-fade');
const glassRules=[...quran.matchAll(/([^{}]+)\{[^{}]*backdrop-filter:\s*blur/gi)].map(m=>m[1]);
assert(glassRules.length>0 && glassRules.every(selector=>/\.qr-full-seek|\.qr-seek/.test(selector)), 'liquid glass is restricted to Quran seek bars');
assert(/\.qr-player\s*\{[^}]*backdrop-filter:\s*none/s.test(quran), 'mini player remains solid rather than glass');
assert(quran.includes('prefers-reduced-motion') && theme.includes('body.lite .screen.leaving'), 'reduced motion / Smooth mode switch the morphs off');
console.log('Fluid motion and ambience-removal checks passed.');
