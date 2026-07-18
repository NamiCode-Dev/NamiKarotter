document.addEventListener('DOMContentLoaded', () => {
  // Apply active theme to the popup UI dynamically (shared from theme.js style matching)
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

    const root = document.documentElement;
    const body = document.body;

    if (isWallpaper) {
      body.classList.add('has-wallpaper');
      const opacity = wallpaperOpacity !== undefined ? wallpaperOpacity / 100 : 0.6;
      root.style.setProperty('--pop-bg', 'transparent');
      root.style.setProperty('--pop-surface', hexToRgbaStr(colors['--surface-card'] || '#ffffff', opacity));
    } else {
      body.classList.remove('has-wallpaper');
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

  function applyFont(fontName, customFontUrl) {
    let fontLink = document.getElementById('popup-font-link');
    let customStyleEl = document.getElementById('popup-custom-font-style');
    
    if (fontLink) fontLink.remove();
    if (customStyleEl) customStyleEl.remove();

    if (!fontName) {
      document.documentElement.style.removeProperty('--font-sans');
      document.documentElement.style.removeProperty('--font-header');
      return;
    }

    if (fontName === 'custom-uploaded') {
      if (customFontUrl) {
        let format = 'truetype';
        if (customFontUrl.includes('data:font/woff2') || customFontUrl.includes('data:application/font-woff2')) {
          format = 'woff2';
        } else if (customFontUrl.includes('data:font/woff') || customFontUrl.includes('data:application/font-woff')) {
          format = 'woff';
        } else if (customFontUrl.includes('data:font/otf') || customFontUrl.includes('data:font/opentype') || customFontUrl.includes('data:application/x-font-opentype')) {
          format = 'opentype';
        }

        customStyleEl = document.createElement('style');
        customStyleEl.id = 'popup-custom-font-style';
        customStyleEl.textContent = `
          @font-face {
            font-family: 'CustomUploadedFont';
            src: url('${customFontUrl}') format('${format}');
          }
        `;
        document.head.appendChild(customStyleEl);
        document.documentElement.style.setProperty('--font-sans', `'CustomUploadedFont', sans-serif`);
        document.documentElement.style.setProperty('--font-header', `'CustomUploadedFont', sans-serif`);
      } else {
        document.documentElement.style.removeProperty('--font-sans');
        document.documentElement.style.removeProperty('--font-header');
      }
      return;
    }

    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
    fontLink = document.createElement('link');
    fontLink.id = 'popup-font-link';
    fontLink.rel = 'stylesheet';
    fontLink.href = fontUrl;
    document.head.appendChild(fontLink);
    document.documentElement.style.setProperty('--font-sans', `"${fontName}", sans-serif`);
    document.documentElement.style.setProperty('--font-header', `"${fontName}", sans-serif`);
  }

  // Restore Theme and Sync styling
  function syncTheme() {
    chrome.storage.local.get([
      'selectedTheme', 
      'customColors', 
      'wallpaperEnable', 
      'wallpaperUrl', 
      'wallpaperOpacity',
      'selectedFont',
      'customFontUrl'
    ], (data) => {
      const theme = data.selectedTheme || 'nord';
      const customColors = data.customColors || {};
      const isWallpaper = data.wallpaperEnable && data.wallpaperUrl;
      const opacityVal = data.wallpaperOpacity !== undefined ? data.wallpaperOpacity : 60;
      applyThemeToPopup(theme, customColors, isWallpaper, opacityVal);

      const font = data.selectedFont || '';
      const customFontUrl = data.customFontUrl || '';
      applyFont(font, customFontUrl);

      // Fade in the content now that styling is fully applied
      document.body.style.opacity = '1';
      setTimeout(() => {
        document.body.classList.remove('preload');
      }, 150);
    });
  }

  // Hide UI Elements Selector & Logic
  const chkPluginHideUiEnable = document.getElementById('chk-plugin-hide-ui-enable');
  const hideUiOptions = document.getElementById('hide-ui-options');
  const chkHideQr = document.getElementById('chk-hide-qr');
  const chkHideCopyUrl = document.getElementById('chk-hide-copy-url');
  const chkHideVerified = document.getElementById('chk-hide-verified');
  const chkHideBot = document.getElementById('chk-hide-bot');
  const chkHideParody = document.getElementById('chk-hide-parody');
  const chkHideBadgePill = document.getElementById('chk-hide-badge-pill');
  const chkHideKawaiiLogo = document.getElementById('chk-hide-kawaii-logo');
  const chkHideLogo = document.getElementById('chk-hide-logo');
  const chkPluginImproveHomeEnable = document.getElementById('chk-plugin-improve-home-enable');
  const chkPluginAdvancedSearchEnable = document.getElementById('chk-plugin-advanced-search-enable');
  const chkPluginNotificationFilterSelectEnable = document.getElementById('chk-plugin-notification-filter-select-enable');
  const chkPluginSimpleUrlPreviewEnable = document.getElementById('chk-plugin-simple-url-preview-enable');
  const chkPluginDisableProStyleEnable = document.getElementById('chk-plugin-disable-pro-style-enable');
  const chkPluginCollapseSidebarEnable = document.getElementById('chk-plugin-collapse-sidebar-enable');
  const chkPluginImageDownloaderEnable = document.getElementById('chk-plugin-image-downloader-enable');
  const chkPluginVoiceDownloaderEnable = document.getElementById('chk-plugin-voice-downloader-enable');
  const chkPluginMarkdownAssistantEnable = document.getElementById('chk-plugin-markdown-assistant-enable');
  const chkPluginPostPreviewEnable = document.getElementById('chk-plugin-post-preview-enable');
  const chkPluginKarotterTLineEnable = document.getElementById('chk-plugin-karotter-tline-enable');
  const chkPluginKbotAssistantEnable = document.getElementById('chk-plugin-kbot-assistant-enable');
  const chkPluginXRedirectEnable = document.getElementById('chk-plugin-x-redirect-enable');
  const chkXRedirectAsk = document.getElementById('chk-x-redirect-ask');
  const xRedirectOptions = document.getElementById('x-redirect-options');
  const btnToggleXRedirectOptions = document.getElementById('btn-toggle-x-redirect-options');
  const txtToggleXRedirectOptions = document.getElementById('txt-toggle-x-redirect-options');
  const svgToggleXRedirectOptions = document.getElementById('svg-toggle-x-redirect-options');
  const btnToggleHideUiOptions = document.getElementById('btn-toggle-hide-ui-options');
  const txtToggleHideUiOptions = document.getElementById('txt-toggle-hide-ui-options');
  const svgToggleHideUiOptions = document.getElementById('svg-toggle-hide-ui-options');

  const collapseSidebarOptions = document.getElementById('collapse-sidebar-options');
  const btnToggleCollapseSidebarOptions = document.getElementById('btn-toggle-collapse-sidebar-options');
  const txtToggleCollapseSidebarOptions = document.getElementById('txt-toggle-collapse-sidebar-options');
  const svgToggleCollapseSidebarOptions = document.getElementById('svg-toggle-collapse-sidebar-options');

  const chkCollapseDefaultTrends = document.getElementById('chk-collapse-default-trends');
  const chkCollapseDefaultSpaces = document.getElementById('chk-collapse-default-spaces');
  const chkCollapseDefaultUsers = document.getElementById('chk-collapse-default-users');
  const chkCollapseDefaultLegal = document.getElementById('chk-collapse-default-legal');

  // Custom CSS elements
  const chkPluginCustomCssEnable = document.getElementById('chk-plugin-custom-css-enable');
  const customCssOptions = document.getElementById('custom-css-options');
  const btnToggleCustomCssOptions = document.getElementById('btn-toggle-custom-css-options');
  const txtToggleCustomCssOptions = document.getElementById('txt-toggle-custom-css-options');
  const svgToggleCustomCssOptions = document.getElementById('svg-toggle-custom-css-options');
  const txtPluginCustomCss = document.getElementById('txt-plugin-custom-css');

  function restorePluginSettings() {
    chrome.storage.local.get([
      'pluginHideUiEnable', 
      'pluginHideQr', 
      'pluginHideCopyUrl',
      'pluginHideVerified',
      'pluginHideBot',
      'pluginHideParody',
      'pluginHideBadgePill',
      'pluginHideKawaiiLogo',
      'pluginHideLogo',
      'pluginImproveHomeEnable',
      'pluginAdvancedSearchEnable',
      'pluginSimpleUrlPreviewEnable',
      'pluginDisableProStyleEnable',
      'pluginCollapseSidebarEnable',
      'pluginCollapseDefaultTrends',
      'pluginCollapseDefaultSpaces',
      'pluginCollapseDefaultUsers',
      'pluginCollapseDefaultLegal',
      'pluginImageDownloaderEnable',
      'pluginVoiceDownloaderEnable',
      'pluginMarkdownAssistantEnable',
      'pluginPostPreviewEnable',
      'pluginKarotterTLineEnable',
      'pluginKbotAssistantEnable',
      'pluginCustomCssEnable',
      'pluginCustomCss',
      'pluginXRedirectEnable',
      'pluginXRedirectAsk',
      'pluginNotificationFilterSelectEnable'
    ], (data) => {
      const hideUiEnable = data.pluginHideUiEnable || false;
      const hideQr = data.pluginHideQr || false;
      const hideCopyUrl = data.pluginHideCopyUrl || false;
      const hideVerified = data.pluginHideVerified || false;
      const hideBot = data.pluginHideBot || false;
      const hideParody = data.pluginHideParody || false;
      const collapseSidebar = data.pluginCollapseSidebarEnable !== false;

      chkPluginHideUiEnable.checked = hideUiEnable;
      chkHideQr.checked = hideQr;
      chkHideCopyUrl.checked = hideCopyUrl;
      chkHideVerified.checked = hideVerified;
      chkHideBot.checked = hideBot;
      chkHideParody.checked = hideParody;
      chkHideBadgePill.checked = data.pluginHideBadgePill || false;
      chkHideKawaiiLogo.checked = data.pluginHideKawaiiLogo || false;
      chkHideLogo.checked = data.pluginHideLogo || false;
      chkPluginImproveHomeEnable.checked = data.pluginImproveHomeEnable !== false;
      chkPluginAdvancedSearchEnable.checked = data.pluginAdvancedSearchEnable !== false;
      chkPluginSimpleUrlPreviewEnable.checked = data.pluginSimpleUrlPreviewEnable !== false;
      chkPluginDisableProStyleEnable.checked = data.pluginDisableProStyleEnable || false;
      chkPluginCollapseSidebarEnable.checked = collapseSidebar;
      chkPluginImageDownloaderEnable.checked = data.pluginImageDownloaderEnable !== false;
      chkPluginVoiceDownloaderEnable.checked = data.pluginVoiceDownloaderEnable !== false;
      chkPluginMarkdownAssistantEnable.checked = data.pluginMarkdownAssistantEnable !== false;
      chkPluginPostPreviewEnable.checked = data.pluginPostPreviewEnable !== false;
      chkPluginKarotterTLineEnable.checked = data.pluginKarotterTLineEnable !== false;
      chkPluginKbotAssistantEnable.checked = data.pluginKbotAssistantEnable !== false;
      chkPluginXRedirectEnable.checked = data.pluginXRedirectEnable || false;
      chkXRedirectAsk.checked = data.pluginXRedirectAsk !== false;
      chkPluginNotificationFilterSelectEnable.checked = data.pluginNotificationFilterSelectEnable !== false;
      chkPluginCustomCssEnable.checked = data.pluginCustomCssEnable || false;
      txtPluginCustomCss.value = data.pluginCustomCss || '';

      chkCollapseDefaultTrends.checked = data.pluginCollapseDefaultTrends || false;
      chkCollapseDefaultSpaces.checked = data.pluginCollapseDefaultSpaces || false;
      chkCollapseDefaultUsers.checked = data.pluginCollapseDefaultUsers || false;
      chkCollapseDefaultLegal.checked = data.pluginCollapseDefaultLegal || false;
    });
  }

  if (btnToggleHideUiOptions) {
    btnToggleHideUiOptions.addEventListener('click', () => {
      const isCurrentlyCollapsed = hideUiOptions.style.display === 'none' || hideUiOptions.style.display === '';
      if (isCurrentlyCollapsed) {
        hideUiOptions.style.display = 'flex';
        txtToggleHideUiOptions.textContent = 'オプションを非表示';
        svgToggleHideUiOptions.style.transform = 'rotate(180deg)';
      } else {
        hideUiOptions.style.display = 'none';
        txtToggleHideUiOptions.textContent = 'オプションを表示';
        svgToggleHideUiOptions.style.transform = 'rotate(0deg)';
      }
    });
  }

  if (btnToggleCollapseSidebarOptions) {
    btnToggleCollapseSidebarOptions.addEventListener('click', () => {
      const isCurrentlyCollapsed = collapseSidebarOptions.style.display === 'none' || collapseSidebarOptions.style.display === '';
      if (isCurrentlyCollapsed) {
        collapseSidebarOptions.style.display = 'flex';
        txtToggleCollapseSidebarOptions.textContent = 'オプションを非表示';
        svgToggleCollapseSidebarOptions.style.transform = 'rotate(180deg)';
      } else {
        collapseSidebarOptions.style.display = 'none';
        txtToggleCollapseSidebarOptions.textContent = 'オプションを表示';
        svgToggleCollapseSidebarOptions.style.transform = 'rotate(0deg)';
      }
    });
  }

  if (btnToggleXRedirectOptions) {
    btnToggleXRedirectOptions.addEventListener('click', () => {
      const isCurrentlyCollapsed = xRedirectOptions.style.display === 'none' || xRedirectOptions.style.display === '';
      if (isCurrentlyCollapsed) {
        xRedirectOptions.style.display = 'flex';
        txtToggleXRedirectOptions.textContent = 'オプションを非表示';
        svgToggleXRedirectOptions.style.transform = 'rotate(180deg)';
      } else {
        xRedirectOptions.style.display = 'none';
        txtToggleXRedirectOptions.textContent = 'オプションを表示';
        svgToggleXRedirectOptions.style.transform = 'rotate(0deg)';
      }
    });
  }

  chkPluginHideUiEnable.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ pluginHideUiEnable: isEnabled });
  });

  chkHideQr.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginHideQr: e.target.checked });
  });

  chkHideCopyUrl.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginHideCopyUrl: e.target.checked });
  });

  chkHideVerified.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginHideVerified: e.target.checked });
  });

  chkHideBot.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginHideBot: e.target.checked });
  });

  chkHideParody.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginHideParody: e.target.checked });
  });

  chkHideBadgePill.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginHideBadgePill: e.target.checked });
  });

  chkHideKawaiiLogo.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginHideKawaiiLogo: e.target.checked });
  });

  chkHideLogo.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginHideLogo: e.target.checked });
  });


  chkPluginImproveHomeEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginImproveHomeEnable: e.target.checked });
  });

  chkPluginNotificationFilterSelectEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginNotificationFilterSelectEnable: e.target.checked });
  });

  chkPluginAdvancedSearchEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginAdvancedSearchEnable: e.target.checked });
  });

  chkPluginSimpleUrlPreviewEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginSimpleUrlPreviewEnable: e.target.checked });
  });
  
  chkPluginDisableProStyleEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginDisableProStyleEnable: e.target.checked });
  });

  chkPluginCollapseSidebarEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginCollapseSidebarEnable: e.target.checked });
  });

  chkCollapseDefaultTrends.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginCollapseDefaultTrends: e.target.checked });
  });

  chkCollapseDefaultSpaces.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginCollapseDefaultSpaces: e.target.checked });
  });

  chkCollapseDefaultUsers.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginCollapseDefaultUsers: e.target.checked });
  });

  chkCollapseDefaultLegal.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginCollapseDefaultLegal: e.target.checked });
  });

  chkPluginImageDownloaderEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginImageDownloaderEnable: e.target.checked });
  });

  chkPluginVoiceDownloaderEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginVoiceDownloaderEnable: e.target.checked });
  });

  chkPluginMarkdownAssistantEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginMarkdownAssistantEnable: e.target.checked });
  });

  chkPluginPostPreviewEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginPostPreviewEnable: e.target.checked });
  });

  chkPluginKarotterTLineEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginKarotterTLineEnable: e.target.checked });
  });

  chkPluginKbotAssistantEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginKbotAssistantEnable: e.target.checked });
  });

  chkPluginXRedirectEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginXRedirectEnable: e.target.checked });
  });

  chkXRedirectAsk.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginXRedirectAsk: e.target.checked });
  });

  // Toggle Custom CSS options visibility
  if (btnToggleCustomCssOptions) {
    btnToggleCustomCssOptions.addEventListener('click', () => {
      const isCurrentlyCollapsed = customCssOptions.style.display === 'none' || customCssOptions.style.display === '';
      if (isCurrentlyCollapsed) {
        customCssOptions.style.display = 'flex';
        txtToggleCustomCssOptions.textContent = 'オプションを非表示';
        svgToggleCustomCssOptions.style.transform = 'rotate(180deg)';
      } else {
        customCssOptions.style.display = 'none';
        txtToggleCustomCssOptions.textContent = 'オプションを表示';
        svgToggleCustomCssOptions.style.transform = 'rotate(0deg)';
      }
    });
  }

  // Focus effect for textarea
  if (txtPluginCustomCss) {
    txtPluginCustomCss.addEventListener('focus', () => {
      txtPluginCustomCss.style.borderColor = 'var(--accent)';
    });
    txtPluginCustomCss.addEventListener('blur', () => {
      txtPluginCustomCss.style.borderColor = 'var(--pop-border)';
    });
    txtPluginCustomCss.addEventListener('input', (e) => {
      chrome.storage.local.set({ pluginCustomCss: e.target.value });
    });
  }

  chkPluginCustomCssEnable.addEventListener('change', (e) => {
    chrome.storage.local.set({ pluginCustomCssEnable: e.target.checked });
  });

  // Tabs Navigation control
  const tabButtons = document.querySelectorAll('.tab-btn');
  const pluginCards = document.querySelectorAll('.plugin-card');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update tab active classes
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter cards
      pluginCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (targetTab === 'all' || category === targetTab) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Initial loads
  syncTheme();
  restorePluginSettings();

  // Listen for storage changes to apply theme instantly
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      syncTheme();
    }
  });
});
