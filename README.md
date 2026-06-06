# Drift Happens

A real-time dynamic segment management system that tracks precise customer membership changes and propagates them across dependent services.

## What It Does

When customer data changes — a new purchase, a period of inactivity, a profile update — this system identifies exactly which customers entered or left a segment and notifies all interested services in real time. No vague "something changed" alerts, just precise deltas.

## Key Features

- **Precise delta tracking** — Know exactly who was added and who was removed, every time
- **Dynamic & static segments** — Auto-updating segments alongside manually controlled ones
- **Cascading updates** — When one segment changes, dependent segments automatically re-evaluate
- **Smart batching** — Groups up to 100 changes or 5 seconds of activity before publishing, reducing message traffic by 100x
- **Bulk operation handling** — Processes up to 50,000 record changes without flooding the queue
- **Real-time propagation** — UI, campaign systems, and analytics all receive updates as they happen
- **Built-in simulation** — Campaign simulator reacts to changes live for easy testing

## Architecture

Data Change → Segment Evaluation → Delta Calculation → Batching → Message Queue → Consumers

Changes flow through evaluation, delta detection, and batching before hitting RabbitMQ, which fans them out to the UI, campaign simulator, and any dependent segments.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular |
| Backend | NestJS |
| Database | PostgreSQL |
| Cache & Batching | Redis |
| Message Queue | RabbitMQ |
| Search | Elasticsearch |
| Infrastructure | Docker Compose |

## Quick Start

# Clone and start everything
cd "Drift Happens"
docker-compose up

# In another terminal, seed the database
docker-compose exec api npm run seed

Then visit the frontend at http://localhost:4200, the API at http://localhost:3000/segments, or RabbitMQ Admin at http://localhost:15672 (admin / admin123).

## Demo Scenarios

- **Customer purchase:** Customer makes a purchase → Added to "Active Buyers" → UI updates instantly → Campaign simulator logs the notification. 
- **Customer inactivity:** Customer goes inactive for 30+ days → Removed from "Active Buyers" → Churn event logged. 
- **Cascading updates:** VIP segment changes → "VIP At Risk" segment auto-re-evaluates → Both publish independent deltas. 
- **Bulk import:** Bulk import of 500 customers → Batched into ~5 events → Queue stays healthy → UI updates smoothly. 
- **Static segments:** Static segment stays frozen → "March Campaign" ignores all data changes → Only updates on manual refresh.

## API at a Glance

# Create a dynamic segment
curl -X POST http://localhost:3000/segments \
  -H "Content-Type: application/json" \
  -d '{"name":"Active Buyers","type":"DYNAMIC","rules":[{"field":"lastTransactionDays","operator":"<=","value":30}]}'

# Trigger evaluation
curl -X POST http://localhost:3000/segments/{id}/evaluate

# Check what changed
curl http://localhost:3000/segments/{id}/deltas

# View current members
curl http://localhost:3000/segments/{id}/members

### Seed Data
Five demo customers come pre-loaded, ranging from very active ($6,000 spent) to long-term inactive ($1,000 spent, 90+ days idle). Five segments are pre-configured to demonstrate dynamic rules, static membership, and cascading dependencies.

## Watching It Work

The campaign simulator logs every delta it receives:
docker-compose logs -f simulator

## Troubleshooting

| Problem | Fix |
|---|---|
| No segments in UI | docker-compose exec api npm run seed |
| Port conflicts | docker-compose down && docker-compose up |
| RabbitMQ won't connect | docker-compose restart rabbitmq api |
| Full reset | docker-compose down -v && docker-compose up --build |

## Scalability

- Batching keeps message volume low under heavy load
- Horizontal scaling via multiple API instances behind a load balancer
- Read replicas for distributing database queries
- RabbitMQ clustering for message queue high availability
