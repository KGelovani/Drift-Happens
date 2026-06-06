# 🧩 Drift Happens - Dynamic Segment Management System

A comprehensive system for managing customer segments with automatic delta detection, change propagation, and cascading updates. Built with Angular, NestJS, RabbitMQ, Redis, Elasticsearch, and PostgreSQL.

## 📋 Overview

**Drift Happens** solves the problem of tracking customer segment membership changes in real-time. As customer data changes due to transactions, profile updates, or time passing, the system:

1. **Detects deltas** - Identifies exactly who was added and removed
2. **Propagates signals** - Notifies subscribers (UI, campaigns, analytics)
3. **Prevents noise** - Batches large updates
4. **Protects static segments** - Ensures frozen segments don't auto-update
5. **Cascades updates** - When a segment changes, dependent segments update automatically

## 🎯 Features

✅ **Dynamic Segments** - Automatically updating based on business rules  
✅ **Static (Frozen) Segments** - Fixed membership until manually refreshed  
✅ **Delta Calculation** - Precise tracking of additions and removals  
✅ **Cascading Updates** - Dependent segments update when parent segments change  
✅ **Batching & Debouncing** - Large updates processed in configurable batches  
✅ **Real-time Notifications** - RabbitMQ event publishing for subscribers  
✅ **Campaign Simulator** - Example consumer that reacts to segment changes  
✅ **Comprehensive UI** - Angular dashboard for segment management  
✅ **Seed Data** - Pre-populated with realistic customer and segment examples  

## 🏗️ System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Angular)                      │
│  • Segment management UI                                    │
│  • Real-time delta notifications                            │
│  • Member browsing and simulation controls                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      API (NestJS)                            │
│  • Segment CRUD operations                                  │
│  • Delta calculation & propagation                          │
│  • Batching service for large updates                       │
│  • Event publishing via RabbitMQ                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
        ▼             ▼             ▼              ▼
   ┌────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐
   │ RabbitMQ│  │ PostgreSQL │  │ Redis   │  │ Elasticsearch│
   │  Queue  │  │ (Database) │  │ (Cache) │  │  (Logs)      │
   └────────┘  └──────────┘  └─────────┘  └──────────────┘
        │
        ▼
   ┌─────────────────────┐
   │ Campaign Simulator  │
   │ (Delta Consumer)    │
   └─────────────────────┘
```

### Data Flow

```
Customer Data Changes
        │
        ▼
Segment Evaluation
        │
        ├─ Current Members vs Previous Members
        │
        ├─ ADDED: New customer IDs
        │
        └─ REMOVED: Dropped customer IDs
              │
              ▼
        Delta Calculation
              │
              ├─ Batch if > 100 records
              │
              └─ Store in SegmentDelta entity
                    │
                    ▼
              Publish to RabbitMQ
                    │
        ┌───────────┼───────────┬─────────────┐
        │           │           │             │
        ▼           ▼           ▼             ▼
      UI Update  Campaigns   Analytics   Cascading
                              Logs      Updates
```

### Cascading Updates

When a segment used as a filter in another segment changes:

```
Segment A (Parent)          Segment B (Dependent)
"Risk Group"          =     "VIP" ∩ "Risk Group"
     │                            │
     ├─ Member Change              │
     │                             │
     └─────────► Trigger Re-eval ──┘
                      │
                      ├─ Calculate new membership
                      │
                      ├─ Compare with previous
                      │
                      └─ Publish Segment B delta
```

### Batching Strategy

```
Delta Events (1 per customer)
        │
        ▼
Queue in Memory
        │
        ├─ If count >= 100: Flush immediately
        │
        └─ If count < 100: Wait for timeout (5s)
              │
              ▼
        Batch Flush
              │
              ├─ Store combined delta in Redis
              │
              └─ Publish single event to RabbitMQ
                    (contains 100+ customer IDs)
                    
Result: 500 individual events → 5 batched events
```

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Installation & Running

#### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
cd "Drift Happens"

# Start all services
docker-compose up

# In another terminal, seed the database
docker-compose exec api npm run seed
```

Services will be available at:
- **Frontend**: http://localhost:4200
- **API**: http://localhost:3000
- **RabbitMQ Admin**: http://localhost:15672 (admin/admin123)
- **PostgreSQL**: localhost:5432 (drift_user/drift_password)
- **Redis**: localhost:6379
- **Elasticsearch**: http://localhost:9200

#### Option 2: Local Development

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (in new terminal)
cd frontend
npm install
npm start

# Simulator (in new terminal)
cd simulator
npm install
npm run dev

# PostgreSQL, Redis, RabbitMQ must be running separately
# Start them with:
# docker-compose up postgres redis rabbitmq elasticsearch
```

## 📊 Key Concepts

### Segment Types

#### Dynamic Segments
- **Definition**: Rules-based segments that automatically update as data changes
- **Evaluation**: On-demand or time-based triggers
- **Use Case**: "Active Buyers", "VIP Clients"
- **Behavior**:
  ```json
  {
    "id": "active-buyers-id",
    "name": "Active Buyers",
    "type": "DYNAMIC",
    "rules": [
      {
        "field": "lastTransactionDaysAgo",
        "operator": "<=",
        "value": 30
      }
    ]
  }
  ```

#### Static (Frozen) Segments
- **Definition**: Fixed membership at creation time
- **Update**: Only through manual refresh trigger
- **Use Case**: Campaign audiences, cohort analysis
- **Behavior**: Ignores data changes until manually refreshed

### Delta Events

A **delta** represents the change in segment membership:

```json
{
  "id": "delta-123",
  "segmentId": "segment-456",
  "type": "ADDED",
  "customerIds": ["cust-1", "cust-2", "cust-3"],
  "count": 3,
  "metadata": {
    "timestamp": "2026-06-06T12:30:00Z"
  }
}
```

**Delta Types:**
- `ADDED`: New members joining the segment
- `REMOVED`: Members leaving the segment

### Dependent Segments

Segments can use other segments as filters:

```json
{
  "name": "VIP At Risk",
  "type": "DYNAMIC",
  "parentSegmentId": "vip-segment-id",
  "rules": [
    {
      "field": "lastTransactionDaysAgo",
      "operator": ">=",
      "value": 30
    }
  ]
}
```

When the parent segment changes, the dependent segment is automatically re-evaluated.

## 🔌 API Endpoints

### Segments

```bash
# Create segment
POST /segments
{
  "name": "Active Buyers",
  "description": "...",
  "type": "DYNAMIC",
  "rules": [...],
  "parentSegmentId": null
}

# Get all segments
GET /segments

# Get segment details
GET /segments/:id

# Evaluate segment (calculate delta)
POST /segments/:id/evaluate

# Get segment members
GET /segments/:id/members?limit=100&offset=0

# Get segment deltas
GET /segments/:id/deltas

# Delete segment
DELETE /segments/:id
```

## 📚 Example Usage

### Creating a Dynamic Segment

```bash
curl -X POST http://localhost:3000/segments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Spenders",
    "description": "Customers with > 5000 GEL purchases",
    "type": "DYNAMIC",
    "rules": [
      {
        "field": "totalPurchases",
        "operator": ">",
        "value": 5000
      }
    ]
  }'
```

### Evaluating and Getting Deltas

```bash
# Trigger evaluation
curl -X POST http://localhost:3000/segments/{id}/evaluate

# View generated deltas
curl http://localhost:3000/segments/{id}/deltas
```

### Dependent Segment

```bash
curl -X POST http://localhost:3000/segments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP But Inactive",
    "description": "VIP members inactive for 30+ days",
    "type": "DYNAMIC",
    "parentSegmentId": "vip-segment-id",
    "rules": [
      {
        "field": "lastTransactionDaysAgo",
        "operator": ">=",
        "value": 30
      }
    ]
  }'
```

## 🎮 Campaign Simulator

The included simulator listens for segment deltas and simulates campaign actions:

```javascript
📬 Delta Event Received!
   Segment: active-buyers
   Type: ADDED
   Count: 5

📧 CAMPAIGN ACTION: Sending notification to 5 new members
   ✉️  → Notification sent to customer cust-1
   ✉️  → Notification sent to customer cust-2
   ✉️  → Notification sent to customer cust-3
   ✉️  → Notification sent to customer cust-4
   ✉️  → Notification sent to customer cust-5
✅ Campaign notifications sent to 5 customers
```

## 📦 Seed Data

The database is seeded with:

### Customers (5)
- John Doe ($5,500 purchases, active)
- Jane Smith ($3,000 purchases, active)
- Bob Wilson ($2,000 purchases, recently inactive)
- Alice Brown ($1,000 purchases, long-term inactive)
- Charlie Davis ($6,000 purchases, very active)

### Segments (5)
1. **Active Buyers** (Dynamic) - Last transaction ≤ 30 days
2. **VIP Clients** (Dynamic) - Total purchases > $5,000
3. **Risk Group** (Dynamic) - Inactive 90+ days
4. **March Campaign Audience** (Static) - Purchases > $2,000
5. **VIP At Risk** (Dynamic, Dependent) - VIP with no purchases 30+ days

## 🔧 Architecture Decisions

### Tech Stack Choice

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Backend** | NestJS | Type-safe, modular, enterprise-ready |
| **Frontend** | Angular | Robust, real-time capable, component-based |
| **Database** | PostgreSQL | ACID compliance, JSONB support for rules |
| **Queue** | RabbitMQ | Reliable, persistent, topic-based routing |
| **Cache** | Redis | In-memory, atomic operations for batching |
| **Search/Logs** | Elasticsearch | Full-text search, aggregation capabilities |

### Key Decisions

1. **Delta-Based Updates**: Instead of sending complete membership lists, we send only changes (added/removed), reducing bandwidth and enabling efficient subscribers.

2. **Batching Strategy**: Large updates (500+) are automatically batched and debounced. This prevents overwhelming the message queue and allows subscribers to process grouped changes.

3. **Cascading Propagation**: Dependent segments create a DAG (Directed Acyclic Graph) of updates. When a parent changes, children automatically re-evaluate.

4. **Static Segment Protection**: Static segments ignore data changes until manually refreshed, preventing unwanted drift in fixed cohorts.

5. **Separate Batching Service**: Batching is handled at the API layer using Redis, allowing horizontal scaling of API instances while maintaining consistent batching behavior.

### Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Batching | Reduced system load | Slight delay (5s max) in notifications |
| RabbitMQ | Reliability & persistence | More complex setup vs simple webhooks |
| PostgreSQL | Strong consistency | Slower than NoSQL for large scans |
| JSONB Rules | Flexibility | No schema validation at DB layer |

## 📈 Scalability Considerations

### Current Limits
- **Batching**: 100 records per batch, 5s timeout
- **Segment Members**: 1M+ supported with pagination
- **Concurrent Users**: 100+ supported via Docker

### To Scale Further

1. **Database Sharding**: Shard customers by region
2. **Redis Cluster**: Distribute batching across cluster
3. **RabbitMQ Clustering**: Multiple broker nodes
4. **API Replication**: Load balance multiple API instances
5. **Elasticsearch**: Distributed analytics queries
6. **Caching Layer**: Add CDN for static content

## 🧪 Testing Scenarios

### Scenario 1: Single Customer Transaction
```
Action: Customer makes new purchase
Expected:
  1. Customer enters "Active Buyers" segment
  2. Delta event published: ADDED [customer-id]
  3. UI updates to show new member count
  4. Campaign simulator logs notification
```

### Scenario 2: Time-Based Expiration
```
Action: 31 days pass, no new transactions
Expected:
  1. Customer leaves "Active Buyers" (last transaction now > 30 days)
  2. Delta event published: REMOVED [customer-id]
  3. UI updates to reflect removal
  4. Campaign simulator logs unsubscription
```

### Scenario 3: Cascading Update
```
Action: Change in "VIP Clients" segment membership
Expected:
  1. "VIP Clients" delta calculated
  2. "VIP At Risk" (dependent) automatically re-evaluated
  3. "VIP At Risk" delta calculated and published
  4. Both UI and campaigns receive notifications
```

### Scenario 4: Bulk Import
```
Action: Import 5,000 new customers
Expected:
  1. System recognizes bulk update
  2. Customers batched into ~50 groups
  3. ~50 delta events published (instead of 5,000)
  4. UI shows incremental updates
  5. No system overload
```

### Scenario 5: Static Segment Immutability
```
Action: Customer profile updates, new transaction
Expected:
  1. "March Campaign" (static) does NOT change
  2. Membership count remains constant
  3. No delta event for static segment
  4. Manual refresh trigger required for update
```

## 📁 Project Structure

```
Drift Happens/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── segments/     # Segment module (entities, service, controller)
│   │   ├── customers/    # Customer module
│   │   ├── delta/        # Delta calculation & batching
│   │   ├── messaging/    # RabbitMQ integration
│   │   ├── database/     # TypeORM setup & seed
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # Angular UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── app.component.ts
│   │   ├── main.ts
│   │   └── index.html
│   ├── Dockerfile
│   └── package.json
├── simulator/            # Campaign simulator
│   ├── src/
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── docker/
│   └── postgres-init.sql # Database initialization
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md
│   └── API.md
├── docker-compose.yml    # Orchestration
├── package.json          # Root workspace
└── README.md            # This file
```

## 🐛 Troubleshooting

### RabbitMQ Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5672
```
**Solution**: Ensure RabbitMQ container is running
```bash
docker-compose up rabbitmq -d
```

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL container is running and initialized
```bash
docker-compose up postgres -d
docker-compose exec api npm run seed
```

### No Segments Showing
```
Empty segment list in UI
```
**Solution**: Seed the database
```bash
docker-compose exec api npm run seed
```

### Port Already in Use
```
Error: listen EADDRINUSE :::4200
```
**Solution**: Use different port or kill existing process
```bash
docker-compose down
docker-compose up
```

