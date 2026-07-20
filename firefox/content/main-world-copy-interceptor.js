(function () {
  if (window.__namikarotter_click_interceptor) return;
  window.__namikarotter_click_interceptor = true;

  function findIdInProps(obj, depth = 0) {
    if (!obj || depth > 5) return null;

    if (obj.postId) return obj.postId;
    if (obj.id && (typeof obj.id === 'number' || (typeof obj.id === 'string' && /^\d+$/.test(obj.id)))) {
      return obj.id;
    }
    if (obj.statusId) return obj.statusId;
    if (obj.post && typeof obj.post === 'object') {
      const res = findIdInProps(obj.post, depth + 1);
      if (res) return res;
    }
    if (obj.status && typeof obj.status === 'object') {
      const res = findIdInProps(obj.status, depth + 1);
      if (res) return res;
    }
    if (obj.memoizedProps) {
      const res = findIdInProps(obj.memoizedProps, depth + 1);
      if (res) return res;
    }
    if (obj.pendingProps) {
      const res = findIdInProps(obj.pendingProps, depth + 1);
      if (res) return res;
    }
    return null;
  }

  document.addEventListener('click', (e) => {
    let target = e.target;
    while (target && target !== document.body) {
      const keys = Object.keys(target);
      const reactKey = keys.find(k => k.startsWith('__reactProps') || k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
      if (reactKey) {
        const props = target[reactKey];
        if (props) {
          const id = findIdInProps(props);
          if (id) {
            window.dispatchEvent(new CustomEvent('namikarotter-captured-post-id', {
              detail: { id: String(id) }
            }));
            break;
          }
        }
      }
      target = target.parentElement;
    }
  }, true);
})();
