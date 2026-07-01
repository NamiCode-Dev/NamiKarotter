(function () {
  chrome.storage.local.get(['pluginXRedirectEnable', 'pluginXRedirectAsk'], (data) => {
    const isEnabled = data.pluginXRedirectEnable || false;
    if (!isEnabled) return;

    const shouldAsk = data.pluginXRedirectAsk !== false;

    try {
      const url = new URL(window.location.href);
      const text = url.searchParams.get('text') || '';
      const urlParam = url.searchParams.get('url') || '';
      const hashtags = url.searchParams.get('hashtags') || '';
      const via = url.searchParams.get('via') || '';

      // Merge text, url, hashtags, and via if they exist
      let combinedText = text;
      if (urlParam) {
        combinedText += (combinedText ? ' ' : '') + urlParam;
      }
      if (hashtags) {
        const tagsArray = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tagsArray.length > 0) {
          combinedText += (combinedText ? ' ' : '') + tagsArray.map(tag => '#' + tag).join(' ');
        }
      }
      if (via) {
        combinedText += (combinedText ? ' ' : '') + 'via @' + via;
      }

      // Ask before redirecting if option is enabled
      if (shouldAsk) {
        const confirmed = confirm('カロッター (Karotter) の投稿画面にリダイレクトしますか？\n\n「キャンセル」を押すと、このままXで投稿できます。');
        if (!confirmed) {
          return;
        }
      }

      // Construct Karotter compose URL
      const targetUrl = `https://karotter.com/?compose=1&text=${encodeURIComponent(combinedText)}`;
      window.location.replace(targetUrl);
    } catch (e) {
      console.error('Error redirecting to Karotter:', e);
    }
  });
})();
