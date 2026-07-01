(function () {
  function hexToHsl(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    let rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    let gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    let bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  }

  // Theme auto generator
  function generateThemeFromColor(baseHex, modeStyle) {
    const hsl = hexToHsl(baseHex);
    const h = hsl.h;
    const s = hsl.s;
    const l = hsl.l;

    const colors = {};

    if (modeStyle === 'light') {
      colors['--app-bg'] = hslToHex(h, Math.min(s, 20), 96);
      colors['--surface-card'] = '#ffffff';
      colors['--surface-elevated'] = hslToHex(h, Math.min(s, 15), 98);
      colors['--surface-soft'] = hslToHex(h, Math.min(s, 20), 94);
      
      const textPrimaryHex = hslToHex(h, Math.min(s, 30), 12);
      colors['--text-primary'] = textPrimaryHex;
      colors['--text-secondary'] = hslToHex(h, Math.min(s, 25), 32);
      
      const textMutedHex = hslToHex(h, Math.min(s, 20), 52);
      colors['--text-muted'] = textMutedHex;
      
      colors['--accent'] = baseHex;
      colors['--link-accent'] = hslToHex(h, s, Math.max(l - 8, 20));
      colors['--link-accent-hover'] = hslToHex(h, s, Math.max(l - 15, 12));
      colors['--text-white'] = l > 60 ? textPrimaryHex : '#ffffff';
    } else if (modeStyle === 'soft') {
      // Soft theme: warm pastel, light cream
      colors['--app-bg'] = hslToHex(h, Math.min(s, 22), 95);
      colors['--surface-card'] = hslToHex(h, Math.min(s, 10), 98);
      colors['--surface-elevated'] = hslToHex(h, Math.min(s, 8), 99);
      colors['--surface-soft'] = hslToHex(h, Math.min(s, 22), 91);
      
      const textPrimaryHex = hslToHex(h, Math.min(s, 20), 24);
      colors['--text-primary'] = textPrimaryHex;
      colors['--text-secondary'] = hslToHex(h, Math.min(s, 18), 40);
      
      const textMutedHex = hslToHex(h, Math.min(s, 15), 58);
      colors['--text-muted'] = textMutedHex;
      
      colors['--accent'] = baseHex;
      colors['--link-accent'] = hslToHex(h, s, Math.max(l - 4, 30));
      colors['--link-accent-hover'] = hslToHex(h, s, Math.max(l - 12, 22));
      colors['--text-white'] = '#ffffff';
    } else if (modeStyle === 'dim') {
      // Dim theme: slate blue/dark, low contrast dark
      colors['--app-bg'] = hslToHex(h, Math.min(s, 25), 15);
      colors['--surface-card'] = hslToHex(h, Math.min(s, 22), 20);
      colors['--surface-elevated'] = hslToHex(h, Math.min(s, 22), 24);
      colors['--surface-soft'] = hslToHex(h, Math.min(s, 22), 17);
      
      colors['--text-primary'] = hslToHex(h, Math.min(s, 10), 94);
      colors['--text-secondary'] = hslToHex(h, Math.min(s, 12), 78);
      
      const textMutedHex = hslToHex(h, Math.min(s, 15), 58);
      colors['--text-muted'] = textMutedHex;
      
      const brightAccentHex = hslToHex(h, s, Math.max(l, 50));
      colors['--accent'] = brightAccentHex;
      
      colors['--link-accent'] = hslToHex(h, s, Math.max(l, 55));
      colors['--link-accent-hover'] = hslToHex(h, s, Math.max(l + 10, 65));
      colors['--surface-shadow'] = '0 18px 38px rgba(0, 0, 0, 0.35)';
      colors['--text-white'] = '#ffffff';
    } else {
      // Dark Style
      colors['--app-bg'] = hslToHex(h, Math.min(s, 18), 8);
      colors['--surface-card'] = hslToHex(h, Math.min(s, 15), 14);
      colors['--surface-elevated'] = hslToHex(h, Math.min(s, 18), 18);
      colors['--surface-soft'] = hslToHex(h, Math.min(s, 15), 12);
      
      colors['--text-primary'] = hslToHex(h, Math.min(s, 10), 94);
      colors['--text-secondary'] = hslToHex(h, Math.min(s, 12), 78);
      
      const textMutedHex = hslToHex(h, Math.min(s, 15), 58);
      colors['--text-muted'] = textMutedHex;
      
      const brightAccentHex = hslToHex(h, s, Math.max(l, 50));
      colors['--accent'] = brightAccentHex;
      
      colors['--link-accent'] = hslToHex(h, s, Math.max(l, 55));
      colors['--link-accent-hover'] = hslToHex(h, s, Math.max(l + 10, 65));
      colors['--surface-shadow'] = '0 18px 38px rgba(0, 0, 0, 0.45)';
      colors['--text-white'] = '#ffffff';
    }
    return colors;
  }

  // Apply active theme to the popup UI dynamically
  function applyThemeToPopup(themeName, customColors, isWallpaper, wallpaperOpacity) {
    const theme = window.NamiThemes[themeName] || window.NamiThemes['default'] || { colors: {} };
    let colors = { ...theme.colors };

    if (themeName === 'custom') {
      const defaultColors = window.NamiThemes['default'] ? window.NamiThemes['default'].colors : {};
      colors = { ...defaultColors, ...customColors };
    }
    if (window.NamiThemeUtils && typeof window.NamiThemeUtils.normalizeThemeColors === 'function') {
      colors = window.NamiThemeUtils.normalizeThemeColors(colors);
    }

    const root = document.documentElement;
    const body = document.body;

    const hexToRgbaStr = (hex, alpha) => {
      const match = hex.trim().match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i) ||
        (hex.trim().length === 4 && hex.trim().match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i));
      if (match) {
        let r, g, b;
        if (hex.trim().length === 4) {
          r = parseInt(match[1] + match[1], 16);
          g = parseInt(match[2] + match[2], 16);
          b = parseInt(match[3] + match[3], 16);
        } else {
          r = parseInt(match[1], 16);
          g = parseInt(match[2], 16);
          b = parseInt(match[3], 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return hex;
    };

    if (isWallpaper) {
      body.classList.add('has-wallpaper');
      const opacityVal = wallpaperOpacity !== undefined ? wallpaperOpacity / 100 : 0.6;
      root.style.setProperty('--pop-bg', 'transparent');
      root.style.setProperty('--pop-surface', hexToRgbaStr(colors['--surface-card'] || '#ffffff', opacityVal));
    } else {
      body.classList.remove('has-wallpaper');
      body.style.backgroundImage = '';
      root.style.setProperty('--pop-bg', colors['--app-bg']);
      root.style.setProperty('--pop-surface', colors['--surface-card']);
    }

    root.style.setProperty('--pop-border', colors['--border-soft'] || 'rgba(152, 168, 187, .28)');
    root.style.setProperty('--pop-text', colors['--text-primary']);
    root.style.setProperty('--pop-text-secondary', colors['--text-secondary']);
    root.style.setProperty('--pop-text-muted', colors['--text-muted']);
    root.style.setProperty('--pop-scrollbar-track', colors['--scrollbar-track'] || colors['--app-bg']);
    root.style.setProperty('--pop-scrollbar-thumb', colors['--scrollbar-thumb'] || colors['--border-soft'] || colors['--text-muted']);
    root.style.setProperty('--pop-scrollbar-thumb-hover', colors['--scrollbar-thumb-hover'] || colors['--link-accent-hover'] || colors['--accent']);
    root.style.setProperty('--pop-scrollbar-thumb-border', colors['--scrollbar-thumb-border'] || colors['--app-bg']);
    
    // Accents
    root.style.setProperty('--accent', colors['--accent']);
    root.style.setProperty('--accent-soft', colors['--accent-soft']);
    root.style.setProperty('--accent-hover', colors['--link-accent-hover'] || colors['--accent']);
  }

  // Expose to window namespace
  window.NamiColorUtils = {
    hexToHsl,
    hslToHex,
    generateThemeFromColor,
    applyThemeToPopup
  };
})();
