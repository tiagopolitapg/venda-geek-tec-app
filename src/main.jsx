import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

console.log('main.jsx: Starting React application');
const rootElement = document.getElementById('root');
console.log('main.jsx: Root element found:', !!rootElement);

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <App />
  );
} else {
  console.error('main.jsx: Root element not found!');
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}



