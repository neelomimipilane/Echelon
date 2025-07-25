// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById("scanBtn");
  const statusText = document.getElementById("statusText");
  const statusIndicator = document.getElementById("statusIndicator");
  const lastScan = document.getElementById("lastScan");
  
  updateStatus();
  loadLastScanResults();
  
  // Listen for scan results
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCAN_COMPLETE') {
      handleScanResults(message.results);
      saveLastScanResults(message.results);
    }
  });
  
  scanBtn.addEventListener("click", async () => {
    if (scanBtn.classList.contains('scanning')) return;
    
    scanBtn.classList.add('scanning');
    scanBtn.querySelector('.button-text').textContent = 'Scanning...';
    statusText.textContent = 'Scanning';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if content script is already injected
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        // Content script exists, trigger scan
        await chrome.tabs.sendMessage(tab.id, { type: 'START_SCAN' });
      } catch {
        // Content script not injected, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
      }
      
    } catch (error) {
      console.error('Scan failed:', error);
      handleScanError();
    }
  });

  function saveLastScanResults(results) {
    chrome.storage.local.set({ lastScanResults: results });
  }

  function loadLastScanResults() {
    chrome.storage.local.get(['lastScanResults'], (result) => {
      if (result.lastScanResults) {
        displayScanResults(result.lastScanResults);
      }
    });
  }

  function displayScanResults(results) {
    const detailsHtml = `
      <small>Risk Level: ${results.riskLevel}</small><br>
      <small>Keywords found: ${results.keywords.length}</small><br>
      <small>Suspicious links: ${results.suspiciousLinks.length}</small><br>
      <small>Payment fields: ${results.formChecks.hasPaymentFields ? 'Yes' : 'No'}</small>
    `;
    lastScan.innerHTML = detailsHtml;
    
    statusText.textContent = results.riskLevel === 'SAFE' ? 'Protected' : `${results.riskLevel} Risk`;
  }
  
  function handleScanResults(results) {
    scanBtn.classList.remove('scanning');
    
    const riskMessages = {
      'HIGH': 'HIGH RISK',
      'MEDIUM': 'MEDIUM RISK', 
      'LOW': 'LOW RISK',
      'SAFE': 'SAFE'
    };
    
    scanBtn.querySelector('.button-text').textContent = riskMessages[results.riskLevel];
    statusText.textContent = results.riskLevel === 'SAFE' ? 'Protected' : `${results.riskLevel} Risk`;
    
    // Show detailed scan results
    const detailsHtml = `
      <small>Last scan: ${new Date().toLocaleTimeString()}</small><br>
      <small>Keywords found: ${results.keywords.length}</small><br>
      <small>Suspicious links: ${results.suspiciousLinks.length}</small><br>
      <small>Payment fields: ${results.formChecks.hasPaymentFields ? 'Yes' : 'No'}</small>
    `;
    lastScan.innerHTML = detailsHtml;
    
    // Apply risk styling
    scanBtn.className = `scan-button risk-${results.riskLevel.toLowerCase()}`;
    
    setTimeout(() => {
      scanBtn.querySelector('.button-text').textContent = 'Deep Scan Page';
      scanBtn.className = 'scan-button';
    }, 5000);
  }
  
  function handleScanError() {
    scanBtn.classList.remove('scanning');
    scanBtn.querySelector('.button-text').textContent = '❌ Scan Failed';
    statusText.textContent = 'Error';
  }
  
  function updateStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        statusText.textContent = 'Active';
        statusIndicator.querySelector('.status-dot').style.background = '#00ff88';
      }
    });
  }
});
