// ============================================
// DHRYZN — Theme & Accent Color Utilities
// ============================================

/**
 * Apply an accent color hex to all derived CSS custom properties.
 * This updates --color-primary, --color-primary-rgb, --color-primary-light,
 * and --color-primary-dark so all CSS variables that reference them update too.
 */
export function applyAccentColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Compute lighter variant (mix with white ~25%)
  const lr = Math.min(255, r + Math.round((255 - r) * 0.25));
  const lg = Math.min(255, g + Math.round((255 - g) * 0.25));
  const lb = Math.min(255, b + Math.round((255 - b) * 0.25));
  const lightHex = `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;

  // Compute darker variant (mix with black ~25%)
  const dr = Math.round(r * 0.75);
  const dg = Math.round(g * 0.75);
  const db = Math.round(b * 0.75);
  const darkHex = `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', hex);
  root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--color-primary-light', lightHex);
  root.style.setProperty('--color-primary-dark', darkHex);
}

/**
 * Apply theme (dark or light) by setting the data-theme attribute on <html>.
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
