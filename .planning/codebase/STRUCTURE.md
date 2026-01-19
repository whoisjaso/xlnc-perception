# Directory Structure

## Backend (`/backend/src`)

```
backend/src/
├── config/
│   ├── env.ts                    # Zod environment validation
│   ├── database.ts               # Drizzle ORM initialization
│   ├── security.ts               # Helmet, CORS, Rate-limiting
│   └── clients/                  # OAuth callback handlers
├── db/
│   ├── schema/
│   │   ├── users.ts              # User accounts
│   │   ├── calls.ts              # Call logs from Retell
│   │   ├── agents.ts             # Voice agents deployed
│   │   ├── conversations.ts      # Conversation transcripts
│   │   ├── customers.ts          # Customer records
│   │   ├── messageQueue.ts       # SMS/Email queue
│   │   ├── alerts.ts             # Alert configurations
│   │   ├── webhookEvents.ts      # Retell webhook audit
│   │   ├── errorLogs.ts          # Error tracking
│   │   ├── systemLogs.ts         # System audit trail
│   │   └── workflows.ts          # n8n automation
│   └── migrations/               # Drizzle migrations
├── middleware/
│   ├── auth.middleware.ts        # JWT validation
│   ├── admin.middleware.ts       # Admin-only routes
│   └── errorHandler.ts           # Global error handler
├── routes/
│   ├── auth.ts                   # Register/Login/Logout
│   ├── calls.ts                  # Call retrieval
│   ├── agents.ts                 # Voice agent CRUD
│   ├── users.ts                  # User profile
│   ├── admin.ts                  # Admin dashboard
│   ├── webhooks.ts               # Retell webhook receiver
│   └── divine.ts                 # Divine system endpoints
├── services/
│   ├── divine/                   # 20 service files
│   │   ├── index.ts
│   │   ├── claude.service.ts
│   │   ├── prism.service.ts
│   │   ├── intent-classifier.service.ts
│   │   ├── followup-writer.service.ts
│   │   ├── webhook-handler.service.ts
│   │   ├── function-dispatcher.service.ts
│   │   ├── context-builder.service.ts
│   │   ├── queue-processor.service.ts
│   │   ├── error-monitor.service.ts
│   │   ├── customer.service.ts
│   │   ├── conversation.service.ts
│   │   ├── post-call-processor.ts
│   │   ├── sms.service.ts
│   │   ├── email.service.ts
│   │   ├── slack.service.ts
│   │   ├── zoho-crm.service.ts
│   │   ├── zoho-calendar.service.ts
│   │   ├── message-queue.service.ts
│   │   └── client-config.service.ts
│   ├── ai/
│   ├── messaging/
│   ├── memory/
│   └── retell.service.ts
├── types/
│   ├── retell.types.ts
│   ├── divine.types.ts
│   └── index.ts
├── utils/
│   ├── logger.ts
│   └── theatrical.ts
├── index.ts                      # Main server entry
└── migrate.ts                    # Migration runner
```

## Frontend (Root)

```
/
├── App.tsx                       # Main app router
├── index.tsx                     # React entry point
├── types.ts                      # Shared type definitions
├── src/
│   ├── stores/
│   │   ├── useAuthStore.ts
│   │   └── useCallStore.ts
│   └── services/
│       ├── api.ts
│       ├── divine.ts
│       ├── admin.ts
│       └── retell.ts
├── services/
│   ├── gemini.ts
│   └── retell.ts
├── views/
│   ├── DashboardLayout.tsx
│   ├── CommandCenter.tsx
│   ├── CallIntelligence.tsx
│   ├── RealityForge.tsx
│   ├── RetellSetup.tsx
│   ├── DivineDashboard.tsx
│   ├── admin/AdminPanel.tsx
│   └── public/
│       ├── Landing.tsx
│       ├── Solutions.tsx
│       ├── Services.tsx
│       ├── Pricing.tsx
│       ├── CaseStudies.tsx
│       ├── About.tsx
│       ├── Terms.tsx
│       ├── Privacy.tsx
│       └── Status.tsx
├── components/
│   ├── DashboardLayout/
│   ├── ErrorBoundary.tsx
│   ├── OnboardingWizard.tsx
│   ├── PublicNavbar.tsx
│   ├── PublicChat.tsx
│   ├── SovereignChat.tsx
│   ├── Sidebar.tsx
│   ├── OperationalLoader.tsx
│   ├── TerminalLog.tsx
│   ├── divine/
│   └── DiscoveryAgent.tsx
└── index.css
```

## Database Schema (11 tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (plan: INITIATE/SOVEREIGN/EMPIRE) |
| `call_logs` | Voice call records |
| `voice_agents` | Deployed agents |
| `conversations` | Conversation metadata |
| `customers` | Customer records |
| `message_queue` | Outbound messages |
| `alerts` | Alert configs |
| `webhookEvents` | Retell webhook log |
| `errorLogs` | Error tracking |
| `systemLogs` | Audit trail |
| `workflows` | n8n automation |
