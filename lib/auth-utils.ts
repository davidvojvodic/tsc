import https from 'https';
import http from 'http';
import { NextResponse } from 'next/server';

/**
 * Custom HTTPS agent for industrial controller connections
 * Only disables TLS verification for specific whitelisted industrial controller IPs
 */
const INDUSTRIAL_CONTROLLER_HOSTS = [
  '194.249.165.38', // Siemens controller
  // Add other industrial controller IPs here as needed
];

/**
 * Creates a secure HTTPS agent that only disables TLS verification for whitelisted industrial controllers
 * @param targetHost - The host to create agent for
 * @returns HTTPS or HTTP agent based on requirements
 */
export function createSecureAgent(targetHost: string): https.Agent | http.Agent {
  // Check if this is an industrial controller that requires TLS bypass
  const isIndustrialController = INDUSTRIAL_CONTROLLER_HOSTS.some(host => 
    targetHost === host || targetHost.startsWith(host + ':')
  );
  
  if (isIndustrialController) {
    // Only for whitelisted industrial controllers, create agent with TLS bypass
    return new https.Agent({
      rejectUnauthorized: false,
      timeout: 10000, // 10 second timeout
    });
  }
  
  // For all other requests, use secure defaults
  return new https.Agent({
    rejectUnauthorized: true,
    timeout: 10000,
  });
}

/**
 * Validates that an admin user has the required permissions
 * @param session - Better Auth session
 * @param requiredRole - Required role (default: ADMIN)
 * @returns boolean indicating if user has required permissions
 */
export function validateAdminPermissions(
  session: { user?: { role?: string; id?: string } } | null, 
  requiredRole: string = 'ADMIN'
): boolean {
  return !!(
    session?.user && 
    session.user.role === requiredRole && 
    session.user.id
  );
}

/**
 * Async wrapper that validates admin authentication using Better Auth session
 * @param headers - Request headers for session validation
 * @param requiredRole - Required role (default: ADMIN)
 * @returns Promise resolving to validation result with error if unauthorized
 */
export async function validateAdminAuth(
  headers?: Headers,
  requiredRole: string = 'ADMIN'
): Promise<{ error?: NextResponse; session?: { user: { id: string; role?: string | null; email: string } } }> {
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({ headers: headers || new Headers() });
    
    if (!session?.user || session.user.role !== requiredRole) {
      return {
        error: new NextResponse('Unauthorized', { status: 401 })
      };
    }
    
    return { session };
  } catch (error) {
    console.error('Admin auth validation failed:', error);
    return {
      error: new NextResponse('Internal Server Error', { status: 500 })
    };
  }
}


/**
 * Creates a detailed error response for API routes
 * @param error - The error object
 * @param statusCode - HTTP status code
 * @param includeDetails - Whether to include detailed error info
 * @returns Formatted error object
 */
export function createDetailedErrorResponse(
  error: unknown,
  statusCode: number = 500,
  includeDetails: boolean = process.env.NODE_ENV === 'development'
): { error: string; details?: unknown; status: number } {
  const sanitizedMessage = sanitizeErrorMessage(error, includeDetails);
  
  const response: { error: string; details?: unknown; status: number } = {
    error: sanitizedMessage,
    status: statusCode
  };
  
  if (includeDetails && error instanceof Error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  return response;
}

/**
 * Sanitizes error messages to prevent information disclosure
 * @param error - The error object
 * @param includeDetails - Whether to include detailed error info (dev mode)
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(
  error: unknown, 
  includeDetails: boolean = process.env.NODE_ENV === 'development'
): string {
  if (!includeDetails) {
    // In production, return generic messages
    return "An error occurred while processing your request";
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

/**
 * Validates critical environment variables required for Better Auth security
 * @throws Error if any critical environment variable is missing or invalid
 */
export function validateEnvironmentVariables(): void {
  const errors: string[] = [];
  
  // Validate BETTER_AUTH_SECRET
  const authSecret = process.env.BETTER_AUTH_SECRET;
  if (!authSecret) {
    errors.push("BETTER_AUTH_SECRET environment variable is required and must be set");
  } else if (authSecret.length < 32) {
    errors.push("BETTER_AUTH_SECRET must be at least 32 characters long for security");
  }
  
  // Validate DATABASE_URL  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    errors.push("DATABASE_URL environment variable is required");
  } else if (!databaseUrl.startsWith('mysql://') && !databaseUrl.startsWith('mysql2://')) {
    errors.push("DATABASE_URL must be a valid MySQL connection string");
  }
  
  // Validate NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    errors.push("NEXT_PUBLIC_APP_URL environment variable is required");
  } else {
    try {
      new URL(appUrl);
    } catch {
      errors.push("NEXT_PUBLIC_APP_URL must be a valid URL");
    }
  }
  
  // Validate RESEND_API_KEY for email functionality
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    errors.push("RESEND_API_KEY environment variable is required for email functionality");
  } else if (!resendKey.startsWith('re_')) {
    errors.push("RESEND_API_KEY appears to be invalid (should start with 're_')");
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Validates environment variables at runtime and logs configuration status
 * @returns boolean indicating if all validations passed
 */
export function safeValidateEnvironment(): boolean {
  try {
    validateEnvironmentVariables();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    
    if (process.env.NODE_ENV === 'production') {
      // In production, exit the process if environment is invalid
      process.exit(1);
    }
    
    return false;
  }
}

/**
 * Rate limiting utility for API endpoints
 * Simple in-memory rate limiter (consider Redis for production)
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(
  identifier: string, 
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 10
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const current = rateLimitMap.get(identifier) || { count: 0, lastReset: now };
  
  // Reset if window has passed
  if (current.lastReset < windowStart) {
    current.count = 0;
    current.lastReset = now;
  }
  
  current.count++;
  rateLimitMap.set(identifier, current);
  
  return current.count <= maxRequests;
}