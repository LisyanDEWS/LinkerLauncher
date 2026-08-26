import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runSystemDiagnosticCheck } from './lib/diagnostics.ts';

// Silent system integrity verification (no UI footprint)
runSystemDiagnosticCheck();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

