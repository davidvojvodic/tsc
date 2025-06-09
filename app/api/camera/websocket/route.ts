import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

const CAMERA_HOST = "194.249.165.38";
const CAMERA_PORT = 4560;
const CAMERA_USERNAME = "tsc";
const CAMERA_PASSWORD = "tscmb2025";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const upgrade = request.headers.get('upgrade');

  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  try {
    // Create WebSocket connection
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection
    server.accept();

    // Set up camera streaming
    let isStreaming = false;
    let streamInterval: NodeJS.Timeout | null = null;

    const startStreaming = async () => {
      if (isStreaming) return;
      isStreaming = true;

      const streamCamera = async () => {
        try {
          const auth = btoa(`${CAMERA_USERNAME}:${CAMERA_PASSWORD}`);
          const timestamp = Date.now();
          
          const response = await fetch(
            `http://${CAMERA_HOST}:${CAMERA_PORT}/cgi-bin/snapshot.cgi?channel=1&subtype=1&t=${timestamp}`,
            {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Cache-Control': 'no-cache'
              },
              signal: AbortSignal.timeout(5000) // 5 second timeout
            }
          );

          if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            const base64Image = btoa(
              String.fromCharCode(...new Uint8Array(imageBuffer))
            );
            
            server.send(JSON.stringify({
              type: 'frame',
              data: `data:image/jpeg;base64,${base64Image}`,
              timestamp: Date.now()
            }));
          } else {
            throw new Error(`Camera error: ${response.status}`);
          }
        } catch (error) {
          console.error('Camera fetch error:', error);
          server.send(JSON.stringify({
            type: 'error',
            message: 'Failed to fetch camera frame'
          }));
        }
      };

      // Start streaming at 2 FPS
      streamInterval = setInterval(streamCamera, 500);
      streamCamera(); // Send first frame immediately
    };

    const stopStreaming = () => {
      isStreaming = false;
      if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
      }
    };

    // Handle WebSocket messages
    server.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data as string);
        
        switch (message.type) {
          case 'start':
            startStreaming();
            break;
          case 'stop':
            stopStreaming();
            break;
          case 'setFPS':
            const fps = Math.max(1, Math.min(10, message.fps || 2));
            if (streamInterval) {
              clearInterval(streamInterval);
              streamInterval = setInterval(async () => {
                if (isStreaming) {
                  try {
                    const auth = btoa(`${CAMERA_USERNAME}:${CAMERA_PASSWORD}`);
                    const timestamp = Date.now();
                    
                    const response = await fetch(
                      `http://${CAMERA_HOST}:${CAMERA_PORT}/cgi-bin/snapshot.cgi?channel=1&subtype=1&t=${timestamp}`,
                      {
                        headers: {
                          'Authorization': `Basic ${auth}`,
                          'Cache-Control': 'no-cache'
                        },
                        signal: AbortSignal.timeout(5000)
                      }
                    );

                    if (response.ok) {
                      const imageBuffer = await response.arrayBuffer();
                      const base64Image = btoa(
                        String.fromCharCode(...new Uint8Array(imageBuffer))
                      );
                      
                      server.send(JSON.stringify({
                        type: 'frame',
                        data: `data:image/jpeg;base64,${base64Image}`,
                        timestamp: Date.now()
                      }));
                    }
                  } catch (error) {
                    console.error('Camera fetch error:', error);
                    server.send(JSON.stringify({
                      type: 'error',
                      message: 'Failed to fetch camera frame'
                    }));
                  }
                }
              }, 1000 / fps);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle WebSocket close
    server.addEventListener('close', () => {
      stopStreaming();
    });

    // Send initial connection message
    server.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket camera stream connected'
    }));

    // Start streaming automatically
    startStreaming();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });

  } catch (error) {
    console.error('WebSocket setup error:', error);
    return new Response('WebSocket setup failed', { status: 500 });
  }
}