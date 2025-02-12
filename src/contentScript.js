'use strict';

// 创建悬浮窗 DOM
function createFloatingWindow() {
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
}

// 添加样式
function addStyles() {
  const styles = document.createElement('style');
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
  document.head.appendChild(styles);
}

// 添加日志到悬浮窗
function addLogToWindow(message, type) {
  const logsContainer = document.querySelector('.api-logger-logs');
  if (!logsContainer) {
    // 如果找不到日志容器，可能是悬浮窗还没创建，先创建它
    if (!document.getElementById('api-logger-window')) {
      initLogger();
    }
    return setTimeout(() => addLogToWindow(message, type), 100);
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

// 初始化日志记录器
function initLogger() {
  // 确保样式已添加
  if (!document.querySelector('style')) {
    addStyles();
  }
  // 创建悬浮窗
  createFloatingWindow();
}

// 等待 DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogger);
} else {
  initLogger();
}

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
