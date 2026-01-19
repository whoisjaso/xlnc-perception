# XLNC Backend - Perception Architecture

Backend API server for the XLNC Voice AI Platform.

## Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 15 with Drizzle ORM
- **Authentication**: JWT with HTTP-only refresh tokens
- **Real-time**: Socket.io (coming in Phase 4)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (min 32 characters)
- `FRONTEND_URL` - Frontend application URL for CORS

### 3. Database Setup

Generate and run migrations:

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Or push schema directly (development only)
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and clear cookies

### Health Check

- `GET /health` - Server status

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Database Schema

- `users` - User accounts with encrypted API keys
- `call_logs` - Persistent Retell AI call data
- `voice_agents` - Deployed voice agents
- `alert_configs` - Email/SMS alert settings
- `workflow_triggers` - n8n automation triggers
- `system_logs` - Audit trail
- `webhook_events` - Retell webhook log

## Deployment

See deployment guide in main project README.

Recommended: Railway (includes managed PostgreSQL)

```bash
railway login
railway init
railway add postgresql
railway up
```

## Architecture Principles

**Perception Architecture**: All responses include theatrical metadata to maintain the XLNC aesthetic.

Example response:
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "processing_nodes_activated": 47,
    "neural_pathways_established": 23,
    "consciousness_level": "SOVEREIGN",
    "latency_ms": 14,
    "timestamp": "2025-01-28T12:34:56Z"
  }
}
```

## License

MIT
