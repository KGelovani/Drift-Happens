# 📊 System Architecture Diagram

## Component Relationships

```
┌────────────────────────────────────────────────────────────────────┐
│                         DRIFT HAPPENS                              │
│                   Segment Management System                         │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────┐      ┌──────────────────────┐            │
│   │   Angular UI         │      │   Browser / Desktop  │            │
│   │  (Port 4200)         │      │   Segment Dashboard  │            │
│   ├──────────────────────┤      └──────────────────────┘            │
│   │ • Segment List       │                                          │
│   │ • Member Browser     │      Real-time Delta                     │
│   │ • Create/Edit        │      Notifications via                   │
│   │ • Simulator Controls │      RabbitMQ → SSE                      │
│   └──────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    HTTP REST API Calls
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER (NestJS)                             │
├─────────────────────────────────────────────────────────────────────┤
│                        (Port 3000)                                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              REST Controllers                                │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ POST   /segments              - Create segment               │  │
│  │ GET    /segments              - List all segments            │  │
│  │ GET    /segments/:id          - Get segment details          │  │
│  │ POST   /segments/:id/evaluate - Trigger delta calculation    │  │
│  │ GET    /segments/:id/members  - List members (paginated)     │  │
│  │ GET    /segments/:id/deltas   - Get delta history           │  │
│  │ DELETE /segments/:id          - Delete segment              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐                │
│         │                    │                    │                │
│         ▼                    ▼                    ▼                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐        │
│  │ Segments        │  │ Delta Calc       │  │ Messaging  │        │
│  │ Service         │  │ Service          │  │ Service    │        │
│  ├─────────────────┤  ├──────────────────┤  ├────────────┤        │
│  │ • CRUD Ops      │  │ • Rule Eval      │  │ • Pub/Sub  │        │
│  │ • Member Query  │  │ • Comparison     │  │ • RabbitMQ │        │
│  │ • List Mgmt     │  │ • Delta Gen      │  │   Connect  │        │
│  │                 │  │ • Cascading      │  │            │        │
│  └─────────────────┘  └──────────────────┘  └────────────┘        │
│         │                    │                    │                │
│         └────────────────────┼────────────────────┘                │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐                │
│         │                    │                    │                │
│         ▼                    ▼                    ▼                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐        │
│  │ Batching        │  │ TypeORM          │  │ Redis      │        │
│  │ Service         │  │ Integration      │  │ Client     │        │
│  ├─────────────────┤  ├──────────────────┤  ├────────────┤        │
│  │ • Memory Queue  │  │ • Entity Manager │  │ • Batching │        │
│  │ • Dual Triggers │  │ • Queries        │  │ • Caching  │        │
│  │ • Debouncing    │  │ • Migrations     │  │ • Events   │        │
│  └─────────────────┘  └──────────────────┘  └────────────┘        │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┬────────────┐
           │                  │                  │            │
           ▼                  ▼                  ▼            ▼
┌─────────────────┐  ┌──────────────────┐  ┌────────────┐  ┌──────────┐
│  PostgreSQL DB  │  │   RabbitMQ       │  │    Redis   │  │Elasticsearch
│  (Port 5432)    │  │  (Port 5672)     │  │(Port 6379) │  │(Port 9200)
├─────────────────┤  ├──────────────────┤  ├────────────┤  ├──────────┤
│ Customers       │  │ Exchanges:       │  │ Batches    │  │Audit Logs│
│ Segments        │  │ • segment-delta  │  │ Caches     │  │Analytics │
│ Memberships     │  │                  │  │ Temporary  │  │Indexes   │
│ Delta Events    │  │ Queues:          │  │ Data       │  │Search    │
│ Rules (JSONB)   │  │ • segment-delta. │  │            │  │          │
│                 │  │   ui             │  │ 1-hour TTL │  │          │
│ Indexes:        │  │ • segment-delta. │  │ expiry     │  │          │
│ • By Status     │  │   campaigns      │  │            │  │          │
│ • By Date       │  │ • segment-delta. │  │            │  │          │
│ • FTS Rules     │  │   analytics      │  │            │  │          │
└─────────────────┘  │                  │  └────────────┘  └──────────┘
                     │ Routing Key:     │
                     │ segment.delta.*  │
                     └──────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐
    │  Campaign       │ │  Analytics       │ │   UI Events  │
    │  Simulator      │ │  Consumer        │ │  Subscriber  │
    ├─────────────────┤ ├──────────────────┤ ├──────────────┤
    │ Listens:        │ │ Listens:         │ │ Real-time    │
    │ segment-delta.  │ │ segment-delta.   │ │ Updates      │
    │ campaigns       │ │ analytics        │ │              │
    │                 │ │                  │ │ WebSocket/SSE│
    │ Actions:        │ │ Actions:         │ │              │
    │ • Email         │ │ • Index metrics  │ │ Pushes       │
    │ • SMS           │ │ • Store counts   │ │ new member   │
    │ • Notification  │ │ • Track trends   │ │ count to UI  │
    └─────────────────┘ └──────────────────┘ └──────────────┘
```

## Delta Calculation Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  Data Change Event                                  │
│  (Transaction, Profile Update, Time Passage)       │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │ Evaluate Segment Rules        │
         │ (Filter customers by rules)   │
         └────────────────┬──────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ Get Matching Customers            │
         │ Query: WHERE rules match          │
         │ Result: Current membership set    │
         └────────────────┬──────────────────┘
                         │
                         ▼
         ┌──────────────────────────────────────┐
         │ Get Previous Membership              │
         │ From segment_memberships table       │
         │ Result: Prior membership set         │
         └────────────────┬─────────────────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
         ▼                              ▼
    ┌─────────────────┐        ┌──────────────────┐
    │ Set Difference  │        │ Set Difference   │
    │ Added = New -   │        │ Removed = Old -  │
    │         Old     │        │         New      │
    └────────┬────────┘        └────────┬─────────┘
             │                         │
             ▼                         ▼
    ┌──────────────────────────────────────────┐
    │ Create Delta Events                      │
    │ • ADDED: [customer IDs]                  │
    │ • REMOVED: [customer IDs]                │
    └────────┬─────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ Queue for Batching                   │
    │ (Dual-trigger: size or timeout)      │
    └────────┬───────────────────────────────┘
             │
             ├─► Size >= 100? ─► Flush Now
             │
             └─► Set 5s Timer ─► Timeout? ─► Flush
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │ Publish to RabbitMQ             │
                    │ Topic: segment.delta.{id}       │
                    │ Subscribers:                    │
                    │ • UI (real-time updates)        │
                    │ • Campaigns (send notifications)│
                    │ • Analytics (track metrics)     │
                    └─────────────────────────────────┘
```

## Cascading Update Sequence Diagram

```
Time ──────────────────────────────────────────────────────────────►

Segment A (Parent)                    Segment B (Dependent)
│                                     │
├─ Member Change Detected             │
│  [ADDED: C1, C2]                    │
│                                     │
├─ Calculate Delta for A              │
│  ├─ ADDED: [C1, C2]                │
│  ├─ REMOVED: []                    │
│                                     │
├─ Publish Delta A                    │
│  └─ RabbitMQ: segment.delta.A      │
│                                     ├─ Trigger: Parent changed
│                                     │
│                                     ├─ Re-evaluate B
│                                     │  (B's rules: B = A ∩ [rule])
│                                     │
│                                     ├─ Calculate Delta for B
│                                     │  ├─ ADDED: [C1] (if C1 matches B's rules)
│                                     │  ├─ REMOVED: []
│                                     │
│                                     ├─ Publish Delta B
│                                     │  └─ RabbitMQ: segment.delta.B
│                                     │
│                                     └─ Recursively update segments
│                                        depending on B

Outcome:
├─ UI receives both deltas
├─ Campaigns notified of all changes
└─ Complete cascade processed
```

## Batching Algorithm Visualization

```
Timeline: 0s ──────────────── 5s

Delta Events (arrive throughout):
  t=0.1s  ► Customer C1 added    ┐
  t=0.5s  ► Customer C2 added    │
  t=1.2s  ► Customer C3 added    │
  t=2.1s  ► Customer C4 added    │
  t=3.0s  ► Customer C5 added    │ In-Memory Buffer
  ...                             │ (size < 100)
  t=4.8s  ► Customer C50 added   ┤
  t=5.0s  ► TIMEOUT!             │
           Flush All             ┘
                │
                ▼
        ┌─────────────────────┐
        │ Batched Delta Event │
        ├─────────────────────┤
        │ ADDED: [C1...C50]   │
        │ Count: 50           │
        │ Timestamp: 5.0s     │
        └─────────────────────┘
                │
                ▼
        Publish to RabbitMQ
        (Single message vs 50)

Result:
  50 individual events → 1 batched event
  Reduces queue load by 50x
  RabbitMQ subscribers process once


Alternative scenario (large batch):
  
  Deltas arriving rapidly...
  
  t=0.1s   ► C1 added
  t=0.15s  ► C2 added
  ...
  t=0.95s  ► C100 added
  
  Buffer size reaches 100!
  
  ► IMMEDIATE FLUSH (don't wait for timeout)
  
  Publish Batch #1: [C1...C100]
  Clear buffer and continue...
  
  t=1.0s   ► C101 added
  ...
  (repeat)
```

## Static vs Dynamic Segment Behavior

```
Dynamic Segment                    Static Segment
┌──────────────────┐              ┌──────────────────┐
│  Active Buyers   │              │ March Campaign   │
│   (DYNAMIC)      │              │   (STATIC)       │
└────────┬─────────┘              └────────┬─────────┘
         │                                │
    Data Changes:                  Data Changes:
    • New purchase                 • New purchase
    • Profile update               • Profile update
    • Time passage                 • Time passage
         │                                │
         ▼                                ▼
    ┌─────────────┐            ┌──────────────────┐
    │ Evaluate    │            │ Check: Was       │
    │ rules       │            │ lastEvaluatedAt │
    │             │            │ set?            │
    ├─────────────┤            └────────┬─────────┘
    │ Members:    │                     │
    │ • C1, C2, C5│                 Yes ├─► Skip update
    │             │                     │   (FROZEN)
    ├─────────────┤                     │
    │ vs Previous │                 No  ├─► First eval
    │ • C1, C3    │                     │   (ALLOWED)
    │             │                     │
    ├─────────────┤            ┌────────▼─────────┐
    │ Delta:      │            │ Evaluate rules   │
    │ • ADDED: C2 │            │ Set snapshot     │
    │ • ADDED: C5 │            │                  │
    │ • REMOVED:  │            ├──────────────────┤
    │   C3        │            │ Members: C1, C2  │
    └──────┬──────┘            │ LOCKED until     │
           │                   │ manual refresh   │
           ▼                   └──────┬───────────┘
    Publish Delta                     │
           │                          ▼
    ┌──────┴───────┐           No auto-update!
    │              │           Membership
    ▼              ▼           stays constant
   UI Updates  Campaigns
               Notified
```

## System Capacity & Load Handling

```
┌─────────────────────────────────────────────────────┐
│ Load Scenario: 1000 customers change status         │
│ Affects: Active Buyers segment                      │
└─────────────────────────────────────────────────────┘

Without Batching:              With Batching:
─────────────────              ──────────────
1000 delta events              Batch 1: [1-100]
  │                            Batch 2: [101-200]
  ├─ Event 1: [C1]             Batch 3: [201-300]
  ├─ Event 2: [C2]             ... (10 batches)
  ├─ Event 3: [C3]             Batch 10: [901-1000]
  ... (998 more)               │
  │                            ├─ All batches queued
  │                            │  in 5 seconds
  ├─ RabbitMQ Queue            │
  │  (1000 messages)           ├─ RabbitMQ receives
  │                            │  10 messages
  ├─ Subscribers               │
  │  process 1000x             ├─ Subscribers process
  │                            │  10 times
  ├─ System Load: HIGH          │
  │  (throttling risk)          ├─ System Load: LOW
  │                            │  (efficient)
  └─ Result: Delays,           │
     potential packet loss     └─ Result: Smooth,
                                  reliable delivery

Efficiency Gain: 100x reduction in message count
```

---

## Key Architectural Principles

1. **Scalability**: Stateless API, distributed components
2. **Reliability**: Persistent queues, database transactions
3. **Real-time**: Event-driven architecture with minimal latency
4. **Maintainability**: Clear separation of concerns
5. **Observability**: Structured logging and monitoring
6. **Flexibility**: Rule engine supports various segment types
