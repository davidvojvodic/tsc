# Secure Authentication Architecture for TŠC Technical Specification Center

## Executive Summary

### Critical Security Issues Addressed
This architecture document provides a comprehensive solution to transform the current insecure authentication implementation into a production-ready, security-compliant system using Better Auth's built-in security features.

**Current Critical Vulnerabilities Resolved:**
- Hardcoded secret fallback removal
- Manual password operations replaced with Better Auth's scrypt hashing
- Password exposure prevention in API responses
- Secure session configuration implementation
- Proper admin plugin usage for user management
- Strong password policy enforcement
- Comprehensive security headers and CORS configuration

### Technology Stack Decision
**Authentication Provider:** Better Auth v1.x with Prisma MySQL adapter
**Rationale:** Better Auth provides enterprise-grade security features out-of-the-box including scrypt password hashing, secure session management, CSRF protection, and built-in rate limiting. This eliminates the need for manual security implementations and reduces attack surface.

### Key Architectural Decisions
1. **Security-First Approach:** All authentication operations use Better Auth's secure defaults
2. **Zero Hardcoded Secrets:** Strict environment variable enforcement with no fallbacks
3. **Centralized Session Management:** Better Auth handles all session security automatically
4. **Admin Operations Security:** All user management through Better Auth admin plugin
5. **API Security Standards:** Consistent authentication patterns across all endpoints

---

## For Backend Engineers

### 1. Secure Better Auth Configuration

**File:** `/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import prisma from "./prisma";
import { getBaseURL } from "./auth-client";
import { createPasswordResetEmailHtml, sendEmail } from "./email";

// Strict secret validation - NO FALLBACKS
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required and must be set in environment variables");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  
  // Secure secret handling - NO hardcoded fallback
  secret: process.env.BETTER_AUTH_SECRET,
  
  // Secure session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      domain: process.env.NODE_ENV === "production" ? ".tscmb.si" : undefined,
    },
  },
  
  // Enhanced password security
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialCharacters: true,
    },
    sendResetPassword: async ({ user, url, token }) => {
      if (!user?.email) {
        console.error("Missing required data for password reset");
        throw new Error("Missing required data for password reset");
      }

      const html = createPasswordResetEmailHtml(url);
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click this link to reset your password: ${url}?token=${token}`,
        html,
      });
    },
  },
  
  // Rate limiting configuration
  rateLimit: {
    window: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  
  // Secure base URL
  baseURL: getBaseURL(),
  
  // Admin plugin with secure configuration
  plugins: [
    admin({
      defaultRole: "USER",
      adminEmail: process.env.ADMIN_EMAIL,
      requireAdminVerification: true,
    }),
  ],
  
  // Strict CORS configuration
  cors: {
    origin: [
      "https://ka2.tscmb.si",
      "https://tsc-testing.vercel.app",
      ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  },
  
  // Trusted origins for additional security
  trustedOrigins: [
    "https://ka2.tscmb.si",
    "https://tsc-testing.vercel.app",
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  ].filter(Boolean),
  
  // Security headers
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production" ? ".tscmb.si" : undefined,
    },
    generateId: () => crypto.randomUUID(),
  },
});
```

### 2. Secure API Endpoint Patterns

**Pattern for Protected Endpoints:**

```typescript
// app/api/protected-resource/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

// Input validation schema
const requestSchema = z.object({
  // Define your request schema here
});

export async function GET(req: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // 2. Authorization check (if needed)
    if (requiresAdminAccess && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" }, 
        { status: 403 }
      );
    }

    // 3. Business logic with secure data handling
    const data = await secureDataFetch();
    
    // 4. Return clean response (no sensitive data)
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("[API_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
```

### 3. Secure Admin Operations

**Replace manual user operations with Better Auth admin plugin:**

```typescript
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Admin authorization through Better Auth
    const isAdmin = await auth.api.admin.listUsers({
      headers: await headers(),
      query: { userId: session.user.id }
    });

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    
    // Use Better Auth admin plugin for secure user creation
    const user = await auth.api.admin.createUser({
      headers: await headers(),
      body: {
        email: body.email,
        name: body.name,
        role: body.role,
        password: body.password, // Better Auth handles secure hashing
        emailVerified: body.emailVerified,
      },
    });

    // Return clean user data (passwords never exposed)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    });

  } catch (error) {
    console.error("[ADMIN_USER_CREATE]", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
```

### 4. Secure Password Management

**Remove manual bcrypt operations - use Better Auth:**

```typescript
// app/api/users/[id]/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Use Better Auth for secure password change
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[PASSWORD_CHANGE]", error);
    return NextResponse.json(
      { error: "Password change failed" }, 
      { status: 400 }
    );
  }
}
```

### 5. Database Schema Compliance

**Ensure Prisma schema matches Better Auth requirements:**

```prisma
// prisma/schema.prisma - Better Auth compliant
model User {
  id                    String                  @id @default(uuid())
  email                 String                  @unique
  name                  String?
  createdAt             DateTime                @default(now())
  updatedAt             DateTime                @updatedAt
  emailVerified         Boolean                 @default(false)
  image                 String?                 @db.Text
  banExpires            DateTime?
  banReason             String?                 @db.Text
  banned                Boolean?                @default(false)
  role                  Role                    @default(USER)
  
  // Better Auth managed relationships
  Account               Account[]
  Session               Session[]
  
  // Application specific relationships
  pages                 Page[]
  quizSubmissions       QuizSubmission[]
  passwordResetRequests PasswordResetRequest[]

  @@map("user")
}

model Session {
  id             String   @id @default(uuid())
  expiresAt      DateTime
  ipAddress      String?  @db.VarChar(45)
  userAgent      String?  @db.Text
  userId         String
  createdAt      DateTime @default(now())
  impersonatedBy String?
  token          String   @unique @db.VarChar(255)
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id @default(uuid())
  accountId             String
  providerId            String
  userId                String
  accessToken           String?   @db.Text
  refreshToken          String?   @db.Text
  idToken               String?   @db.Text
  expiresAt             DateTime?
  password              String?   @db.Text // Better Auth manages this securely
  accessTokenExpiresAt  DateTime?
  createdAt             DateTime  @default(now())
  refreshTokenExpiresAt DateTime?
  scope                 String?   @db.Text
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("account")
}
```

---

## For Frontend Engineers

### 1. Secure Client Configuration

**File:** `/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || "development";

export function getBaseURL() {
  switch (environment) {
    case "development":
      return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    case "preview":
      return process.env.NEXT_PUBLIC_TEST_APP_URL || "https://tsc-testing.vercel.app";
    case "production":
      if (!process.env.NEXT_PUBLIC_PROD_APP_URL) {
        throw new Error("Production app URL must be defined in environment variables");
      }
      return process.env.NEXT_PUBLIC_PROD_APP_URL;
    default:
      return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }
}

const baseURL = getBaseURL();

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: { 
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  },
  plugins: [adminClient()],
});
```

### 2. Secure Authentication Hooks

**Custom React hooks for secure auth state management:**

```typescript
// hooks/use-secure-auth.ts
import { useAuth } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useSecureAuth(requireAuth = false) {
  const { user, session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !session) {
      router.push("/login");
    }
  }, [loading, session, requireAuth, router]);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!session,
    isAdmin: user?.role === "ADMIN",
  };
}

export function useAdminAuth() {
  const auth = useSecureAuth(true);
  
  if (auth.user && auth.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  
  return auth;
}
```

### 3. Secure Form Components

**Login form with proper error handling:**

```typescript
// components/forms/secure-login-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function SecureLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      toast.success("Login successful");
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={12}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
```

### 4. Protected Route Components

**Higher-order component for route protection:**

```typescript
// components/auth/protected-route.tsx
"use client";

import { useSecureAuth } from "@/hooks/use-secure-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  fallback 
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, isAdmin } = useSecureAuth(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || <div>Please log in to access this page.</div>;
  }

  if (requireAdmin && !isAdmin) {
    return <div>Admin access required.</div>;
  }

  return <>{children}</>;
}
```

---

## For Security Analysts

### 1. Security Threat Model

**Authentication Attack Vectors Mitigated:**

| Threat | Mitigation | Implementation |
|--------|------------|----------------|
| **Password Brute Force** | Rate limiting + Strong password policy | Better Auth built-in rate limiting (5 attempts/15min) |
| **Session Hijacking** | Secure cookies + HTTPS | httpOnly, secure, sameSite strict cookies |
| **CSRF Attacks** | Origin validation | Better Auth built-in CSRF protection |
| **Password Storage** | Scrypt hashing | Better Auth automatic secure hashing |
| **Session Fixation** | Session regeneration | Better Auth automatic session management |
| **Credential Stuffing** | Account lockout | Better Auth rate limiting per user |
| **Man-in-the-Middle** | TLS enforcement | Secure cookie flags + HSTS headers |
| **XSS via Auth** | HttpOnly cookies | Prevents JavaScript access to auth tokens |

### 2. Security Configuration Requirements

**Required Environment Variables (NO FALLBACKS):**
```bash
# Core Authentication
BETTER_AUTH_SECRET=<cryptographically-secure-32-byte-key>
DATABASE_URL=<mysql-connection-string>

# Application URLs
NEXT_PUBLIC_APP_URL=<application-base-url>
NEXT_PUBLIC_PROD_APP_URL=<production-url>
NEXT_PUBLIC_TEST_APP_URL=<staging-url>

# Email Configuration
RESEND_API_KEY=<resend-api-key>
ADMIN_EMAIL=<admin-email-for-notifications>

# File Upload
UPLOADTHING_SECRET=<uploadthing-secret>
UPLOADTHING_APP_ID=<uploadthing-app-id>
```

### 3. Security Headers Configuration

**Required security headers for production:**

```typescript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.uploadthing.com;"
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=()'
  }
];
```

### 4. Security Monitoring

**Required security monitoring points:**

```typescript
// lib/security-monitoring.ts
export const securityEvents = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success', 
  LOGIN_FAILURE: 'login_failure',
  PASSWORD_CHANGE: 'password_change',
  ADMIN_ACTION: 'admin_action',
  RATE_LIMIT_HIT: 'rate_limit_hit',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
};

export function logSecurityEvent(event: string, userId?: string, metadata?: any) {
  console.warn(`[SECURITY] ${event}`, {
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service (Sentry, LogRocket, etc.)
  }
}
```

---

## For DevOps Engineers

### 1. Environment Configuration

**Development Environment:**
```bash
# .env.local
BETTER_AUTH_SECRET="development-secret-change-in-production"
DATABASE_URL="mysql://user:password@localhost:3306/tsc_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY="your-resend-key"
ADMIN_EMAIL="admin@localhost"
```

**Production Environment:**
```bash
# Vercel Environment Variables
BETTER_AUTH_SECRET=<32-byte-cryptographically-secure-key>
DATABASE_URL=<production-mysql-connection>
NEXT_PUBLIC_PROD_APP_URL="https://ka2.tscmb.si"
RESEND_API_KEY=<production-resend-key>
ADMIN_EMAIL="admin@tscmb.si"
```

### 2. Deployment Security Checklist

- [ ] **Secrets Management**: All secrets stored in environment variables, no hardcoded values
- [ ] **TLS Configuration**: HTTPS enforced in production with HSTS headers
- [ ] **Database Security**: Connection encryption enabled, least privilege access
- [ ] **Rate Limiting**: Implemented at application and infrastructure level
- [ ] **Security Headers**: All recommended headers configured
- [ ] **CORS Configuration**: Strict origin allowlist, no wildcards
- [ ] **Session Security**: Secure cookie configuration for production domain
- [ ] **Error Handling**: No sensitive information exposed in error responses
- [ ] **Monitoring**: Security event logging configured

### 3. Infrastructure Security

**Database Configuration:**
- Enable SSL/TLS encryption
- Configure connection pooling with timeouts
- Implement database firewall rules
- Regular security updates and patches

**Load Balancer/CDN:**
- Configure rate limiting at infrastructure level
- Enable DDoS protection
- Implement WAF rules for authentication endpoints
- SSL termination with strong ciphers

### 4. Backup and Recovery

**Security Considerations:**
- Encrypted database backups
- Secure backup storage with access controls
- Regular security vulnerability assessments
- Incident response plan for security breaches

---

## Implementation Roadmap

### Phase 1: Critical Security Fixes (Immediate)
1. Remove hardcoded secret fallback from `lib/auth.ts`
2. Update environment variables with secure secrets
3. Enable Better Auth security configuration
4. Remove manual bcrypt operations

### Phase 2: API Security Hardening (Week 1)
1. Implement secure API endpoint patterns
2. Replace manual admin operations with Better Auth admin plugin
3. Add comprehensive error handling
4. Enable security event logging

### Phase 3: Client Security Enhancement (Week 2)
1. Implement secure client configuration
2. Add protected route components
3. Enhance form security and validation
4. Add security monitoring on client side

### Phase 4: Production Deployment (Week 3)
1. Configure security headers
2. Implement infrastructure security measures
3. Set up monitoring and alerting
4. Conduct security testing and validation

---

## Security Validation

### Required Security Tests
1. **Authentication Flow Testing**: Login, logout, session management
2. **Authorization Testing**: Role-based access control
3. **Rate Limiting Testing**: Brute force protection
4. **Session Security Testing**: Cookie security, session fixation
5. **CSRF Protection Testing**: Cross-site request forgery attempts
6. **Password Security Testing**: Strong password enforcement
7. **Admin Operations Testing**: Secure user management

### Penetration Testing Checklist
- [ ] SQL injection attempts on auth endpoints
- [ ] XSS attempts via authentication forms
- [ ] CSRF token validation
- [ ] Session hijacking attempts
- [ ] Password brute force attempts
- [ ] Admin privilege escalation attempts
- [ ] Rate limiting bypass attempts

This comprehensive architecture transforms the current insecure authentication system into a production-ready, security-compliant implementation using Better Auth's built-in security features properly.