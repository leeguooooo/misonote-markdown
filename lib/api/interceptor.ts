// API 响应拦截器
export function setupApiInterceptor() {
  // 保存原始的 fetch 函数
  const originalFetch = window.fetch;

  // 重写 fetch 函数
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    // 如果响应是 401，清除认证信息并跳转到登录页
    if (response.status === 401) {
      // 清除所有认证相关的 localStorage
      localStorage.removeItem('admin-token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-cache');
      
      // 获取当前路径
      const currentPath = window.location.pathname;
      
      // 如果在管理后台，跳转到管理员登录页
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin';
      } else {
        // 否则跳转到前台登录页
        window.location.href = '/login';
      }
    }
    
    return response;
  };
}
