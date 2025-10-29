import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite 优化配置
 * 
 * 优化策略：
 * 1. 代码分割 (Code Splitting) - 将大文件拆分为小块
 * 2. 懒加载 (Lazy Loading) - 按需加载组件
 * 3. 依赖预构建 (Dependency Pre-bundling) - 优化第三方库
 * 4. 压缩优化 (Minification) - 减小文件大小
 * 5. Tree Shaking - 移除未使用的代码
 */

export default defineConfig({
  plugins: [react()],
  
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 生成 sourcemap 用于调试（生产环境可以关闭）
    sourcemap: false,
    
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动代码分块策略
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Web3 相关库
          'web3-vendor': ['ethers'],
          
          // 图表和可视化库
          'chart-vendor': ['recharts', 'd3', 'react-force-graph-2d'],
          
          // i18n 国际化
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          
          // UI 组件库
          'ui-vendor': ['framer-motion'],
          
          // 工具库
          'utils-vendor': ['date-fns', 'lodash'],
        },
        
        // 文件命名策略
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // 代码分割大小警告阈值 (KB)
    chunkSizeWarningLimit: 500,
    
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除 console.log
        drop_console: true,
        // 移除 debugger
        drop_debugger: true,
      },
    },
    
    // CSS 代码分割
    cssCodeSplit: true,
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'ethers',
      'i18next',
      'react-i18next',
    ],
    exclude: [
      // 排除不需要预构建的包
    ],
  },
  
  // 服务器配置
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  
  // 预览服务器配置
  preview: {
    port: 4173,
    host: true,
  },
});

