// API 响应拦截器
export function setupApiInterceptor() {
  // 保存原始的 fetch 函数
  const originalFetch = window.fetch;

  // 重写 fetch 函数
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    // 如果响应是 401，清除认证信息但不重定向（让组件处理）
    if (response.status === 401) {
      // 清除所有认证相关的 localStorage
      localStorage.removeItem('admin-token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-cache');
      
      // 不在这里重定向，让各个页面的认证组件处理
      // 这可以避免无限重定向循环
    }
    
    return response;
  };
}

// 创建一个带拦截器的 fetch 函数
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // 添加认证头
  const token = localStorage.getItem('admin-token');
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // 处理 401 响应
  if (response.status === 401) {
    // 清除认证信息
    localStorage.removeItem('admin-token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-cache');
    
    // 不在这里重定向，让各个页面的认证组件处理
  }

  return response;
}