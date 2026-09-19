import React from 'react';
import { createRoot } from 'react-dom/client';
import { SidePanel } from './SidePanel';
import '../index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <SidePanel />
    </React.StrictMode>
  );
}
