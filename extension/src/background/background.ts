// Background service worker for ApplyAI Chrome Extension (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('ApplyAI Extension installed successfully.');

  // Configure side panel to open on action click where supported
  if (chrome.sidePanel && 'setPanelBehavior' in chrome.sidePanel) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.warn('Could not set side panel behavior:', err));
  }
});

// Fallback action click handler if setPanelBehavior is not supported
if (chrome.action?.onClicked) {
  chrome.action.onClicked.addListener(async (tab) => {
    if (tab.id && chrome.sidePanel && 'open' in chrome.sidePanel) {
      try {
        await chrome.sidePanel.open({ tabId: tab.id });
      } catch (err) {
        console.warn('Could not open side panel:', err);
      }
    }
  });
}
