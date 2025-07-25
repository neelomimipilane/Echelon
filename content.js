// content.js
console.log("[Echelon] Scanning this page for scam content...");

// Check if scanner already exists to prevent duplicate declarations
if (!window.echelonScanner) {
  const scamKeywords = [
    "lottery", "bitcoin", "urgent", "click here", "limited time", "verify account",
    "free money", "investment", "get rich", "congratulations", "you have won", "act now",
    "crypto", "nft", "double your money", "risk free", "guaranteed profit", "exclusive",
    "winner", "claim your prize", "expires", "opportunity", "quick", "24 hours","fast money","ways to make easy money",
    
  ];

  // Add message listener for manual scans
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({ status: 'ready' });
    } else if (message.type === 'START_SCAN') {
      if (window.echelonScanner) {
        window.echelonScanner.startManualScan();
      }
      sendResponse({ status: 'scanning' });
    }
  });

  class EchelonScanner {
    constructor() {
      this.isScanning = false;
      this.scanProgress = 0;
      this.countdownTimer = null;
      this.createScannerUI();
    }

    createScannerUI() {
      const existing = document.getElementById('echelon-scanner');
      if (existing) existing.remove();

      const scanner = document.createElement('div');
      scanner.id = 'echelon-scanner';
      scanner.innerHTML = `
        <div class="scanner-content">
          <div class="scanner-icon">
            <div class="icon-fallback">E</div>
          </div>
          <div class="scanner-text">Echelon Scanning...</div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="scan-status">Initializing...</div>
        </div>
      `;
      
      // Try to load the icon immediately
      const iconContainer = scanner.querySelector('.scanner-icon');
      const iconImg = document.createElement('img');
      iconImg.alt = 'Echelon';
      iconImg.style.cssText = 'width: 32px; height: 32px; display: block; border-radius: 4px;';
      
      iconImg.onload = function() {
        console.log('Icon loaded successfully');
        iconContainer.querySelector('.icon-fallback').style.display = 'none';
        iconContainer.appendChild(iconImg);
      };
      
      iconImg.onerror = function() {
        console.log('Icon failed to load from:', this.src);
        console.log('Using fallback icon');
      };
      
      // Set the source after setting up handlers
      try {
        iconImg.src = chrome.runtime.getURL('icons/icon.png');
        console.log('Attempting to load icon from:', iconImg.src);
      } catch (error) {
        console.error('Error getting icon URL:', error);
      }
      
      const style = document.createElement('style');
      style.textContent = `
        #echelon-scanner {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #0057b7, #003e91);
          color: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,87,183,0.3);
          z-index: 10000;
          font-family: Arial, sans-serif;
          min-width: 280px;
          transform: translateX(320px);
          transition: all 0.3s ease;
        }
        #echelon-scanner.active {
          transform: translateX(0);
        }
        #echelon-scanner.high-risk {
          background: linear-gradient(135deg, #ff4444, #cc0000);
          animation: danger-pulse 1s infinite;
        }
        #echelon-scanner.medium-risk {
          background: linear-gradient(135deg, #ff8800, #e67300);
        }
        @keyframes danger-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(255,68,68,0.5); }
          50% { box-shadow: 0 4px 30px rgba(255,68,68,0.8); }
        }
        .scanner-content {
          text-align: center;
        }
        .scanner-icon {
          font-size: 24px;
          margin-bottom: 8px;
          animation: pulse 1.5s infinite;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .icon-fallback {
          width: 32px;
          height: 32px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #0057b7;
          font-size: 18px;
        }
        .scanner-text {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .progress-bar {
          background: rgba(255,255,255,0.2);
          height: 6px;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-fill {
          background: #00ff88;
          height: 100%;
          width: 0%;
          transition: width 0.3s ease;
          border-radius: 3px;
        }
        .scan-status {
          font-size: 12px;
          opacity: 0.9;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(scanner);
      
      setTimeout(() => scanner.classList.add('active'), 100);
    }

    async startScan() {
      if (this.isScanning) return;
      
      this.isScanning = true;
      const scanner = document.getElementById('echelon-scanner');
      const progressFill = scanner.querySelector('.progress-fill');
      const statusText = scanner.querySelector('.scan-status');
      
      const steps = [
        { progress: 20, status: "Analyzing page content..." },
        { progress: 40, status: "Checking for scam keywords..." },
        { progress: 60, status: "Scanning links and forms..." },
        { progress: 80, status: "Validating security..." },
        { progress: 100, status: "Scan complete!" }
      ];
      
      for (const step of steps) {
        await this.delay(800);
        progressFill.style.width = step.progress + '%';
        statusText.textContent = step.status;
      }
      
      const results = this.scanPageForScams();
      this.showResults(results);
      
      setTimeout(() => this.hideScannerUI(), 3000);
    }

    async startManualScan() {
      if (this.isScanning) return;
      
      const results = this.scanPageForScams();
      
      // Send results immediately for manual scans
      chrome.runtime.sendMessage({
        type: 'SCAN_COMPLETE',
        results: results
      });
    }

    scanPageForScams() {
      const bodyText = document.body.innerText.toLowerCase();
      const titleText = document.title.toLowerCase();
      const allText = bodyText + ' ' + titleText;
      
      const found = scamKeywords.filter(keyword => allText.includes(keyword));
      const suspiciousLinks = this.checkSuspiciousLinks();
      const formChecks = this.checkSuspiciousForms();
      
      return {
        keywords: found,
        suspiciousLinks,
        formChecks,
        riskLevel: this.calculateRiskLevel(found, suspiciousLinks, formChecks)
      };
    }

    checkSuspiciousLinks() {
      const links = document.querySelectorAll('a[href]');
      const suspicious = [];
      
      links.forEach(link => {
        const href = link.href.toLowerCase();
        if (href.includes('bit.ly') || href.includes('tinyurl') || 
            href.includes('t.co') || href.match(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/)) {
          suspicious.push(href);
        }
      });
      
      return suspicious;
    }

    checkSuspiciousForms() {
      const forms = document.querySelectorAll('form');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const cardInputs = document.querySelectorAll('input[name*="card"], input[name*="cvv"]');
      
      return {
        formCount: forms.length,
        passwordFields: passwordInputs.length,
        hasPaymentFields: cardInputs.length > 0
      };
    }

    calculateRiskLevel(keywords, links, forms) {
      let risk = 0;
      risk += keywords.length * 2;
      risk += links.length * 3;
      risk += forms.passwordFields * 2;
      risk += forms.hasPaymentFields ? 8 : 0;
      
      if (risk >= 15) return 'HIGH';
      if (risk >= 8) return 'MEDIUM';
      if (risk > 0) return 'LOW';
      return 'SAFE';
    }

    showResults(results) {
      const scanner = document.getElementById('echelon-scanner');
      const statusText = scanner.querySelector('.scan-status');
      
      if (results.riskLevel === 'HIGH') {
        scanner.classList.add('high-risk');
        statusText.textContent = `HIGH RISK DETECTED! Found ${results.keywords.length} threats`;
        this.startAutoCloseCountdown();
      } else if (results.riskLevel === 'MEDIUM') {
        scanner.classList.add('medium-risk');
        statusText.textContent = `Medium risk - ${results.keywords.length} warnings`;
        this.showMediumRiskDialog();
      } else if (results.riskLevel === 'LOW') {
        statusText.textContent = `Low risk detected`;
      } else {
        statusText.textContent = `Page is safe`;
      }
      
      // Send results to popup and save to storage
      chrome.runtime.sendMessage({
        type: 'SCAN_COMPLETE',
        results: results
      });
      
      chrome.storage.local.set({ lastScanResults: results });
    }

    showMediumRiskDialog() {
      const overlay = document.createElement('div');
      overlay.id = 'echelon-medium-risk';
      overlay.innerHTML = `
        <div class="medium-risk-content">
          <div class="medium-risk-icon"></div>
          <div class="medium-risk-title">MEDIUM RISK DETECTED</div>
          <div class="medium-risk-message">This page contains potentially suspicious content. We recommend caution when interacting with this site.</div>
          <div class="medium-risk-buttons">
            <button class="medium-risk-close" onclick="this.parentElement.parentElement.parentElement.remove();">
              Close Page
            </button>
            <button class="medium-risk-stay" onclick="this.parentElement.parentElement.parentElement.remove();">
              Stay Anyway
            </button>
          </div>
        </div>
      `;

      const style = document.createElement('style');
      style.textContent = `
        #echelon-medium-risk {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
        }
        .medium-risk-content {
          background: linear-gradient(135deg, #ff8800, #e67300);
          color: white;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 10px 50px rgba(255, 136, 0, 0.5);
          max-width: 400px;
        }
        .medium-risk-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .medium-risk-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        .medium-risk-message {
          font-size: 16px;
          margin-bottom: 25px;
          line-height: 1.4;
        }
        .medium-risk-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        .medium-risk-close, .medium-risk-stay {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .medium-risk-close {
          background: #ff4444;
          color: white;
        }
        .medium-risk-close:hover {
          background: #cc0000;
        }
        .medium-risk-stay {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid white;
        }
        .medium-risk-stay:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(overlay);

      // Add click handlers
      overlay.querySelector('.medium-risk-close').onclick = () => {
        overlay.remove();
        this.closePage();
      };
      
      overlay.querySelector('.medium-risk-stay').onclick = () => {
        overlay.remove();
      };
    }

    startAutoCloseCountdown() {
      let timeLeft = 10;
      
      // Create countdown overlay
      this.createCountdownOverlay(timeLeft);
      
      // Show alert
      alert(` HIGH RISK SCAM DETECTED! \n\nThis page will automatically close in ${timeLeft} seconds for your protection.\n\nDetected threats include suspicious keywords, payment forms, and malicious links.`);
      
      // Start countdown
      this.countdownTimer = setInterval(() => {
        timeLeft--;
        this.updateCountdownDisplay(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(this.countdownTimer);
          this.closePage();
        }
      }, 1000);
    }

    createCountdownOverlay(timeLeft) {
      // Remove existing overlay
      const existing = document.getElementById('echelon-countdown');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'echelon-countdown';
      overlay.innerHTML = `
        <div class="countdown-content">
          <div class="countdown-icon"></div>
          <div class="countdown-title">HIGH RISK SCAM DETECTED</div>
          <div class="countdown-message">This page will close automatically in:</div>
          <div class="countdown-timer">${timeLeft}</div>
          <div class="countdown-subtitle">seconds</div>
          <button class="countdown-close-btn" onclick="this.parentElement.parentElement.remove(); clearInterval(window.echelonScanner.countdownTimer);">
            Stay on Page (Not Recommended)
          </button>
        </div>
      `;

      const style = document.createElement('style');
      style.textContent = `
        #echelon-countdown {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
        }
        .countdown-content {
          background: linear-gradient(135deg, #ff4444, #cc0000);
          color: white;
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 10px 50px rgba(255, 68, 68, 0.5);
          animation: danger-shake 0.5s infinite;
          max-width: 400px;
        }
        .countdown-icon {
          font-size: 48px;
          margin-bottom: 15px;
          animation: pulse-danger 1s infinite;
        }
        .countdown-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .countdown-message {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .countdown-timer {
          font-size: 72px;
          font-weight: bold;
          margin: 20px 0;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
        .countdown-subtitle {
          font-size: 18px;
          margin-bottom: 30px;
        }
        .countdown-close-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid white;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .countdown-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        @keyframes danger-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes pulse-danger {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(overlay);
    }

    updateCountdownDisplay(timeLeft) {
      const timer = document.querySelector('.countdown-timer');
      if (timer) {
        timer.textContent = timeLeft;
        
        // Change color as time runs out
        if (timeLeft <= 10) {
          timer.style.color = '#ffff00';
          timer.style.animation = 'pulse-danger 0.5s infinite';
        }
      }
    }

    closePage() {
      // Show final warning
      alert('CLOSING DANGEROUS PAGE FOR YOUR PROTECTION ');
      
      // Try to close the page (works for popup windows)
      if (window.opener) {
        window.close();
      } else {
        // For regular tabs, redirect to a safe page
        window.location.href = 'about:blank';
      }
    }

    hideScannerUI() {
      const scanner = document.getElementById('echelon-scanner');
      if (scanner) {
        scanner.classList.remove('active');
        setTimeout(() => scanner.remove(), 300);
      }
      this.isScanning = false;
    }

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    
  }

  // Make scanner globally accessible and start scan
  window.echelonScanner = new EchelonScanner();
  window.echelonScanner.startScan();
}
