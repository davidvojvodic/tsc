import { NextRequest } from "next/server";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // WebSocket-based streaming solution
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebSocket Camera Stream</title>
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
          font-family: Arial, sans-serif;
        }
        
        .container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .video-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        canvas {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          border: 1px solid #333;
        }
        
        .controls {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: between;
          align-items: center;
          background: rgba(0,0,0,0.8);
          padding: 5px 10px;
          border-radius: 5px;
        }
        
        .status {
          color: white;
          font-size: 12px;
          flex: 1;
        }
        
        .fps-control {
          color: white;
          font-size: 12px;
          margin-left: 10px;
        }
        
        button {
          padding: 5px 10px;
          margin: 0 5px;
          background: #3b82f6;
          color: white;
          border: none;
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
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 12px;
        }
        
        .loading {
          color: white;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="video-container">
          <div class="loading" id="loading">
            <p>Starting camera stream...</p>
          </div>
          <canvas id="canvas" style="display: none;"></canvas>
        </div>
        
        <div class="controls" id="controls" style="display: none;">
          <div class="status">
            <span id="status">● Live</span> | 
            <span id="frameCount">0 frames</span> | 
            <span id="actualFps">0 FPS</span>
          </div>
          <div class="fps-control">
            FPS: <select id="fpsSelect">
              <option value="1">1</option>
              <option value="2" selected>2</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
            <button id="pauseBtn">Pause</button>
            <button id="retryBtn">Retry</button>
          </div>
        </div>
      </div>
      
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const loading = document.getElementById('loading');
        const controls = document.getElementById('controls');
        const status = document.getElementById('status');
        const frameCount = document.getElementById('frameCount');
        const actualFpsDisplay = document.getElementById('actualFps');
        const fpsSelect = document.getElementById('fpsSelect');
        const pauseBtn = document.getElementById('pauseBtn');
        const retryBtn = document.getElementById('retryBtn');
        
        let isRunning = false;
        let isPaused = false;
        let interval = null;
        let frames = 0;
        let lastFrameTime = Date.now();
        let fpsHistory = [];
        
        function updateFPS() {
          const now = Date.now();
          const timeDiff = now - lastFrameTime;
          const currentFps = timeDiff > 0 ? 1000 / timeDiff : 0;
          
          fpsHistory.push(currentFps);
          if (fpsHistory.length > 10) fpsHistory.shift();
          
          const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
          actualFpsDisplay.textContent = avgFps.toFixed(1) + ' FPS';
          lastFrameTime = now;
        }
        
        function loadFrame() {
          if (!isRunning || isPaused) return;
          
          const img = new Image();
          const timestamp = Date.now();
          
          img.onload = function() {
            if (!isRunning || isPaused) return;
            
            // Resize canvas to image dimensions
            if (canvas.width !== img.width || canvas.height !== img.height) {
              canvas.width = img.width;
              canvas.height = img.height;
            }
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Update statistics
            frames++;
            frameCount.textContent = frames + ' frames';
            updateFPS();
            
            // Show canvas and controls on first successful frame
            if (frames === 1) {
              loading.style.display = 'none';
              canvas.style.display = 'block';
              controls.style.display = 'flex';
            }
          };
          
          img.onerror = function() {
            console.error('Failed to load frame');
            status.textContent = '● Connection Error';
            // Continue trying...
          };
          
          img.src = '/api/camera/snapshot?t=' + timestamp;
        }
        
        function start() {
          const fps = parseInt(fpsSelect.value);
          const intervalMs = 1000 / fps;
          
          isRunning = true;
          isPaused = false;
          frames = 0;
          
          status.textContent = '● Live';
          pauseBtn.textContent = 'Pause';
          
          // Clear existing interval
          if (interval) clearInterval(interval);
          
          // Start new interval
          interval = setInterval(loadFrame, intervalMs);
          loadFrame(); // Load first frame immediately
        }
        
        function pause() {
          isPaused = !isPaused;
          pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
          status.textContent = isPaused ? '● Paused' : '● Live';
        }
        
        function retry() {
          if (interval) clearInterval(interval);
          loading.style.display = 'block';
          canvas.style.display = 'none';
          controls.style.display = 'none';
          frames = 0;
          fpsHistory = [];
          start();
        }
        
        // Event listeners
        fpsSelect.addEventListener('change', () => {
          if (isRunning) {
            start(); // Restart with new FPS
          }
        });
        
        pauseBtn.addEventListener('click', pause);
        retryBtn.addEventListener('click', retry);
        
        // Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            isPaused = true;
            status.textContent = '● Paused (Tab Hidden)';
          } else if (isRunning) {
            isPaused = false;
            status.textContent = '● Live';
          }
        });
        
        // Start automatically
        start();
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