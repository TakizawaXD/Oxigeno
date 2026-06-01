import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Developer console signature
console.log(
  '%c HealthLogix OS %c Desarrollado por AndresTaker ',
  'background: #0284c7; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;',
  'background: #0f172a; color: #38bdf8; font-weight: bold; padding: 4px 8px; border-radius: 0 4px 4px 0;'
);

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F5') {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
