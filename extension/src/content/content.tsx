import React from 'react';
import { createRoot } from 'react-dom/client';
import { FloatingWidget } from '../components/FloatingWidget';

/**
 * Extracts raw page text and cleans obvious noise without losing JD content.
 */
export function extractPageData(): { url: string; title: string; pageText: string } {
  const url = window.location.href;
  const title = document.title || '';

  // Clone or extract body text
  let rawText = '';
  if (document.body) {
    // Collect text while filtering out script, style, and hidden elements
    const clone = document.body.cloneNode(true) as HTMLElement;

    // Remove noise elements
    const noiseSelectors = [
      'script',
      'style',
      'noscript',
      'iframe',
      'nav',
      'header',
      'footer',
      '[role="banner"]',
      '[role="navigation"]',
      '#cookie-banner',
      '.cookie-banner',
      '.consent-banner',
      '.ad',
      '.advertisement',
      '.social-share',
    ];

    noiseSelectors.forEach((selector) => {
      try {
        const elements = clone.querySelectorAll(selector);
        elements.forEach((el) => el.remove());
      } catch {
        // Ignored
      }
    });

    rawText = clone.innerText || document.body.innerText || '';
  }

  // Normalize excessive whitespace and duplicated empty lines
  const cleanedText = rawText
    .replace(/(\r\n|\r|\n){3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return {
    url,
    title,
    pageText: cleanedText,
  };
}

// Listen for messages from background worker or sidepanel
if (typeof chrome !== 'undefined' && chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'APPLYAI_EXTRACT_PAGE') {
      const pageData = extractPageData();
      sendResponse(pageData);
      return true;
    }
  });
}

// Inject Floating ✦ Widget into page with isolated Shadow DOM styling
function initFloatingWidget() {
  // Avoid duplicate injection
  if (document.getElementById('applyai-root-container')) return;

  const container = document.createElement('div');
  container.id = 'applyai-root-container';
  container.style.position = 'fixed';
  container.style.zIndex = '2147483647';
  container.style.bottom = '0';
  container.style.right = '0';
  container.style.pointerEvents = 'auto';
  document.body.appendChild(container);

  // Attach Shadow DOM for style encapsulation so host website styles don't break extension UI
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Inject extension stylesheet link into shadow root
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    // Link to CSS file emitted by Vite build
    styleLink.href = chrome.runtime.getURL('assets/style.css');
    shadowRoot.appendChild(styleLink);
  }

  const appMount = document.createElement('div');
  appMount.id = 'applyai-widget-host';
  shadowRoot.appendChild(appMount);

  const root = createRoot(appMount);
  root.render(
    <React.StrictMode>
      <FloatingWidget pageTextProvider={extractPageData} />
    </React.StrictMode>
  );
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingWidget);
  } else {
    initFloatingWidget();
  }
}
