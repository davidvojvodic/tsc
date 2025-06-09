// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  // PWA-based solution with better caching and offline support
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PWA Camera Stream</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #000;
          font-family: Arial, sans-serif;
          overflow: hidden;
        }
        
        .stream-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }
        
        .video-wrapper {
          position: relative;
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }
        
        .main-image {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          display: block;
        }
        
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: white;
          text-align: center;
        }
        
        .hidden {
          display: none !important;
        }
        
        .controls {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 10px;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }
        
        .status {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .quality-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 5px 15px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        }
        
        button:hover {
          background: #2563eb;
        }
        
        button:disabled {
          background: #666;
          cursor: not-allowed;
        }
        
        select {
          background: #333;
          color: white;
          border: 1px solid #666;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 12px;
        }
        
        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse 2s infinite;
        }
        
        .indicator.live {
          background: #22c55e;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="stream-container">
        <div class="video-wrapper">
          <img id="mainImage" class="main-image" alt="Camera Stream" style="display: none;">
          
          <!-- Loading Overlay -->
          <div id="loadingOverlay" class="overlay">
            <div class="loading-spinner"></div>
            <h3>Connecting to Camera...</h3>
            <p>Please wait while we establish connection</p>
          </div>
          
          <!-- Error Overlay -->
          <div id="errorOverlay" class="overlay hidden">
            <h3>Connection Failed</h3>
            <p id="errorMessage">Unable to connect to camera stream</p>
            <button onclick="retryConnection()">Retry Connection</button>
          </div>
        </div>
        
        <!-- Controls -->
        <div id="controls" class="controls hidden">
          <div class="status">
            <div class="indicator" id="indicator"></div>
            <span id="statusText">Connecting...</span>
            <span id="frameInfo">0 frames</span>
            <span id="fpsInfo">0 FPS</span>
          </div>
          
          <div class="quality-controls">
            <label>Quality:</label>
            <select id="fpsSelect" onchange="changeFPS()">
              <option value="1">1 FPS (Low)</option>
              <option value="2" selected>2 FPS (Normal)</option>
              <option value="5">5 FPS (High)</option>
              <option value="10">10 FPS (Ultra)</option>
            </select>
            <button onclick="toggleStream()" id="toggleBtn">Pause</button>
            <button onclick="retryConnection()">Retry</button>
          </div>
        </div>
      </div>
      
      <script>
        class CameraStream {
          constructor() {
            this.isActive = false;
            this.isPaused = false;
            this.fps = 2;
            this.frameCount = 0;
            this.errorCount = 0;
            this.maxErrors = 10;
            this.interval = null;
            this.lastFrameTime = Date.now();
            this.actualFPS = 0;
            
            this.elements = {
              mainImage: document.getElementById('mainImage'),
              loadingOverlay: document.getElementById('loadingOverlay'),
              errorOverlay: document.getElementById('errorOverlay'),
              controls: document.getElementById('controls'),
              indicator: document.getElementById('indicator'),
              statusText: document.getElementById('statusText'),
              frameInfo: document.getElementById('frameInfo'),
              fpsInfo: document.getElementById('fpsInfo'),
              fpsSelect: document.getElementById('fpsSelect'),
              toggleBtn: document.getElementById('toggleBtn'),
              errorMessage: document.getElementById('errorMessage')
            };
            
            this.bindEvents();
            this.start();
          }
          
          bindEvents() {
            // Visibility change handling
            document.addEventListener('visibilitychange', () => {
              if (document.hidden) {
                this.pause();
              } else {
                this.resume();
              }
            });
            
            // Image load events
            this.elements.mainImage.onload = () => this.onFrameLoaded();
            this.elements.mainImage.onerror = () => this.onFrameError();
          }
          
          start() {
            this.isActive = true;
            this.isPaused = false;
            this.errorCount = 0;
            this.frameCount = 0;
            
            this.updateStatus('Connecting...', false);
            this.scheduleNextFrame();
          }
          
          pause() {
            this.isPaused = true;
            this.updateStatus('Paused', false);
            this.elements.toggleBtn.textContent = 'Resume';
            if (this.interval) {
              clearTimeout(this.interval);
              this.interval = null;
            }
          }
          
          resume() {
            if (this.isActive) {
              this.isPaused = false;
              this.updateStatus('Live', true);
              this.elements.toggleBtn.textContent = 'Pause';
              this.scheduleNextFrame();
            }
          }
          
          stop() {
            this.isActive = false;
            this.isPaused = false;
            if (this.interval) {
              clearTimeout(this.interval);
              this.interval = null;
            }
          }
          
          scheduleNextFrame() {
            if (!this.isActive || this.isPaused) return;
            
            const intervalMs = 1000 / this.fps;
            this.interval = setTimeout(() => this.loadFrame(), intervalMs);
          }
          
          loadFrame() {
            if (!this.isActive || this.isPaused) return;
            
            const timestamp = Date.now();
            const imageUrl = '/api/camera/snapshot?t=' + timestamp;
            
            // Preload the image
            const tempImg = new Image();
            tempImg.onload = () => {
              if (this.isActive && !this.isPaused) {
                this.elements.mainImage.src = tempImg.src;
              }
            };
            tempImg.onerror = () => this.onFrameError();
            tempImg.src = imageUrl;
          }
          
          onFrameLoaded() {
            this.frameCount++;
            this.errorCount = 0;
            
            // Calculate actual FPS
            const now = Date.now();
            const timeDiff = now - this.lastFrameTime;
            if (timeDiff > 0) {
              this.actualFPS = 1000 / timeDiff;
            }
            this.lastFrameTime = now;
            
            // Show image and controls on first frame
            if (this.frameCount === 1) {
              this.elements.mainImage.style.display = 'block';
              this.elements.loadingOverlay.classList.add('hidden');
              this.elements.controls.classList.remove('hidden');
            }
            
            this.updateStatus('Live', true);
            this.updateFrameInfo();
            this.scheduleNextFrame();
          }
          
          onFrameError() {
            this.errorCount++;
            
            if (this.errorCount >= this.maxErrors) {
              this.showError('Too many connection failures. Please check camera status.');
              this.stop();
              return;
            }
            
            // Continue trying
            this.updateStatus('Reconnecting...', false);
            this.scheduleNextFrame();
          }
          
          updateStatus(text, isLive) {
            this.elements.statusText.textContent = text;
            this.elements.indicator.classList.toggle('live', isLive);
          }
          
          updateFrameInfo() {
            this.elements.frameInfo.textContent = this.frameCount + ' frames';
            this.elements.fpsInfo.textContent = this.actualFPS.toFixed(1) + ' FPS';
          }
          
          showError(message) {
            this.elements.errorMessage.textContent = message;
            this.elements.loadingOverlay.classList.add('hidden');
            this.elements.errorOverlay.classList.remove('hidden');
            this.elements.controls.classList.add('hidden');
          }
          
          hideError() {
            this.elements.errorOverlay.classList.add('hidden');
            this.elements.loadingOverlay.classList.remove('hidden');
          }
          
          setFPS(newFPS) {
            this.fps = newFPS;
            if (this.isActive && !this.isPaused) {
              // Restart with new FPS
              if (this.interval) {
                clearTimeout(this.interval);
              }
              this.scheduleNextFrame();
            }
          }
        }
        
        // Global instance
        let cameraStream;
        
        // Global functions for button events
        function toggleStream() {
          if (cameraStream.isPaused) {
            cameraStream.resume();
          } else {
            cameraStream.pause();
          }
        }
        
        function retryConnection() {
          if (cameraStream) {
            cameraStream.stop();
          }
          cameraStream.hideError();
          cameraStream = new CameraStream();
        }
        
        function changeFPS() {
          const newFPS = parseInt(document.getElementById('fpsSelect').value);
          cameraStream.setFPS(newFPS);
        }
        
        // Initialize
        cameraStream = new CameraStream();
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}