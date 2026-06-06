# 🏗️ Architecture Decision Log

## Overview

This document details the architectural decisions made for the Drift Happens system, including alternatives considered and trade-offs.

## ADR-001: Backend Framework Selection

**Decision**: Use NestJS for the backend API

**Rationale**:
- Type-safe with TypeScript
- Modular architecture (modules, controllers, services)
- Built-in dependency injection
- Excellent TypeORM integration for database
- Middleware and interceptor support for cross-cutting concerns
- Active community and enterprise adoption

**Alternatives Considered**:
1. **Express.js** - Simpler but less structured, would require more boilerplate
2. **Fastify** - Fast but smaller ecosystem, NestJS can wrap it
3. **Golang** - Excellent performance but steeper learning curve for team

**Trade-offs**:
- Slight startup overhead vs pure Express
- Learning curve for developers unfamiliar with NestJS
- Larger bundle size (mitigated by modular tree-shaking)

---

## ADR-002: Frontend Framework Selection

**Decision**: Use Angular for the frontend UI

**Rationale**:
- Full-featured framework (routing, forms, HTTP, animations)
- TypeScript-first, strong typing
- Real-time capable with RxJS
- Enterprise-grade tooling (CLI, testing, build optimization)
- Component-based architecture
- Excellent for complex dashboard UIs

**Alternatives Considered**:
1. **React** - More flexible, larger ecosystem, but less structured
2. **Vue.js** - Simpler learning curve, smaller bundle, fewer out-of-box features
3. **Svelte** - Excellent performance, but smaller ecosystem

**Trade-offs**:
- Larger initial bundle size (mitigated by lazy loading)
- Steeper learning curve vs React
- More opinionated structure (benefits for large teams)

---

## ADR-003: Message Queue Selection

**Decision**: Use RabbitMQ for event publication/subscription

**Rationale**:
- Mature, production-proven (15+ years)
- Reliable message delivery with persistence
- Topic-based routing allows multiple subscribers
- Support for dead-letter queues (future enhancement)
- Excellent admin UI for monitoring
- Scaling via clustering

**Alternatives Considered**:
1. **Kafka** - Better for high-throughput streaming, overkill for our use case
2. **AWS SQS** - Managed but vendor lock-in, higher latency
3. **Redis Pub/Sub** - Simple but no persistence, limited routing

**Trade-offs**:
- Complexity vs simpler webhooks
- Memory overhead vs lightweight alternatives
- Clustering setup more complex than single instance

---

## ADR-004: Caching & Batching Layer

**Decision**: Use Redis for in-memory batching and caching

**Rationale**:
- Sub-millisecond latency for batch operations
- Atomic operations for consistent state
- Expiring keys for automatic cleanup
- Simple to scale horizontally
- No schema required for flexible batching

**Alternatives Considered**:
1. **In-Memory Store** - Simpler but no persistence, scales poorly
2. **Memcached** - Lighter than Redis but fewer features
3. **Elasticsearch** - Overkill for batching, better for analytics

**Trade-offs**:
- Another component to manage and monitor
- Data loss on Redis crash (mitigated by small timeout window)
- Memory overhead for large batches

---

## ADR-005: Database Selection

**Decision**: Use PostgreSQL for persistent data storage

**Rationale**:
- ACID compliance ensures data integrity
- JSONB support for flexible rule storage
- Advanced indexing (B-tree, GiST, GIN)
- Full-text search capabilities
- Excellent JSON query support
- Strong typing with TypeORM

**Alternatives Considered**:
1. **MongoDB** - Flexible schema but lacks ACID, joins slower
2. **MySQL** - Solid choice but less advanced features than PostgreSQL
3. **DynamoDB** - Managed but vendor lock-in, limited querying

**Trade-offs**:
- Slower writes than NoSQL for time-series data
- Stricter schema requires migrations
- Horizontal scaling more complex (read replicas vs sharding)

---

## ADR-006: Delta Calculation Strategy

**Decision**: Store and compare membership snapshots for delta calculation

**Rationale**:
- Precise identification of added/removed members
- Works for both dynamic and static segments
- Clear audit trail of membership changes
- Enables cascading updates tracking

**Alternatives Considered**:
1. **Change Data Capture (CDC)** - More complex, overkill for our use case
2. **Event Sourcing** - Overhead for simple membership tracking
3. **Versioned Records** - Similar overhead, less clean queries

**Trade-offs**:
- Storage overhead from maintaining deltas
- Requires cleanup/archival of old deltas
- Cannot recover exact moment of change without timestamps

---

## ADR-007: Batching Algorithm

**Decision**: Implement dual-trigger batching (size + timeout)

### Algorithm:
```
When delta event received:
  1. Add to in-memory batch for segment
  2. If batch size >= 100:
     - Flush immediately
  3. Else if batch timeout not set:
     - Set 5-second timeout
  4. On timeout or size limit:
     - Combine deltas
     - Publish single event to RabbitMQ
     - Clear batch
```

**Rationale**:
- Size trigger (100) prevents queue overload
- Timeout (5s) ensures timely delivery
- Reduces 500 events → 5 batched events
- Subscriber-friendly (processes grouped changes)

**Trade-offs**:
- 5-second delay for small batches
- More complex logic than simple webhooks
- Requires distributed coordination if scaling to multiple API instances

---

## ADR-008: Cascading Update Propagation

**Decision**: Implement recursive evaluation of dependent segments

### Strategy:
```
1. Parent segment changes
2. Query database for dependent segments
3. For each dependent:
   a. Re-evaluate against new parent membership
   b. Calculate deltas
   c. Publish delta events
   d. Recursively update segments dependent on this one
```

**Rationale**:
- Clear, explicit dependency tracking
- Works for multi-level hierarchies (A → B → C)
- Leverages existing delta calculation logic

**Alternatives Considered**:
1. **Event Sourcing** - Track all state changes, replay to compute state
2. **Graph Database** - Optimized for relationships but added complexity
3. **Immediate Recalculation** - Simpler but slow for deep hierarchies

**Trade-offs**:
- Risk of circular dependencies (prevented by constraint)
- Recursive queries can be slow for deep graphs
- Requires careful ordering to avoid duplicate processing

---

## ADR-009: Static Segment Immutability

**Decision**: Mark segments as `type: STATIC` and skip automatic updates

**Rationale**:
- Ensures campaign cohorts don't drift
- Explicit manual refresh required for updates
- Simple to implement and understand
- Protects business logic from unintended changes

**Implementation**:
```javascript
async evaluateSegmentAndCalculateDelta(segmentId) {
  const segment = await getSegment(segmentId);
  
  if (segment.type === 'STATIC' && segment.lastEvaluatedAt) {
    // Skip automatic update
    return [];
  }
  
  // Continue with evaluation...
}
```

**Trade-offs**:
- Manual intervention required for updates
- Risk of stale data if refresh forgotten
- Requires UI/API to expose manual refresh

---

## ADR-010: Real-time Notifications

**Decision**: Use server-sent events (SSE) with RabbitMQ fallback

**Rationale**:
- SSE simpler than WebSockets for one-way updates
- Browser reconnects automatically
- Works through most proxies/firewalls
- Lower overhead than WebSockets

**UI Implementation**:
```typescript
// Angular component subscribes to delta notifications
this.deltaNotification$.subscribe((delta) => {
  this.updateSegmentCount(delta);
  this.showNotification(`${delta.count} new members added`);
});
```

**Alternatives Considered**:
1. **Long Polling** - Simpler but higher latency
2. **WebSockets** - Full-duplex but overkill for one-way updates
3. **gRPC** - Excellent but requires more setup

**Trade-offs**:
- SSE requires dedicated connection per user
- No browser support on older clients
- Horizontal scaling requires sticky sessions

---

## ADR-011: Error Handling & Observability

**Decision**: Implement comprehensive logging with Elasticsearch + structured logs

**Rationale**:
- All significant events logged with context
- Elasticsearch enables searching and aggregation
- Structured logs (JSON) for parsing
- Future alerting and monitoring

**Log Levels**:
- `ERROR`: Failed segment evaluation, database errors
- `WARN`: Delta processing delays, queue backpressure
- `INFO`: Segment evaluations, cascade triggers
- `DEBUG`: Rule matching details, batch operations

**Trade-offs**:
- Logging overhead (mitigated by async handlers)
- Storage cost for Elasticsearch
- Complexity of log aggregation

---

## ADR-012: Horizontal Scaling

**Decision**: Design stateless API for horizontal scaling

**Constraints**:
- Redis handles distributed batching
- RabbitMQ ensures message persistence
- PostgreSQL as central truth source
- Stateless API instances

**Scaling Approach**:
```
Load Balancer
    ├─ API Instance 1
    ├─ API Instance 2
    └─ API Instance N
        │
        ├─ PostgreSQL (single or replicated)
        ├─ Redis (cluster)
        ├─ RabbitMQ (cluster)
        └─ Elasticsearch (cluster)
```

**Trade-offs**:
- Added complexity of distributed coordination
- Redis cluster management overhead
- Database becomes bottleneck for writes
- Network latency between components

---

## Future Enhancements

1. **Event Sourcing**: Full audit trail of all membership changes
2. **Segment Versioning**: Track rule changes over time
3. **Predictive Segments**: ML-based membership prediction
4. **Multi-Tenancy**: Support multiple organizations
5. **Advanced Analytics**: Segment overlap, churn prediction
6. **Rule Builder UI**: No-code segment creation
7. **Webhook Integration**: Custom subscriber webhooks
8. **Segment Cloning**: Duplicate existing segment with modifications

---

## Conclusion

The architecture balances:
- **Simplicity** vs completeness (NestJS, PostgreSQL)
- **Reliability** vs overhead (RabbitMQ, Redis)
- **Scalability** vs operational complexity
- **Type Safety** vs flexibility (TypeScript)

Each decision prioritizes production readiness and team maintainability.
