(function () {
  let hideUiObserver = null;
  let sidebarCollapseObserver = null;
  let surfaceShadowObserver = null;

  function startHideUiObserver(hideUiEnable, hideQr, hideCopyUrl) {
    if (hideUiObserver) {
      hideUiObserver.disconnect();
      hideUiObserver = null;
    }

    // Always clean up existing attributes if disabled or parameters change
    document.querySelectorAll('[data-namikarotter-hidden-qr]').forEach(el => el.removeAttribute('data-namikarotter-hidden-qr'));
    document.querySelectorAll('[data-namikarotter-hidden-copy]').forEach(el => el.removeAttribute('data-namikarotter-hidden-copy'));

    if (!hideUiEnable || (!hideQr && !hideCopyUrl)) {
      return;
    }

    const checkAndMarkElements = () => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (hideQr && text === 'QRを表示') {
          if (btn.getAttribute('data-namikarotter-hidden-qr') !== 'true') {
            btn.setAttribute('data-namikarotter-hidden-qr', 'true');
          }
        }
        if (hideCopyUrl && text.includes('プロフィールURLをコピー')) {
          if (btn.getAttribute('data-namikarotter-hidden-copy') !== 'true') {
            btn.setAttribute('data-namikarotter-hidden-copy', 'true');
          }
        }
      });
    };

    // Run once initially
    checkAndMarkElements();

    // Observe changes
    hideUiObserver = new MutationObserver(checkAndMarkElements);
    hideUiObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function startSidebarCollapseObserver(enabled, defaultTrends, defaultSpaces, defaultUsers, defaultLegal) {
    if (sidebarCollapseObserver) {
      sidebarCollapseObserver.disconnect();
      sidebarCollapseObserver = null;
    }

    // Clean up if disabled
    if (!enabled) {
      document.querySelectorAll('.namikarotter-collapse-btn').forEach(btn => btn.remove());
      document.querySelectorAll('[data-namikarotter-collapsed]').forEach(el => el.removeAttribute('data-namikarotter-collapsed'));
      document.querySelectorAll('[data-namikarotter-has-collapse-btn]').forEach(el => el.removeAttribute('data-namikarotter-has-collapse-btn'));
      return;
    }

    const injectCollapseButtons = () => {
      const sections = document.querySelectorAll('aside section');
      sections.forEach(sec => {
        if (sec.getAttribute('data-namikarotter-has-collapse-btn') === 'true') {
          return;
        }

        const header = sec.querySelector(':scope > div:first-child');
        if (!header) return;

        // Mark section
        sec.setAttribute('data-namikarotter-has-collapse-btn', 'true');

        // Ensure header is a flex container so button aligns nicely on the right
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        // Check if we should collapse by default
        const headerText = header.textContent.trim();
        let shouldCollapseDefault = false;
        if (defaultTrends && headerText.includes('トレンド')) {
          shouldCollapseDefault = true;
        } else if (defaultSpaces && headerText.includes('知り合いが参加中のスペース')) {
          shouldCollapseDefault = true;
        } else if (defaultUsers && headerText.includes('おすすめユーザー')) {
          shouldCollapseDefault = true;
        } else if (defaultLegal && (headerText.includes('法務・お問い合わせ') || headerText.includes('法務') || headerText.includes('お問い合わせ'))) {
          shouldCollapseDefault = true;
        }

        if (shouldCollapseDefault) {
          sec.setAttribute('data-namikarotter-collapsed', 'true');
        }

        // Create button
        const btn = document.createElement('button');
        btn.className = 'namikarotter-collapse-btn';
        // Add svg (arrows.svg content, stroke set to currentColor so it adapts to light/dark themes)
        // Inline style for rotation: -90deg by default (left 90 degrees)
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="66.05 84.4 284.2 284.2" width="16" height="16" style="transition: transform 0.2s ease; transform: rotate(-90deg); display: block;">
            <path fill="none" stroke="currentColor" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" d="M 165 138 L 250 226 L 165 314" />
          </svg>
        `;
        btn.style.background = 'none';
        btn.style.border = 'none';
        btn.style.padding = '6px';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.outline = 'none';
        btn.style.borderRadius = '50%';
        btn.style.color = 'var(--text-secondary, #475569)';
        btn.style.transition = 'background-color 0.2s ease';
        btn.style.marginLeft = '8px';
        
        // Add simple hover effect
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = 'transparent';
        });

        // Initialize state
        const isCollapsed = sec.getAttribute('data-namikarotter-collapsed') === 'true';
        btn.querySelector('svg').style.transform = isCollapsed ? 'rotate(90deg)' : 'rotate(-90deg)';

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentCollapsed = sec.getAttribute('data-namikarotter-collapsed') === 'true';
          if (currentCollapsed) {
            sec.removeAttribute('data-namikarotter-collapsed');
            btn.querySelector('svg').style.transform = 'rotate(-90deg)';
          } else {
            sec.setAttribute('data-namikarotter-collapsed', 'true');
            btn.querySelector('svg').style.transform = 'rotate(90deg)';
          }
        });

        header.appendChild(btn);
      });
    };

    // Run once initially
    injectCollapseButtons();

    // Observe changes
    sidebarCollapseObserver = new MutationObserver(injectCollapseButtons);
    sidebarCollapseObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  let imageDownloaderObserver = null;

  function startImageDownloader(enabled) {
    if (imageDownloaderObserver) {
      imageDownloaderObserver.disconnect();
      imageDownloaderObserver = null;
    }

    // Clean up buttons if disabled
    if (!enabled) {
      document.querySelectorAll('.namikarotter-download-btn').forEach(btn => btn.remove());
      return;
    }

    const processImages = () => {
      const imgs = document.querySelectorAll('img[src*="https://api.karotter.com/uploads/posts/"]');
      imgs.forEach(img => {
        const parent = img.parentElement;
        if (!parent) return;

        // Check if button already injected
        if (parent.querySelector('.namikarotter-download-btn')) {
          return;
        }

        // Ensure parent has positioning context so absolute positioning works
        const computedStyle = window.getComputedStyle(parent);
        if (computedStyle.position === 'static') {
          parent.style.position = 'relative';
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'namikarotter-download-btn';
        btn.setAttribute('aria-label', '画像をダウンロード');
        btn.title = '画像をダウンロード';
        
        btn.innerHTML = `<span style="display: inline-block; width: 18px; height: 18px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/download.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/download.svg')}') no-repeat center / contain;"></span>`;
        
        btn.style.cssText = `
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--accent, rgba(15, 23, 42, 0.7));
          color: var(--text-white, #ffffff);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease, transform 0.2s ease;
          backdrop-filter: blur(4px);
          outline: none;
        `;
        
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = 'var(--link-accent-hover, var(--accent, rgba(15, 23, 42, 0.9)))';
          btn.style.transform = 'scale(1.08)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = 'var(--accent, rgba(15, 23, 42, 0.7))';
          btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const imgUrl = img.src;
          chrome.runtime.sendMessage({ type: 'DOWNLOAD_IMAGE', url: imgUrl }, (response) => {
            if (response && response.success) {
              const originalHTML = btn.innerHTML;
              btn.innerHTML = `<span style="display: inline-block; width: 18px; height: 18px; background-color: #4ade80; -webkit-mask: url('${chrome.runtime.getURL('svgicons/check.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/check.svg')}') no-repeat center / contain;"></span>`;
              setTimeout(() => {
                btn.innerHTML = originalHTML;
              }, 1200);
            } else {
              console.error('Download message response error:', response);
            }
          });
        });

        parent.appendChild(btn);
      });
    };

    // Run once initially
    processImages();

    // Observe changes
    imageDownloaderObserver = new MutationObserver(processImages);
    imageDownloaderObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  let voiceDownloaderObserver = null;

  function startVoiceDownloader(enabled) {
    if (voiceDownloaderObserver) {
      voiceDownloaderObserver.disconnect();
      voiceDownloaderObserver = null;
    }

    // Clean up buttons if disabled
    if (!enabled) {
      document.querySelectorAll('.namikarotter-voice-download-btn').forEach(btn => btn.remove());
      return;
    }

    const processAudio = () => {
      const audios = document.querySelectorAll('audio[src*="https://api.karotter.com/uploads/audio/"]');
      audios.forEach(audio => {
        const parent = audio.parentElement;
        if (!parent) return;

        // Check if button already injected
        if (parent.querySelector('.namikarotter-voice-download-btn')) {
          return;
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'namikarotter-voice-download-btn';
        btn.setAttribute('aria-label', '音声をダウンロード');
        btn.title = '音声をダウンロード';
        
        btn.innerHTML = `<span style="display: inline-block; width: 18px; height: 18px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/download.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/download.svg')}') no-repeat center / contain;"></span>`;
        
        btn.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--accent, rgba(15, 23, 42, 0.7));
          color: var(--text-white, #ffffff);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease, transform 0.2s ease;
          flex-shrink: 0;
          outline: none;
        `;
        
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = 'var(--link-accent-hover, var(--accent, rgba(15, 23, 42, 0.9)))';
          btn.style.transform = 'scale(1.08)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = 'var(--accent, rgba(15, 23, 42, 0.7))';
          btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const audioUrl = audio.src;
          chrome.runtime.sendMessage({ type: 'DOWNLOAD_IMAGE', url: audioUrl }, (response) => {
            if (response && response.success) {
              const originalHTML = btn.innerHTML;
              btn.innerHTML = `<span style="display: inline-block; width: 18px; height: 18px; background-color: #4ade80; -webkit-mask: url('${chrome.runtime.getURL('svgicons/check.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/check.svg')}') no-repeat center / contain;"></span>`;
              setTimeout(() => {
                btn.innerHTML = originalHTML;
              }, 1200);
            } else {
              console.error('Download message response error:', response);
            }
          });
        });

        // Insert at the end of controls
        parent.appendChild(btn);
      });
    };

    // Run once initially
    processAudio();

    // Observe changes
    voiceDownloaderObserver = new MutationObserver(processAudio);
    voiceDownloaderObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  let markdownAssistantObserver = null;
  let markdownAssistantStyle = null;
  let katexStyleLink = null;
  let markdownAssistantEnabled = false;
  let postPreviewObserver = null;
  let postPreviewEnabled = false;

  function ensureKatexStyle() {
    if (!katexStyleLink) {
      katexStyleLink = document.createElement('link');
      katexStyleLink.id = 'namikarotter-katex-style';
      katexStyleLink.rel = 'stylesheet';
      katexStyleLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
      (document.head || document.documentElement).appendChild(katexStyleLink);
    }
  }

  function checkAndCleanupKatex() {
    if (!markdownAssistantEnabled && !postPreviewEnabled) {
      if (katexStyleLink) {
        katexStyleLink.remove();
        katexStyleLink = null;
      }
    }
  }

  function checkAndCleanupModals() {
    if (!markdownAssistantEnabled && !postPreviewEnabled) {
      const existingModal = document.getElementById('namikarotter-preview-modal');
      if (existingModal) existingModal.remove();
      const existingAnim = document.getElementById('namikarotter-modal-animation');
      if (existingAnim) existingAnim.remove();
    }
  }

  const parseMath = (latex, isDisplayMode) => {
    if (typeof katex !== 'undefined') {
      try {
        return katex.renderToString(latex, {
          displayMode: isDisplayMode,
          throwOnError: false
        });
      } catch (err) {
        console.error('KaTeX rendering error:', err);
        return `<span class="katex-error" style="color: var(--error, #ef4444);">${latex}</span>`;
      }
    }
    return latex;
  };

  const renderMarkdownPreview = (text) => {
    if (!text.trim()) {
      return '<span style="color: var(--text-muted, #64748b); font-style: italic; font-size: 13px;">ここにプレビューが表示されます</span>';
    }
    
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    html = html.replace(/&lt;span style="color:\s*(.*?)"&gt;([\s\S]*?)&lt;\/span&gt;/gi, (match, color, content) => {
      const sanitizedColor = color.replace(/[^\w\s#(),.-]/g, '');
      return `<span style="color: ${sanitizedColor}">${content}</span>`;
    });
    
    // Store math formulas
    const mathBlocks = [];
    const mathInlines = [];
    
    // 1. Extract block math $$ ... $$
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
      mathBlocks.push(formula.trim());
      return placeholder;
    });
    
    // 2. Extract inline math $ ... $
    html = html.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      const placeholder = `___MATH_INLINE_${mathInlines.length}___`;
      mathInlines.push(formula.trim());
      return placeholder;
    });

    const lines = html.split('\n');
    let inTable = false;
    let tableRows = [];
    let renderedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        const cells = line.split('|').map(c => c.trim()).slice(1, -1);
        tableRows.push(cells);
      } else {
        if (inTable) {
          if (tableRows.length >= 2) {
            let tableHtml = '<table style="border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 13px; border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));">';
            tableHtml += '<thead><tr style="border-bottom: 2px solid var(--border-soft, rgba(148, 163, 184, 0.22)); background: var(--surface-soft, rgba(148, 163, 184, 0.04));">';
            tableRows[0].forEach(cell => {
              tableHtml += `<th style="padding: 6px 8px; text-align: left; font-weight: 600; border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));">${cell}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
            
            const startIdx = tableRows[1].every(cell => /^:?-+:?$/.test(cell)) ? 2 : 1;
            for (let r = startIdx; r < tableRows.length; r++) {
              tableHtml += '<tr style="border-bottom: 1px solid var(--border-soft, rgba(148, 163, 184, 0.15));">';
              tableRows[r].forEach(cell => {
                tableHtml += `<td style="padding: 6px 8px; border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.15));">${cell}</td>`;
              });
              tableHtml += '</tr>';
            }
            tableHtml += '</tbody></table>';
            renderedLines.push(tableHtml);
          } else {
            tableRows.forEach(row => {
              renderedLines.push('| ' + row.join(' | ') + ' |');
            });
          }
          inTable = false;
          tableRows = [];
        }
        renderedLines.push(lines[i]);
      }
    }
    if (inTable && tableRows.length >= 1) {
      let tableHtml = '<table style="border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 13px; border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));"><tbody>';
      tableRows.forEach(row => {
        tableHtml += '<tr>';
        row.forEach(cell => {
          tableHtml += `<td style="padding: 6px 8px; border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));">${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table>';
      renderedLines.push(tableHtml);
    }
    
    html = renderedLines.join('\n');

    html = html.replace(/｜([^｜\n]+?)《([^《》\n]+?)》/g, '<ruby>$1<rt style="font-size: 0.6em; color: var(--text-secondary);">$2</rt></ruby>');
    html = html.replace(/([\u4e00-\u9faf]+?)《([^《》\n]+?)》/g, '<ruby>$1<rt style="font-size: 0.6em; color: var(--text-secondary);">$2</rt></ruby>');

    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const lines = code.trim().split('\n');
      let codeText = code;
      if (lines.length > 0 && lines[0].trim().match(/^[a-zA-Z0-9+#-]+$/)) {
        codeText = lines.slice(1).join('\n');
      }
      return `<pre style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; margin: 8px 0;"><code style="font-family: monospace;">${codeText.trim()}</code></pre>`;
    });

    html = html.replace(/`([^`\n]+?)`/g, '<code style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; margin: 0 2px;">$1</code>');

    html = html.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^\*\n]+?)\*/g, '<em>$1</em>');
    html = html.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');
    html = html.replace(/\[([^\[\]\n]+?)\]\(([^\(\)\n]+?)\)/g, '<a href="$2" target="_blank" style="color: var(--accent, #3b82f6); text-decoration: underline; word-break: break-all;">$1</a>');

    html = html.replace(/^### (.*?)$/gm, '<h3 style="font-size: 1.1em; font-weight: 700; margin: 8px 0 4px 0; border-bottom: 1px solid var(--border-soft);">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="font-size: 1.25em; font-weight: 700; margin: 10px 0 6px 0; border-bottom: 1px solid var(--border-soft);">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="font-size: 1.4em; font-weight: 700; margin: 12px 0 8px 0; border-bottom: 1px solid var(--border-soft);">$1</h1>');

    html = html.replace(/\n/g, '<br>');

    // Restore math blocks and inlines
    for (let i = 0; i < mathBlocks.length; i++) {
      const formula = mathBlocks[i];
      const parsed = parseMath(formula, true);
      const replacement = `<div style="text-align: center; margin: 8px 0; overflow-x: auto; white-space: pre-wrap;">${parsed}</div>`;
      html = html.replace(`___MATH_BLOCK_${i}___`, replacement);
    }

    for (let i = 0; i < mathInlines.length; i++) {
      const formula = mathInlines[i];
      const parsed = parseMath(formula, false);
      const replacement = `<span style="margin: 0 2px;">${parsed}</span>`;
      html = html.replace(`___MATH_INLINE_${i}___`, replacement);
    }

    return html;
  };

  const showPreviewModal = (text) => {
    let modal = document.getElementById('namikarotter-preview-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'namikarotter-preview-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: var(--font-sans, sans-serif);
      padding: 20px;
      box-sizing: border-box;
      animation: namikarotter-backdrop-fade-in 0.2s ease-out;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--surface-card, #ffffff);
      color: var(--text-primary, #0f172a);
      width: 100%;
      max-width: 540px;
      max-height: 80vh;
      border-radius: 14px;
      border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: namikarotter-fade-in 0.2s ease-out;
    `;

    if (!document.getElementById('namikarotter-modal-animation')) {
      const animStyle = document.createElement('style');
      animStyle.id = 'namikarotter-modal-animation';
      animStyle.textContent = `
        @keyframes namikarotter-fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes namikarotter-fade-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.96); }
        }
        @keyframes namikarotter-backdrop-fade-in {
          from { background: rgba(15, 23, 42, 0); backdrop-filter: blur(0px); }
          to { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
        }
        @keyframes namikarotter-backdrop-fade-out {
          from { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
          to { background: rgba(15, 23, 42, 0); backdrop-filter: blur(0px); }
        }
        .namikarotter-modal-closing {
          animation: namikarotter-backdrop-fade-out 0.2s ease-in forwards !important;
        }
        .namikarotter-modal-closing > div {
          animation: namikarotter-fade-out 0.2s ease-in forwards !important;
        }
      `;
      document.head.appendChild(animStyle);
    }

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--border-soft, rgba(148, 163, 184, 0.15)); user-select: none; background: var(--surface-soft, #f8fafc);">
        <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">投稿プレビュー</span>
        <button type="button" class="namikarotter-modal-close" style="background: none; border: none; font-size: 20px; font-weight: 700; color: var(--text-muted, #64748b); cursor: pointer; padding: 4px; line-height: 1; outline: none; transition: color 0.15s ease; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%;">
          &times;
        </button>
      </div>
      <div style="padding: 20px; overflow-y: auto; flex: 1; font-size: 14px; line-height: 1.6; word-break: break-all; background: var(--surface-card);">
        ${renderMarkdownPreview(text)}
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    let isClosing = false;
    const closeModal = () => {
      if (isClosing) return;
      isClosing = true;
      modal.classList.add('namikarotter-modal-closing');
      setTimeout(() => {
        modal.remove();
      }, 200);
    };

    content.querySelector('.namikarotter-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  };

  function startMarkdownAssistant(enabled) {
    markdownAssistantEnabled = !!enabled;
    if (markdownAssistantObserver) {
      markdownAssistantObserver.disconnect();
      markdownAssistantObserver = null;
    }

    // Clean up if disabled
    if (!enabled) {
      if (markdownAssistantStyle) {
        markdownAssistantStyle.remove();
        markdownAssistantStyle = null;
      }
      checkAndCleanupKatex();
      checkAndCleanupModals();
      
      document.querySelectorAll('.namikarotter-markdown-assistant').forEach(el => el.remove());
      document.querySelectorAll('.namikarotter-markdown-preview-container').forEach(el => el.remove());
      return;
    }

    if (!markdownAssistantStyle) {
      markdownAssistantStyle = document.createElement('style');
      markdownAssistantStyle.id = 'namikarotter-markdown-assistant-style';
      markdownAssistantStyle.textContent = `
        .namikarotter-color-dot {
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
          border: none !important;
          cursor: pointer !important;
          transition: transform 0.1s ease !important;
          outline: none !important;
          flex-shrink: 0 !important;
          padding: 0 !important;
          min-width: 0 !important;
          min-height: 0 !important;
          box-sizing: border-box !important;
        }
      `;
      (document.head || document.documentElement).appendChild(markdownAssistantStyle);
    }

    ensureKatexStyle();

    const insertTextAtCursor = (textarea, action, option) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);
      
      let before = text.substring(0, start);
      let after = text.substring(end);
      let insert = '';
      let newCursorStart = start;
      let newCursorEnd = end;
      
      switch (action) {
        case 'katex-inline':
          insert = `$${selectedText || ' '}$`;
          newCursorStart = start + 1;
          newCursorEnd = selectedText ? start + 1 + selectedText.length : start + 2;
          break;
        case 'katex-block': {
          const newlineBeforeK = (before.length > 0 && !before.endsWith('\n')) ? '\n' : '';
          const newlineAfterK = (after.length > 0 && !after.startsWith('\n')) ? '\n' : '';
          insert = `${newlineBeforeK}$$\n${selectedText || ' '}\n$$${newlineAfterK}`;
          newCursorStart = start + newlineBeforeK.length + 3;
          newCursorEnd = selectedText ? newCursorStart + selectedText.length : newCursorStart + 1;
          break;
        }
        case 'bold':
          insert = `**${selectedText || ' '}**`;
          newCursorStart = start + 2;
          newCursorEnd = selectedText ? start + 2 + selectedText.length : start + 3;
          break;
        case 'italic':
          insert = `*${selectedText || ' '}*`;
          newCursorStart = start + 1;
          newCursorEnd = selectedText ? start + 1 + selectedText.length : start + 2;
          break;
        case 'link':
          insert = `[${selectedText || 'リンクテキスト'}](url)`;
          if (selectedText) {
            newCursorStart = start + selectedText.length + 3;
            newCursorEnd = newCursorStart + 3;
          } else {
            newCursorStart = start + 1;
            newCursorEnd = start + 8;
          }
          break;
        case 'codeblock': {
          const newlineBeforeC = (before.length > 0 && !before.endsWith('\n')) ? '\n' : '';
          const newlineAfterC = (after.length > 0 && !after.startsWith('\n')) ? '\n' : '';
          insert = `${newlineBeforeC}\`\`\`\n${selectedText || ' '}\n\`\`\`${newlineAfterC}`;
          newCursorStart = start + newlineBeforeC.length + 4;
          newCursorEnd = selectedText ? newCursorStart + selectedText.length : newCursorStart + 1;
          break;
        }
        case 'table': {
          const newlineBeforeT = (before.length > 0 && !before.endsWith('\n')) ? '\n' : '';
          const newlineAfterT = (after.length > 0 && !after.startsWith('\n')) ? '\n' : '';
          insert = `${newlineBeforeT}\n| 見出し | 見出し |\n| --- | --- |\n| 内容 | 内容 |\n${newlineAfterT}`;
          newCursorStart = start + newlineBeforeT.length + 3;
          newCursorEnd = newCursorStart + 3;
          break;
        }
        case 'color': {
          insert = `$\\color{${option}}{\\text{${selectedText || '色付きテキスト'}}}$`;
          if (selectedText) {
            newCursorStart = start + 16 + option.length;
            newCursorEnd = newCursorStart + selectedText.length;
          } else {
            newCursorStart = start + 16 + option.length;
            newCursorEnd = newCursorStart + 7; // Length of "色付きテキスト"
          }
          break;
        }
      }
      
      textarea.value = before + insert + after;
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const processComposer = () => {
      const textareas = document.querySelectorAll('.karotter-composer-textarea');
      textareas.forEach(textarea => {
        const container = textarea.parentElement;
        if (!container) return;

        // Check if toolbar is already injected
        if (container.nextElementSibling && container.nextElementSibling.classList.contains('namikarotter-markdown-assistant')) {
          return;
        }

        const toolbar = document.createElement('div');
        toolbar.className = 'namikarotter-markdown-assistant';
        toolbar.style.cssText = `
          display: flex;
          flex-direction: column;
          margin-top: 8px;
          margin-bottom: 8px;
          user-select: none;
        `;

        toolbar.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; width: 100%;">
            <button type="button" class="namikarotter-assist-btn" data-action="katex-inline" title="KaTeX数式 (インライン) を挿入" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              <span>$ 数式</span>
            </button>
            
            <button type="button" class="namikarotter-assist-btn" data-action="katex-block" title="KaTeX数式 (ブロック) を挿入" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              <span>$$ 数式</span>
            </button>
            
            <button type="button" class="namikarotter-assist-btn" data-action="bold" title="太字を挿入" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              <span>** 太字</span>
            </button>
            
            <button type="button" class="namikarotter-assist-btn" data-action="italic" title="斜体を挿入" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              <span>* 斜体</span>
            </button>
            
            <button type="button" class="namikarotter-assist-btn" data-action="link" title="リンクを挿入" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/url.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/url.svg')}') no-repeat center / contain;"></span>
              <span>リンク</span>
            </button>
            
            <button type="button" class="namikarotter-assist-btn" data-action="codeblock" title="コードブロックを挿入" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/dev.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/dev.svg')}') no-repeat center / contain;"></span>
              <span>コード</span>
            </button>
            
            <button type="button" class="namikarotter-assist-btn" data-action="table" title="表を挿入" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/list.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/list.svg')}') no-repeat center / contain;"></span>
              <span>表</span>
            </button>
 
            <button type="button" class="namikarotter-color-toggle-btn" title="文字の色を変更" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/pallet.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/pallet.svg')}') no-repeat center / contain;"></span>
              <span>色</span>
            </button>
          </div>

          <div class="namikarotter-color-drawer" style="display: none; align-items: center; gap: 8px; margin-top: 8px; padding: 6px 10px; background: var(--surface-soft, rgba(148, 163, 184, 0.05)); border: 1px dashed var(--border-soft, rgba(148, 163, 184, 0.22)); border-radius: 8px; width: 100%; box-sizing: border-box;">
            <button type="button" class="namikarotter-color-dot" data-color="#ef4444" style="background: #ef4444;" title="赤"></button>
            <button type="button" class="namikarotter-color-dot" data-color="#f97316" style="background: #f97316;" title="オレンジ"></button>
            <button type="button" class="namikarotter-color-dot" data-color="#eab308" style="background: #eab308;" title="黄"></button>
            <button type="button" class="namikarotter-color-dot" data-color="#22c55e" style="background: #22c55e;" title="緑"></button>
            <button type="button" class="namikarotter-color-dot" data-color="#3b82f6" style="background: #3b82f6;" title="青"></button>
            <button type="button" class="namikarotter-color-dot" data-color="#a855f7" style="background: #a855f7;" title="紫"></button>
            <button type="button" class="namikarotter-color-dot" data-color="#ec4899" style="background: #ec4899;" title="ピンク"></button>
            
            <label style="width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: transform 0.1s ease; flex-shrink: 0;" title="カスタム色を選択">
              <span style="display: inline-block; width: 16px; height: 16px; background-color: var(--text-secondary, #475569); -webkit-mask: url('${chrome.runtime.getURL('svgicons/pallet.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/pallet.svg')}') no-repeat center / contain;"></span>
              <input type="color" class="namikarotter-color-input" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">
            </label>
          </div>
        `;

        const buttons = toolbar.querySelectorAll('.namikarotter-assist-btn');
        buttons.forEach(btn => {
          btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = 'var(--accent-soft, rgba(59, 130, 246, 0.12))';
            btn.style.color = 'var(--accent, #3b82f6)';
          });
          btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
            btn.style.color = 'var(--text-secondary, #475569)';
          });
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            insertTextAtCursor(textarea, action);
          });
        });

        // Setup color toggle button
        const colorToggle = toolbar.querySelector('.namikarotter-color-toggle-btn');
        const colorDrawer = toolbar.querySelector('.namikarotter-color-drawer');
        
        colorToggle.addEventListener('mouseenter', () => {
          colorToggle.style.backgroundColor = 'var(--accent-soft, rgba(59, 130, 246, 0.12))';
          colorToggle.style.color = 'var(--accent, #3b82f6)';
        });
        colorToggle.addEventListener('mouseleave', () => {
          if (colorDrawer.style.display === 'none') {
            colorToggle.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
            colorToggle.style.color = 'var(--text-secondary, #475569)';
          }
        });
        colorToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isOpen = colorDrawer.style.display === 'flex';
          if (isOpen) {
            colorDrawer.style.display = 'none';
            colorToggle.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
            colorToggle.style.color = 'var(--text-secondary, #475569)';
          } else {
            colorDrawer.style.display = 'flex';
            colorToggle.style.backgroundColor = 'var(--accent-soft, rgba(59, 130, 246, 0.12))';
            colorToggle.style.color = 'var(--accent, #3b82f6)';
          }
        });

        // Setup preset color dots
        const colorDots = colorDrawer.querySelectorAll('.namikarotter-color-dot');
        colorDots.forEach(dot => {
          dot.addEventListener('mouseenter', () => {
            dot.style.transform = 'scale(1.2)';
          });
          dot.addEventListener('mouseleave', () => {
            dot.style.transform = 'scale(1)';
          });
          dot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const colorHex = dot.getAttribute('data-color');
            insertTextAtCursor(textarea, 'color', colorHex);
            
            // Auto close drawer
            colorDrawer.style.display = 'none';
            colorToggle.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
            colorToggle.style.color = 'var(--text-secondary, #475569)';
          });
        });

        // Setup custom color input
        const colorInput = colorDrawer.querySelector('.namikarotter-color-input');
        const colorLabel = colorInput.parentElement;
        colorLabel.addEventListener('mouseenter', () => {
          colorLabel.style.transform = 'scale(1.2)';
        });
        colorLabel.addEventListener('mouseleave', () => {
          colorLabel.style.transform = 'scale(1)';
        });
        colorInput.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        colorInput.addEventListener('change', (e) => {
          const colorHex = e.target.value;
          insertTextAtCursor(textarea, 'color', colorHex);
          
          // Auto close drawer
          colorDrawer.style.display = 'none';
          colorToggle.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
          colorToggle.style.color = 'var(--text-secondary, #475569)';
        });

        container.insertAdjacentElement('afterend', toolbar);
      });
    };

    // Run once initially
    processComposer();

    // Observe changes
    markdownAssistantObserver = new MutationObserver(processComposer);
    markdownAssistantObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function startPostPreview(enabled) {
    postPreviewEnabled = !!enabled;
    if (postPreviewObserver) {
      postPreviewObserver.disconnect();
      postPreviewObserver = null;
    }

    if (!enabled) {
      checkAndCleanupKatex();
      checkAndCleanupModals();
      
      // Clean up injected buttons and restore submit button parents
      const wrappers = document.querySelectorAll('.namikarotter-preview-wrapper');
      wrappers.forEach(wrapper => {
        const submitBtn = wrapper.querySelector('button[type="submit"]');
        if (submitBtn) {
          wrapper.parentNode.insertBefore(submitBtn, wrapper);
        }
        wrapper.remove();
      });
      return;
    }

    ensureKatexStyle();

    const processPostPreview = () => {
      const textareas = document.querySelectorAll('.karotter-composer-textarea');
      textareas.forEach(textarea => {
        const form = textarea.closest('form');
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        // Check if already wrapped / injected
        if (submitBtn.parentElement && submitBtn.parentElement.classList.contains('namikarotter-preview-wrapper')) {
          return;
        }

        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'namikarotter-post-preview-btn';
        previewBtn.title = 'プレビューを表示';
        previewBtn.innerHTML = '<span>プレビュー</span>';

        previewBtn.style.cssText = `
          border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));
          background: var(--surface-soft, #f1f5f9);
          color: var(--text-secondary, #475569);
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          outline: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          box-sizing: border-box;
        `;

        previewBtn.addEventListener('mouseenter', () => {
          previewBtn.style.backgroundColor = 'var(--accent-soft, rgba(59, 130, 246, 0.12))';
          previewBtn.style.borderColor = 'var(--accent, #3b82f6)';
          previewBtn.style.color = 'var(--accent, #3b82f6)';
        });
        previewBtn.addEventListener('mouseleave', () => {
          previewBtn.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
          previewBtn.style.borderColor = 'var(--border-soft, rgba(148, 163, 184, 0.22))';
          previewBtn.style.color = 'var(--text-secondary, #475569)';
        });

        previewBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          showPreviewModal(textarea.value);
        });

        // Wrap the preview button and the submit button in a small flex container
        const wrapper = document.createElement('div');
        wrapper.className = 'namikarotter-preview-wrapper';
        wrapper.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        
        submitBtn.parentNode.insertBefore(wrapper, submitBtn);
        wrapper.appendChild(previewBtn);
        wrapper.appendChild(submitBtn);
      });
    };

    // Run once initially
    processPostPreview();

    // Observe changes
    postPreviewObserver = new MutationObserver(processPostPreview);
    postPreviewObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  let kbotAssistantObserver = null;
  let kbotAssistantEnabled = false;

  function startKbotAssistant(enabled) {
    kbotAssistantEnabled = !!enabled;
    if (kbotAssistantObserver) {
      kbotAssistantObserver.disconnect();
      kbotAssistantObserver = null;
    }

    if (!kbotAssistantEnabled) {
      document.querySelectorAll('.namikarotter-kbot-assistant').forEach(el => el.remove());
      return;
    }

    const insertKbotText = (textarea, textToInsert) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = textarea.value;
      
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      
      textarea.value = before + textToInsert + after;
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const processKbotComposer = () => {
      const textareas = document.querySelectorAll('.karotter-composer-textarea');
      textareas.forEach(textarea => {
        const container = textarea.parentElement;
        if (!container) return;

        // Check if kbot assistant is already injected
        if (container.nextElementSibling && (
          container.nextElementSibling.classList.contains('namikarotter-kbot-assistant') ||
          (container.nextElementSibling.nextElementSibling && container.nextElementSibling.nextElementSibling.classList.contains('namikarotter-kbot-assistant'))
        )) {
          return;
        }

        let insertAfterTarget = container;
        if (container.nextElementSibling && container.nextElementSibling.classList.contains('namikarotter-markdown-assistant')) {
          insertAfterTarget = container.nextElementSibling;
        }

        const toolbar = document.createElement('div');
        toolbar.className = 'namikarotter-kbot-assistant';
        toolbar.style.cssText = `
          display: flex;
          flex-direction: column;
          margin-top: 8px;
          margin-bottom: 8px;
          user-select: none;
        `;

        toolbar.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; width: 100%;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted, #64748b); margin-right: 4px; display: inline-flex; align-items: center; gap: 4px;">
              kbotアシスタント:
            </span>
            
            <button type="button" class="namikarotter-kbot-tab-btn" data-target="vs" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              👤 VS比較
            </button>
            
            <button type="button" class="namikarotter-kbot-tab-btn" data-target="rank-range" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              📊 範囲順位
            </button>
            
            <button type="button" class="namikarotter-kbot-tab-btn" data-target="rank-period" style="background: var(--surface-soft, #f1f5f9); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); color: var(--text-secondary, #475569); border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 150ms ease; outline: none; display: inline-flex; align-items: center; gap: 4px;">
              📅 期間ランキング
            </button>
          </div>
          
          <!-- VS比較 Drawer -->
          <div class="namikarotter-kbot-drawer" data-drawer="vs" style="display: none; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; padding: 8px 12px; background: var(--surface-soft, rgba(148, 163, 184, 0.05)); border: 1px dashed var(--border-soft, rgba(148, 163, 184, 0.22)); border-radius: 8px; width: 100%; box-sizing: border-box;">
            <input type="text" placeholder="ユーザーA" class="namikarotter-kbot-input-usera" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.3)); color: var(--text-primary); border-radius: 6px; padding: 4px 8px; font-size: 12px; width: 100px; outline: none;">
            <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">vs</span>
            <input type="text" placeholder="ユーザーB" class="namikarotter-kbot-input-userb" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.3)); color: var(--text-primary); border-radius: 6px; padding: 4px 8px; font-size: 12px; width: 100px; outline: none;">
            <button type="button" class="namikarotter-kbot-insert-btn" style="background: var(--accent, #3b82f6); color: #ffffff; border: none; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; margin-left: auto; outline: none; transition: background-color 150ms ease;">挿入</button>
          </div>
          
          <!-- 範囲順位 Drawer -->
          <div class="namikarotter-kbot-drawer" data-drawer="rank-range" style="display: none; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; padding: 8px 12px; background: var(--surface-soft, rgba(148, 163, 184, 0.05)); border: 1px dashed var(--border-soft, rgba(148, 163, 184, 0.22)); border-radius: 8px; width: 100%; box-sizing: border-box;">
            <select class="namikarotter-kbot-select-type" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.3)); color: var(--text-primary); border-radius: 6px; padding: 4px 8px; font-size: 12px; outline: none;">
              <option value="rps">投稿数ランキング (rps)</option>
              <option value="rflw">フォロワーランキング (rflw)</option>
            </select>
            <input type="number" value="11" min="1" class="namikarotter-kbot-input-start" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.3)); color: var(--text-primary); border-radius: 6px; padding: 4px 8px; font-size: 12px; width: 60px; outline: none;">
            <span style="font-size: 12px; color: var(--text-secondary);">〜</span>
            <input type="number" value="20" min="1" class="namikarotter-kbot-input-end" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.3)); color: var(--text-primary); border-radius: 6px; padding: 4px 8px; font-size: 12px; width: 60px; outline: none;">
            <span style="font-size: 11px; color: var(--text-muted, #64748b); margin-left: 4px;">(範囲: 2〜15以内)</span>
            <button type="button" class="namikarotter-kbot-insert-btn" style="background: var(--accent, #3b82f6); color: #ffffff; border: none; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; margin-left: auto; outline: none; transition: background-color 150ms ease;">挿入</button>
          </div>
          
          <!-- 期間ランキング Drawer -->
          <div class="namikarotter-kbot-drawer" data-drawer="rank-period" style="display: none; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; padding: 8px 12px; background: var(--surface-soft, rgba(148, 163, 184, 0.05)); border: 1px dashed var(--border-soft, rgba(148, 163, 184, 0.22)); border-radius: 8px; width: 100%; box-sizing: border-box;">
            <select class="namikarotter-kbot-select-period-type" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.3)); color: var(--text-primary); border-radius: 6px; padding: 4px 8px; font-size: 12px; outline: none;">
              <option value="rps day">【日間】投稿数ランキング (rps day)</option>
              <option value="rps week">【週間】投稿数ランキング (rps week)</option>
              <option value="rflw day">【日間】フォロワー数ランキング (rflw day)</option>
              <option value="rflw week">【週間】フォロワー数ランキング (rflw week)</option>
              <option value="rrt day">【日間】レート変動ランキング (rrt day)</option>
              <option value="rrt week">【週間】レート変動ランキング (rrt week)</option>
            </select>
            <button type="button" class="namikarotter-kbot-insert-btn" style="background: var(--accent, #3b82f6); color: #ffffff; border: none; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; margin-left: auto; outline: none; transition: background-color 150ms ease;">挿入</button>
          </div>
        `;

        const tabs = toolbar.querySelectorAll('.namikarotter-kbot-tab-btn');
        const drawers = toolbar.querySelectorAll('.namikarotter-kbot-drawer');

        tabs.forEach(tab => {
          tab.addEventListener('mouseenter', () => {
            if (!tab.classList.contains('namikarotter-active')) {
              tab.style.backgroundColor = 'var(--accent-soft, rgba(59, 130, 246, 0.12))';
              tab.style.color = 'var(--accent, #3b82f6)';
            }
          });
          tab.addEventListener('mouseleave', () => {
            if (!tab.classList.contains('namikarotter-active')) {
              tab.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
              tab.style.color = 'var(--text-secondary, #475569)';
            }
          });
          tab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const target = tab.getAttribute('data-target');
            const targetDrawer = toolbar.querySelector(`.namikarotter-kbot-drawer[data-drawer="${target}"]`);
            const isCurrentlyOpen = targetDrawer.style.display === 'flex';

            // Close all drawers
            drawers.forEach(d => d.style.display = 'none');
            tabs.forEach(t => {
              t.classList.remove('namikarotter-active');
              t.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
              t.style.color = 'var(--text-secondary, #475569)';
              t.style.borderColor = 'var(--border-soft, rgba(148, 163, 184, 0.22))';
            });

            if (!isCurrentlyOpen) {
              tab.classList.add('namikarotter-active');
              tab.style.backgroundColor = 'var(--accent, #3b82f6)';
              tab.style.color = '#ffffff';
              tab.style.borderColor = 'var(--accent, #3b82f6)';
              targetDrawer.style.display = 'flex';
            }
          });
        });

        // Set up insert actions
        drawers.forEach(drawer => {
          const drawerType = drawer.getAttribute('data-drawer');
          const insertBtn = drawer.querySelector('.namikarotter-kbot-insert-btn');
          
          insertBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (drawerType === 'vs') {
              const userA = (drawer.querySelector('.namikarotter-kbot-input-usera').value || '').trim();
              const userB = (drawer.querySelector('.namikarotter-kbot-input-userb').value || '').trim();
              if (!userA || !userB) {
                alert('両方のユーザー名を入力してください。');
                return;
              }
              insertKbotText(textarea, `@kbot ${userA} vs ${userB} `);
            } else if (drawerType === 'rank-range') {
              const start = parseInt(drawer.querySelector('.namikarotter-kbot-input-start').value, 10);
              const end = parseInt(drawer.querySelector('.namikarotter-kbot-input-end').value, 10);
              if (isNaN(start) || isNaN(end)) {
                alert('順位を数字で入力してください。');
                return;
              }
              const range = Math.abs(end - start) + 1;
              if (range < 2 || range > 15) {
                alert('順位の表示範囲は2〜15位の間で指定してください。 (例: 11-20)');
                return;
              }
              const rankType = drawer.querySelector('.namikarotter-kbot-select-type').value;
              const minRank = Math.min(start, end);
              const maxRank = Math.max(start, end);
              insertKbotText(textarea, `@kbot ${rankType} ${minRank}-${maxRank} `);
            } else if (drawerType === 'rank-period') {
              const val = drawer.querySelector('.namikarotter-kbot-select-period-type').value;
              insertKbotText(textarea, `@kbot ${val} `);
            }

            // Collapse drawer after inserting
            drawer.style.display = 'none';
            tabs.forEach(t => {
              t.classList.remove('namikarotter-active');
              t.style.backgroundColor = 'var(--surface-soft, #f1f5f9)';
              t.style.color = 'var(--text-secondary, #475569)';
              t.style.borderColor = 'var(--border-soft, rgba(148, 163, 184, 0.22))';
            });
          });
        });

        insertAfterTarget.insertAdjacentElement('afterend', toolbar);
      });
    };

    processKbotComposer();
    kbotAssistantObserver = new MutationObserver(processKbotComposer);
    kbotAssistantObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function startSurfaceShadowObserver() {
    if (surfaceShadowObserver) {
      surfaceShadowObserver.disconnect();
      surfaceShadowObserver = null;
    }

    const checkElements = () => {
      const containers = document.querySelectorAll('.shadow-\\[var\\(--surface-shadow\\)\\]');
      containers.forEach(container => {
        const divs = container.querySelectorAll('div');
        let hasCurrent = false;
        for (const div of divs) {
          if (div.textContent.trim() === '現在') {
            hasCurrent = true;
            break;
          }
        }
        if (hasCurrent) {
          if (container.getAttribute('data-namikarotter-has-current') !== 'true') {
            container.setAttribute('data-namikarotter-has-current', 'true');
          }
        } else {
          if (container.getAttribute('data-namikarotter-has-current') === 'true') {
            container.removeAttribute('data-namikarotter-has-current');
          }
        }
      });
    };

    checkElements();

    surfaceShadowObserver = new MutationObserver(checkElements);
    surfaceShadowObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Expose to window namespace
  window.NamiObservers = {
    startHideUiObserver,
    startSidebarCollapseObserver,
    startImageDownloader,
    startVoiceDownloader,
    startMarkdownAssistant,
    startPostPreview,
    startKbotAssistant,
    startSurfaceShadowObserver
  };
})();
