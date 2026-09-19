import JSZip from 'jszip';

export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();

  // Fetch or construct the extension bundle files
  const manifestContent = JSON.stringify(
    {
      manifest_version: 3,
      name: 'ApplyAI — Personal Job Application Assistant',
      version: '1.0.0',
      description: 'Tailor your LaTeX resume and find verified recruiter contact info directly on job postings.',
      permissions: ['storage', 'activeTab', 'scripting', 'sidePanel'],
      host_permissions: ['http://localhost/*', 'http://127.0.0.1/*'],
      background: {
        service_worker: 'background.js',
        type: 'module',
      },
      action: {
        default_title: 'Open ApplyAI',
        default_popup: 'popup.html',
      },
      side_panel: {
        default_path: 'sidepanel.html',
      },
      content_scripts: [
        {
          matches: ['https://*/*', 'http://*/*'],
          js: ['content.js'],
          run_at: 'document_idle',
        },
      ],
      icons: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      },
    },
    null,
    2
  );

  zip.file('manifest.json', manifestContent);

  // Readme instructions for loading in Chrome
  const readmeContent = `# ApplyAI — Chrome Extension Setup

## How to load this extension in Google Chrome:
1. Unzip this downloaded folder.
2. Open Google Chrome and navigate to: chrome://extensions
3. Toggle on "Developer mode" in the top-right corner.
4. Click "Load unpacked" in the top-left corner.
5. Select this unzipped folder.
6. Make sure your local ApplyAI backend is running:
   cd server && npm run dev
7. Navigate to any job posting (e.g. LinkedIn, Greenhouse, Lever, Indeed) and look for the ✦ widget!
`;
  zip.file('README.txt', readmeContent);

  // Background script
  zip.file(
    'background.js',
    `// ApplyAI Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('ApplyAI Extension installed.');
  if (chrome.sidePanel && 'setPanelBehavior' in chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});
chrome.action?.onClicked?.addListener(async (tab) => {
  if (tab.id && chrome.sidePanel?.open) {
    await chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});
`
  );

  // Basic HTML files for popup and sidepanel
  zip.file(
    'popup.html',
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ApplyAI</title>
  <style>
    body { width: 360px; height: 500px; margin: 0; background: #171717; color: #ededed; font-family: system-ui, sans-serif; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="sidepanel.html"></iframe>
</body>
</html>`
  );

  zip.file(
    'sidepanel.html',
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ApplyAI Side Panel</title>
  <style>
    body { margin: 0; padding: 16px; background: #171717; color: #ededed; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; }
    h2 { font-size: 15px; margin-top: 0; display: flex; align-items: center; gap: 6px; }
    .btn { background: #262626; color: #fff; border: 1px solid #404040; padding: 8px 12px; border-radius: 6px; cursor: pointer; width: 100%; margin-top: 8px; font-weight: 500; }
    .btn-primary { background: #ededed; color: #0a0a0a; border: none; }
    .badge { background: #064e3b; color: #6ee7b7; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .card { background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h2>✦ ApplyAI</h2>
  <div id="content">
    <div class="card">
      <div style="font-weight: 600; margin-bottom: 4px;" id="jobTitle">Detecting job posting...</div>
      <div style="color: #a3a3a3; font-size: 12px;" id="companyName">Looking at active tab...</div>
    </div>
    <button class="btn btn-primary" id="tailorBtn">✦ Tailor Resume</button>
    <button class="btn" id="recruiterBtn">Find Recruiter</button>
  </div>
  <script src="sidepanel.js"></script>
</body>
</html>`
  );

  // Minimal sidepanel.js
  zip.file(
    'sidepanel.js',
    `// Communicate with backend and active tab
const BACKEND_URL = 'http://localhost:3000';
document.getElementById('tailorBtn')?.addEventListener('click', async () => {
  alert('Tailoring request initiated with local backend at ' + BACKEND_URL);
});
document.getElementById('recruiterBtn')?.addEventListener('click', async () => {
  alert('Searching public recruiters for company at ' + BACKEND_URL);
});
`
  );

  // Generate icons folder
  const iconsFolder = zip.folder('icons');
  const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  iconsFolder?.file('icon16.png', minimalPng, { base64: true });
  iconsFolder?.file('icon48.png', minimalPng, { base64: true });
  iconsFolder?.file('icon128.png', minimalPng, { base64: true });

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'ApplyAI_Chrome_Extension_v1.0.0.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
