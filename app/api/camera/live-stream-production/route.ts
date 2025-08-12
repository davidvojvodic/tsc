import { NextResponse } from "next/server";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  // Production-friendly version that uses snapshot polling instead of continuous stream
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loading" id="loading">
          <p>Connecting to camera...</p>
        </div>
        <img id="stream" style="display: none;" alt="Camera Stream" />
        <div class="status" id="status" style="display: none;">
          ● Live (Snapshot Mode)
        </div>
        <div class="error" id="error" style="display: none;">
          <p>Camera stream unavailable</p>
          <button class="retry-button" onclick="startStream()">Retry</button>
        </div>
      </div>
      
      <script>
        const img = document.getElementById('stream');
        const loading = document.getElementById('loading');
        const status = document.getElementById('status');
        const error = document.getElementById('error');
        
        let isConnected = false;
        let errorCount = 0;
        let refreshInterval = null;
        
        function showError() {
          loading.style.display = 'none';
          img.style.display = 'none';
          status.style.display = 'none';
          error.style.display = 'block';
        }
        
        function updateImage() {
          const newImg = new Image();
          const timestamp = new Date().getTime();
          
          newImg.onload = function() {
            // Success - update the displayed image
            img.src = newImg.src;
            errorCount = 0;
            
            if (!isConnected) {
              console.log('Camera connected successfully');
              isConnected = true;
              loading.style.display = 'none';
              img.style.display = 'block';
              status.style.display = 'block';
            }
          };
          
          newImg.onerror = function() {
            errorCount++;
            console.log('Failed to load snapshot, error count:', errorCount);
            
            if (errorCount > 5) {
              // Too many errors, stop trying
              if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
              }
              showError();
            }
          };
          
          // Use snapshot endpoint with cache-busting timestamp
          newImg.src = '/api/camera/snapshot?t=' + timestamp;
        }
        
        function startStream() {
          console.log('Starting camera stream (snapshot mode)...');
          errorCount = 0;
          isConnected = false;
          
          loading.style.display = 'block';
          error.style.display = 'none';
          img.style.display = 'none';
          status.style.display = 'none';
          
          // Clear any existing interval
          if (refreshInterval) {
            clearInterval(refreshInterval);
          }
          
          // Initial load
          updateImage();
          
          // Refresh every 500ms (2 FPS) - adjust as needed
          refreshInterval = setInterval(updateImage, 500);
          
          // Add visibility change handler to pause when tab is hidden
          document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
              // Pause updates when tab is hidden
              if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
              }
            } else {
              // Resume updates when tab is visible
              if (!refreshInterval && isConnected) {
                refreshInterval = setInterval(updateImage, 500);
              }
            }
          });
        }
        
        // Start the stream on load
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