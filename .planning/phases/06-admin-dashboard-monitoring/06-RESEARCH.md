# Phase 6: Admin Dashboard & Monitoring - Research

**Researched:** 2026-01-27
**Domain:** Admin Dashboard, Real-time Monitoring, Error Tracking
**Confidence:** HIGH

## Summary

Research reveals that Phase 6 requires primarily **integration and enhancement** work rather than new infrastructure. The codebase already has significant dashboard infrastructure built in Phase 4:

1. **MessageQueueViewer** - Full WebSocket real-time updates, status tabs, alert banners, compose/edit functionality
2. **ErrorMonitorPanel** - Error listing with resolution, severity filtering, stats display
3. **DivineStatusWidget** - Service health monitoring, queue stats
4. **useSocketMessages** / **useErrorSocket** hooks - Real-time WebSocket connectivity
5. **errorMonitorService** - Backend error logging with Slack alerts, buffer/flush, severity classification

The main gaps are:
- **Real-time call status** - No WebSocket events for calls, only conversations table updates
- **Per-client filtering** - Partial support exists, needs UI implementation
- **Error log browser enhancements** - Missing filtering by time/service/type in UI
- **Dashboard Overview refinements** - Error summary shows hardcoded zeros, recent calls placeholder

**Primary recommendation:** Focus on wiring existing components together and adding missing real-time call events, rather than building new infrastructure.

## Existing Infrastructure

### Backend Services (HIGH confidence)

| Service | Location | Status | Capabilities |
|---------|----------|--------|--------------|
| errorMonitorService | `backend/src/services/divine/error-monitor.service.ts` | COMPLETE | Logging, buffering, Slack alerts, stats, resolution, per-client queries |
| queueProcessorService | `backend/src/services/divine/queue-processor.service.ts` | COMPLETE | Processing, retries, dead letter, WebSocket emissions |
| alertingService | `backend/src/services/divine/alerting.service.ts` | COMPLETE | Multi-channel (Slack/Email/SMS), throttling, severity routing |
| slackService | `backend/src/services/divine/slack.service.ts` | COMPLETE | Webhook integration, formatted messages, severity colors |
| conversationService | `backend/src/services/divine/conversation.service.ts` | COMPLETE | Call tracking, stats, per-client queries |

### Frontend Components (HIGH confidence)

| Component | Location | Status | Capabilities |
|-----------|----------|--------|--------------|
| DivineDashboard | `views/DivineDashboard.tsx` | EXISTS | Tabbed UI, quick stats, overview, sub-component integration |
| MessageQueueViewer | `components/divine/MessageQueueViewer.tsx` | COMPLETE | WebSocket integration, tabs (all/pending/sent/failed/dead_letter/scheduled), compose, edit & retry |
| ErrorMonitorPanel | `components/divine/ErrorMonitorPanel.tsx` | COMPLETE | Error list, expand/collapse, resolve action, stats summary |
| DivineStatusWidget | `components/divine/DivineStatusWidget.tsx` | COMPLETE | Service health, queue stats, overall status |
| ErrorDrawer | `components/ErrorDrawer.tsx` | COMPLETE | Client-facing error view, acknowledge action |
| ErrorNotificationBadge | `components/ErrorNotificationBadge.tsx` | COMPLETE | Badge with count, critical indicator |

### WebSocket Infrastructure (HIGH confidence)

| Item | Status | Details |
|------|--------|---------|
| Socket.IO Server | COMPLETE | `backend/src/index.ts` lines 78-110 |
| Admin Room | COMPLETE | `join:admin` event, `io.to('admin').emit()` |
| Client Rooms | COMPLETE | `join:client`, `io.to('client:${clientId}').emit()` |
| useSocketMessages Hook | COMPLETE | Queue events: `queue:stats`, `queue:message:processing/sent/failed/retry` |
| useErrorSocket Hook | COMPLETE | Error events: `error:logged`, `error:critical`, `error:acknowledged`, `error:resolved` |
| Error Store (Zustand) | COMPLETE | `src/stores/useErrorStore.ts` - errors, stats, unread count |

### Database Schema (HIGH confidence)

| Table | Key Fields | Notes |
|-------|------------|-------|
| error_logs | id, clientId, service, operation, errorType, errorMessage, severity, resolved, createdAt | Full error tracking |
| conversations | id, clientId, callId, status, intent, sentiment, summary, durationMs | Call/conversation tracking |
| message_queue | id, clientId, channel, recipient, status, scheduledFor, attempts | Message tracking |
| customers | id, clientId, phone | Customer linking |

### API Endpoints (HIGH confidence)

All endpoints exist in `backend/src/routes/divine.ts`:

**Error Monitoring:**
- `GET /divine/errors` - Recent errors (admin)
- `GET /divine/errors/stats` - Error statistics
- `GET /divine/errors/unresolved` - Unresolved errors
- `POST /divine/errors/:errorId/resolve` - Mark resolved
- `GET /divine/errors/client` - Client-specific errors
- `GET /divine/errors/client/stats` - Client-specific stats
- `POST /divine/errors/:errorId/acknowledge` - Client acknowledge

**Queue Monitoring:**
- `GET /divine/queue/stats` - Queue statistics
- `GET /divine/queue/messages` - Recent messages
- `GET /divine/queue/failed` - Failed messages
- `GET /divine/queue/dead-letter` - Dead letter queue
- `GET /divine/queue/scheduled` - Scheduled messages

**Conversations:**
- `GET /divine/conversations` - By client
- `GET /divine/conversations/stats` - Statistics
- `GET /divine/conversations/:callId` - Single conversation

## Gaps Identified

### Gap 1: Real-time Call Status (CRITICAL)

**What exists:**
- Webhook handler receives `call_started`, `call_ended`, `call_analyzed` events
- Conversation records created/updated in database
- No WebSocket emissions for call events

**What's missing:**
- Socket.IO emissions for call events
- Frontend hook for call events (`useCallSocket` or similar)
- Live call status display in dashboard

**Recommendation:**
Add WebSocket emissions in `webhookHandlerService` for call events:
```typescript
// In handleCallStarted
this.io?.to('admin').emit('call:started', { callId, clientId, phone, direction });
this.io?.to(`client:${clientId}`).emit('call:started', { ... });

// In handleCallEnded
this.io?.to('admin').emit('call:ended', { callId, clientId, durationMs, status });
```

### Gap 2: Per-Client Filtering UI (MEDIUM)

**What exists:**
- Backend methods support `clientId` parameter: `getErrorsByClient()`, `getRecentMessages(clientId)`, etc.
- Client list available from `divineApi.getAllClients()`

**What's missing:**
- Client dropdown filter in DivineDashboard
- Pass clientId to child components
- Persist filter selection

**Recommendation:**
Add client selector to DivineDashboard header:
```typescript
const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
// Pass to MessageQueueViewer, ErrorMonitorPanel as props
```

### Gap 3: Error Log Browser Enhancements (MEDIUM)

**What exists:**
- ErrorMonitorPanel shows list with expand/collapse
- Stats summary by severity
- Resolve action

**What's missing:**
- Time range filter (1h, 6h, 24h, 7d)
- Service filter dropdown
- Error type filter
- Search/filter by message content
- Sort options (time, severity)

**Recommendation:**
Add filter controls to ErrorMonitorPanel header:
```typescript
const [timeRange, setTimeRange] = useState<'1h'|'6h'|'24h'|'7d'>('24h');
const [serviceFilter, setServiceFilter] = useState<string | null>(null);
```

### Gap 4: Dashboard Overview Shows Hardcoded Values (LOW)

**What exists:**
- Error Summary section in overview tab
- Shows "0" for all severity counts

**What's missing:**
- Wire actual stats from `errorData.stats.bySeverity` to display

**Location:** `views/DivineDashboard.tsx` lines 181-199

**Fix:** Replace hardcoded zeros with actual stats values.

### Gap 5: Recent Calls Display (LOW)

**What exists:**
- Placeholder "No recent calls" in overview
- `conversationService.getRecentByClient()` available

**What's missing:**
- Actual API call to load recent conversations
- Display of call cards with status, intent, duration

**Recommendation:**
Add conversation loading to `loadDashboardData()` and display in "Recent Call Activity" section.

## Architecture Patterns

### Socket.IO Room Pattern (Already Established)

```typescript
// Join patterns already in use:
socket.on('join:admin', () => socket.join('admin'));
socket.on('join:client', (clientId) => socket.join(`client:${clientId}`));

// Emit patterns:
io.to('admin').emit('event:name', data);
io.to(`client:${clientId}`).emit('event:name', data);
```

### Component Data Flow Pattern

```
DivineDashboard (parent)
  |
  |-- [selectedClientId state]
  |-- [refreshTrigger state]
  |
  +-- MessageQueueViewer (clientId prop)
  +-- ErrorMonitorPanel (clientId prop)
  +-- CallStatusPanel (clientId prop) [NEW]
```

### Real-time Update Pattern (useSocketMessages example)

```typescript
// Already established pattern:
useEffect(() => {
  socket.on('event:name', (data) => {
    setState(prev => mergeData(prev, data));
  });
  return () => socket.off('event:name');
}, []);
```

## Don't Hand-Roll

| Problem | Existing Solution | Why |
|---------|-------------------|-----|
| Error logging | errorMonitorService.logError() | Has severity classification, Slack integration, buffering |
| Real-time stats | useSocketMessages hook | WebSocket reconnection, event handling |
| Error state | useErrorStore (Zustand) | Centralized state, real-time updates |
| Alert routing | alertingService | Multi-channel, throttling, severity-based |
| Client filtering | Backend already supports clientId params | Just need UI dropdown |

## Common Pitfalls

### Pitfall 1: Duplicating Socket.IO Server Attachment

**What goes wrong:** Creating multiple Socket.IO attachments or handlers
**How to avoid:** Services already receive `io` via `setSocketServer()`. Use existing pattern.

### Pitfall 2: Mixing Admin and Client Error Access

**What goes wrong:** Showing all errors to client users
**How to avoid:** Use `getClientErrors()` for non-admin, `getRecentErrors()` for admin. Check `user.isAdmin`.

### Pitfall 3: Not Debouncing Real-time Updates

**What goes wrong:** Too many re-renders from rapid WebSocket events
**How to avoid:** Batch updates or use `requestAnimationFrame`. MessageQueueViewer already handles this.

### Pitfall 4: Forgetting to Leave Rooms

**What goes wrong:** Socket remains in rooms after component unmount
**How to avoid:** useErrorSocket already handles this with cleanup in useEffect return.

## Code Examples

### Adding Call Events to WebSocket (Verified Pattern)

```typescript
// In webhook-handler.service.ts, add io reference
private io: SocketServer | null = null;

setSocketServer(io: SocketServer): void {
  this.io = io;
}

// In handleCallStarted:
if (this.io) {
  const callEvent = {
    callId: call.call_id,
    clientId: config.client_id,
    phone,
    direction: call.direction,
    agentId: call.agent_id,
    timestamp: new Date().toISOString(),
  };
  this.io.to('admin').emit('call:started', callEvent);
  this.io.to(`client:${config.client_id}`).emit('call:started', callEvent);
}
```

### Client Filter Dropdown (Established UI Pattern)

```typescript
// From existing component patterns in the codebase
<select
  value={selectedClientId || ''}
  onChange={(e) => setSelectedClientId(e.target.value || null)}
  className="bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none"
>
  <option value="">All Clients</option>
  {clients.map(client => (
    <option key={client.client_id} value={client.client_id}>
      {client.business_name}
    </option>
  ))}
</select>
```

### Wiring Error Stats to Overview (Fix)

```typescript
// In DivineDashboard, replace hardcoded error summary
{errorData && (
  <div className="grid grid-cols-4 gap-4">
    <div className="text-center p-4 bg-white/5">
      <div className="text-2xl font-bold text-red-500">
        {errorData.stats.bySeverity?.critical || 0}
      </div>
      <div className="text-[9px] text-gray-500 uppercase mt-1">Critical</div>
    </div>
    {/* ... similar for error, warning, resolved */}
  </div>
)}
```

## State of the Art

| Aspect | Current State | What's Good | What's Missing |
|--------|---------------|-------------|----------------|
| Error Monitoring | Full backend, partial frontend | Logging, alerts, per-client | UI filters, time range |
| Message Queue | Full stack complete | Real-time, compose, retry | Nothing major |
| Call Status | Backend only | Conversation tracking | Real-time WebSocket events |
| Per-client Filter | Backend ready | APIs support clientId | UI dropdown |
| Slack Alerts | Complete | Severity routing, throttling | Nothing |

## Open Questions

1. **Call Status Granularity**
   - What we know: call_started, call_ended, call_analyzed events exist
   - What's unclear: Should we track "in_progress" status for active calls?
   - Recommendation: Start with start/end events, add granularity if needed

2. **Historical Data Retention**
   - What we know: No explicit retention policy in schema
   - What's unclear: How long to keep error_logs, conversations?
   - Recommendation: Add retention policy in future phase (not blocking for Phase 6)

3. **Performance at Scale**
   - What we know: Current queries work, no pagination in ErrorMonitorPanel
   - What's unclear: Behavior with 1000+ errors
   - Recommendation: Add pagination if performance issues observed

## Recommended Approach

### Task Groupings

**Group A: Wire Existing Components (2-3 tasks)**
1. Fix hardcoded values in DivineDashboard overview (error stats, recent calls)
2. Add client filter dropdown to dashboard header, pass to child components
3. Add time range filter to ErrorMonitorPanel

**Group B: Add Real-time Call Events (2-3 tasks)**
1. Add Socket.IO emissions to webhookHandlerService for call events
2. Create useCallSocket hook (following useErrorSocket pattern)
3. Create CallStatusPanel component for real-time call display

**Group C: Polish & Testing (1-2 tasks)**
1. Manual testing of all dashboard flows with mock data
2. Verify Slack alerts trigger correctly for critical errors

### Estimated Effort

- Group A: ~3 hours (mostly wiring existing pieces)
- Group B: ~4 hours (new WebSocket events and hook)
- Group C: ~2 hours (testing and verification)

**Total: ~9 hours**

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WebSocket events flood dashboard | LOW | MEDIUM | Existing throttling patterns work |
| Per-client filter breaks admin view | LOW | LOW | Test both paths explicitly |
| Slack webhook rate limits | LOW | MEDIUM | alertingService already has throttling |
| Socket.IO reconnection issues | LOW | MEDIUM | useSocketMessages already handles reconnection |

## Sources

### Primary (HIGH confidence)
- Direct code analysis of existing codebase
- `backend/src/services/divine/*.ts` - All service implementations
- `components/divine/*.tsx` - All dashboard components
- `src/hooks/*.ts` - WebSocket hooks
- `backend/src/routes/divine.ts` - All API endpoints

### Secondary (MEDIUM confidence)
- Socket.IO documentation patterns (verified against existing implementation)
- Zustand store patterns (verified against useErrorStore)

## Metadata

**Confidence breakdown:**
- Existing Infrastructure: HIGH - Direct code review
- Gaps Identified: HIGH - Compared requirements to code
- Architecture: HIGH - Patterns already established in codebase
- Effort Estimates: MEDIUM - Based on similar work in Phase 4

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable codebase)
