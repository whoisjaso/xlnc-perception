# Technical Concerns

## Technical Debt

### 1. Mixed Monolithic/Microservice Pattern
- Frontend and backend in single repo with different package managers
- Frontend entry points scattered (services/, components/ at root level)
- Could benefit from clear module boundaries

### 2. Service Layer Complexity
- 20 Divine services managing interconnected responsibilities
- Limited service isolation (strong coupling between processors)
- No clear dependency injection pattern

### 3. Database Schema Maturity
- 11 tables across different migration states
- Some schema relationships underspecified (customers vs. users)
- Webhook event audit logging could be more comprehensive

### 4. Error Recovery
- Message queue has retry logic (3 attempts) but no dead-letter queue
- No circuit breaker pattern for external service failures
- Zoho OAuth token refresh not automated (manual env update required)

## Security Considerations

### 1. Secrets Management
- API keys stored in `.env` files (risky for production)
- Retell API key encrypted in database but decryption key not specified
- **Recommendation:** Use AWS Secrets Manager, HashiCorp Vault, or similar

### 2. Authentication
- JWT tokens require secure `JWT_SECRET` (min 32 chars)
- Rate limiting: 5 auth attempts/15min, 100 API requests/min
- HTTP-only cookies prevent XSS token theft

### 3. CORS & CSP
- Development allows multiple origins (localhost ports)
- Production restricted to single `FRONTEND_URL`
- CSP allows unsafe-inline for styles (could be tightened)

### 4. Data Privacy
- Call transcripts stored in database (consider encryption at rest)
- Customer sentiment scores could be PII-sensitive
- No data retention policies documented

## Performance Issues

### 1. Queue Processing
- Poll-based processing every 5 seconds (not push-based)
- Batch size 50 could be high under load
- No backpressure handling if providers slow down

### 2. Real-time Updates
- Socket.IO broadcasts to all admin connections
- Queue stats emitted on every message processed (chatty)

### 3. Database Queries
- Call filtering loads all calls then filters in-memory
- Could use database-level pagination/filtering
- No query optimization hints or indexes specified

### 4. Frontend State
- Zustand store persists to localStorage (can bloat)
- No pagination in call lists (could load thousands of records)

## Operational Concerns

### 1. Monitoring
- Error monitor tracks last 24 hours only
- No health check for external services
- Slack alerts only on errors; no success metrics

### 2. Deployment
- No environment-specific configuration files
- Database migrations manual (`npm run db:migrate`)
- No deployment documentation

### 3. Logging
- Theatrical logs are fun but mask real issues (hard to search)
- No log rotation specified
- No structured logging for machine parsing

## Recommended Improvements

1. Migrate to mono-repo structure (Nx, Turborepo) or separate repos
2. Implement event-driven queue processing (replace polling)
3. Add database indexes and query optimization
4. Implement circuit breakers for external services
5. Create comprehensive API specification (OpenAPI 3.0)
6. Add e2e tests for critical user flows
7. Set up structured logging pipeline (ELK, DataDog)
8. Document secrets management strategy for production
9. Implement database encryption at rest for sensitive data
10. Add feature flags and gradual rollout capability
