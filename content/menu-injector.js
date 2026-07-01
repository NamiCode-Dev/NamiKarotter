(function () {
  const MENU_STYLE_ID = 'namikarotter-menu-style';
  const NAV_ITEM_ATTR = 'data-namikarotter-nav-item';
  const SUBMENU_ATTR = 'data-namikarotter-submenu';
  const SETTINGS_MODAL_ID = 'namikarotter-settings-modal';
  const NAV_CHECK_INTERVAL_MS = 100;
  const DEFAULT_FONT_STACK = '"Noto Sans JP", "Inter", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", sans-serif';
  let navCheckTimer = null;
  let navGlobalListenersReady = false;

  function injectMenuStyles() {
    if (document.getElementById(MENU_STYLE_ID)) return;

    const styleEl = document.createElement('style');
    styleEl.id = MENU_STYLE_ID;
    styleEl.textContent = `
[${NAV_ITEM_ATTR}="true"] {
  position: relative;
}
[${NAV_ITEM_ATTR}="true"] button {
  border: 0;
  font: inherit;
  cursor: pointer;
}
.namikarotter-modal-sidebar {
  display: flex;
  flex-direction: column;
  width: 160px;
  border-right: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));
  padding: 12px 8px;
  gap: 4px;
  background: var(--surface-soft, rgba(148, 163, 184, 0.04));
  flex-shrink: 0;
}
.namikarotter-modal-tab {
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
  text-align: left;
  cursor: pointer;
  transition: all 150ms ease;
}
.namikarotter-modal-tab:hover {
  background: var(--surface-soft, rgba(148, 163, 184, 0.08));
  color: var(--text-primary, #0f172a);
}
.namikarotter-modal-tab.is-active {
  font-weight: 700;
  color: var(--accent, #3b82f6) !important;
  background: var(--accent-soft, rgba(59, 130, 246, 0.12)) !important;
}
#${SETTINGS_MODAL_ID} {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--text-primary, #0f172a);
  font-family: var(--app-font-family, ${DEFAULT_FONT_STACK});
  opacity: 0;
  pointer-events: none;
  transition: opacity 240ms ease;
}
#${SETTINGS_MODAL_ID}[hidden] {
  display: none !important;
}
#${SETTINGS_MODAL_ID}.is-open {
  opacity: 1;
  pointer-events: auto;
}
#${SETTINGS_MODAL_ID} .namikarotter-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  opacity: 0;
  transition: opacity 240ms ease;
}
#${SETTINGS_MODAL_ID}.is-open .namikarotter-modal-backdrop {
  opacity: 1;
}
#${SETTINGS_MODAL_ID} .namikarotter-modal-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(680px, calc(100vw - 28px));
  height: min(540px, calc(100vh - 28px));
  overflow: hidden;
  border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.28));
  border-radius: 1.4rem;
  background: var(--surface-card, #ffffff);
  box-shadow: var(--surface-shadow, 0 24px 70px rgba(15, 23, 42, 0.24));
  transform: scale(0.96) translateY(8px);
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}
#${SETTINGS_MODAL_ID}.is-open .namikarotter-modal-panel {
  transform: scale(1) translateY(0);
}
#${SETTINGS_MODAL_ID}.has-wallpaper .namikarotter-modal-panel {
  backdrop-filter: blur(var(--modal-blur, 10px)) !important;
  -webkit-backdrop-filter: blur(var(--modal-blur, 10px)) !important;
}
#${SETTINGS_MODAL_ID} .namikarotter-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 54px;
  padding: 10px 14px 10px 18px;
  border-bottom: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));
  background: var(--surface-card, #ffffff);
}
#${SETTINGS_MODAL_ID} .namikarotter-modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}
#${SETTINGS_MODAL_ID} .namikarotter-modal-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#${SETTINGS_MODAL_ID} .namikarotter-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}
#${SETTINGS_MODAL_ID} .namikarotter-modal-close:hover {
  background: var(--surface-soft, rgba(148, 163, 184, 0.12));
  color: var(--text-primary, #0f172a);
}
#${SETTINGS_MODAL_ID} .namikarotter-settings-frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: 0;
  background: transparent;
  color-scheme: normal;
}
.namikarotter-modal-lock {
  overflow: hidden !important;
}
@media (max-width: 640px) {
  #${SETTINGS_MODAL_ID} {
    padding: 10px;
    align-items: flex-end;
  }
  #${SETTINGS_MODAL_ID} .namikarotter-modal-panel {
    width: 100%;
    height: min(680px, calc(100vh - 20px));
    border-radius: 1.2rem;
  }
  .namikarotter-modal-container {
    flex-direction: column !important;
  }
  .namikarotter-modal-sidebar {
    width: 100% !important;
    flex-direction: row !important;
    border-right: 0 !important;
    border-bottom: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)) !important;
    padding: 6px 12px !important;
    gap: 8px !important;
    overflow-x: auto;
  }
  .namikarotter-modal-tab {
    padding: 8px 12px !important;
    text-align: center !important;
  }
}
.dev-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary, #475569);
  margin-top: 12px;
}
.dev-links a {
  color: var(--accent, #3b82f6) !important;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 150ms ease;
}
.dev-links a:hover {
  opacity: 0.8;
  text-decoration: underline;
}
.namikarotter-notification-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 280px;
  margin: 8px 12px;
}
.namikarotter-notification-select {
  width: 100%;
  padding: 8px 36px 8px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #0f172a);
  background-color: var(--surface-card, #ffffff);
  border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22));
  border-radius: 9999px;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.namikarotter-notification-select:hover {
  border-color: var(--accent, #3b82f6);
}
.namikarotter-notification-select:focus {
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 0 0 3px var(--accent-soft, rgba(59, 130, 246, 0.15));
}
.namikarotter-notification-select-arrow {
  position: absolute;
  right: 14px;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #475569);
  width: 16px;
  height: 16px;
}
`;
    (document.head || document.documentElement).appendChild(styleEl);
  }


  function carrotIcon(className) {
    return `<span class="${className}" style="display: inline-block; vertical-align: middle; width: 24px !important; height: 24px !important; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/carrot.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/carrot.svg')}') no-repeat center / contain;"></span>`;
  }

  function styleItemLikeSibling(item, sibling) {
    if (!sibling) return;
    const btn = item.querySelector('[data-namikarotter-toggle]');
    if (!btn) return;

    btn.className = '';
    const activeClasses = [
      'bg-blue-50', 'bg-blue-100', 'bg-sky-50', 'bg-sky-100',
      'text-blue-600', 'text-blue-500', 'text-sky-600', 'text-sky-500',
      'font-bold'
    ];
    let hasTextColor = false;
    for (const cls of sibling.classList) {
      if (!activeClasses.includes(cls)) {
        btn.classList.add(cls);
        if (cls.startsWith('text-')) {
          hasTextColor = true;
        }
      }
    }
    const extraClasses = ['font-medium', 'border-0', 'bg-transparent', 'text-left', 'w-full'];
    if (!hasTextColor) {
      extraClasses.push('text-gray-700');
    }
    btn.classList.add(...extraClasses);
  }

  function createNamiNavItem() {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative';
    wrapper.setAttribute(NAV_ITEM_ATTR, 'true');
    wrapper.innerHTML = `
<button type="button" class="flex w-full items-center space-x-3 rounded-[1.2rem] border-0 bg-transparent px-4 py-3 text-left transition-colors text-gray-700 hover:bg-gray-100" data-namikarotter-toggle>
  <div class="relative" style="display: flex; align-items: center; justify-content: center;">${carrotIcon('lucide lucide-palette h-5 w-5')}</div>
  <span class="font-medium text-sm md:text-base">NamiKarotter</span>
</button>`;

    const toggle = wrapper.querySelector('[data-namikarotter-toggle]');
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openNamiSettingsModal('theme');
    });

    return wrapper;
  }

  function findTargetNavs() {
    const exactNavs = Array.from(document.querySelectorAll('nav.space-y-2.flex-1, nav.space-y-4.flex-1'));
    if (exactNavs.length > 0) return exactNavs;

    return Array.from(document.querySelectorAll('nav')).filter((nav) => {
      const likelyLinks = nav.querySelectorAll('a[href="/"], a[href="/search"], a[href="/notifications"], a[href="/dm"], a[href="/bookmarks"], a[href^="/profile/"]');
      return likelyLinks.length >= 3 && nav.children.length >= 4;
    });
  }

  function placeNamiNavItem(nav, item) {
    const siblings = Array.from(nav.children).filter((child) => child !== item);
    const targetIndex = Math.max(siblings.length - 1, 0);
    const insertBefore = siblings[targetIndex] || null;

    if (item.parentElement !== nav || item.nextElementSibling !== insertBefore) {
      nav.insertBefore(item, insertBefore);
    }

    if (siblings.length > 0) {
      styleItemLikeSibling(item, siblings[0]);
    }
  }

  function ensureNamiNavItems() {
    const navs = findTargetNavs();
    if (navs.length === 0) return;

    injectMenuStyles();
    ensureNamiGlobalListeners();

    navs.forEach((nav) => {
      let item = nav.querySelector(`[${NAV_ITEM_ATTR}="true"]`);
      if (!item) {
        item = createNamiNavItem();
      }
      placeNamiNavItem(nav, item);
    });
  }

  function ensureNamiGlobalListeners() {
    if (navGlobalListenersReady) return;

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeThemeSettingsModal();
    });

    navGlobalListenersReady = true;
  }

  function modalRoot() {
    return document.body || document.documentElement;
  }

  function closeThemeSettingsModal() {
    const modal = document.getElementById(SETTINGS_MODAL_ID);
    if (!modal) return;

    modal.classList.remove('is-open');
    document.documentElement.classList.remove('namikarotter-modal-lock');
    window.setTimeout(() => {
      if (!modal.classList.contains('is-open')) {
        modal.hidden = true;
      }
    }, 180);
  }

  function openNamiSettingsModal(initialTab = 'theme') {
    injectMenuStyles();

    let modal = document.getElementById(SETTINGS_MODAL_ID);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = SETTINGS_MODAL_ID;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.hidden = true;
      modal.innerHTML = `
<div class="namikarotter-modal-backdrop" data-namikarotter-modal-close></div>
<section class="namikarotter-modal-panel">
  <header class="namikarotter-modal-header">
    <div class="namikarotter-modal-title">
      ${carrotIcon('lucide lucide-palette h-5 w-5')}
      <span data-namikarotter-modal-title>NamiKarotter</span>
    </div>
    <button type="button" class="namikarotter-modal-close" aria-label="閉じる" data-namikarotter-modal-close>
      <span style="display: inline-block; vertical-align: middle; width: 20px !important; height: 20px !important; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/close.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/close.svg')}') no-repeat center / contain;"></span>
    </button>
  </header>
  <div class="namikarotter-modal-container" style="display:flex; flex:1; min-height:0;">
    <div class="namikarotter-modal-sidebar">
      <button type="button" class="namikarotter-modal-tab" data-tab="theme" style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 18px; height: 18px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/pallet.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/pallet.svg')}') no-repeat center / contain; flex-shrink: 0;"></span>
        <span>テーマ</span>
      </button>
      <button type="button" class="namikarotter-modal-tab" data-tab="extensions" style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 18px; height: 18px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/puzzle.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/puzzle.svg')}') no-repeat center / contain; flex-shrink: 0;"></span>
        <span>プラグイン</span>
      </button>
      <button type="button" class="namikarotter-modal-tab" data-tab="info" style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 18px; height: 18px; background-color: currentColor; -webkit-mask: url('${chrome.runtime.getURL('svgicons/info.svg')}') no-repeat center / contain; mask: url('${chrome.runtime.getURL('svgicons/info.svg')}') no-repeat center / contain; flex-shrink: 0;"></span>
        <span>情報</span>
      </button>
    </div>
    <div data-namikarotter-modal-body style="display:flex; flex:1; min-height:0;"></div>
  </div>
</section>`;

      modal.addEventListener('click', (event) => {
        const closeTarget = event.target instanceof Element
          ? event.target.closest('[data-namikarotter-modal-close]')
          : null;
        if (closeTarget) {
          closeThemeSettingsModal();
        }

        const tabTarget = event.target instanceof Element
          ? event.target.closest('.namikarotter-modal-tab')
          : null;
        if (tabTarget) {
          const tabId = tabTarget.getAttribute('data-tab');
          switchNamiTab(tabId);
        }
      });

      modalRoot().appendChild(modal);
    }

    // Sync wallpaper setting to modal backdrop/panel
    chrome.storage.local.get(['wallpaperEnable', 'wallpaperUrl', 'wallpaperOpacity', 'wallpaperBlur'], (data) => {
      const isWallpaper = data.wallpaperEnable && data.wallpaperUrl;
      const opacity = data.wallpaperOpacity !== undefined ? data.wallpaperOpacity / 100 : 0.6;
      const blurVal = data.wallpaperBlur !== undefined ? data.wallpaperBlur : 5;

      modal.classList.toggle('has-wallpaper', !!isWallpaper);
      if (isWallpaper) {
        modal.style.setProperty('--modal-opacity', String(opacity));
        modal.style.setProperty('--modal-blur', `${blurVal}px`);
      } else {
        modal.style.removeProperty('--modal-opacity');
        modal.style.removeProperty('--modal-blur');
      }
    });

    modal.hidden = false;
    document.documentElement.classList.add('namikarotter-modal-lock');
    switchNamiTab(initialTab);
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
    });
  }

  function switchNamiTab(tabId) {
    const modal = document.getElementById(SETTINGS_MODAL_ID);
    if (!modal) return;

    modal.querySelectorAll('.namikarotter-modal-tab').forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('is-active', isActive);
    });

    const bodyContainer = modal.querySelector('[data-namikarotter-modal-body]');
    if (!bodyContainer) return;

    if (tabId === 'theme') {
      bodyContainer.innerHTML = `<iframe class="namikarotter-settings-frame" src="${chrome.runtime.getURL('options/theme.html')}" title="NamiKarotter theme settings" allowtransparency="true"></iframe>`;
    } else if (tabId === 'extensions') {
      bodyContainer.innerHTML = `<iframe class="namikarotter-settings-frame" src="${chrome.runtime.getURL('options/extensions.html')}" title="NamiKarotter extension settings" allowtransparency="true"></iframe>`;
    } else if (tabId === 'info') {
       bodyContainer.innerHTML = `
 <div style="display:flex; flex:1; align-items:center; justify-content:center; padding:24px; text-align:center; color:var(--text-secondary, #475569); line-height:1.7;">
   <div>
     <div style="margin-bottom:8px; font-weight:700; color:var(--text-primary, #0f172a); font-size:16px;">NamiKarotter</div>
     <div style="font-size:13px; margin-bottom:16px;">バージョン 0.2</div>
     <div style="font-weight:600; font-size:13px; color:var(--text-primary, #0f172a); margin-bottom:4px;">開発者: NamiCode (Developer)</div>
     <div class="dev-links">
       <a href="https://github.com/NamiCode-Dev" target="_blank" rel="noopener noreferrer">GitHub</a> &nbsp;·&nbsp;
       <a href="https://x.com/NamiCode_Dev" target="_blank" rel="noopener noreferrer">X (Twitter)</a> &nbsp;·&nbsp;
       <a href="https://karotter.com/?recommended=latest" target="_blank" rel="noopener noreferrer">Karotter</a> &nbsp;·&nbsp;
       <a href="https://namicode.f5.si/" target="_blank" rel="noopener noreferrer">Website</a>
     </div>
   </div>
 </div>`;
      }
  }

  function injectAdvancedSearchButton() {
    chrome.storage.local.get(['pluginAdvancedSearchEnable'], (data) => {
      const isEnabled = data.pluginAdvancedSearchEnable !== false;
      
      const inputs = document.querySelectorAll('input[placeholder*="検索"], input[placeholder*="search"], input[placeholder*="Search"]');
      
      if (!isEnabled) {
        document.querySelectorAll('.namikarotter-adv-search-btn').forEach(btn => btn.remove());
        const existingPopup = document.getElementById('namikarotter-adv-search-popup');
        if (existingPopup) existingPopup.remove();
        return;
      }

      inputs.forEach(input => {
        const parent = input.parentElement;
        if (!parent || parent.querySelector('.namikarotter-adv-search-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'namikarotter-adv-search-btn';
        btn.setAttribute('aria-label', '高度な検索');
        
        btn.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 6px;
          color: var(--text-secondary, #475569);
          cursor: pointer;
          transition: color 150ms ease;
          flex-shrink: 0;
        `;
        
        if (parent.classList.contains('relative') || getComputedStyle(parent).position === 'relative') {
          btn.style.position = 'absolute';
          btn.style.right = '12px';
          btn.style.top = '50%';
          btn.style.transform = 'translateY(-50%)';
          btn.style.zIndex = '5';
          input.style.paddingRight = '38px';
        }

        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sliders-horizontal" style="pointer-events: none;"><line x1="21" x2="14" y1="4" y2="4"></line><line x1="10" x2="3" y1="4" y2="4"></line><line x1="21" x2="12" y1="12" y2="12"></line><line x1="8" x2="3" y1="12" y2="12"></line><line x1="21" x2="16" y1="20" y2="20"></line><line x1="12" x2="3" y1="20" y2="20"></line><line x1="14" x2="14" y1="2" y2="6"></line><line x1="8" x2="8" y1="10" y2="14"></line><line x1="16" x2="16" y1="18" y2="22"></line></svg>
        `;

        btn.addEventListener('mouseenter', () => {
          btn.style.color = 'var(--accent, #3b82f6)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.color = 'var(--text-secondary, #475569)';
        });

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleAdvancedSearchPopup(btn, input);
        });

        if (input.nextSibling) {
          parent.insertBefore(btn, input.nextSibling);
        } else {
          parent.appendChild(btn);
        }
      });
    });
  }

  function toggleAdvancedSearchPopup(btn, input) {
    let popup = document.getElementById('namikarotter-adv-search-popup');
    if (popup) {
      popup.remove();
      return;
    }

    popup = document.createElement('div');
    popup.id = 'namikarotter-adv-search-popup';
    popup.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--app-font-family, ${DEFAULT_FONT_STACK});
    `;

    let animStyle = document.getElementById('namikarotter-adv-anim-style');
    if (!animStyle) {
      animStyle = document.createElement('style');
      animStyle.id = 'namikarotter-adv-anim-style';
      animStyle.textContent = `
        @keyframes namiFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(animStyle);
    }

    popup.innerHTML = `
<div class="namikarotter-adv-search-backdrop" style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);"></div>
<section class="namikarotter-adv-search-panel" style="position: relative; width: min(460px, 95vw); max-height: 85vh; background: var(--surface-card, #ffffff); border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.28)); border-radius: 16px; box-shadow: var(--surface-shadow, 0 12px 40px rgba(0,0,0,0.15)); display: flex; flex-direction: column; overflow: hidden; animation: namiFadeIn 200ms ease; color: var(--text-primary);">
  <header style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); background: var(--surface-card, #ffffff);">
    <span style="font-weight: 700; font-size: 15px; color: var(--text-primary);">高度な検索</span>
    <button type="button" class="namikarotter-adv-search-close" style="background: transparent; border: none; font-size: 20px; color: var(--text-secondary, #475569); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%;">&times;</button>
  </header>
  
  <div style="flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 14px; background: var(--surface-card, #ffffff);">
    <div>
      <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">キーワード</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div>
          <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">次の単語をすべて含む</label>
          <input type="text" id="adv-search-all" placeholder="例: カロート 美味しい" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
        <div>
          <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">次の単語のいずれかを含む</label>
          <input type="text" id="adv-search-any" placeholder="例: りんご みかん" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
        <div>
          <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">完全一致フレーズ</label>
          <input type="text" id="adv-search-exact" placeholder="例: 朝のコーヒー" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
        <div>
          <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">次の単語を含まない</label>
          <input type="text" id="adv-search-exclude" placeholder="例: 広告 スパム" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">ハッシュタグ</label>
            <input type="text" id="adv-search-hashtag" placeholder="例: #event" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
          </div>
          <div>
            <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">ルビ振り完全一致</label>
            <input type="text" id="adv-search-ruby" placeholder="例: カロート" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
          </div>
        </div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div>
        <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">言語指定</label>
        <select id="adv-search-lang" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
          <option value="">指定なし</option>
          <option value="ja">日本語 (ja)</option>
          <option value="en">英語 (en)</option>
          <option value="ko">韓国語 (ko)</option>
          <option value="zh-CN">簡体中国語 (zh-CN)</option>
          <option value="zh-TW">繁体中国語 (zh-TW)</option>
          <option value="es">スペイン語 (es)</option>
          <option value="fr">フランス語 (fr)</option>
          <option value="de">ドイツ語 (de)</option>
          <option value="pt-BR">ポルトガル語 (pt-BR)</option>
          <option value="it">イタリア語 (it)</option>
          <option value="id">インドネシア語 (id)</option>
          <option value="vi">ベトナム語 (vi)</option>
          <option value="th">タイ語 (th)</option>
          <option value="hi">ヒンディー語 (hi)</option>
        </select>
      </div>
      <div>
        <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">形態フィルター</label>
        <select id="adv-search-filter-type" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
          <option value="">すべて</option>
          <option value="links-only">リンクのみ</option>
          <option value="links-exclude">リンクを弾く</option>
          <option value="replies-only">返信のみ</option>
          <option value="replies-exclude">返信を弾く</option>
          <option value="quotes-only">引用のみ</option>
          <option value="quotes-exclude">引用を弾く</option>
          <option value="media-only">メディアのみ</option>
          <option value="media-exclude">メディアを弾く</option>
        </select>
      </div>
    </div>
    
    <div>
      <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">エンゲージメント</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
        <div>
          <label style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 3px;">返信数</label>
          <input type="number" id="adv-search-min-replies" min="0" placeholder="0" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
        <div>
          <label style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 3px;">いいね数</label>
          <input type="number" id="adv-search-min-likes" min="0" placeholder="0" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
        <div>
          <label style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 3px;">リカロート</label>
          <input type="number" id="adv-search-min-rekarots" min="0" placeholder="0" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
      </div>
    </div>

    <div>
      <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">アカウント</div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">送信元</label>
            <input type="text" id="adv-search-from" placeholder="例: user" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
          </div>
          <div>
            <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">送信先</label>
            <input type="text" id="adv-search-to" placeholder="例: user" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">メンション</label>
            <input type="text" id="adv-search-mention" placeholder="例: user" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
          </div>
          <div>
            <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">メンションを除く</label>
            <input type="text" id="adv-search-exclude-mention" placeholder="例: user" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
          </div>
        </div>
      </div>
    </div>

    <div>
      <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">日付</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">開始</label>
          <input type="date" id="adv-search-since" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
        <div>
          <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 3px;">終了</label>
          <input type="date" id="adv-search-until" style="width: 100%; border: 1px solid var(--border-soft, rgba(148,163,184,0.3)); border-radius: 8px; padding: 8px; font-size: 13px; background: var(--surface-soft, #f8fafc); color: var(--text-primary); outline: none;">
        </div>
      </div>
    </div>
  </div>
  
  <footer style="padding: 12px 18px; border-top: 1px solid var(--border-soft, rgba(148, 163, 184, 0.22)); display: flex; justify-content: flex-end; gap: 8px; background: var(--surface-card, #ffffff);">
    <button type="button" class="namikarotter-adv-search-clear" style="background: transparent; border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.28)); padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; color: var(--text-secondary, #475569); cursor: pointer;">クリア</button>
    <button type="button" class="namikarotter-adv-search-submit" style="background: var(--accent, #3b82f6); border: none; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 700; color: #ffffff; cursor: pointer; transition: background-color 150ms ease;">検索</button>
  </footer>
</section>
    `;

    document.body.appendChild(popup);

    const closeBtn = popup.querySelector('.namikarotter-adv-search-close');
    const backdrop = popup.querySelector('.namikarotter-adv-search-backdrop');
    const clearBtn = popup.querySelector('.namikarotter-adv-search-clear');
    const submitBtn = popup.querySelector('.namikarotter-adv-search-submit');

    const closePopup = () => {
      popup.remove();
    };

    closeBtn.addEventListener('click', closePopup);
    backdrop.addEventListener('click', closePopup);

    clearBtn.addEventListener('click', () => {
      popup.querySelectorAll('input').forEach(i => i.value = '');
      popup.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    });

    submitBtn.addEventListener('click', () => {
      const parts = [];

      const allVal = document.getElementById('adv-search-all').value.trim();
      if (allVal) parts.push(allVal);

      const anyVal = document.getElementById('adv-search-any').value.trim();
      if (anyVal) {
        const words = anyVal.split(/\s+/).filter(Boolean);
        if (words.length > 0) parts.push(words.join(' OR '));
      }

      const exactVal = document.getElementById('adv-search-exact').value.trim();
      if (exactVal) {
        parts.push(exactVal.startsWith('"') && exactVal.endsWith('"') ? exactVal : `"${exactVal}"`);
      }

      const excludeVal = document.getElementById('adv-search-exclude').value.trim();
      if (excludeVal) {
        excludeVal.split(/\s+/).filter(Boolean).forEach(w => {
          parts.push(w.startsWith('-') ? w : `-${w}`);
        });
      }

      const hashtagVal = document.getElementById('adv-search-hashtag').value.trim();
      if (hashtagVal) {
        hashtagVal.split(/\s+/).filter(Boolean).forEach(t => {
          if (t.startsWith('-')) {
            const rest = t.substring(1);
            parts.push(rest.startsWith('#') ? t : `-#${rest}`);
          } else {
            parts.push(t.startsWith('#') ? t : `#${t}`);
          }
        });
      }

      const rubyVal = document.getElementById('adv-search-ruby').value.trim();
      if (rubyVal) {
        rubyVal.split(/\s+/).filter(Boolean).forEach(r => {
          if (r.startsWith('-')) {
            const rest = r.substring(1);
            parts.push(rest.startsWith('《') && rest.endsWith('》') ? r : `-《${rest}》`);
          } else {
            parts.push(r.startsWith('《') && r.endsWith('》') ? r : `《${r}》`);
          }
        });
      }

      const langVal = document.getElementById('adv-search-lang').value;
      if (langVal) parts.push(`lang:${langVal}`);

      const filterVal = document.getElementById('adv-search-filter-type').value;
      if (filterVal) {
        if (filterVal === 'links-only') parts.push('filter:links');
        if (filterVal === 'links-exclude') parts.push('-filter:links');
        if (filterVal === 'replies-only') parts.push('filter:replies');
        if (filterVal === 'replies-exclude') parts.push('-filter:replies');
        if (filterVal === 'quotes-only') parts.push('filter:quotes');
        if (filterVal === 'quotes-exclude') parts.push('-filter:quotes');
        if (filterVal === 'media-only') parts.push('filter:media');
        if (filterVal === 'media-exclude') parts.push('-filter:media');
      }

      const minReplies = document.getElementById('adv-search-min-replies').value;
      if (minReplies !== '') parts.push(`min_replies:${minReplies}`);

      const minLikes = document.getElementById('adv-search-min-likes').value;
      if (minLikes !== '') parts.push(`min_faves:${minLikes}`);

      const minRekarots = document.getElementById('adv-search-min-rekarots').value;
      if (minRekarots !== '') parts.push(`min_rekarots:${minRekarots}`);

      const fromVal = document.getElementById('adv-search-from').value.trim();
      if (fromVal) parts.push(`from:${fromVal}`);

      const toVal = document.getElementById('adv-search-to').value.trim();
      if (toVal) parts.push(`to:${toVal}`);

      const mentionVal = document.getElementById('adv-search-mention').value.trim();
      if (mentionVal) {
        mentionVal.split(/\s+/).filter(Boolean).forEach(u => {
          parts.push(u.startsWith('@') ? u : `@${u}`);
        });
      }

      const excludeMentionVal = document.getElementById('adv-search-exclude-mention').value.trim();
      if (excludeMentionVal) {
        excludeMentionVal.split(/\s+/).filter(Boolean).forEach(u => {
          if (u.startsWith('-')) {
            const rest = u.substring(1);
            parts.push(rest.startsWith('@') ? u : `-@${rest}`);
          } else {
            parts.push(u.startsWith('@') ? `-${u}` : `-@${u}`);
          }
        });
      }

      const sinceVal = document.getElementById('adv-search-since').value;
      if (sinceVal) parts.push(`since:${sinceVal}`);

      const untilVal = document.getElementById('adv-search-until').value;
      if (untilVal) parts.push(`until:${untilVal}`);

      const query = parts.join(' ');
      if (!query.trim()) {
        alert('検索条件を入力してください。');
        return;
      }
      input.value = query;
      
      closePopup();
      window.location.href = window.location.origin + '/search?q=' + encodeURIComponent(query);
    });
  }

  function findNotificationFilterContainer() {
    const containers = document.querySelectorAll('div.flex.overflow-x-auto');
    for (const container of containers) {
      if (container.closest('#' + SETTINGS_MODAL_ID)) continue;
      
      const buttons = container.querySelectorAll(':scope > button');
      if (buttons.length > 0) {
        const texts = Array.from(buttons).map(b => b.textContent.trim());
        if (texts.includes('すべて') && (texts.includes('いいね') || texts.includes('リカロート') || texts.includes('返信'))) {
          return container;
        }
      }
    }
    return null;
  }

  function injectNotificationFilter() {
    chrome.storage.local.get(['pluginNotificationFilterSelectEnable'], (data) => {
      const isEnabled = data.pluginNotificationFilterSelectEnable !== false;
      const container = findNotificationFilterContainer();
      if (!container) return;

      if (!isEnabled) {
        const selectWrapper = container.querySelector('.namikarotter-notification-select-wrapper');
        if (selectWrapper) {
          selectWrapper.remove();
        }
        const buttons = container.querySelectorAll(':scope > button');
        buttons.forEach(btn => {
          if (btn.style.display === 'none') {
            btn.style.display = '';
          }
        });
        return;
      }

      const buttons = Array.from(container.querySelectorAll(':scope > button'));
      if (buttons.length === 0) return;

      // Hide original buttons
      buttons.forEach(btn => {
        btn.style.display = 'none';
      });

      // Find active button
      let activeIndex = 0;
      buttons.forEach((btn, idx) => {
        const isBtnActive = btn.querySelector('.absolute') || btn.children.length > 1 || btn.classList.contains('text-blue-600') || btn.className.includes('text-blue-');
        if (isBtnActive) {
          activeIndex = idx;
        }
      });

      let selectWrapper = container.querySelector('.namikarotter-notification-select-wrapper');
      let selectEl;

      if (!selectWrapper) {
        selectWrapper = document.createElement('div');
        selectWrapper.className = 'namikarotter-notification-select-wrapper';

        selectEl = document.createElement('select');
        selectEl.className = 'namikarotter-notification-select';

        buttons.forEach((btn, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = btn.textContent.trim();
          selectEl.appendChild(opt);
        });

        selectEl.selectedIndex = activeIndex;

        selectEl.addEventListener('change', () => {
          const idx = selectEl.selectedIndex;
          if (buttons[idx]) {
            buttons[idx].click();
          }
        });

        const arrow = document.createElement('div');
        arrow.className = 'namikarotter-notification-select-arrow';
        arrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down" style="display:block;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

        selectWrapper.appendChild(selectEl);
        selectWrapper.appendChild(arrow);
        container.appendChild(selectWrapper);
      } else {
        selectEl = selectWrapper.querySelector('.namikarotter-notification-select');
        if (selectEl) {
          if (selectEl.options.length !== buttons.length) {
            selectEl.innerHTML = '';
            buttons.forEach((btn, idx) => {
              const opt = document.createElement('option');
              opt.value = idx;
              opt.textContent = btn.textContent.trim();
              selectEl.appendChild(opt);
            });
          }
          if (selectEl.selectedIndex !== activeIndex) {
            selectEl.selectedIndex = activeIndex;
          }
        }
      }
    });
  }

  function startNamiNavigationWatcher() {
    if (navCheckTimer) return;

    ensureNamiNavItems();
    injectAdvancedSearchButton();
    injectNotificationFilter();
    navCheckTimer = window.setInterval(() => {
      ensureNamiNavItems();
      injectAdvancedSearchButton();
      injectNotificationFilter();
    }, NAV_CHECK_INTERVAL_MS);
  }

  // Listen for storage changes to apply settings instantly
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if ('pluginAdvancedSearchEnable' in changes) {
        injectAdvancedSearchButton();
      }
      if ('pluginNotificationFilterSelectEnable' in changes) {
        injectNotificationFilter();
      }
    }
  });

  startNamiNavigationWatcher();
})();
