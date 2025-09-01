# TŠC Technical Specification Center - Codebase Documentation

## Project Overview
**Name**: TŠC (Technical Specification Center)  
**Type**: Next.js 15 Full-Stack Application with React 19  
**Architecture**: Monolithic Next.js application with App Router  
**Language**: TypeScript (strict mode)  
**Styling**: TailwindCSS + shadcn/ui components  
**Database**: MySQL with Prisma ORM  
**Authentication**: Better Auth  
**Deployment**: Vercel (standalone mode)  

## Tech Stack

### Frontend
- **Framework**: Next.js 15.0.0 with App Router
- **React**: Version 19.0.0
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: TailwindCSS with CSS variables
- **State Management**: React Context + Zustand
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: TipTap editor
- **File Uploads**: UploadThing

### Backend
- **API Routes**: Next.js API routes with edge runtime support
- **Database**: MySQL with Prisma ORM (Neon adapter for serverless)
- **Authentication**: Better Auth with email/password
- **Email**: Resend for transactional emails
- **Media Storage**: UploadThing + external CDN support

### Development Tools
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Next.js config
- **Package Manager**: npm with legacy peer deps support
- **Build Tool**: Next.js bundler with standalone output

## Project Structure

```
tsc/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages (login, register, reset)
│   ├── (localized)/       # Multilingual public pages (en/sl/hr)
│   ├── (public)/          # Non-localized public pages
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── forms/            # Form components
│   ├── homepage/         # Homepage sections
│   ├── admin/            # Admin-specific components
│   └── providers/        # Context providers
├── lib/                   # Utility functions and configurations
│   ├── auth.ts           # Authentication setup
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
├── store/                 # Global state management
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## Key Features

### 1. Multilingual Support
- **Languages**: English (en), Slovenian (sl), Croatian (hr)
- **Implementation**: URL-based routing with middleware
- **Storage**: Cookies (NEXT_LOCALE) + localStorage
- **Fallback**: English as default language

### 2. Authentication System
- **Provider**: Better Auth with Prisma adapter
- **Methods**: Email/password with verification
- **Features**: Password reset, role-based access (USER/ADMIN)
- **Session**: JWT-based with refresh tokens

### 3. Content Management
- **Projects**: Full CRUD with timeline, gallery, and team management
- **Materials**: Educational resources with download tracking
- **Quizzes**: Interactive quizzes with submission tracking
- **Teachers**: Profile management with photo uploads
- **Testimonials**: User testimonials with moderation

### 4. Media Handling
- **Uploads**: UploadThing integration
- **Image Optimization**: Next.js Image component
- **External CDN**: Support for Cloudinary and custom CDNs
- **Live Streaming**: WebSocket-based camera streaming

### 5. Industrial Controller Integration
- **Siemens Logo Controller**: Real-time data visualization
- **Camera Streams**: Multiple streaming protocols (WebSocket, HTTP)
- **Proxy Routes**: Secure controller communication

## Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run postinstall` - Generate Prisma client

### Database
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run migrations in development
- `npx prisma migrate deploy` - Deploy migrations to production
- `npx prisma studio` - Open Prisma Studio GUI

## Code Style Guidelines

### Imports
- Use absolute imports with `@/` prefix (e.g., `import { Button } from "@/components/ui/button"`)
- Group imports: React/Next.js, external libraries, internal components/utils
- Order: React → Third-party → Local components → Utils → Types

### Component Patterns
- **Structure**: Functional components only (no class components)
- **TypeScript**: Explicit type definitions for all props
- **Naming**: PascalCase for components, camelCase for functions
- **Files**: One component per file, matching component name
- **Exports**: Named exports for components

### UI Components
- Use shadcn/ui components from `/components/ui`
- Extend with class-variance-authority (cva) for variants
- Apply styles with `cn()` utility for className merging
- Use Radix UI primitives with TailwindCSS styling

### State Management
- **Local State**: useState for component-specific state
- **Global State**: React Context for app-wide state
- **Server State**: Server Components with data fetching
- **Form State**: React Hook Form with Zod validation

### API Routes Pattern
```typescript
// Standard API route structure
export async function GET(req: Request) {
  // Authentication check
  const session = await auth.api.getSession({ headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Business logic with try/catch
  try {
    const data = await prisma.model.findMany();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

### Database Queries
- Use Prisma for all database operations
- Include proper relations with `include` or `select`
- Handle errors with try/catch blocks
- Use transactions for multiple operations

### Error Handling
- Use try/catch for async operations
- Return structured error responses from API
- Display user-friendly error messages with toast
- Log errors to console in development

### Performance Optimizations
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize images with Next.js Image component
- Code split with dynamic imports

## Environment Variables

Required environment variables:
- `DATABASE_URL` - MySQL connection string
- `NEXT_PUBLIC_APP_URL` - Application URL
- `RESEND_API_KEY` - Email service API key
- `UPLOADTHING_TOKEN` - File upload service token
- `BETTER_AUTH_SECRET` - Authentication secret

## Security Considerations
- CSRF protection with SameSite cookies
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- XSS prevention with proper escaping
- Rate limiting on API routes

## Deployment
- **Platform**: Vercel
- **Build**: Standalone Next.js output
- **Database**: MySQL (Neon/PlanetScale recommended)
- **Environment**: Node.js 20+
- **Configuration**: vercel.json with function timeouts

## Important Instruction Reminders
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files
- Only create documentation files if explicitly requested by the User

## Testing Commands
- Run tests: `npm test` (if configured)
- Type checking: `npx tsc --noEmit`
- Lint check: `npm run lint`

## Common Workflows

### Adding a New Page
1. Create page component in appropriate route folder
2. For localized pages, add to all language folders (en/sl/hr)
3. Update navigation components if needed
4. Add translations to language-specific fields in database

### Creating API Endpoints
1. Add route handler in `app/api/[resource]/route.ts`
2. Implement standard CRUD operations (GET, POST, PUT, DELETE)
3. Add authentication checks using Better Auth
4. Use Prisma for database operations
5. Return proper HTTP status codes

### Managing Translations
1. Database fields follow pattern: `field`, `field_sl`, `field_hr`
2. Use `getLocalizedContent()` utility for fetching translations
3. Fallback to English if translation missing
4. Update all language variants when editing content

### File Upload Process
1. Use UploadThing components for UI
2. Configure upload endpoints in `app/api/uploadthing/core.ts`
3. Store file URLs in Media table via Prisma
4. Reference Media records in related tables

## Database Schema Key Models

### User
- Authentication and authorization
- Roles: USER, ADMIN
- Relations: Sessions, Accounts, QuizSubmissions

### Project
- Main content type with multilingual support
- Relations: Teachers, Media (gallery), ProjectPhases (timeline)
- Features: slug-based routing, publishing status

### Material
- Educational resources with file attachments
- Categories and tags for organization
- Download tracking capability

### Quiz
- Questions with multiple choice answers
- Submission tracking per user
- Score calculation and feedback

### Teacher
- Profile management with photos
- School associations
- Display ordering for carousels

### Media
- Centralized file storage references
- Support for images and documents
- Used across multiple content types