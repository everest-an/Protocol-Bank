import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom'],
          
          // Web3 相关库
          'web3-vendor': ['ethers'],
          
          // UI 组件库
          'ui-vendor': ['lucide-react', 'recharts'],
        },
      },
    },
    
    // 提高 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console.log
        drop_debugger: true,
      },
    },
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'ethers',
      'lucide-react',
      'recharts',
    ],
  },
  
  // 服务器配置
  server: {
    port: 5173,
    host: true,
  },
})
