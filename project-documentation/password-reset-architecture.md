# Admin-Controlled Password Reset System Architecture

## Overview
This document outlines the architecture for replacing the current Better Auth automatic password reset system with an admin-approval flow where users submit requests and administrators manage password changes directly.

## System Requirements

### Current State
- Better Auth with automatic email-based password reset
- Users can independently reset passwords via email tokens
- No administrative oversight or control

### New Requirements
1. Users submit password reset requests (stored in database)
2. Requests require admin review and approval
3. Admins can directly change user passwords
4. Must use same password hashing as Better Auth (bcrypt)
5. Complete audit trail and security controls

## 1. Database Schema Changes

### New Table: PasswordResetRequest

```prisma
model PasswordResetRequest {
  id            String   @id @default(cuid())
  userId        String
  userEmail     String   // Cached for easy reference
  reason        String?  // Optional reason from user
  status        PasswordResetStatus @default(PENDING)
  requestedAt   DateTime @default(now())
  reviewedAt    DateTime?
  reviewedBy    String?  // Admin user ID
  adminNotes    String?  // Admin comments/reasoning
  expiresAt     DateTime // Auto-expire after 7 days
  
  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewedByUser User?   @relation(fields: [reviewedBy], references: [id], name: "AdminReviews")
  
  @@unique([userId, status]) // Prevent multiple pending requests per user
  @@map("password_reset_requests")
}

enum PasswordResetStatus {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
  EXPIRED
}
```

### User Model Updates

```prisma
// Add to existing User model
model User {
  // ... existing fields
  
  // New relations for password reset system
  passwordResetRequests PasswordResetRequest[]
  adminPasswordResets   PasswordResetRequest[] @relation(name: "AdminReviews")
}
```

## 2. API Endpoints

### User Endpoints

#### POST /api/password-reset/request
**Purpose**: Submit password reset request
**Authentication**: Required (user session)
**Rate Limit**: 1 request per user per 24 hours

```typescript
// Request Body Schema
{
  reason?: string; // Optional explanation
}

// Response
{
  success: boolean;
  message: string;
  requestId?: string;
}
```

#### GET /api/password-reset/status
**Purpose**: Check status of user's pending requests
**Authentication**: Required (user session)

```typescript
// Response
{
  requests: Array<{
    id: string;
    status: PasswordResetStatus;
    requestedAt: string;
    reviewedAt?: string;
    adminNotes?: string;
  }>;
}
```

### Admin Endpoints

#### GET /api/admin/password-reset-requests
**Purpose**: List all password reset requests with filtering
**Authentication**: Required (ADMIN role)

```typescript
// Query Parameters
{
  status?: PasswordResetStatus;
  page?: number;
  limit?: number;
  sortBy?: 'requestedAt' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
}

// Response
{
  requests: Array<{
    id: string;
    userId: string;
    userEmail: string;
    user: {
      name: string;
      email: string;
    };
    reason?: string;
    status: PasswordResetStatus;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewedByUser?: {
      name: string;
      email: string;
    };
    adminNotes?: string;
  }>;
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
  };
}
```

#### PUT /api/admin/password-reset-requests/[id]
**Purpose**: Update request status (approve/reject)
**Authentication**: Required (ADMIN role)

```typescript
// Request Body Schema
{
  status: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

// Response
{
  success: boolean;
  message: string;
  request: PasswordResetRequest;
}
```

#### POST /api/admin/password-reset-requests/[id]/reset-password
**Purpose**: Actually reset the user's password
**Authentication**: Required (ADMIN role)
**Prerequisite**: Request must be in APPROVED status

```typescript
// Request Body Schema
{
  newPassword: string; // Must meet password requirements
  adminNotes?: string;
}

// Response
{
  success: boolean;
  message: string;
}
```

## 3. Component Architecture

### Admin Components

```
components/admin/password-reset/
├── password-reset-requests-page.tsx     # Main page component
├── password-reset-requests-table.tsx    # Data table with actions
├── request-details-modal.tsx            # View full request details
├── reset-password-modal.tsx             # Admin password reset form
├── request-status-badge.tsx             # Visual status indicators
├── request-actions-dropdown.tsx         # Per-request actions menu
└── request-filters.tsx                  # Filtering controls
```

#### PasswordResetRequestsPage Component
```typescript
interface PasswordResetRequestsPageProps {
  initialData?: PasswordResetRequest[];
}

// Features:
// - Data fetching and pagination
// - Filter controls (status, date range)
// - Bulk actions (if needed)
// - Auto-refresh capabilities
```

#### PasswordResetRequestsTable Component
```typescript
interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  render: (request: PasswordResetRequest) => ReactNode;
}

// Features:
// - Sortable columns (user, date, status)
// - Status filtering
// - Inline actions (approve, reject, view details)
// - Responsive design
```

#### ResetPasswordModal Component
```typescript
interface ResetPasswordModalProps {
  request: PasswordResetRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
}

// Features:
// - Password strength validation
// - Confirm password field
// - Admin notes field
// - Secure password generation option
```

### User-Facing Components

```
components/forms/
├── password-reset-request-form.tsx      # Request submission form
└── password-reset-status.tsx            # Status checking component
```

#### PasswordResetRequestForm Component
```typescript
interface PasswordResetRequestFormProps {
  onSuccess?: (requestId: string) => void;
  onError?: (error: string) => void;
}

// Features:
// - Rate limit handling
// - Optional reason field
// - Form validation
// - Success/error states
```

## 4. Security Considerations

### Password Hashing
- **Method**: bcrypt with same salt rounds as Better Auth (typically 12)
- **Implementation**: Use same hashing utility as Better Auth to ensure compatibility
- **Validation**: Hash comparison for admin authentication

```typescript
// Password hashing utility (compatible with Better Auth)
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Match Better Auth configuration
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Rate Limiting
```typescript
// Rate limiting configuration
const RATE_LIMITS = {
  passwordResetRequest: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1, // 1 request per user per 24 hours
  },
  adminActions: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 actions per minute
  }
};
```

### Authentication & Authorization
- **User Endpoints**: Require valid session, verify user identity
- **Admin Endpoints**: Require ADMIN role, validate session
- **Request Validation**: Ensure users can only request resets for their accounts
- **Admin Actions**: Log all admin actions with timestamps and user IDs

### Input Validation Schemas
```typescript
import { z } from 'zod';

export const passwordResetRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNotes: z.string().max(1000).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  adminNotes: z.string().max(1000).optional(),
});
```

### Audit Trail
```typescript
// Admin action logging
interface AdminActionLog {
  adminId: string;
  action: 'APPROVE_REQUEST' | 'REJECT_REQUEST' | 'RESET_PASSWORD';
  targetUserId: string;
  requestId: string;
  timestamp: Date;
  details?: string;
}
```

## 5. Implementation Steps

### Phase 1: Database & API Foundation
1. **Create Prisma Migration**
   - Add PasswordResetRequest model
   - Add enum for status values
   - Update User model relations

2. **Implement Core APIs**
   - User request submission endpoint
   - Admin management endpoints
   - Password hashing utilities

3. **Security Implementation**
   - Rate limiting middleware
   - Authentication checks
   - Input validation schemas

### Phase 2: Admin Interface
1. **Admin Page Structure**
   - Create new admin route: `/app/admin/password-reset-requests/page.tsx`
   - Add navigation item to admin sidebar
   - Implement data table component

2. **Admin Components**
   - Build all admin-specific components
   - Implement modals for actions
   - Add filtering and sorting capabilities

3. **Integration**
   - Connect components to API endpoints
   - Add toast notifications
   - Implement real-time updates

### Phase 3: User Interface
1. **Request Form**
   - Create user-facing request form
   - Add to appropriate user pages
   - Implement status checking

2. **Navigation Updates**
   - Replace existing password reset links
   - Update forgot password flow
   - Add status checking page

### Phase 4: Integration & Testing
1. **Better Auth Integration**
   - Disable automatic email reset (if desired)
   - Maintain compatibility with existing password hashing
   - Test user authentication flow

2. **Security Testing**
   - Test rate limiting
   - Verify admin authorization
   - Audit trail validation

3. **Performance Optimization**
   - Database query optimization
   - Component performance testing
   - API response time monitoring

## 6. Database Migration Script

```sql
-- Create enum for password reset status
CREATE TYPE password_reset_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'EXPIRED');

-- Create password reset requests table
CREATE TABLE password_reset_requests (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  user_email VARCHAR(191) NOT NULL,
  reason TEXT,
  status password_reset_status DEFAULT 'PENDING',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(191),
  admin_notes TEXT,
  expires_at TIMESTAMP NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  UNIQUE KEY unique_user_pending (user_id, status)
);

-- Create index for efficient querying
CREATE INDEX idx_password_reset_status ON password_reset_requests(status, requested_at);
CREATE INDEX idx_password_reset_expires ON password_reset_requests(expires_at);
```

## 7. Configuration Updates

### Environment Variables
```env
# Add to .env
PASSWORD_RESET_REQUEST_EXPIRY_DAYS=7
MAX_PASSWORD_RESET_REQUESTS_PER_DAY=1
ADMIN_PASSWORD_RESET_RATE_LIMIT=30
```

### Admin Navigation Update
```typescript
// Add to admin sidebar navigation
{
  title: "Password Resets",
  href: "/admin/password-reset-requests",
  icon: KeyIcon,
  description: "Manage user password reset requests"
}
```

This architecture provides a secure, auditable, and user-friendly password reset system that gives administrators full control while maintaining security best practices and integration with the existing Better Auth system.