# Architecture

## Overall Pattern

**Modular Microservices-oriented Backend with Monolithic Frontend**

The system is branded as "Divine Agentic Intelligence System" - an AI-powered voice automation platform.

## Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Express.js HTTP Server + Socket.IO              │
├─────────────────────────────────────────────────────────┤
│                   ROUTES LAYER                          │
│ ┌──────────────┬─────────────┬──────────┬───────────┐  │
│ │ /auth        │ /calls      │ /agents  │ /divine   │  │
│ │ /users       │ /admin      │ /webhook │           │  │
│ └──────────────┴─────────────┴──────────┴───────────┘  │
├─────────────────────────────────────────────────────────┤
│                MIDDLEWARE LAYER                         │
│ ┌────────────────┬─────────────────┬─────────────────┐ │
│ │ Auth (JWT)     │ Admin           │ Error Handler   │ │
│ │ Rate Limiting  │ CORS            │ Async Wrapper   │ │
│ │ Security       │ Helmet CSP      │                 │ │
│ └────────────────┴─────────────────┴─────────────────┘ │
├─────────────────────────────────────────────────────────┤
│               SERVICES LAYER (Divine)                   │
│ ┌─────────────────────────────────────────────────────┐│
│ │ AI Services          │ Communication Services      ││
│ │ - Claude AI          │ - SMS (Twilio, Text180)     ││
│ │ - Intent Classifier  │ - Email (SendGrid, Zoho)    ││
│ │ - PRISM Analysis     │ - Message Queue             ││
│ ├──────────────────────┼─────────────────────────────┤│
│ │ CRM/Calendar         │ Monitoring & Data           ││
│ │ - Zoho CRM           │ - Slack Alerts              ││
│ │ - Zoho Calendar      │ - Error Monitor             ││
│ │ - Customer Service   │ - Conversation Service      ││
│ ├──────────────────────┼─────────────────────────────┤│
│ │ Core Processors      │ Configuration               ││
│ │ - Webhook Handler    │ - Client Config Service     ││
│ │ - Function Dispatcher│ - Context Builder           ││
│ │ - Queue Processor    │                             ││
│ │ - Post-Call Process  │                             ││
│ └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│               DATA ACCESS LAYER                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Drizzle ORM + PostgreSQL Schema                  │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

```
┌────────────────────────────────────────────┐
│         React App (Vite)                   │
├────────────────────────────────────────────┤
│           Router (App.tsx)                 │
│ ├─ Public Pages (Landing, Pricing, etc)   │
│ ├─ Auth Flow (SignUp)                     │
│ └─ Dashboard (if authenticated)           │
├────────────────────────────────────────────┤
│         Dashboard Layout                   │
│ ├─ Sidebar Navigation                     │
│ ├─ Dynamic Views                          │
│ │  - CommandCenter (Overview)             │
│ │  - CallIntelligence (Analytics)         │
│ │  - RealityForge (Agent Builder)         │
│ │  - RetellSetup (Config)                 │
│ │  - DivineDashboard (System Status)      │
│ │  - AdminPanel (Management)              │
│ └─ ErrorBoundary & Onboarding             │
├────────────────────────────────────────────┤
│         State Management                   │
│ - useAuthStore (Zustand + persist)        │
│ - useCallStore (call data)                │
├────────────────────────────────────────────┤
│         API Service Layer                  │
│ - API interceptors (auth, retry logic)    │
│ - Call APIs, Auth APIs, Admin APIs        │
└────────────────────────────────────────────┘
```

## Data Flow

1. **Inbound Voice Call** -> Retell AI Agent -> Webhook Endpoint
2. **Webhook Handler** -> Validates payload, loads client config
3. **Service Orchestration** ->
   - Customer identification/creation
   - Context builder enriches with customer history
   - Intent classifier determines call purpose
   - Post-call processor triggers AI analysis
4. **Message Queue** -> SMS/Email follow-ups scheduled
5. **Real-time Updates** -> Socket.IO broadcasts to admin dashboard
6. **CRM Sync** -> Conversation data persisted, Zoho CRM updated

## Key Design Decisions

- **Service Layer Pattern**: Business logic separated from routes
- **Middleware Stack**: Security -> Routes -> Handlers
- **Real-time Updates**: Socket.IO for admin dashboard
- **Queue Processing**: BullMQ/Redis for async message handling
- **Client Configuration**: Per-client configuration stored in service
- **Post-Call Orchestration**: Webhook -> Analysis -> Follow-up -> CRM Sync
