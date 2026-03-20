import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import '@/shared/i18n/i18n';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('/sw.js');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
