/* Naseem V4.0.1 — persistent seven-choice accent system. */
(() => {
  'use strict';
  const KEY = 'noorAccentV1';
  const PRESETS = {
    emerald: '#20a875',
    forest: '#2f9b63',
    blue: '#4f8fe8',
    purple: '#9a7bea',
    gold: '#c4a15b',
    silver: '#a8b3c2'
  };
  const labels = { emerald: 'Islamic emerald', forest: 'Deep forest green', blue: 'Royal blue', purple: 'Midnight purple', gold: 'Muted gold', silver: 'Silver / grey', custom: 'Custom colour' };
  const validHex = value => /^#[0-9a-f]{6}$/i.test(value || '');
  const clamp = n => Math.max(0, Math.min(255, n));
  function shade(hex, factor) {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    return '#' + rgb.map(v => clamp(Math.round(v * factor)).toString(16).padStart(2, '0')).join('');
  }
  function contrast(hex) {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] > .42 ? '#151515' : '#ffffff';
  }
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      const preset = Object.hasOwn(PRESETS, value.preset) || value.preset === 'custom' ? value.preset : 'emerald';
      const color = preset === 'custom' && validHex(value.color) ? value.color : (PRESETS[preset] || PRESETS.emerald);
      return { preset, color };
    } catch (_) { return { preset: 'emerald', color: PRESETS.emerald }; }
  }
  function apply(value) {
    const color = validHex(value.color) ? value.color : PRESETS.emerald;
    // body.light in theme.css redefines --gold/--accent on <body>, which shadows anything set on <html>.
    // Set the variables on both so the chosen accent wins in light and dark themes.
    const dark = shade(color, .72);
    [document.documentElement, document.body].filter(Boolean).forEach(root => {
      root.style.setProperty('--gold', color);
      root.style.setProperty('--gold2', dark);
      root.style.setProperty('--accent', color);
      root.style.setProperty('--on-accent', contrast(color));
      root.style.setProperty('--accent-soft', `color-mix(in srgb, ${color} 14%, transparent)`);
      root.style.setProperty('--accent-line', `color-mix(in srgb, ${color} 28%, transparent)`);
    });
    document.querySelectorAll('.accent-swatch span').forEach(el => {
      if (el.parentElement?.dataset.accent === value.preset) el.style.setProperty('--swatch', color);
    });
  }
  function set(preset, customColor) {
    if (!Object.hasOwn(PRESETS, preset) && preset !== 'custom') return get();
    const color = preset === 'custom' ? (validHex(customColor) ? customColor : PRESETS.emerald) : PRESETS[preset];
    const value = { preset, color };
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (_) {}
    apply(value);
    return value;
  }
  function get() { return read(); }
  window.NaseemAccent = { get, set, presets: { ...PRESETS }, labels: { ...labels } };
  apply(read());
})();
