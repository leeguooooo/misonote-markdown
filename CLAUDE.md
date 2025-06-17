# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Misonote Markdown is a modern, enterprise-ready Markdown documentation management system built with Next.js 15, TypeScript, and PostgreSQL. It features real-time collaborative editing, comprehensive search, and enterprise licensing capabilities.

**Important**: This project uses **pnpm** as the package manager, not npm. Always use pnpm commands.

## Repository Structure

This repository contains private submodules for commercial features:
- `misonote-mcp-client`: MCP (Model Context Protocol) client implementation
- `enterprise`: Enterprise features for paid users
- `misonote-license-server`: License validation server

These submodules contain proprietary commercial code and are not publicly accessible. When cloning, use:
```bash
git clone --recursive [repository-url]
# Or if already cloned:
git submodule update --init --recursive
```

## Key Commands

### Package Management
```bash
pnpm install         # Install dependencies
pnpm add [package]   # Add new dependency
pnpm remove [package] # Remove dependency
pnpm update          # Update dependencies
```

### Development
```bash
pnpm dev              # Start dev server with Turbopack on port 3001
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript type checking (tsc --noEmit)
```

### Database Operations
```bash
pnpm db:init          # Initialize PostgreSQL database
pnpm db:migrate       # Run database migrations
pnpm db:status        # Check database connection and status
```

### Testing
```bash
pnpm test            # Run tests in watch mode with Vitest
pnpm test:run        # Run tests once
pnpm test:coverage   # Generate coverage report
```

### Deployment
```bash
pnpm docker:build    # Build Docker image
pnpm docker:run      # Run Docker container
pnpm pm2:start       # Start with PM2 process manager
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API routes, PostgreSQL database
- **Real-time**: Yjs with y-websocket for collaborative editing
- **Authentication**: JWT-based with bcrypt password hashing
- **Search**: Fuse.js for full-text search
- **Markdown**: react-markdown with remark-gfm, Mermaid diagrams

### Core Architecture Patterns

1. **Hybrid Storage Model**: Documents can be stored in both filesystem (`/docs` directory) and PostgreSQL database. The system uses a unified interface through storage adapters.

2. **Service Layer Pattern**: Business logic is organized in `/src/core/services/` with clear separation of concerns:
   - `AuthService`: Authentication and user management
   - `DocumentService`: Document CRUD operations
   - `LicenseService`: Enterprise licensing logic
   - `McpService`: Model Context Protocol integration

3. **Database Access**: Uses raw SQL with parameterized queries through `/lib/db/` modules. No ORM, which provides flexibility and performance.

4. **API Route Structure**: RESTful API routes in `/src/app/api/` follow Next.js conventions with route handlers for each endpoint.

5. **Component Organization**: 
   - Base UI components in `/src/components/ui/`
   - Feature-specific components in respective directories
   - Admin interface components isolated in `/src/components/admin/`

### Mobile Optimization

The current feature/mobile-optimization branch includes:
- `MobileBottomNav`: Bottom navigation for mobile devices
- `MobileOptimizedContent`: Content wrapper with mobile-specific optimizations
- `useSwipeGesture` and `useMobileOptimization` hooks for mobile interactions
- Extensive mobile-specific CSS in globals.css (lines 557-934)

### Authentication Flow

1. Login via `/api/auth/login` returns JWT token
2. Token stored in cookies with httpOnly flag
3. Middleware validates tokens on protected routes
4. Admin routes require specific admin role

### Document Management

- Documents stored as `.md` files in filesystem or database
- Hierarchical tree structure with unlimited nesting
- Real-time collaborative editing using Yjs
- Automatic syntax highlighting and Mermaid diagram rendering

### Enterprise Features

- Hardware fingerprinting for license enforcement
- Multi-workspace support (prepared but not fully implemented)
- API key management for external integrations
- Performance monitoring and analytics

## Important Considerations

1. **Database Migration**: Recently migrated from SQLite to PostgreSQL. Ensure proper database initialization before running.

2. **Environment Variables**: 
   - `ADMIN_PASSWORD_HASH_BASE64`: Must be set for admin access
   - `JWT_SECRET`: Required for authentication
   - Database connection variables (DB_HOST, DB_PORT, etc.)

3. **Mobile PR #10**: The open PR for mobile optimization may have conflicts and needs review before merging.

4. **Build Process**: Uses Next.js with Turbopack for development. Production builds should use `pnpm build`.

5. **Testing Strategy**: Tests use Vitest with jsdom. Component tests should use Testing Library patterns.

6. **Security**: 
   - Passwords are bcrypt hashed
   - JWT tokens for session management
   - API routes validate authentication
   - Rate limiting on sensitive endpoints

7. **MCP Integration**: Built-in support for pushing documents to AI assistants via Model Context Protocol.

## Development Workflow

1. Clone repository with submodules: `git clone --recursive [repo-url]`
2. Always run `pnpm install` after pulling changes
3. Update submodules: `git submodule update --init --recursive`
4. Initialize database with `pnpm db:init` on first setup
5. Start development server with `pnpm dev`
6. Run tests before committing: `pnpm test:run`
7. Check types with `pnpm typecheck`
8. For production deployment, use Docker or PM2

## Submodule Integration

The project integrates with private submodules for commercial features:

1. **misonote-mcp-client**: Provides MCP client functionality for AI assistant integration
   - Imported in `/src/core/mcp/` modules
   - Handles document pushing to AI contexts

2. **enterprise**: Contains enterprise-only features
   - License validation
   - Advanced user management
   - Premium features for paid users

3. **misonote-license-server**: External license validation server
   - Used for license key verification
   - Hardware fingerprinting validation

These modules are conditionally loaded based on user license status and are not included in the community version.

## Common Tasks

### Adding a New API Endpoint
Create route handler in `/src/app/api/[endpoint]/route.ts` following existing patterns.

### Creating Database Migrations
Add SQL files to `/scripts/migrations/` with sequential numbering.

### Adding New Components
Place in appropriate directory under `/src/components/` and follow existing component patterns with TypeScript interfaces.

### Modifying Document Storage
Update both filesystem and database adapters in `/lib/storage/` to maintain consistency.

### Working with Mobile Features
The mobile optimization branch includes comprehensive mobile enhancements that need to be integrated with main branch developments.