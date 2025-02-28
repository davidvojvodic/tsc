# Commands

## Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run postinstall` - Generate Prisma client

## Code Style Guidelines

### Imports
- Use absolute imports with `@/` prefix (e.g., `import { Button } from "@/components/ui/button"`)
- Group imports: React/Next.js, external libraries, internal components/utils

### Formatting
- TypeScript with strict mode enabled
- React functional components with explicit type definitions
- Use destructuring for props
- Use named exports for components

### Naming Conventions
- PascalCase for components and interfaces
- camelCase for variables, functions, and instances
- Components in dedicated files matching their name

### Components 
- Use UI components from `/components/ui`
- Extend with class-variance-authority when needed
- Leverage React.forwardRef for component references
- Use Radix UI primitives with TailwindCSS for styling

### Error Handling
- Use try/catch for async operations
- Provide meaningful error messages
- Use toast notifications for user feedback