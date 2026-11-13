export const Directory = { Cache: 'CACHE' };
export const Encoding = { UTF8: 'utf8' };
export const Filesystem = { writeFile: async o => { (window.__fs = window.__fs || []).push(o); return { uri: 'file:///cache/' + o.path }; } };
