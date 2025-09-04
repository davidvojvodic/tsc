import { NextRequest } from "next/server";
import { auth } from "./auth";

// Rate limiting storage (in-memory for now, should use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface SecurityCheckResult {
  allowed: boolean;
  error?: string;
  status?: number;
}

/**
 * Check if user is authenticated for camera access
 */
export async function checkCameraAuth(request: NextRequest): Promise<SecurityCheckResult> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return {
        allowed: false,
        error: "Authentication required for camera access",
        status: 401
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Camera auth check failed:", error);
    return {
      allowed: false,
      error: "Authentication verification failed",
      status: 401
    };
  }
}

/**
 * Check rate limits based on IP address
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { maxRequests: 30, windowMs: 60000 } // 30 requests per minute
): SecurityCheckResult {
  const clientIP = 
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const key = `rate_limit:${clientIP}`;
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { allowed: true };
  }
  
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      error: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds`,
      status: 429
    };
  }
  
  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);
  
  return { allowed: true };
}

/**
 * Log camera access for monitoring
 */
export function logCameraAccess(request: NextRequest, endpoint: string, userId?: string) {
  const clientIP = 
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";
    
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  console.log(`[CAMERA_ACCESS] ${new Date().toISOString()} - IP: ${clientIP} - User: ${userId || 'anonymous'} - Endpoint: ${endpoint} - UserAgent: ${userAgent}`);
}

/**
 * Comprehensive security check for camera endpoints
 */
export async function checkCameraSecurity(
  request: NextRequest,
  endpoint: string,
  requireAuth: boolean = process.env.CAMERA_REQUIRE_AUTH === 'true'
): Promise<SecurityCheckResult> {
  try {
    // 1. Rate limiting check
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      logCameraAccess(request, endpoint, 'rate_limited');
      return rateLimitResult;
    }
    
    // 2. Authentication check (if required)
    if (requireAuth) {
      const authResult = await checkCameraAuth(request);
      if (!authResult.allowed) {
        logCameraAccess(request, endpoint, 'auth_failed');
        return authResult;
      }
      
      // Get user info for logging
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      
      logCameraAccess(request, endpoint, session?.user?.id);
    } else {
      logCameraAccess(request, endpoint);
    }
    
    return { allowed: true };
  } catch (error) {
    console.error("Camera security check failed:", error);
    logCameraAccess(request, endpoint, 'security_error');
    return {
      allowed: false,
      error: "Security check failed",
      status: 500
    };
  }
}

/**
 * Clean up old rate limit records (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up rate limit store every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);