/**
 * PWA 工具函数
 */

/**
 * 注册 Service Worker
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[PWA] Service Worker registered:', registration.scope);
      
      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] New Service Worker found');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新版本可用
            console.log('[PWA] New version available');
            showUpdateNotification();
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  } else {
    console.log('[PWA] Service Workers not supported');
  }
};

/**
 * 注销 Service Worker
 */
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('[PWA] Service Worker unregistered');
  }
};

/**
 * 显示更新通知
 */
const showUpdateNotification = () => {
  if (window.confirm('New version available! Reload to update?')) {
    window.location.reload();
  }
};

/**
 * 检查是否为 PWA 模式
 */
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://');
};

/**
 * 检查是否可以安装 PWA
 */
export const canInstallPWA = () => {
  return 'beforeinstallprompt' in window;
};

/**
 * PWA 安装提示管理
 */
let deferredPrompt = null;

export const setupPWAInstall = (onInstallable) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止默认提示
    e.preventDefault();
    deferredPrompt = e;
    
    // 通知应用可以安装
    if (onInstallable) {
      onInstallable(true);
    }
    
    console.log('[PWA] Install prompt available');
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    
    if (onInstallable) {
      onInstallable(false);
    }
  });
};

/**
 * 触发 PWA 安装
 */
export const promptPWAInstall = async () => {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }
  
  // 显示安装提示
  deferredPrompt.prompt();
  
  // 等待用户响应
  const { outcome } = await deferredPrompt.userChoice;
  console.log('[PWA] User choice:', outcome);
  
  deferredPrompt = null;
  return outcome === 'accepted';
};

/**
 * 获取网络状态
 */
export const getNetworkStatus = () => {
  return {
    online: navigator.onLine,
    type: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || 0,
    rtt: navigator.connection?.rtt || 0
  };
};

/**
 * 监听网络状态变化
 */
export const onNetworkChange = (callback) => {
  const handleOnline = () => callback({ online: true });
  const handleOffline = () => callback({ online: false });
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * 清除所有缓存
 */
export const clearAllCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => caches.delete(name))
    );
    console.log('[PWA] All caches cleared');
  }
};
