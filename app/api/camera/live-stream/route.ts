import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Simple HTML page that uses our stream proxy
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loading" id="loading">
          <p>Connecting to camera...</p>
        </div>
        <img id="stream" style="display: none;" alt="Camera Stream" />
        <div class="status" id="status" style="display: none;">
          ● Live
        </div>
      </div>
      
      <script>
        const img = document.getElementById('stream');
        const loading = document.getElementById('loading');
        const status = document.getElementById('status');
        
        let isConnected = false;
        
        function connectToLiveStream() {
          const proxyUrl = '/api/camera/stream-proxy?endpoint=0'; // Use working endpoint 0
          
          img.onload = function() {
            console.log('Live MJPEG stream connected successfully');
            console.log('Stream dimensions:', this.naturalWidth, 'x', this.naturalHeight);
            isConnected = true;
            loading.style.display = 'none';
            img.style.display = 'block';
            status.style.display = 'block';
            // No need for refresh cycles with continuous MJPEG stream
          };
          
          img.onerror = function() {
            console.log('Live stream failed to connect:', this.src);
            loading.innerHTML = '<p>Camera stream unavailable - check console</p>';
          };
          
          console.log('Connecting to live MJPEG stream:', proxyUrl);
          img.src = proxyUrl; // No timestamp needed for continuous stream
          
          // Add timeout for debugging
          setTimeout(() => {
            if (!isConnected) {
              console.log('Timeout waiting for live stream connection');
            }
          }, 10000);
        }
        
        // Start the live stream connection
        connectToLiveStream();
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