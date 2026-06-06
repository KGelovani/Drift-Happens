# 📑 Project Index

## 🚀 START HERE

1. **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
2. **[DELIVERY_SUMMARY.md](DELIVERY_SUMMARY.md)** - See what was built
3. **[README.md](README.md)** - Comprehensive overview

---

## 📚 Documentation

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Quick setup guide with commands
- **[README.md](README.md)** - Full project overview, features, examples

### Technical Deep Dives
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - 12 architectural decision logs with trade-offs
- **[docs/ARCHITECTURE_DIAGRAMS.md](docs/ARCHITECTURE_DIAGRAMS.md)** - Visual system diagrams and flows
- **[docs/API.md](docs/API.md)** - Complete API endpoint reference with examples
- **[docs/DEBUGGING.md](docs/DEBUGGING.md)** - Troubleshooting guide

### Project Status
- **[DELIVERY_SUMMARY.md](DELIVERY_SUMMARY.md)** - What was delivered, acceptance criteria met

---

## 🗂️ Project Structure

```
Drift Happens/
├── backend/                    NestJS API
│   ├── src/
│   │   ├── segments/          Core segment logic
│   │   ├── delta/             Delta calculation & batching
│   │   ├── messaging/         RabbitMQ integration
│   │   ├── customers/         Customer entity
│   │   ├── database/          TypeORM & seed
│   │   └── main.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   Angular UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    Segment dashboard
│   │   │   └── services/      API & notifications
│   │   ├── main.ts
│   │   └── index.html
│   ├── Dockerfile
│   └── package.json
│
├── simulator/                  Campaign consumer
│   ├── src/
│   │   └── index.ts           RabbitMQ listener
│   └── package.json
│
├── docker/
│   └── postgres-init.sql       Database init script
│
├── docs/
│   ├── ARCHITECTURE.md         12 ADRs
│   ├── ARCHITECTURE_DIAGRAMS.md Visual diagrams
│   ├── API.md                  REST API reference
│   └── DEBUGGING.md            Troubleshooting
│
├── docker-compose.yml          Complete orchestration
├── package.json                Root workspace
├── README.md                   Full guide
├── QUICKSTART.md               Quick setup
├── DELIVERY_SUMMARY.md         What was built
├── .env.example                Configuration template
└── .gitignore
```

---

## 🚀 Quick Commands

```bash
# Start everything
docker-compose up

# Seed database
docker-compose exec api npm run seed

# View logs
docker-compose logs -f

# Access services
# Frontend: http://localhost:4200
# API: http://localhost:3000/segments
# RabbitMQ: http://localhost:15672 (admin/admin123)
```

---

## 📖 Feature Overview

### What's Included

| Feature | Details |
|---------|---------|
| **Segments** | Dynamic (auto-update) & Static (frozen) |
| **Delta Detection** | Precise added/removed tracking |
| **Cascading Updates** | Dependent segments auto-update |
| **Batching** | Dual-trigger (size/timeout) for efficiency |
| **Real-time Events** | RabbitMQ pub/sub pattern |
| **Simulator** | Campaign consumer example |
| **API** | 7 REST endpoints for CRUD & evaluation |
| **UI** | Angular dashboard |
| **Database** | PostgreSQL with seed data |
| **Seed Data** | 5 customers, 5 segments |

### Seed Data

**Customers:**
- John Doe ($5,500 purchases, VIP)
- Jane Smith ($3,000 purchases, active)
- Bob Wilson ($2,000 purchases, recently inactive)
- Alice Brown ($1,000 purchases, long-term inactive)
- Charlie Davis ($6,000 purchases, very active)

**Segments:**
1. Active Buyers (Dynamic)
2. VIP Clients (Dynamic)
3. Risk Group (Dynamic)
4. March Campaign (Static)
5. VIP At Risk (Dynamic, Dependent)

---

## 🔗 Tech Stack

### Backend
- **NestJS** 10 - Framework
- **TypeORM** - Database ORM
- **PostgreSQL** 15 - Database
- **RabbitMQ** 3.12 - Message queue
- **Redis** 7 - Caching & batching
- **Elasticsearch** 8.9 - Logs

### Frontend
- **Angular** 17 - Framework
- **RxJS** - Reactive programming
- **TypeScript** - Type safety
- **CSS** - Styling

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **PostgreSQL** - Database
- **RabbitMQ** - Event system
- **Redis** - Cache layer

---

## 🎯 Acceptance Criteria (All Met ✓)

- [x] 3+ dynamic segments + 1 static segment
- [x] One segment uses another as filter
- [x] Delta calculation (added/removed)
- [x] Change signals to 2+ consumer types
- [x] Cascading updates work
- [x] Static segments don't auto-update
- [x] Large updates processed in chunks
- [x] Simulation capability included

---

## 📝 API Examples

### Create Segment
```bash
curl -X POST http://localhost:3000/segments \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"DYNAMIC","rules":[]}'
```

### Evaluate Segment
```bash
curl -X POST http://localhost:3000/segments/{id}/evaluate
```

### List Members
```bash
curl "http://localhost:3000/segments/{id}/members?limit=10"
```

### Get Deltas
```bash
curl http://localhost:3000/segments/{id}/deltas
```

### Complete Examples
See [docs/API.md](docs/API.md) for full reference

---

## 🏗️ Architecture Highlights

### Data Flow
```
Data Change
    ↓
Evaluate Segment
    ↓
Calculate Delta (Added/Removed)
    ↓
Batch if needed
    ↓
Publish to RabbitMQ
    ↓
Subscribers React (UI, Campaigns, Analytics)
    ↓
Cascading: Dependent segments update
```

### Batching Strategy
- **Size Trigger**: 100 records
- **Timeout**: 5 seconds
- **Effect**: 500 events → 5 batched events
- **Benefit**: 100x reduction in queue messages

### Cascading Mechanism
```
Parent segment changes
    ↓
Find dependent segments
    ↓
Re-evaluate each dependent
    ↓
Calculate their deltas
    ↓
Publish delta events
    ↓
Recursively update their dependents
```

---

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs

# Common issues:
docker-compose down -v
docker-compose up --build
```

### No Segments Showing
```bash
# Seed database
docker-compose exec api npm run seed
```

### Port Already in Use
```bash
# Kill process or use different port
lsof -i :{PORT}
kill -9 {PID}
```

See [docs/DEBUGGING.md](docs/DEBUGGING.md) for more troubleshooting.

---

## 📞 Support

### Documentation
- **Quick Setup**: [QUICKSTART.md](QUICKSTART.md)
- **Full Guide**: [README.md](README.md)
- **API Docs**: [docs/API.md](docs/API.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Debugging**: [docs/DEBUGGING.md](docs/DEBUGGING.md)

### Commands
```bash
# Start: docker-compose up
# Seed: docker-compose exec api npm run seed
# Logs: docker-compose logs -f
# Stop: docker-compose down
```

### Next Steps
1. Run `docker-compose up`
2. Seed with `docker-compose exec api npm run seed`
3. Open http://localhost:4200
4. Create/evaluate segments
5. Watch simulator logs
6. Read architecture docs

---

## 🎉 Status

✅ **Complete & Ready**

- [x] All components built
- [x] Seed data included
- [x] Docker Compose configured
- [x] API endpoints working
- [x] Frontend UI functional
- [x] Simulator operational
- [x] Documentation comprehensive
- [x] Acceptance criteria met

**Total Files**: 50+  
**Lines of Code**: 5000+  
**Documentation Pages**: 6  
**Components**: 6 (Frontend, Backend, Simulator, DB, Queue, Cache)  
**Seed Records**: 10 (5 customers, 5 segments)  

---

**Start with [QUICKSTART.md](QUICKSTART.md) for immediate setup!**

Last Updated: June 6, 2026
