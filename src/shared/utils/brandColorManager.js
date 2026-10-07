import defaultLogo from '../../assets/logos/logo-official.png';

/**
 * Convert HEX to HSL
 * @param {string} hex - e.g. "#F86F03" or "#2563EB"
 * @returns {{ h: number, s: number, l: number }}
 */
function hexToHsl(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to HEX
 * @param {number} h - 0 to 360
 * @param {number} s - 0 to 100
 * @param {number} l - 0 to 100
 * @returns {string} 7-char hex "#RRGGBB"
 */
function hslToHex(h, s, l) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = n => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = n => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Convert HEX to RGB triplet
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

/**
 * Generates an 11-step color palette from a single primary hex color.
 * Shades: 50, 100, 200, 300, 400, 500 (anchor), 600, 700, 800, 900, plus rgb string.
 * @param {string} primaryHex
 * @returns {Record<string, string>}
 */
export function generateBrandPalette(primaryHex) {
  const hex = /^#([A-Fa-f0-9]{6})$/.test(primaryHex) ? primaryHex : '#F86F03';
  const { h, s, l } = hexToHsl(hex);
  const { r, g, b } = hexToRgb(hex);

  return {
    50:  hslToHex(h, Math.min(s, 95), Math.min(97, l + (100 - l) * 0.92)),
    100: hslToHex(h, Math.min(s, 90), Math.min(93, l + (100 - l) * 0.82)),
    200: hslToHex(h, Math.min(s, 85), Math.min(85, l + (100 - l) * 0.65)),
    300: hslToHex(h, s,               Math.min(74, l + (100 - l) * 0.45)),
    400: hslToHex(h, s,               Math.min(62, l + (100 - l) * 0.22)),
    500: hex, // The exact user-selected anchor
    600: hslToHex(h, Math.min(100, s * 1.05), Math.max(10, l * 0.88)),
    700: hslToHex(h, Math.min(100, s * 1.10), Math.max(8,  l * 0.74)),
    800: hslToHex(h, Math.min(100, s * 1.15), Math.max(6,  l * 0.58)),
    900: hslToHex(h, Math.min(100, s * 1.20), Math.max(4,  l * 0.42)),
    rgb: `${r}, ${g}, ${b}`,
    raw: { r, g, b, h, s, l },
  };
}

/**
 * Injects CSS custom properties into document.documentElement (:root)
 * Sets:
 *  --brand-50 .. --brand-900
 *  --brand-rgb
 *  --color-primary
 *  --color-primary-hover
 * @param {string} primaryHex
 * @returns {Record<string, string>}
 */
export function applyBrandTheme(primaryHex) {
  if (typeof document === 'undefined') return {};
  const palette = generateBrandPalette(primaryHex);
  const root = document.documentElement;

  Object.entries(palette).forEach(([key, val]) => {
    if (key !== 'raw') {
      root.style.setProperty(`--brand-${key}`, val);
    }
  });

  // Bridge legacy direct variables
  root.style.setProperty('--color-primary', palette[500]);
  root.style.setProperty('--color-primary-hover', palette[600]);

  return palette;
}

/**
 * Resets brand theme on :root back to default StackCode Orange (#F86F03)
 */
export function resetBrandTheme() {
  return applyBrandTheme('#F86F03');
}

/**
 * Logo Precedence Contract:
 * CompanySettings.companyLogo >> Company.logo >> Platform Default Asset
 * @param {object} user - The authenticated user object
 * @returns {string} URL or imported asset path
 */
export function getTenantLogo(user) {
  return (
    user?.companySettings?.companyLogo ||
    user?.company?.settings?.companyLogo ||
    user?.company?.logo ||
    defaultLogo
  );
}
