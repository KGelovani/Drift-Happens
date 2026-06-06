# ⚡ Quick Start Guide

## 30-Second Setup

```bash
cd "C:\Users\Kesaria\Desktop\Drift Happens"
docker-compose up
```

Wait for all services to start (2-3 minutes). Then:

```bash
docker-compose exec api npm run seed
```

Open browser:
- **Frontend**: http://localhost:4200
- **API Docs**: http://localhost:3000/segments
- **RabbitMQ Admin**: http://localhost:15672 (admin/admin123)

## What You Get

### 5 Demo Segments (Pre-seeded)
1. **Active Buyers** (Dynamic) - Customers with purchases in last 30 days
2. **VIP Clients** (Dynamic) - Total purchases > $5,000
3. **Risk Group** (Dynamic) - Inactive 90+ days
4. **March Campaign** (Static) - Fixed campaign audience
5. **VIP At Risk** (Dynamic) - VIP members inactive 30+ days

### 5 Demo Customers
- John Doe (VIP, Active)
- Jane Smith (Active)
- Bob Wilson (Recently Inactive)
- Alice Brown (Long-term Inactive)
- Charlie Davis (Very Active, VIP)

## Testing Workflow

### 1. View Segments
```bash
# Browser
http://localhost:4200

# Or via API
curl http://localhost:3000/segments | jq
```

### 2. Evaluate a Segment
```bash
# Get segment ID from list, then:
curl -X POST http://localhost:3000/segments/{id}/evaluate | jq

# Expected: Array of delta events (ADDED and REMOVED)
```

### 3. Check Delta Events
```bash
curl http://localhost:3000/segments/{id}/deltas | jq
```

### 4. View Members
```bash
curl "http://localhost:3000/segments/{id}/members?limit=10" | jq
```

### 5. Watch Simulator React
```bash
# Terminal already shows simulator logs
docker-compose logs -f simulator

# Create/evaluate a segment in another terminal
# Watch simulator react to the delta
```

## Key Features Demo

### Dynamic Segment Evaluation
```bash
# Segment rules auto-adapt to data
curl -X POST http://localhost:3000/segments/[active-buyers-id]/evaluate

# See who was added/removed
curl http://localhost:3000/segments/[active-buyers-id]/deltas
```

### Cascading Updates
```bash
# Evaluate parent segment (VIP Clients)
curl -X POST http://localhost:3000/segments/[vip-id]/evaluate

# Dependent segment (VIP At Risk) automatically updates
curl http://localhost:3000/segments/[vip-at-risk-id]/deltas

# Both generate delta events
```

### Batching in Action
```bash
# Import 1000 customers → Batched into ~10 events
# (not shown in demo, but configured)
```

### Static Segment Protection
```bash
# March Campaign (Static) won't auto-update
# Try to evaluate it:
curl -X POST http://localhost:3000/segments/[march-campaign-id]/evaluate

# Returns empty deltas (unchanged)
```

## Commands Reference

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Seed database
docker-compose exec api npm run seed

# Access PostgreSQL
docker-compose exec postgres psql -U drift_user -d drift_db

# Access RabbitMQ admin
http://localhost:15672

# Restart specific service
docker-compose restart api

# Full reset
docker-compose down -v
docker-compose up --build
```

## Troubleshooting Quick Fixes

**"Cannot GET /segments"**
```bash
# API not running, check logs
docker-compose logs api
docker-compose restart api
```

**"No segments showing in UI"**
```bash
# Database not seeded
docker-compose exec api npm run seed
```

**"Port 4200 already in use"**
```bash
# Kill existing process or use different port
lsof -i :4200
kill -9 {PID}
```

**"RabbitMQ connection refused"**
```bash
# Wait for RabbitMQ to start (takes ~30s)
docker-compose logs rabbitmq
# Once healthy, restart API
docker-compose restart api
```

## Next Steps

1. **Create Custom Segment** - Try POST to `/segments` with different rules
2. **Explore API** - Use cURL or Postman to test endpoints
3. **Monitor Events** - Watch RabbitMQ admin UI for published events
4. **Check Simulator** - See campaign simulator react to deltas
5. **Review Code** - Backend: `backend/src/segments/`, Frontend: `frontend/src/app/`

## Files to Explore

- **Backend Architecture**: [backend/src/segments/](../backend/src/segments)
- **API Docs**: [docs/API.md](../docs/API.md)
- **Architecture Decisions**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **Detailed Diagrams**: [docs/ARCHITECTURE_DIAGRAMS.md](../docs/ARCHITECTURE_DIAGRAMS.md)
- **Debugging Guide**: [docs/DEBUGGING.md](../docs/DEBUGGING.md)

## Example: Complete Flow

```bash
# 1. Get segment ID
SEGMENT_ID=$(curl http://localhost:3000/segments | jq -r '.[0].id')

# 2. Evaluate
curl -X POST http://localhost:3000/segments/$SEGMENT_ID/evaluate | jq

# 3. Check deltas
curl http://localhost:3000/segments/$SEGMENT_ID/deltas | jq

# 4. Check members
curl http://localhost:3000/segments/$SEGMENT_ID/members | jq

# 5. Watch logs
docker-compose logs -f simulator
```

## Architecture at a Glance

```
User → Angular UI → NestJS API → PostgreSQL (Data)
                      ↓
                   RabbitMQ (Events)
                      ↓
              Campaign Simulator (Reaction)
                      
                   + Redis (Batching)
                   + Elasticsearch (Logs)
```

---

**🎉 Ready? Run `docker-compose up` and start exploring!**
