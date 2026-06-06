# Drift Happens - Dynamic Segment Management System

## 📋 Problem Overview
In Optio, segments are customer groups defined by business rules. Two types exist: Dynamic segments (auto-update as customer data changes) and Static segments (fixed membership, only updates manually). The challenge: when customer data changes (transactions, time passing, profile updates), we need to track EXACTLY who was added/removed (delta), not just "changed". This delta must propagate to subscribers (UI, campaigns, dependent segments) without creating noise during bulk updates.

## ✅ Acceptance Criteria Met
✓ 3+ dynamic segments + 1 static segment with different rules ✓ One segment uses another as filter (cascading updates) ✓ System calculates precise deltas (ADDED/REMOVED) ✓ Change signals reach 2+ consumer types with delta data ✓ Cascading updates work between dependent segments ✓ Static segments don't auto-update (manual refresh only) ✓ Large changes (50K records) processed in chunks ✓ Simulation capability for testing

## 🏗️ Architecture & Tech Stack
Tech Stack: Angular, NestJS, PostgreSQL, RabbitMQ, Redis, Elasticsearch, Docker Compose. Data Flow: Data Change → Segment Evaluation → Delta Calculation → Batching (100 records OR 5 sec) → RabbitMQ Exchange → UI Push / Campaign Simulator / Dependent Segments. Batching Strategy: Accumulates deltas in Redis, flushes at 100 records OR 5 seconds timeout. Result: 500 events → 5 batched events (100x reduction). Cascading Updates: Segment A (Parent) changes → Segment B (uses A as filter) auto-re-evaluates → Segment B's own deltas calculated and published.

## 🚀 Quick Start
Prerequisites: Docker & Docker Compose, 4GB+ RAM. Installation: cd "Drift Happens", docker-compose up, then in another terminal: docker-compose exec api npm run seed. Access Points: Frontend: http://localhost:4200, API: http://localhost:3000/segments, RabbitMQ Admin: http://localhost:15672 (admin/admin123).

## 🎮 Demo Scenarios
1. Customer Makes Purchase: Customer enters "Active Buyers" → System publishes ADDED [customer-id] → UI updates, campaign simulator logs notification. 2. Time Passes (30+ days inactive): Customer leaves "Active Buyers" → System publishes REMOVED [customer-id] → Analytics logs churn event. 3. Cascading Update: "VIP Clients" changes → Dependent "VIP At Risk" auto-re-evaluates → Both segments publish their own deltas. 4. Bulk Import (500 customers): System batches into ~5 events → No queue overload → UI shows incremental updates. 5. Static Segment Protection: "March Campaign" remains frozen → Data changes don't affect membership → Manual refresh required.

## 🔌 API Examples
Create segment: curl -X POST http://localhost:3000/segments -H "Content-Type: application/json" -d '{"name":"Active Buyers","type":"DYNAMIC","rules":[{"field":"lastTransactionDays","operator":"<=","value":30}]}' Evaluate segment: curl -X POST http://localhost:3000/segments/{id}/evaluate Get deltas: curl http://localhost:3000/segments/{id}/deltas Get members: curl http://localhost:3000/segments/{id}/members

## 📊 Seed Data
Customers (5 demo profiles): John Doe ($5,500, active), Jane Smith ($3,000, active), Bob Wilson ($2,000, recently inactive), Alice Brown ($1,000, long-term inactive), Charlie Davis ($6,000, very active). Segments (5 pre-configured): Active Buyers (Dynamic - last transaction ≤ 30 days), VIP Clients (Dynamic - total purchases > $5,000), Risk Group (Dynamic - inactive 90+ days), March Campaign (Static - fixed campaign audience), VIP At Risk (Dynamic + Dependent - VIP ∩ inactive 30+ days).

## 🧪 Simulation
The system includes a Campaign Simulator that listens for deltas and reacts. Watch it: docker-compose logs -f simulator. Output example: "📬 Delta: Segment 'Active Buyers' - ADDED: 3 customers → 📧 Sending welcome notifications to 3 new members"

## 📁 Project Structure
Drift Happens/ → backend/ (NestJS API: delta calc, batching, RabbitMQ), frontend/ (Angular UI: dashboard, real-time updates), simulator/ (Campaign consumer), docker/ (Postgres init), docs/ (Architecture decisions, API docs)

## 🐛 Troubleshooting
No segments in UI: docker-compose exec api npm run seed. Port already in use: docker-compose down && docker-compose up. RabbitMQ connection refused: docker-compose restart rabbitmq api. Full reset: docker-compose down -v && docker-compose up --build

## 📈 Scalability
Batching: 100 records / 5s timeout. Horizontal scaling: Multiple API instances + Redis cluster. Database: PostgreSQL replicas for read distribution. Message queue: RabbitMQ cluster for HA.

---
Built for Optio technical assignment - Real-time segment delta detection and propagation
