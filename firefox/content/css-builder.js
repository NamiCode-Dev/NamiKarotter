(function () {
  const THEME_STYLE_ID = 'namikarotter-custom-style';
  const DEFAULT_FONT_STACK = '"Noto Sans JP", "Inter", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", sans-serif';
  let themeStylePriorityObserver = null;
  let themeStylePriorityTarget = null;
  let themeStylePriorityQueued = false;

  function placeThemeStyleLast(styleEl) {
    const container = document.head || document.documentElement;
    if (!container) return;

    if (styleEl.parentNode !== container || container.lastElementChild !== styleEl) {
      container.appendChild(styleEl);
    }
  }

  function scheduleThemeStylePriority() {
    if (themeStylePriorityQueued) return;
    themeStylePriorityQueued = true;

    const applyPriority = () => {
      themeStylePriorityQueued = false;
      const styleEl = document.getElementById(THEME_STYLE_ID);
      if (styleEl) placeThemeStyleLast(styleEl);
      startThemeStylePriorityObserver();
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(applyPriority);
    } else {
      setTimeout(applyPriority, 0);
    }
  }

  function startThemeStylePriorityObserver() {
    const target = document.head || document.documentElement;
    if (!target || themeStylePriorityTarget === target) return;

    if (themeStylePriorityObserver) {
      themeStylePriorityObserver.disconnect();
    }

    themeStylePriorityObserver = new MutationObserver(scheduleThemeStylePriority);
    themeStylePriorityObserver.observe(target, { childList: true });
    themeStylePriorityTarget = target;
  }

  function loadFont(fontName) {
    let fontLink = document.getElementById('namikarotter-font-link');
    if (!fontName || fontName === 'custom-uploaded') {
      if (fontLink) fontLink.remove();
      return;
    }

    // Check if it's already loaded
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;700&display=swap`;
    if (fontLink && fontLink.getAttribute('href') === fontUrl) {
      return;
    }

    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'namikarotter-font-link';
      fontLink.rel = 'stylesheet';
      (document.head || document.documentElement).appendChild(fontLink);
    }
    fontLink.href = fontUrl;
  }

  // Apply styles to document
  function applyStyles(themeName, customColors, fontName, wallpaper, extensions, customFontUrl, hideVerified, hideBot, hideParody, disableProStyle, hideBadgePill, hideKawaiiLogo, hideLogo) {
    // 1. Handle Font loading
    loadFont(fontName);

    // 2. Build CSS text
    let cssText = '';

    if (fontName === 'custom-uploaded' && customFontUrl) {
      let format = 'truetype';
      if (customFontUrl.includes('data:font/woff2') || customFontUrl.includes('data:application/font-woff2')) {
        format = 'woff2';
      } else if (customFontUrl.includes('data:font/woff') || customFontUrl.includes('data:application/font-woff')) {
        format = 'woff';
      } else if (customFontUrl.includes('data:font/otf') || customFontUrl.includes('data:font/opentype') || customFontUrl.includes('data:application/x-font-opentype')) {
        format = 'opentype';
      }
      cssText += `
@font-face {
  font-family: 'CustomUploadedFont';
  src: url("${customFontUrl}") format("${format}");
}
`;
    }

    cssText += ':root {\n';

    // Get base colors from theme
    const theme = window.NamiThemes[themeName] || window.NamiThemes['default'] || { colors: {} };
    let colors = { ...theme.colors };

    // Overlay custom colors if theme is custom
    if (themeName === 'custom') {
      const defaultColors = window.NamiThemes['default'] ? window.NamiThemes['default'].colors : {};
      colors = { ...defaultColors, ...customColors };
    }
    if (window.NamiThemeUtils && typeof window.NamiThemeUtils.normalizeThemeColors === 'function') {
      colors = window.NamiThemeUtils.normalizeThemeColors(colors);
    }

    const surfaceCardHex = colors['--surface-card'] || '#ffffff';
    const isWallpaper = wallpaper && wallpaper.enable && wallpaper.url;
    const opacity = isWallpaper ? (wallpaper.opacity !== undefined ? wallpaper.opacity / 100 : 0.6) : 1.0;

    // Helper to convert hex to rgba
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

    // Append colors
    for (const [key, value] of Object.entries(colors)) {
      if (isWallpaper && (key === '--surface-card' || key === '--surface-elevated' || key === '--surface-soft')) {
        cssText += `  ${key}: ${hexToRgbaStr(value, opacity)} !important;\n`;
      } else {
        cssText += `  ${key}: ${value} !important;\n`;
      }
    }

    // Set background color on :root explicitly
    if (colors['--app-bg']) {
      if (isWallpaper) {
        cssText += `  background-color: transparent !important;\n`;
      } else {
        cssText += `  background-color: var(--app-bg) !important;\n`;
      }
    }

    // Generate --surface-card-80 dynamically to support transparent overlays (e.g. bg-white/80)
    if (colors['--surface-card']) {
      const hex = colors['--surface-card'].trim();
      const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i) ||
        (hex.length === 4 && hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i));
      if (match) {
        let r, g, b;
        if (hex.length === 4) {
          r = parseInt(match[1] + match[1], 16);
          g = parseInt(match[2] + match[2], 16);
          b = parseInt(match[3] + match[3], 16);
        } else {
          r = parseInt(match[1], 16);
          g = parseInt(match[2], 16);
          b = parseInt(match[3], 16);
        }
        const targetOpacity = isWallpaper ? opacity * 0.8 : 0.8;
        cssText += `  --surface-card-80: rgba(${r}, ${g}, ${b}, ${targetOpacity}) !important;\n`;
        const dropdownOpacity = isWallpaper ? Math.max(opacity, 0.95) : 0.95;
        cssText += `  --surface-card-dropdown: rgba(${r}, ${g}, ${b}, ${dropdownOpacity}) !important;\n`;
      } else {
        cssText += `  --surface-card-80: rgba(255, 255, 255, 0.8) !important;\n`;
        cssText += `  --surface-card-dropdown: rgba(255, 255, 255, 0.95) !important;\n`;
      }
    } else {
      cssText += `  --surface-card-80: rgba(255, 255, 255, 0.8) !important;\n`;
      cssText += `  --surface-card-dropdown: rgba(255, 255, 255, 0.95) !important;\n`;
    }

    // Generate --accent-soft-30 dynamically for mid-light elements (e.g. bg-blue-300)
    if (colors['--accent']) {
      const hex = colors['--accent'].trim();
      const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i) ||
        (hex.length === 4 && hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i));
      if (match) {
        let r, g, b;
        if (hex.length === 4) {
          r = parseInt(match[1] + match[1], 16);
          g = parseInt(match[2] + match[2], 16);
          b = parseInt(match[3] + match[3], 16);
        } else {
          r = parseInt(match[1], 16);
          g = parseInt(match[2], 16);
          b = parseInt(match[3], 16);
        }
        cssText += `  --accent-soft-30: rgba(${r}, ${g}, ${b}, 0.35) !important;\n`;
      } else {
        cssText += `  --accent-soft-30: rgba(29, 155, 240, 0.35) !important;\n`;
      }
    } else {
      cssText += `  --accent-soft-30: rgba(29, 155, 240, 0.35) !important;\n`;
    }

    // Append font family
    if (fontName) {
      if (fontName === 'custom-uploaded') {
        cssText += `  --app-font-family: "CustomUploadedFont", ${DEFAULT_FONT_STACK} !important;\n`;
      } else {
        cssText += `  --app-font-family: "${fontName}", ${DEFAULT_FONT_STACK} !important;\n`;
      }
    } else {
      cssText += `  --app-font-family: ${DEFAULT_FONT_STACK} !important;\n`;
    }

    // Apply wallpaper blur value to root variable
    const rawBlurPx = isWallpaper ? (wallpaper.blur !== undefined ? wallpaper.blur : 5) : 0;
    const blurPx = Math.max(Number(rawBlurPx) || 0, 0);
    const wallpaperBlurInsetPx = Math.max(blurPx * 2 + 2, 2);
    cssText += `  --wallpaper-blur: ${blurPx}px !important;\n`;

    cssText += '}\n';

    // background styles for wallpaper and container
    if (isWallpaper) {
      cssText += `
html {
  position: relative !important;
  isolation: isolate !important;
  min-height: 100% !important;
  background: transparent !important;
}
html::before {
  content: "" !important;
  position: fixed !important;
  inset: -${wallpaperBlurInsetPx}px !important;
  z-index: -1 !important;
  pointer-events: none !important;
  background-image: url("${wallpaper.url}") !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  filter: blur(var(--wallpaper-blur)) !important;
  transform: scale(1.04) !important;
  transform-origin: center !important;
}
.bg-\\[var\\(--app-bg\\)\\] {
  background-color: ${hexToRgbaStr(colors['--app-bg'] || '#ffffff', opacity)} !important;
}
`;
    } else {
      cssText += `
.bg-\\[var\\(--app-bg\\)\\] {
  background-color: var(--app-bg) !important;
}
`;
    }

    // Enforce font-family
    cssText += `
.shadow-\\[var\\(--surface-shadow\\)\\][data-namikarotter-has-current="true"] {
  backdrop-filter: blur(5px) !important;
  -webkit-backdrop-filter: blur(5px) !important;
}

body {
  position: relative !important;
  isolation: isolate !important;
  background: transparent !important;
}

body, input, button, select, textarea {
  font-family: var(--app-font-family) !important;
}

/* Tailwind utility class overrides for theme integration */
.bg-blue-600, .bg-blue-500, .bg-sky-600, .bg-sky-500 {
  background-color: var(--accent) !important;
}
.hover\\:bg-blue-700:hover, .hover\\:bg-blue-600:hover, .hover\\:bg-sky-700:hover, .hover\\:bg-sky-600:hover {
  background-color: var(--link-accent-hover) !important;
}
.text-blue-600, .text-blue-500, .text-sky-600, .text-sky-500 {
  color: var(--link-accent) !important;
}
.hover\\:text-blue-700:hover, .hover\\:text-blue-600:hover, .hover\\:text-sky-700:hover, .hover\\:text-sky-600:hover {
  color: var(--link-accent-hover) !important;
}
.border-blue-600, .border-blue-500, .border-sky-600, .border-sky-500 {
  border-color: var(--accent) !important;
}
.bg-blue-50, .bg-blue-100, .bg-sky-50, .bg-sky-100 {
  background-color: var(--accent-soft) !important;
}
.bg-blue-300, .bg-sky-300 {
  background-color: var(--accent-soft-30) !important;
}
/* Hide UI elements plugin */
[data-namikarotter-hidden-qr="true"] {
  display: none !important;
}
[data-namikarotter-hidden-copy="true"] {
  display: none !important;
}
${hideVerified ? `[aria-label*="認証済み"] { display: none !important; }\n` : ''}
${hideBot ? `[title="BOTアカウント"] { display: none !important; }\n` : ''}
${hideParody ? `[title="パロディアカウント"] { display: none !important; }\n` : ''}
${hideBadgePill ? `.badge-pill { display: none !important; }\n` : ''}
${hideKawaiiLogo ? `img[alt="New Logo Karotter"] { display: none !important; }\n` : ''}
${hideLogo ? `img[alt="Karotter"] { display: none !important; }\n` : ''}
${disableProStyle ? `
/* Disable Pro user decoration styles */
[style*="border-left"][style*="linear-gradient"] {
  border-left: none !important;
  background: var(--surface-card) !important;
}
.profile-pinned-section--accented,
.profile-accent-panel,
.profile-accent-topbar {
  background: var(--surface-card) !important;
}
.profile-accent-cover:after {
  background: transparent !important;
}
.profile-pinned-section {
  background: transparent !important;
}
` : ''}
/* Sidebar collapse CSS */
[data-namikarotter-collapsed="true"] > *:not(:first-child) {
  display: none !important;
}
[data-namikarotter-collapsed="true"] > div:first-child {
  border-bottom-color: transparent !important;
}


/* Simple URL Preview plugin */
.namikarotter-simple-url-preview a[class*="_linkCard_"] {
  transform: none !important;
}
/* Card WITH image */
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) {
  position: relative !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-end !important;
  aspect-ratio: 16 / 9 !important;
  height: auto !important;
  min-height: unset !important;
  background-color: var(--surface-soft, #f8fafc) !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) > [class*="_imageWrapper_"] {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 1 !important;
  border-bottom: 0 !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) > [class*="_imageWrapper_"] img {
  height: 100% !important;
  width: 100% !important;
  object-fit: cover !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) > [class*="_contentBody_"] {
  position: relative !important;
  z-index: 2 !important;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%) !important;
  color: #ffffff !important;
  padding: 16px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  border: 0 !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) > [class*="_contentBody_"] * {
  color: #ffffff !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) > [class*="_contentBody_"] [class*="_siteInfo_"] {
  display: none !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) > [class*="_contentBody_"] [class*="_previewTitle_"] {
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1.4 !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) > [class*="_contentBody_"] [class*="_previewDescription_"] {
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 12px !important;
  margin-top: 4px !important;
  line-height: 1.4 !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:has([class*="_previewImage_"]) > [class*="_contentBody_"] [class*="_urlText_"] {
  display: none !important;
}

/* Card WITHOUT image */
.namikarotter-simple-url-preview a[class*="_linkCard_"]:not(:has([class*="_previewImage_"])) {
  background-color: var(--surface-card, #ffffff) !important;
  display: block !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:not(:has([class*="_previewImage_"])) > [class*="_imageWrapper_"] {
  display: none !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:not(:has([class*="_previewImage_"])) > [class*="_contentBody_"] {
  padding: 16px !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:not(:has([class*="_previewImage_"])) [class*="_siteInfo_"] {
  font-size: 11px !important;
  margin-bottom: 4px !important;
  color: var(--text-muted, #94a3b8) !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:not(:has([class*="_previewImage_"])) [class*="_previewTitle_"] {
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1.4 !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:not(:has([class*="_previewImage_"])) [class*="_previewDescription_"] {
  font-size: 12px !important;
  margin-top: 6px !important;
  line-height: 1.4 !important;
  color: var(--text-secondary, #475569) !important;
}
.namikarotter-simple-url-preview a[class*="_linkCard_"]:not(:has([class*="_previewImage_"])) [class*="_urlText_"] {
  display: none !important;
}

/* Tailwind white opacity background override */
.bg-white\\/80 {
  background-color: var(--surface-card-80) !important;
}

/* Tailwind white text override */
.text-white {
  color: var(--text-white, #ffffff) !important;
}

/* Tailwind bg-gray-900 override */
.bg-gray-900 {
  background-color: var(--neutral-900) !important;
  color: var(--neutral-50) !important;
  border-color: var(--text-primary) !important;
}
.bg-gray-900 * {
  color: inherit !important;
}
.hover\\:bg-gray-800:hover {
  background-color: var(--neutral-800) !important;
}

/* Tailwind from-white gradient override */
.from-white {
  --tw-gradient-from: var(--surface-card) var(--tw-gradient-from-position) !important;
  --tw-gradient-to: ${hexToRgbaStr(surfaceCardHex, 0)} var(--tw-gradient-to-position) !important;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
}
`;

    if (isWallpaper && blurPx > 0) {
      cssText += `
.post-menu, .top-\\[calc\\(100\\%\\+0\\.5rem\\)\\], .bottom-full.left-0.right-0, .bottom-full.bg-\\[var\\(--surface-card\\)\\], .pb-\\[calc\\(3\\.25rem\\+env\\(safe-area-inset-bottom\\)\\)\\], .shadow-lg, .bg-white {
  backdrop-filter: blur(var(--wallpaper-blur)) !important;
  -webkit-backdrop-filter: blur(var(--wallpaper-blur)) !important;
}
.top-\\[calc\\(100\\%\\+0\\.5rem\\)\\], .bottom-full.left-0.right-0, .bottom-full.bg-\\[var\\(--surface-card\\)\\] {
  background-color: var(--surface-card-dropdown) !important;
}
.shadow-lg, .bg-white {
  background-color: var(--surface-card-80) !important;
}
`;
    }

    // Theme scrollbar styling
    cssText += `
html {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, var(--neutral-400, #cbd5e1)) var(--scrollbar-track, var(--app-bg));
}
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background: var(--scrollbar-track, var(--app-bg)) !important;
}
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, var(--neutral-400, #cbd5e1)) !important;
  border-radius: 9999px;
  border: 2px solid var(--scrollbar-thumb-border, var(--scrollbar-track, var(--app-bg)));
}
::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, var(--accent)) !important;
}
`;

    // 4. Inject Extension Features
    if (extensions) {
      if (extensions.compact) {
        cssText += `
/* Compact view customization */
article, [data-testid="tweet"], .tweet, .post, .status-wrapper {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
article [data-testid="tweetText"], .tweet-text, .post-content {
  margin-top: 2px !important;
  margin-bottom: 2px !important;
}
`;
      }

      if (extensions.mediaRadius && extensions.mediaRadius !== 'default') {
        let radiusVal = '8px';
        if (extensions.mediaRadius === 'none') radiusVal = '0px';
        if (extensions.mediaRadius === 'large') radiusVal = '16px';
        if (extensions.mediaRadius === 'full') radiusVal = '9999px';

        cssText += `
/* Media Corner Radius customization */
article img:not([class*="avatar"]):not([class*="profile"]):not([src*="avatar"]):not([src*="profile"]),
article video,
[data-testid="tweetPhoto"] img,
[data-testid="videoPlayer"],
video,
.media-container img,
.media-container video {
  border-radius: ${radiusVal} !important;
}
`;
      }

      if (extensions.hideFollows) {
        cssText += `
/* Hide recommended users customization */
[aria-label="おすすめユーザー"], 
aside section:has([data-testid="UserCell"]),
.who-to-follow,
.recommended-users {
  display: none !important;
}
`;
      }

      if (extensions.hideTrends) {
        cssText += `
/* Hide trends customization */
[aria-label="トレンド"],
[aria-label="話題の検索"],
[data-testid="trend"],
aside section:has([data-testid="trend"]),
.trends,
.trending-topics {
  display: none !important;
}
`;
      }

      if (extensions.customCss) {
        cssText += `
/* Custom CSS customization */
${extensions.customCss}
`;
      }
    }

    // 5. Inject/Update style element
    let styleEl = document.getElementById(THEME_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = THEME_STYLE_ID;
      styleEl.setAttribute('data-namikarotter-priority', 'highest');
    }
    styleEl.textContent = cssText;
    placeThemeStyleLast(styleEl);
    startThemeStylePriorityObserver();
  }

  // Expose to window namespace
  window.NamiCSSBuilder = {
    applyStyles
  };
})();
