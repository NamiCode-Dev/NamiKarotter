(function () {
  // Load settings and apply
  function loadAndApply() {
    chrome.storage.local.get([
      'selectedTheme',
      'customColors',
      'selectedFont',
      'wallpaperEnable',
      'wallpaperUrl',
      'wallpaperOpacity',
      'wallpaperBlur',
      'extCompact',
      'extMediaRadius',
      'extHideFollows',
      'extHideTrends',
      'extCustomCss',
      'customFontUrl',
      'pluginHideUiEnable',
      'pluginHideQr',
      'pluginHideCopyUrl',
      'pluginHideVerified',
      'pluginHideBot',
      'pluginHideParody',
      'pluginHideBadgePill',
      'pluginHideKawaiiLogo',
      'pluginHideLogo',
      'pluginSimpleUrlPreviewEnable',
      'pluginCollapseSidebarEnable',
      'pluginCollapseDefaultTrends',
      'pluginCollapseDefaultSpaces',
      'pluginCollapseDefaultUsers',
      'pluginCollapseDefaultLegal',
      'pluginImageDownloaderEnable',
      'pluginVoiceDownloaderEnable',
      'pluginMarkdownAssistantEnable',
      'pluginPostPreviewEnable',
      'pluginKbotAssistantEnable',
      'pluginCustomCssEnable',
      'pluginCustomCss',
      'pluginDisableProStyleEnable'
    ], (data) => {
      const theme = data.selectedTheme || 'nord';
      const customColors = data.customColors || {};
      const font = data.selectedFont || '';
      const wallpaper = {
        enable: data.wallpaperEnable || false,
        url: data.wallpaperUrl || '',
        opacity: data.wallpaperOpacity !== undefined ? data.wallpaperOpacity : 60,
        blur: data.wallpaperBlur !== undefined ? data.wallpaperBlur : 5
      };
      const pluginCustomCssEnable = data.pluginCustomCssEnable || false;
      const pluginCustomCss = pluginCustomCssEnable ? (data.pluginCustomCss || '') : '';
      const extensions = {
        compact: data.extCompact || false,
        mediaRadius: data.extMediaRadius || 'default',
        hideFollows: data.extHideFollows || false,
        hideTrends: data.extHideTrends || false,
        customCss: (data.extCustomCss || '') + '\n' + pluginCustomCss
      };
      const customFontUrl = data.customFontUrl || '';
      const hideUiEnable = data.pluginHideUiEnable || false;
      const hideQr = data.pluginHideQr || false;
      const hideCopyUrl = data.pluginHideCopyUrl || false;
      const hideVerified = hideUiEnable && (data.pluginHideVerified || false);
      const hideBot = hideUiEnable && (data.pluginHideBot || false);
      const hideParody = hideUiEnable && (data.pluginHideParody || false);
      const hideBadgePill = hideUiEnable && (data.pluginHideBadgePill || false);
      const hideKawaiiLogo = hideUiEnable && (data.pluginHideKawaiiLogo || false);
      const hideLogo = hideUiEnable && (data.pluginHideLogo || false);

      const disableProStyle = data.pluginDisableProStyleEnable || false;

      // Call NamiCSSBuilder to apply styles
      if (window.NamiCSSBuilder && typeof window.NamiCSSBuilder.applyStyles === 'function') {
        window.NamiCSSBuilder.applyStyles(theme, customColors, font, wallpaper, extensions, customFontUrl, hideVerified, hideBot, hideParody, disableProStyle, hideBadgePill, hideKawaiiLogo, hideLogo);
      }

      // Call NamiObservers to start page monitoring observers
      if (window.NamiObservers) {
        if (typeof window.NamiObservers.startHideUiObserver === 'function') {
          window.NamiObservers.startHideUiObserver(hideUiEnable, hideQr, hideCopyUrl);
        }

        const collapseSidebarEnable = data.pluginCollapseSidebarEnable !== false;
        const defaultTrends = data.pluginCollapseDefaultTrends || false;
        const defaultSpaces = data.pluginCollapseDefaultSpaces || false;
        const defaultUsers = data.pluginCollapseDefaultUsers || false;
        const defaultLegal = data.pluginCollapseDefaultLegal || false;
        if (typeof window.NamiObservers.startSidebarCollapseObserver === 'function') {
          window.NamiObservers.startSidebarCollapseObserver(collapseSidebarEnable, defaultTrends, defaultSpaces, defaultUsers, defaultLegal);
        }

        const imageDownloaderEnable = data.pluginImageDownloaderEnable !== false;
        if (typeof window.NamiObservers.startImageDownloader === 'function') {
          window.NamiObservers.startImageDownloader(imageDownloaderEnable);
        }

        const voiceDownloaderEnable = data.pluginVoiceDownloaderEnable !== false;
        if (typeof window.NamiObservers.startVoiceDownloader === 'function') {
          window.NamiObservers.startVoiceDownloader(voiceDownloaderEnable);
        }

        const markdownAssistantEnable = data.pluginMarkdownAssistantEnable !== false;
        if (typeof window.NamiObservers.startMarkdownAssistant === 'function') {
          window.NamiObservers.startMarkdownAssistant(markdownAssistantEnable);
        }

        const postPreviewEnable = data.pluginPostPreviewEnable !== false;
        if (typeof window.NamiObservers.startPostPreview === 'function') {
          window.NamiObservers.startPostPreview(postPreviewEnable);
        }

        const kbotAssistantEnable = data.pluginKbotAssistantEnable !== false;
        if (typeof window.NamiObservers.startKbotAssistant === 'function') {
          window.NamiObservers.startKbotAssistant(kbotAssistantEnable);
        }

        if (typeof window.NamiObservers.startSurfaceShadowObserver === 'function') {
          window.NamiObservers.startSurfaceShadowObserver();
        }
      }

      const simpleUrlPreviewEnable = data.pluginSimpleUrlPreviewEnable !== false;
      document.documentElement.classList.toggle('namikarotter-simple-url-preview', simpleUrlPreviewEnable);
    });
  }

  // Initial load
  loadAndApply();

  // Listen for storage changes to apply theme instantly
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      loadAndApply();
    }
  });
})();
