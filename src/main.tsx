import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router';
import '@/styles/globals.css';
import { App } from '@/App';
import { hydrateFromSupabase } from '@/store';

void hydrateFromSupabase();

// Hash routing is used for single-file hosted previews where the app does not own the URL path.
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);
