import { NextResponse } from "next/server";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  // Edge-based streaming for production
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Camera Live Stream</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          overflow: hidden;
        }
        
        .container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }
        
        .status {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 12px;
          font-family: Arial, sans-serif;
        }
        
        .loading {
          color: white;
          text-align: center;
          font-family: Arial, sans-serif;
        }
        
        .error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          text-align: center;
          font-family: Arial, sans-serif;
        }
        
        .retry-button {
          margin-top: 10px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .retry-button:hover {
          background: #2563eb;
        }
        
        .mode-switch {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 5px;
          background: rgba(0,0,0,0.8);
          padding: 5px;
          border-radius: 4px;
        }
        
        .mode-button {
          padding: 5px 10px;
          font-size: 11px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          background: #444;
          color: white;
        }
        
        .mode-button.active {
          background: #3b82f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loading" id="loading">
          <p>Connecting to camera...</p>
        </div>
        <img id="stream" style="display: none;" alt="Camera Stream" />
        <div class="status" id="status" style="display: none;">
          ● <span id="statusText">Live</span>
        </div>
        <div class="error" id="error" style="display: none;">
          <p>Camera stream unavailable</p>
          <button class="retry-button" onclick="startStream()">Retry</button>
        </div>
        <div class="mode-switch" id="modeSwitch" style="display: none;">
          <button class="mode-button active" id="edgeMode" onclick="switchMode('edge')">Edge Stream</button>
          <button class="mode-button" id="snapshotMode" onclick="switchMode('snapshot')">Snapshot Mode</button>
        </div>
      </div>
      
      <script>
        const img = document.getElementById('stream');
        const loading = document.getElementById('loading');
        const status = document.getElementById('status');
        const statusText = document.getElementById('statusText');
        const error = document.getElementById('error');
        const modeSwitch = document.getElementById('modeSwitch');
        
        let isConnected = false;
        let errorCount = 0;
        let refreshInterval = null;
        let currentMode = 'edge'; // Try edge streaming first
        let retryCount = 0;
        
        function showError() {
          loading.style.display = 'none';
          img.style.display = 'none';
          status.style.display = 'none';
          error.style.display = 'block';
          modeSwitch.style.display = 'flex';
        }
        
        function switchMode(mode) {
          currentMode = mode;
          document.getElementById('edgeMode').classList.toggle('active', mode === 'edge');
          document.getElementById('snapshotMode').classList.toggle('active', mode === 'snapshot');
          error.style.display = 'none';
          startStream();
        }
        
        function connectEdgeStream() {
          console.log('Attempting edge stream connection...');
          const proxyUrl = '/api/camera/stream-edge';
          
          img.onload = function() {
            console.log('Edge stream connected successfully');
            isConnected = true;
            loading.style.display = 'none';
            img.style.display = 'block';
            status.style.display = 'block';
            modeSwitch.style.display = 'flex';
            statusText.textContent = 'Live (Edge Stream)';
            retryCount = 0;
          };
          
          img.onerror = function() {
            console.log('Edge stream failed, falling back to snapshot mode');
            if (retryCount < 2) {
              retryCount++;
              setTimeout(() => connectEdgeStream(), 1000);
            } else {
              // Fallback to snapshot mode
              currentMode = 'snapshot';
              connectSnapshotStream();
            }
          };
          
          img.src = proxyUrl;
        }
        
        function updateSnapshot() {
          const newImg = new Image();
          const timestamp = new Date().getTime();
          
          newImg.onload = function() {
            img.src = newImg.src;
            errorCount = 0;
            
            if (!isConnected) {
              console.log('Snapshot mode connected');
              isConnected = true;
              loading.style.display = 'none';
              img.style.display = 'block';
              status.style.display = 'block';
              modeSwitch.style.display = 'flex';
              statusText.textContent = 'Live (Snapshot Mode - 2 FPS)';
            }
          };
          
          newImg.onerror = function() {
            errorCount++;
            if (errorCount > 5) {
              if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
              }
              showError();
            }
          };
          
          newImg.src = '/api/camera/snapshot?t=' + timestamp;
        }
        
        function connectSnapshotStream() {
          console.log('Starting snapshot mode...');
          
          if (refreshInterval) {
            clearInterval(refreshInterval);
          }
          
          updateSnapshot();
          refreshInterval = setInterval(updateSnapshot, 500); // 2 FPS
          
          // Pause when tab is hidden
          document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
              if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
              }
            } else {
              if (!refreshInterval && isConnected && currentMode === 'snapshot') {
                refreshInterval = setInterval(updateSnapshot, 500);
              }
            }
          });
        }
        
        function startStream() {
          console.log('Starting camera stream, mode:', currentMode);
          errorCount = 0;
          isConnected = false;
          retryCount = 0;
          
          loading.style.display = 'block';
          error.style.display = 'none';
          img.style.display = 'none';
          status.style.display = 'none';
          modeSwitch.style.display = 'none';
          
          if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
          }
          
          if (currentMode === 'edge') {
            connectEdgeStream();
          } else {
            connectSnapshotStream();
          }
        }
        
        // Start with edge streaming
        startStream();
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}