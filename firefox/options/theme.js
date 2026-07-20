document.addEventListener('DOMContentLoaded', () => {
  // Tab Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Control Elements
  const genericThemesGrid = document.getElementById('generic-themes-grid');
  const presetThemesGrid = document.getElementById('preset-themes-grid');
  const fontSelect = document.getElementById('font-select');
  const fontPreview = document.getElementById('font-preview');
  const fontUploadZone = document.getElementById('font-upload-zone');
  const fileFont = document.getElementById('file-font');
  const lblFontFilename = document.getElementById('lbl-font-filename');
  // Customizer Base Elements
  const customTabBtn = document.getElementById('custom-tab-btn');
  const customInactiveWarning = document.getElementById('custom-inactive-warning');
  const customInputsContainer = document.getElementById('custom-inputs-container');

  // Mode Selection Elements
  const btnModeManual = document.getElementById('btn-mode-manual');
  const btnModeAuto = document.getElementById('btn-mode-auto');
  const autoSettingsPanel = document.getElementById('auto-settings-panel');
  const manualSettingsPanel = document.getElementById('manual-settings-panel');

  // Auto-Generate Elements
  const pickerBaseColor = document.getElementById('picker-base-color');
  const textBaseColor = document.getElementById('text-base-color');
  const btnStyleLight = document.getElementById('btn-style-light');
  const btnStyleSoft = document.getElementById('btn-style-soft');
  const btnStyleDim = document.getElementById('btn-style-dim');
  const btnStyleDark = document.getElementById('btn-style-dark');

  // Manual Color pickers & textboxes
  const customPickers = {
    '--app-bg': document.getElementById('picker-app-bg'),
    '--surface-card': document.getElementById('picker-surface-card'),
    '--text-primary': document.getElementById('picker-text-primary'),
    '--accent': document.getElementById('picker-accent')
  };

  const customTexts = {
    '--app-bg': document.getElementById('text-app-bg'),
    '--surface-card': document.getElementById('text-surface-card'),
    '--text-primary': document.getElementById('text-text-primary'),
    '--accent': document.getElementById('text-accent')
  };

  // Wallpaper Elements
  const chkWallpaperEnable = document.getElementById('chk-wallpaper-enable');
  const wallpaperSettingsGroup = document.getElementById('wallpaper-settings-group');
  const uploadZone = document.getElementById('upload-zone');
  const fileWallpaper = document.getElementById('file-wallpaper');
  const lblWallpaperFilename = document.getElementById('lbl-wallpaper-filename');
  const txtWallpaperUrl = document.getElementById('txt-wallpaper-url');
  const rngWallpaperOpacity = document.getElementById('rng-wallpaper-opacity');
  const valWallpaperOpacity = document.getElementById('val-wallpaper-opacity');
  const rngWallpaperBlur = document.getElementById('rng-wallpaper-blur');
  const valWallpaperBlur = document.getElementById('val-wallpaper-blur');

  // State
  let currentTheme = 'nord';
  let currentFont = '';
  let currentCustomColors = {};
  let currentCustomMode = 'auto'; // 'manual' or 'auto'
  let currentCustomBaseColor = '#1d9bf0';
  let currentCustomBaseStyle = 'light'; // 'light' or 'dark'

  let currentCustomFontUrl = '';

  let currentWallpaper = {
    enable: false,
    url: '',
    opacity: 60,
    blur: 5
  };

  let allGoogleFonts = [];
  let fontConsentGranted = false;
  let fontConsentDenied = false;
  let pendingActiveFontName = '';

  // Wrappers to NamiColorUtils
  function generateThemeFromColor(baseHex, modeStyle) {
    if (window.NamiColorUtils && typeof window.NamiColorUtils.generateThemeFromColor === 'function') {
      return window.NamiColorUtils.generateThemeFromColor(baseHex, modeStyle);
    }
    return {};
  }

  // Apply active theme to the popup UI dynamically
  function applyThemeToPopup(themeName, customColors) {
    if (window.NamiColorUtils && typeof window.NamiColorUtils.applyThemeToPopup === 'function') {
      const isWallpaper = currentWallpaper && currentWallpaper.enable && currentWallpaper.url;
      const opacity = currentWallpaper ? currentWallpaper.opacity : 60;
      window.NamiColorUtils.applyThemeToPopup(themeName, customColors, isWallpaper, opacity);
    }
  }

  // Update the wallpaper preview display in the UI
  function updateWallpaperPreviewUI() {
    const previewGroup = document.getElementById('wallpaper-preview-group');
    const previewImg = document.getElementById('img-wallpaper-preview');
    if (previewGroup && previewImg) {
      if (currentWallpaper.url) {
        previewImg.src = currentWallpaper.url;
        previewGroup.style.display = 'block';
      } else {
        previewImg.src = '';
        previewGroup.style.display = 'none';
      }
    }
  }

  // 1. Tab Switching Logic
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // If switching to fonts tab
      if (targetTab === 'fonts-tab') {
        if (!fontConsentGranted) {
          requestFontConsent();
        }
      }

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // 2. Load Fonts Database and Populate Select
  function lazyLoadOptionFonts(fonts) {
    // Disabled in Firefox version to prevent option styling issues
  }

  function requestFontConsent() {
    if (fontConsentGranted) return true;

    // Prompt for consent whenever it's not granted (even if previously denied)
    const ok = confirm("フォントプレビューと適用のためにGoogle Fontsサーバーへ接続します。Googleへアクセス情報（IPアドレス等）が送信されますが、よろしいですか？\n\n（キャンセルすると、フォント機能が無効化されます）");
    if (ok) {
      fontConsentGranted = true;
      fontConsentDenied = false;
      fontSelect.disabled = false; // Re-enable select box if it was disabled
      chrome.storage.local.set({ fontConsentGranted: true });
      // Load currently selected preview font if it was pending
      if (pendingActiveFontName) {
        loadPreviewFont(pendingActiveFontName);
        pendingActiveFontName = '';
      }
      return true;
    } else {
      fontConsentDenied = true;
      fontSelect.disabled = true;
      fontSelect.blur();
      chrome.storage.local.remove('fontConsentGranted');
      // Reset preview back to default since custom web fonts cannot be loaded
      loadPreviewFont('');
      return false;
    }
  }

  // 2. Load Fonts Database and Populate Select
  function loadFonts() {
    fetch(chrome.runtime.getURL('data/google-fonts-jp.json'))
      .then(res => res.json())
      .then(fonts => {
        allGoogleFonts = fonts;
        fonts.forEach(font => {
          const opt = document.createElement('option');
          opt.value = font.family;
          opt.textContent = font.label || font.family;
          fontSelect.appendChild(opt);
        });

        // Prompt consent when interacting with the select box
        const handleInteraction = () => {
          if (!fontConsentGranted) {
            requestFontConsent();
          }
        };
        fontSelect.addEventListener('focus', handleInteraction);
        fontSelect.addEventListener('click', handleInteraction);

        restoreSettings();
      })
      .catch(err => {
        console.error('Failed to load google-fonts-jp.json:', err);
        restoreSettings();
      });
  }

  // Helper: load Google Font or custom font into Popup for preview
  function loadPreviewFont(fontName, customFontUrl) {
    let fontLink = document.getElementById('popup-preview-font-link');
    let customStyleEl = document.getElementById('popup-preview-custom-font-style');
    
    if (fontLink) fontLink.remove();
    if (customStyleEl) customStyleEl.remove();

    if (!fontName) {
      fontPreview.style.fontFamily = '';
      document.documentElement.style.removeProperty('--font-sans');
      document.documentElement.style.removeProperty('--font-header');
      return;
    }

    if (fontName === 'custom-uploaded') {
      const urlToUse = customFontUrl || currentCustomFontUrl;
      if (urlToUse) {
        let format = 'truetype';
        if (urlToUse.includes('data:font/woff2') || urlToUse.includes('data:application/font-woff2')) {
          format = 'woff2';
        } else if (urlToUse.includes('data:font/woff') || urlToUse.includes('data:application/font-woff')) {
          format = 'woff';
        } else if (urlToUse.includes('data:font/otf') || urlToUse.includes('data:font/opentype') || urlToUse.includes('data:application/x-font-opentype')) {
          format = 'opentype';
        }

        customStyleEl = document.createElement('style');
        customStyleEl.id = 'popup-preview-custom-font-style';
        customStyleEl.textContent = `
          @font-face {
            font-family: 'CustomUploadedFont';
            src: url('${urlToUse}') format('${format}');
          }
        `;
        document.head.appendChild(customStyleEl);
        fontPreview.style.fontFamily = `'CustomUploadedFont', sans-serif`;
        document.documentElement.style.setProperty('--font-sans', `'CustomUploadedFont', sans-serif`);
        document.documentElement.style.setProperty('--font-header', `'CustomUploadedFont', sans-serif`);
      } else {
        fontPreview.style.fontFamily = '';
        document.documentElement.style.removeProperty('--font-sans');
        document.documentElement.style.removeProperty('--font-header');
      }
      return;
    }

    // Check if consent has been granted for loading Google Fonts
    if (!fontConsentGranted) {
      if (fontConsentDenied) {
        fontPreview.style.fontFamily = '';
        document.documentElement.style.removeProperty('--font-sans');
        document.documentElement.style.removeProperty('--font-header');
        return;
      }
      // Hold font loading until the user interacts with the select box
      pendingActiveFontName = fontName;
      return;
    }

    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
    fontLink = document.createElement('link');
    fontLink.id = 'popup-preview-font-link';
    fontLink.rel = 'stylesheet';
    fontLink.href = fontUrl;
    document.head.appendChild(fontLink);
    fontPreview.style.fontFamily = `"${fontName}", sans-serif`;
    document.documentElement.style.setProperty('--font-sans', `"${fontName}", sans-serif`);
    document.documentElement.style.setProperty('--font-header', `"${fontName}", sans-serif`);
  }

  // 3. Render Theme Presets Grid
  function renderThemes() {
    genericThemesGrid.innerHTML = '';
    presetThemesGrid.innerHTML = '';
    
    // Helper to create a theme card
    function createThemeCard(key, theme) {
      const card = document.createElement('div');
      card.className = `theme-card theme-card-${key}`;
      card.dataset.theme = key;

      const previewBox = document.createElement('div');
      previewBox.className = 'theme-preview-box';
      previewBox.style.backgroundColor = theme.colors['--app-bg'];

      const miniCard = document.createElement('div');
      miniCard.className = 'theme-preview-card';
      miniCard.style.backgroundColor = theme.colors['--surface-card'];

      const dot = document.createElement('div');
      dot.className = 'theme-preview-dot';
      dot.style.backgroundColor = theme.colors['--accent'];

      miniCard.appendChild(dot);
      previewBox.appendChild(miniCard);

      const name = document.createElement('div');
      name.className = 'theme-card-name';
      name.textContent = theme.name;

      card.appendChild(previewBox);
      card.appendChild(name);
      
      card.addEventListener('click', () => selectTheme(key));
      return card;
    }

    // Render generic presets (default, dark)
    if (window.NamiThemes['default']) {
      genericThemesGrid.appendChild(createThemeCard('default', window.NamiThemes['default']));
    }
    if (window.NamiThemes['dark']) {
      genericThemesGrid.appendChild(createThemeCard('dark', window.NamiThemes['dark']));
    }

    // Render Custom Theme option (goes to genericThemesGrid)
    const customCard = document.createElement('div');
    customCard.className = 'theme-card theme-card-custom';
    customCard.dataset.theme = 'custom';

    const customPreview = document.createElement('div');
    customPreview.className = 'theme-preview-box';
    
    const swatch1 = document.createElement('div');
    swatch1.className = 'custom-swatch-dot';
    swatch1.style.backgroundColor = '#eef3f8';
    const swatch2 = document.createElement('div');
    swatch2.className = 'custom-swatch-dot';
    swatch2.style.backgroundColor = '#ffffff';
    const swatch3 = document.createElement('div');
    swatch3.className = 'custom-swatch-dot';
    swatch3.style.backgroundColor = '#102132';
    const swatch4 = document.createElement('div');
    swatch4.className = 'custom-swatch-dot';
    swatch4.style.backgroundColor = '#1d9bf0';

    customPreview.appendChild(swatch1);
    customPreview.appendChild(swatch2);
    customPreview.appendChild(swatch3);
    customPreview.appendChild(swatch4);

    const customName = document.createElement('div');
    customName.className = 'theme-card-name';
    customName.textContent = 'カスタム';

    customCard.appendChild(customPreview);
    customCard.appendChild(customName);
    genericThemesGrid.appendChild(customCard);

    customCard.addEventListener('click', () => selectTheme('custom'));

    // Render other presets from themes.js (sepia, nord, forest, sakura, and 30 new ones)
    Object.entries(window.NamiThemes).forEach(([key, theme]) => {
      if (key !== 'default' && key !== 'dark') {
        presetThemesGrid.appendChild(createThemeCard(key, theme));
      }
    });
  }

  // 4. Update UI Select State
  function updateThemeUISelection() {
    document.querySelectorAll('.theme-card').forEach(card => {
      if (card.dataset.theme === currentTheme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    if (currentTheme === 'custom') {
      customInactiveWarning.style.display = 'none';
      customInputsContainer.classList.remove('disabled');
    } else {
      customInactiveWarning.style.display = 'flex';
      customInputsContainer.classList.add('disabled');
    }
  }

  // Select theme action
  function selectTheme(themeKey) {
    currentTheme = themeKey;
    updateThemeUISelection();
    applyThemeToPopup(themeKey, currentCustomColors);
    chrome.storage.local.set({ selectedTheme: themeKey }, () => {
      if (themeKey === 'custom') {
        customTabBtn.click();
      }
    });
  }

  // 5. Update Customizer Mode Selection
  function updateCustomModeUI() {
    if (currentCustomMode === 'auto') {
      btnModeAuto.classList.add('active');
      btnModeManual.classList.remove('active');
      autoSettingsPanel.style.display = 'flex';
      manualSettingsPanel.style.display = 'none';
    } else {
      btnModeManual.classList.add('active');
      btnModeAuto.classList.remove('active');
      autoSettingsPanel.style.display = 'none';
      manualSettingsPanel.style.display = 'flex';
    }

    btnStyleLight.classList.toggle('active', currentCustomBaseStyle === 'light');
    btnStyleSoft.classList.toggle('active', currentCustomBaseStyle === 'soft');
    btnStyleDim.classList.toggle('active', currentCustomBaseStyle === 'dim');
    btnStyleDark.classList.toggle('active', currentCustomBaseStyle === 'dark');
  }

  // Trigger auto theme generation and save
  function handleAutoThemeGeneration() {
    if (currentCustomMode !== 'auto') return;
    
    const generatedColors = generateThemeFromColor(currentCustomBaseColor, currentCustomBaseStyle);
    currentCustomColors = generatedColors;

    // Temporarily update pickers/texts visually in manual settings, so the values are visible to the user
    Object.keys(customPickers).forEach(variable => {
      if (generatedColors[variable]) {
        if (customPickers[variable]) customPickers[variable].value = generatedColors[variable];
        if (customTexts[variable]) customTexts[variable].value = generatedColors[variable];
      }
    });

    applyThemeToPopup('custom', generatedColors);

    chrome.storage.local.set({ 
      customColors: generatedColors,
      customBaseColor: currentCustomBaseColor,
      customBaseStyle: currentCustomBaseStyle
    });
  }

  // 6. Restore Settings
  function restoreSettings() {
    chrome.storage.local.get([
      'selectedTheme', 
      'selectedFont', 
      'customColors', 
      'customMode',
      'customBaseColor',
      'customBaseStyle',
      'wallpaperEnable',
      'wallpaperUrl',
      'wallpaperFilename',
      'wallpaperOpacity',
      'wallpaperBlur',
      'customFontUrl',
      'customFontName',
      'fontConsentGranted'
    ], (data) => {
      currentTheme = data.selectedTheme || 'nord';
      currentFont = data.selectedFont || '';
      currentCustomColors = data.customColors || {};
      currentCustomMode = data.customMode || 'auto';
      currentCustomBaseColor = data.customBaseColor || '#1d9bf0';
      currentCustomBaseStyle = data.customBaseStyle || 'light';
      fontConsentGranted = data.fontConsentGranted || false;
      
      currentWallpaper.enable = data.wallpaperEnable || false;
      currentWallpaper.url = data.wallpaperUrl || '';
      currentWallpaper.opacity = data.wallpaperOpacity !== undefined ? data.wallpaperOpacity : 60;
      currentWallpaper.blur = data.wallpaperBlur !== undefined ? data.wallpaperBlur : 5;
      const filename = data.wallpaperFilename || '';

      currentCustomFontUrl = data.customFontUrl || '';
      const fontFilename = data.customFontName || '';

      // Restore general UI
      updateThemeUISelection();
      updateCustomModeUI();
      
      // Restore wallpaper inputs UI
      chkWallpaperEnable.checked = currentWallpaper.enable;
      if (currentWallpaper.enable) {
        wallpaperSettingsGroup.classList.remove('disabled-group');
      } else {
        wallpaperSettingsGroup.classList.add('disabled-group');
      }
      txtWallpaperUrl.value = currentWallpaper.url.startsWith('data:') ? '' : currentWallpaper.url;
      lblWallpaperFilename.textContent = filename ? `ファイル名: ${filename}` : 'ファイル名: 未選択';
      rngWallpaperOpacity.value = currentWallpaper.opacity;
      valWallpaperOpacity.textContent = currentWallpaper.opacity + '%';
      rngWallpaperBlur.value = currentWallpaper.blur;
      valWallpaperBlur.textContent = currentWallpaper.blur + 'px';

      updateWallpaperPreviewUI();
      applyThemeToPopup(currentTheme, currentCustomColors);

      // Restore font dropdown UI
      const customOption = fontSelect.querySelector('option[value="custom-uploaded"]');
      if (customOption && fontFilename) {
        customOption.textContent = `カスタム: ${fontFilename}`;
      }
      fontSelect.value = currentFont;
      lblFontFilename.textContent = fontFilename ? `ファイル名: ${fontFilename}` : 'ファイル名: 未選択';
      loadPreviewFont(currentFont, currentCustomFontUrl);

      // Restore customizer auto inputs
      pickerBaseColor.value = currentCustomBaseColor;
      textBaseColor.value = currentCustomBaseColor;

      // Restore customizer manual inputs
      const defaultColors = window.NamiThemes['default'].colors;
      Object.keys(customPickers).forEach(variable => {
        const value = currentCustomColors[variable] || defaultColors[variable];
        if (value.startsWith('#')) {
          customPickers[variable].value = value;
          customTexts[variable].value = value;
        } else {
          customTexts[variable].value = value;
        }
      });

      // Fade in the content now that the settings are fully loaded and applied
      document.body.style.opacity = '1';
      setTimeout(() => {
        document.body.classList.remove('preload');
      }, 150);
    });
  }

  // 7. Event Listeners for Custom Mode Toggle
  btnModeManual.addEventListener('click', () => {
    currentCustomMode = 'manual';
    updateCustomModeUI();
    chrome.storage.local.set({ customMode: 'manual' }, () => {
      // Re-apply customizer colors to popup
      applyThemeToPopup('custom', currentCustomColors);
    });
  });

  btnModeAuto.addEventListener('click', () => {
    currentCustomMode = 'auto';
    updateCustomModeUI();
    chrome.storage.local.set({ customMode: 'auto' }, () => {
      handleAutoThemeGeneration();
    });
  });

  // Auto base color inputs
  pickerBaseColor.addEventListener('input', (e) => {
    currentCustomBaseColor = e.target.value;
    textBaseColor.value = currentCustomBaseColor;
    handleAutoThemeGeneration();
  });

  textBaseColor.addEventListener('change', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && (val.length === 3 || val.length === 6)) {
      val = '#' + val;
    }
    if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
      currentCustomBaseColor = val;
      pickerBaseColor.value = val;
      textBaseColor.value = val;
      handleAutoThemeGeneration();
    } else {
      textBaseColor.value = pickerBaseColor.value;
    }
  });

  // Auto style selectors
  btnStyleLight.addEventListener('click', () => {
    currentCustomBaseStyle = 'light';
    updateCustomModeUI();
    handleAutoThemeGeneration();
  });

  btnStyleSoft.addEventListener('click', () => {
    currentCustomBaseStyle = 'soft';
    updateCustomModeUI();
    handleAutoThemeGeneration();
  });

  btnStyleDim.addEventListener('click', () => {
    currentCustomBaseStyle = 'dim';
    updateCustomModeUI();
    handleAutoThemeGeneration();
  });

  btnStyleDark.addEventListener('click', () => {
    currentCustomBaseStyle = 'dark';
    updateCustomModeUI();
    handleAutoThemeGeneration();
  });

  // Event Listeners for Customizer Manual Inputs
  Object.keys(customPickers).forEach(variable => {
    const picker = customPickers[variable];
    const textInput = customTexts[variable];

    picker.addEventListener('input', (e) => {
      if (currentCustomMode === 'auto') return; // Ignore input if in auto mode
      const val = e.target.value;
      textInput.value = val;
      updateCustomColor(variable, val);
    });

    textInput.addEventListener('change', (e) => {
      if (currentCustomMode === 'auto') return; // Ignore input if in auto mode
      let val = e.target.value.trim();
      if (!val.startsWith('#') && (val.length === 3 || val.length === 6)) {
        val = '#' + val;
      }
      if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
        picker.value = val;
        textInput.value = val;
        updateCustomColor(variable, val);
      } else {
        textInput.value = picker.value;
      }
    });
  });

  function updateCustomColor(variable, value) {
    currentCustomColors[variable] = value;
    applyThemeToPopup('custom', currentCustomColors);
    chrome.storage.local.set({ customColors: currentCustomColors });
  }

  // 8. Font Select Handler
  fontSelect.addEventListener('change', (e) => {
    const font = e.target.value;

    // If a Google Font is selected and consent has not been granted yet
    if (font && font !== 'custom-uploaded' && !fontConsentGranted) {
      const granted = requestFontConsent();
      if (!granted) {
        // Reset select value if consent is denied
        fontSelect.value = '';
        currentFont = '';
        chrome.storage.local.set({ selectedFont: '' });
        return;
      }
    }

    currentFont = font;
    loadPreviewFont(font, currentCustomFontUrl);
    chrome.storage.local.set({ selectedFont: font });
  });

  // Wallpaper Tab Event Listeners
  chkWallpaperEnable.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    currentWallpaper.enable = isEnabled;
    if (isEnabled) {
      wallpaperSettingsGroup.classList.remove('disabled-group');
    } else {
      wallpaperSettingsGroup.classList.add('disabled-group');
    }
    applyThemeToPopup(currentTheme, currentCustomColors);
    chrome.storage.local.set({ wallpaperEnable: isEnabled });
  });

  // Upload Zone Clicks and Drags
  uploadZone.addEventListener('click', () => {
    fileWallpaper.click();
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });

  fileWallpaper.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files[0]);
    }
  });

  function handleImageUpload(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルのみアップロード可能です。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      currentWallpaper.url = base64Url;
      lblWallpaperFilename.textContent = `ファイル名: ${file.name}`;
      txtWallpaperUrl.value = ''; // Reset external URL text box

      updateWallpaperPreviewUI();
      applyThemeToPopup(currentTheme, currentCustomColors);
      chrome.storage.local.set({ 
        wallpaperUrl: base64Url,
        wallpaperFilename: file.name
      });
    };
    reader.readAsDataURL(file);
  }

  txtWallpaperUrl.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    currentWallpaper.url = url;
    if (!url) {
      lblWallpaperFilename.textContent = 'ファイル名: 未選択';
    }
    updateWallpaperPreviewUI();
    applyThemeToPopup(currentTheme, currentCustomColors);
    chrome.storage.local.set({ 
      wallpaperUrl: url,
      wallpaperFilename: ''
    });
  });

  rngWallpaperOpacity.addEventListener('input', (e) => {
    const opacity = parseInt(e.target.value);
    currentWallpaper.opacity = opacity;
    valWallpaperOpacity.textContent = opacity + '%';
    applyThemeToPopup(currentTheme, currentCustomColors);
    chrome.storage.local.set({ wallpaperOpacity: opacity });
  });

  rngWallpaperBlur.addEventListener('input', (e) => {
    const blur = parseInt(e.target.value);
    currentWallpaper.blur = blur;
    valWallpaperBlur.textContent = blur + 'px';
    applyThemeToPopup(currentTheme, currentCustomColors);
    chrome.storage.local.set({ wallpaperBlur: blur });
  });



  // Font Upload Zone Clicks and Drags
  fontUploadZone.addEventListener('click', () => {
    fileFont.click();
  });

  fontUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fontUploadZone.classList.add('dragover');
  });

  fontUploadZone.addEventListener('dragleave', () => {
    fontUploadZone.classList.remove('dragover');
  });

  fontUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fontUploadZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFontUpload(e.dataTransfer.files[0]);
    }
  });

  fileFont.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFontUpload(e.target.files[0]);
    }
  });

  function handleFontUpload(file) {
    if (!file) return;
    const allowedExtensions = /\.(ttf|otf|woff|woff2)$/i;
    if (!allowedExtensions.test(file.name)) {
      alert('TTF, OTF, WOFF, WOFF2 形式のフォントファイルのみアップロード可能です。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      currentCustomFontUrl = base64Url;
      lblFontFilename.textContent = `ファイル名: ${file.name}`;
      
      currentFont = 'custom-uploaded';
      const customOption = fontSelect.querySelector('option[value="custom-uploaded"]');
      if (customOption) {
        customOption.textContent = `カスタム: ${file.name}`;
      }
      fontSelect.value = 'custom-uploaded';

      loadPreviewFont(currentFont, base64Url);
      chrome.storage.local.set({ 
        selectedFont: currentFont,
        customFontUrl: base64Url,
        customFontName: file.name
      });
    };
    reader.readAsDataURL(file);
  }

  // --- Theme Backup (Export / Import) Logic ---
  const btnExportTheme = document.getElementById('btn-export-theme');
  const btnImportTheme = document.getElementById('btn-import-theme');
  const fileImportTheme = document.getElementById('file-import-theme');

  if (btnExportTheme && btnImportTheme && fileImportTheme) {
    btnExportTheme.addEventListener('click', () => {
      chrome.storage.local.get([
        'selectedTheme',
        'customColors',
        'customMode',
        'customBaseColor',
        'customBaseStyle',
        'wallpaperEnable',
        'wallpaperUrl',
        'wallpaperFilename',
        'wallpaperOpacity',
        'wallpaperBlur'
      ], (data) => {
        const exportData = {
          version: 1,
          selectedTheme: data.selectedTheme || 'nord',
          customColors: data.customColors || {},
          customMode: data.customMode || 'auto',
          customBaseColor: data.customBaseColor || '#1d9bf0',
          customBaseStyle: data.customBaseStyle || 'light'
        };

        // カベガミ（壁紙）が有効な場合、それもエクスポートに含める
        if (data.wallpaperEnable) {
          exportData.wallpaper = {
            wallpaperEnable: true,
            wallpaperUrl: data.wallpaperUrl || '',
            wallpaperFilename: data.wallpaperFilename || '',
            wallpaperOpacity: data.wallpaperOpacity !== undefined ? data.wallpaperOpacity : 60,
            wallpaperBlur: data.wallpaperBlur !== undefined ? data.wallpaperBlur : 5
          };
        } else {
          exportData.wallpaper = {
            wallpaperEnable: false
          };
        }

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `namikarotter-theme-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    });

    btnImportTheme.addEventListener('click', () => {
      fileImportTheme.click();
    });

    fileImportTheme.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          
          if (!importData || typeof importData !== 'object') {
            throw new Error('無効なJSON形式です。');
          }

          const keysToSave = {};

          // テーマの復元
          if (importData.selectedTheme) {
            keysToSave.selectedTheme = importData.selectedTheme;
          }
          if (importData.customColors) {
            keysToSave.customColors = importData.customColors;
          }
          if (importData.customMode) {
            keysToSave.customMode = importData.customMode;
          }
          if (importData.customBaseColor) {
            keysToSave.customBaseColor = importData.customBaseColor;
          }
          if (importData.customBaseStyle) {
            keysToSave.customBaseStyle = importData.customBaseStyle;
          }

          // 壁紙の復元
          if (importData.wallpaper) {
            if (importData.wallpaper.wallpaperEnable) {
              keysToSave.wallpaperEnable = true;
              keysToSave.wallpaperUrl = importData.wallpaper.wallpaperUrl || '';
              keysToSave.wallpaperFilename = importData.wallpaper.wallpaperFilename || '';
              keysToSave.wallpaperOpacity = importData.wallpaper.wallpaperOpacity !== undefined ? importData.wallpaper.wallpaperOpacity : 60;
              keysToSave.wallpaperBlur = importData.wallpaper.wallpaperBlur !== undefined ? importData.wallpaper.wallpaperBlur : 5;
            } else {
              keysToSave.wallpaperEnable = false;
            }
          }

          chrome.storage.local.set(keysToSave, () => {
            alert('テーマをインポートしました。');
            restoreSettings();
            fileImportTheme.value = '';
          });

        } catch (err) {
          alert('インポートに失敗しました。ファイルが破損しているか、正しいテーマファイルではありません。\n' + err.message);
          fileImportTheme.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  // Initialize
  renderThemes();
  loadFonts();
});

