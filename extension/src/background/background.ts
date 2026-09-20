// Background service worker for ApplyAI Chrome Extension (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log("ApplyAI Extension installed successfully.");

  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({
        openPanelOnActionClick: true,
      })
      .catch((error) => {
        console.warn("Could not set side panel behavior:", error);
      });
  }
});

if (chrome.action?.onClicked) {
  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id || !chrome.sidePanel?.open) {
      return;
    }

    try {
      await chrome.sidePanel.open({
        tabId: tab.id,
      });
    } catch (error) {
      console.warn("Could not open side panel:", error);
    }
  });
}
