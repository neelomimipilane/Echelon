// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById("scanBtn");
  const statusText = document.getElementById("statusText");
  const statusIndicator = document.getElementById("statusIndicator");
  const lastScan = document.getElementById("lastScan");
  
  updateStatus();
  
  // Listen for scan results
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCAN_COMPLETE') {
      handleScanResults(message.results);
    }
  });
  
  scanBtn.addEventListener("click", async () => {
    if (scanBtn.classList.contains('scanning')) return;
    
    scanBtn.classList.add('scanning');
    scanBtn.querySelector('.button-text').textContent = '🔄 Scanning...';
    statusText.textContent = 'Scanning';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      
    } catch (error) {
      console.error('Scan failed:', error);
      handleScanError();
    }
  });
  
  function handleScanResults(results) {
    scanBtn.classList.remove('scanning');
    
    const riskMessages = {
      'HIGH': '🚨 HIGH RISK',
      'MEDIUM': '⚠️ MEDIUM RISK', 
      'LOW': '⚡ LOW RISK',
      'SAFE': '✅ SAFE'
    };
    
    scanBtn.querySelector('.button-text').textContent = riskMessages[results.riskLevel];
    statusText.textContent = results.riskLevel === 'SAFE' ? 'Protected' : `${results.riskLevel} Risk`;
    lastScan.innerHTML = `<small>Last scan: ${new Date().toLocaleTimeString()}</small>`;
    
    // Apply risk styling
    scanBtn.className = `scan-button risk-${results.riskLevel.toLowerCase()}`;
    
    setTimeout(() => {
      scanBtn.querySelector('.button-text').textContent = '🔍 Deep Scan Page';
      scanBtn.className = 'scan-button';
    }, 3000);
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
