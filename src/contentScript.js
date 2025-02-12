'use strict';

// 创建悬浮窗 DOM
function createFloatingWindow() {
  if (!document.body) return null;

  const existingWindow = document.getElementById('api-logger-window');
  if (existingWindow) return existingWindow;

  const floatingWindow = document.createElement('div');
  floatingWindow.id = 'api-logger-window';
  floatingWindow.innerHTML = `
    <div class="api-logger-header">
      API 日志监控
      <button class="api-logger-minimize">-</button>
    </div>
    <div class="api-logger-content">
      <div class="api-logger-logs"></div>
    </div>
  `;
  
  try {
    document.body.appendChild(floatingWindow);
    
    // 添加最小化按钮功能
    const minimizeBtn = floatingWindow.querySelector('.api-logger-minimize');
    const content = floatingWindow.querySelector('.api-logger-content');
    minimizeBtn.addEventListener('click', () => {
      if (content.style.display === 'none') {
        content.style.display = 'block';
        minimizeBtn.textContent = '-';
      } else {
        content.style.display = 'none';
        minimizeBtn.textContent = '+';
      }
    });

    // 使悬浮窗可拖动
    const header = floatingWindow.querySelector('.api-logger-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      initialX = e.clientX - floatingWindow.offsetLeft;
      initialY = e.clientY - floatingWindow.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        floatingWindow.style.left = currentX + 'px';
        floatingWindow.style.top = currentY + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    return floatingWindow;
  } catch (error) {
    console.error('Error creating floating window:', error);
    return null;
  }
}

// 添加样式
function addStyles() {
  if (!document.head) return false;

  const existingStyle = document.getElementById('api-logger-styles');
  if (existingStyle) return true;

  const styles = document.createElement('style');
  styles.id = 'api-logger-styles';
  styles.textContent = `
    #api-logger-window {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 999999;
      font-family: Arial, sans-serif;
      font-size: 14px;
    }

    .api-logger-header {
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      cursor: move;
      user-select: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .api-logger-minimize {
      border: none;
      background: none;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
    }

    .api-logger-content {
      max-height: 400px;
      overflow-y: auto;
      padding: 8px;
    }

    .api-logger-logs {
      font-family: monospace;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .api-log-item {
      padding: 4px 0;
      border-bottom: 1px solid #eee;
      margin-bottom: 4px;
    }

    .api-log-time {
      color: #666;
      font-size: 12px;
    }

    .api-log-message {
      color: #333;
    }

    .api-log-start {
      color: #2196F3;
    }

    .api-log-response {
      color: #4CAF50;
    }

    .api-log-complete {
      color: #9C27B0;
    }
  `;

  try {
    document.head.appendChild(styles);
    return true;
  } catch (error) {
    console.error('Error adding styles:', error);
    return false;
  }
}

// 存储待处理的日志
let pendingLogs = [];

// 添加日志到悬浮窗
function addLogToWindow(message, type) {
  const logsContainer = document.querySelector('.api-logger-logs');
  if (!logsContainer) {
    // 如果找不到日志容器，存储日志并等待初始化完成
    pendingLogs.push({ message, type });
    return;
  }

  const logItem = document.createElement('div');
  logItem.className = 'api-log-item';
  
  const time = new Date().toLocaleTimeString();
  const messageClass = type === 'start' ? 'api-log-start' : 
                      type === 'response' ? 'api-log-response' : 
                      type === 'complete' ? 'api-log-complete' : '';

  logItem.innerHTML = `
    <span class="api-log-time">[${time}]</span>
    <span class="api-log-message ${messageClass}">${message}</span>
  `;

  logsContainer.appendChild(logItem);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

// 处理所有待处理的日志
function processPendingLogs() {
  const logs = [...pendingLogs];
  pendingLogs = [];
  logs.forEach(log => addLogToWindow(log.message, log.type));
}

// 初始化日志记录器
function initLogger() {
  // 添加样式
  if (!addStyles()) {
    setTimeout(initLogger, 100);
    return;
  }

  // 创建悬浮窗
  const window = createFloatingWindow();
  if (!window) {
    setTimeout(initLogger, 100);
    return;
  }

  // 处理待处理的日志
  processPendingLogs();
}

// 确保DOM加载完成后初始化
function ensureInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initLogger, 500); // 给予额外的延迟确保DOM完全准备好
    });
  } else {
    setTimeout(initLogger, 500);
  }
}

// 立即开始尝试初始化
ensureInit();

// 存储原始的控制台方法
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

// 重写 console.log 方法
console.log = function(...args) {
  originalConsole.log.apply(console, args);
  
  // 转换参数为字符串
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2);
    }
    return String(arg);
  }).join(' ');

  // 检查是否是 API 相关日志
  if (message.includes('[API]')) {
    let type = 'info';
    if (message.includes('Start')) {
      type = 'start';
    } else if (message.includes('Response')) {
      type = 'response';
    } else if (message.includes('Complete')) {
      type = 'complete';
    }
    
    addLogToWindow(message, type);
  }
};

// 添加 MutationObserver 以处理动态加载的内容
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && !document.getElementById('api-logger-window')) {
      initLogger();
      break;
    }
  }
});

// 开始观察 DOM 变化
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
