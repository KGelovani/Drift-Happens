# 🐛 Debugging Guide

## Common Issues & Solutions

### Backend Issues

#### Error: "connect ECONNREFUSED 127.0.0.1:5432"
**Problem**: PostgreSQL not running

**Solutions**:
```bash
# Start PostgreSQL
docker-compose up postgres -d

# Check if running
docker-compose ps postgres

# View logs
docker-compose logs postgres
```

#### Error: "connect ECONNREFUSED 127.0.0.1:5672"
**Problem**: RabbitMQ not running

**Solutions**:
```bash
# Start RabbitMQ
docker-compose up rabbitmq -d

# Access admin UI
# http://localhost:15672 (admin/admin123)

# Check logs
docker-compose logs rabbitmq
```

#### Error: "Segment not found"
**Problem**: ID doesn't exist or database not seeded

**Solutions**:
```bash
# Seed database
docker-compose exec api npm run seed

# Verify data exists
docker-compose exec postgres psql -U drift_user -d drift_db -c "SELECT COUNT(*) FROM segments;"
```

#### Error: "Failed to connect to RabbitMQ"
**Problem**: Messaging service can't initialize

**Solutions**:
1. Ensure RabbitMQ is healthy: `docker-compose ps`
2. Check queues exist: Visit http://localhost:15672/api/queues
3. Restart RabbitMQ: `docker-compose restart rabbitmq`

### Frontend Issues

#### Segments list is empty
**Problem**: API not seeded or not connected

**Solutions**:
```bash
# Seed database
docker-compose exec api npm run seed

# Check API is running
curl http://localhost:3000/segments

# Check frontend API_URL env var
docker-compose logs ui | grep API
```

#### CORS errors
**Problem**: Frontend can't reach backend

**Error in console**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions**:
- Ensure backend has CORS enabled (`app.enableCors()`)
- Check frontend is hitting correct API URL
- Restart both services

#### UI not updating after evaluate
**Problem**: Real-time notifications not working

**Causes**:
1. RabbitMQ not publishing events
2. WebSocket/SSE connection not established
3. Simulator not running

**Debug**:
```bash
# Check RabbitMQ messages
docker-compose exec rabbitmq rabbitmqctl list_queues
docker-compose logs simulator
```

### Database Issues

#### Migrations not applied
**Problem**: Tables don't exist

**Solutions**:
```bash
# Force synchronize (development only!)
docker-compose exec api npm run typeorm:run:migrations

# Or re-seed
docker-compose exec postgres psql -U drift_user -d drift_db < docker/postgres-init.sql
docker-compose exec api npm run seed
```

#### Connection timeout
**Problem**: Can't connect to database

**Check**:
```bash
# Verify PostgreSQL is running
docker-compose exec postgres pg_isready -U drift_user

# Test connection
docker-compose exec postgres psql -U drift_user -d drift_db -c "SELECT NOW();"
```

### Docker Issues

#### Container won't start
**Error**: `exit code 1`

**Solutions**:
```bash
# View logs
docker-compose logs {service}

# Remove container and rebuild
docker-compose rm {service}
docker-compose up {service} --build

# Nuclear option: clean everything
docker-compose down -v
docker-compose up --build
```

#### Port already in use
**Error**: `Bind for 0.0.0.0:4200 failed`

**Solutions**:
```bash
# Find what's using port 4200
lsof -i :4200

# Kill process
kill -9 {PID}

# Or use different port
PORT=4201 docker-compose up ui
```

#### Out of memory
**Error**: `OOMKilled`

**Solutions**:
- Increase Docker memory: Docker Desktop settings → Resources
- Reduce batch size in code
- Restart containers: `docker-compose restart`

## Debugging Techniques

### View Real-time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 simulator

# Filter by timestamp
docker-compose logs --since 2026-06-06T12:00:00 api
```

### Database Inspection

```bash
# Connect to database
docker-compose exec postgres psql -U drift_user -d drift_db

# Common queries
SELECT * FROM segments;
SELECT * FROM customers;
SELECT COUNT(*) FROM segment_memberships;
SELECT * FROM segment_deltas ORDER BY created_at DESC LIMIT 10;

# Check indexes
\d+ segments
```

### RabbitMQ Inspection

```bash
# Admin UI
http://localhost:15672 (admin/admin123)

# CLI commands
docker-compose exec rabbitmq rabbitmqctl list_queues
docker-compose exec rabbitmq rabbitmqctl list_bindings
docker-compose exec rabbitmq rabbitmqctl list_connections

# Purge queue (careful!)
docker-compose exec rabbitmq rabbitmqctl purge_queue segment-delta.campaigns
```

### Redis Inspection

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Commands
KEYS *              # List all keys
GET key-name        # Get value
TTL key-name        # Time to live
FLUSHALL            # Clear all (careful!)
```

### API Testing

```bash
# Test if API is running
curl http://localhost:3000/

# Test segments endpoint
curl http://localhost:3000/segments | jq

# Test with specific ID
curl http://localhost:3000/segments/{uuid} | jq

# POST test
curl -X POST http://localhost:3000/segments \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"DYNAMIC","rules":[]}'
```

### Network Debugging

```bash
# Check if services can reach each other
docker-compose exec api ping redis
docker-compose exec api ping postgres
docker-compose exec api ping rabbitmq

# View network
docker network ls
docker network inspect drift-network
```

## Performance Debugging

### Slow Segment Evaluation

**Symptoms**: Evaluation takes > 5 seconds

**Debug**:
```bash
# Check database indices
docker-compose exec postgres psql -U drift_user -d drift_db
\d+ customers
\d+ segment_memberships

# Check query performance
EXPLAIN ANALYZE SELECT * FROM customers WHERE total_purchases > 5000;
```

**Fixes**:
- Add missing indices
- Simplify rules
- Limit customer scan

### High Memory Usage

**Symptoms**: Container crashes with OOMKilled

**Debug**:
```bash
# Monitor memory
docker stats

# Check what's consuming memory
# Usually: API batch accumulation or large queries
```

**Fixes**:
- Reduce batch size (in batching.service.ts)
- Add memory limit: `docker-compose` memory reservation
- Paginate queries

### RabbitMQ Queue Backlog

**Symptoms**: Messages accumulating in queue

**Debug**:
```bash
# Check queue lengths
docker-compose exec rabbitmq rabbitmqctl list_queues

# Check consumer count
docker-compose exec rabbitmq rabbitmqctl list_consumers
```

**Fixes**:
- Start more consumer instances
- Increase batch timeout
- Optimize subscriber processing

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads and displays UI
- [ ] Segments list shows 5 seed segments
- [ ] Can create new segment
- [ ] Can evaluate segment
- [ ] Deltas appear in database
- [ ] RabbitMQ shows published events
- [ ] Simulator logs segment changes
- [ ] UI updates in real-time (if implemented)
- [ ] All 5 segments have correct member counts

## Useful Commands

```bash
# Reset everything
docker-compose down -v && docker-compose up

# Rebuild images
docker-compose build --no-cache

# Run migrations
docker-compose exec api npm run typeorm:run:migrations

# Seed data
docker-compose exec api npm run seed

# View all services
docker-compose ps

# Attach to service
docker-compose exec api bash

# Kill service
docker-compose kill api

# View resource usage
docker stats

# Clean up unused containers
docker container prune

# View detailed service info
docker-compose logs -f --timestamps {service}
```

## Still Stuck?

1. Check Docker logs for error messages
2. Verify all services are running: `docker-compose ps`
3. Test connectivity: `docker-compose exec api ping postgres`
4. Verify database exists: `docker-compose exec postgres psql -l`
5. Rebuild and restart: `docker-compose down -v && docker-compose up --build`
6. Check memory/CPU: `docker stats`
7. Review code for obvious errors
