import { NextRequest } from "next/server";

// Simple rate limiting storage (in-memory)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface SecurityResult {
  allowed: boolean;
  status?: number;
  message?: string;
}

/**
 * Simple rate limiting based on IP - 60 requests per minute per IP
 */
export function checkRateLimit(request: NextRequest): SecurityResult {
  const clientIP = 
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const key = `camera_rate_limit:${clientIP}`;
  const windowMs = 60000; // 1 minute
  const maxRequests = 60; // 60 requests per minute
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }
  
  if (record.count >= maxRequests) {
    const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      status: 429,
      message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds`
    };
  }
  
  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);
  
  return { allowed: true };
}

/**
 * Log camera access for monitoring (simplified)
 */
export function logCameraAccess(request: NextRequest, endpoint: string, status: 'success' | 'rate_limited' | 'blocked' = 'success') {
  const clientIP = 
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";
    
  const userAgent = request.headers.get("user-agent") || "unknown";
  const timestamp = new Date().toISOString();
  
  console.log(`[CAMERA_ACCESS] ${timestamp} - IP: ${clientIP} - Endpoint: ${endpoint} - Status: ${status} - UserAgent: ${userAgent.substring(0, 100)}`);
}

/**
 * Simple security check for camera endpoints (rate limiting + logging only)
 */
export function checkCameraSecurity(request: NextRequest, endpoint: string): SecurityResult {
  // Rate limiting
  const rateLimitResult = checkRateLimit(request);
  
  if (!rateLimitResult.allowed) {
    logCameraAccess(request, endpoint, 'rate_limited');
    return rateLimitResult;
  }
  
  // Log successful access
  logCameraAccess(request, endpoint, 'success');
  
  return { allowed: true };
}

/**
 * Cleanup old rate limit records every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);