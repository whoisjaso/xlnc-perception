# Code Conventions

## Naming Patterns

| Type | Convention | Example |
|------|------------|---------|
| Services | `*Service` class | `ClaudeService`, `QueueProcessorService` |
| Routes | Plural kebab-case | `/api/calls`, `/api/agents` |
| DB Tables | Plural snake_case | `call_logs`, `voice_agents` |
| Types | PascalCase | `CallLog`, `NewCallLog`, `AuthRequest` |
| Enums | UPPERCASE | `ViewState`, `PublicPage` |
| Functions | camelCase verbs | `authenticateToken`, `getCallsFromDatabase` |
| Service files | `*.service.ts` | `claude.service.ts` |
| Type files | `*.types.ts` | `retell.types.ts` |

## TypeScript Configuration

**Backend (strict mode):**
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`

**Frontend:**
- Less strict configuration
- Uses Vite's TypeScript support

## Validation Pattern

All user input validated with Zod schemas at entry points:

```typescript
const MySchema = z.object({
  field: z.string().min(1),
  optional: z.number().optional()
});

// In route handler
const data = MySchema.parse(req.body);
```

## Error Handling

Centralized error handler with async wrapper:

```typescript
// Wrap async route handlers
router.get('/endpoint', asyncHandler(async (req, res) => {
  // Errors automatically caught and forwarded
}));
```

## Response Format

Theatrical wrapper adding metadata:

```typescript
{
  success: true,
  data: { ... },
  perception: {
    processing_nodes_activated: 7,
    consciousness_level: "SOVEREIGN",
    resonance_frequency: "432Hz"
  }
}
```

## Logging Style

Winston logger with theatrical helpers:

```typescript
logger.info('Operation successful');  // Standard
theatricalLog('Entity created');       // With flair
```

## Authentication

- JWT tokens: 15m access, 7d refresh
- Tokens stored in HTTP-only cookies
- `AuthRequest` interface extends Express Request

## Database Access

- Drizzle ORM with full type safety
- Foreign keys with cascade delete
- Migrations via drizzle-kit

## File Organization

- One service per file
- Routes grouped by resource
- Types in dedicated `/types` directory
- Shared utils in `/utils`
