import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign ResizeObserver errors
const resizeObserverLoopErrRe = /^[a-zA-Z: ]*ResizeObserver loop completed with undelivered notifications/;
window.addEventListener('error', (e) => {
  if (resizeObserverLoopErrRe.test(e.message)) {
    e.stopImmediatePropagation();
  }
});

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && resizeObserverLoopErrRe.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
