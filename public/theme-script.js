(function() {
  try {
    var theme = localStorage.getItem('theme') || 'light';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // 只添加 dark 类，不添加 light 类以避免 hydration 错误
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 设置 body 背景色
    document.body.style.backgroundColor = isDark ? '#0f172a' : '#ffffff';
    document.body.style.color = isDark ? '#f1f5f9' : '#171717';
  } catch (e) {
    // 如果出错，默认使用浅色模式
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#171717';
  }
})();
