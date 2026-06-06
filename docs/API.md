# 📚 API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently no authentication. Production should add JWT middleware.

## Response Format

All responses are JSON:

```json
{
  "data": {},
  "error": null,
  "timestamp": "2026-06-06T12:00:00Z"
}
```

---

## Segments Endpoints

### Create Segment

**Endpoint**: `POST /segments`

**Request Body**:
```json
{
  "name": "Active Buyers",
  "description": "Customers with purchases in last 30 days",
  "type": "DYNAMIC",
  "rules": [
    {
      "field": "lastTransactionDaysAgo",
      "operator": "<=",
      "value": 30
    }
  ],
  "parentSegmentId": null
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid-123",
  "name": "Active Buyers",
  "description": "...",
  "type": "DYNAMIC",
  "rules": [...],
  "memberCount": 0,
  "isActive": true,
  "createdAt": "2026-06-06T12:00:00Z",
  "updatedAt": "2026-06-06T12:00:00Z"
}
```

**Field Definitions**:
- `name`: String, required, unique
- `description`: String, optional
- `type`: "DYNAMIC" or "STATIC", required
- `rules`: Array of rule objects
  - `field`: "lastTransactionDaysAgo", "totalPurchases", "status"
  - `operator`: ">=", "<=", ">", "<", "="
  - `value`: Number or string
- `parentSegmentId`: UUID of parent segment (for dependent segments)

---

### List All Segments

**Endpoint**: `GET /segments`

**Query Parameters**: None

**Response**: `200 OK`
```json
[
  {
    "id": "uuid-1",
    "name": "Active Buyers",
    "type": "DYNAMIC",
    "memberCount": 42,
    "isActive": true
  },
  {
    "id": "uuid-2",
    "name": "VIP Clients",
    "type": "DYNAMIC",
    "memberCount": 15,
    "isActive": true
  }
]
```

---

### Get Segment Details

**Endpoint**: `GET /segments/{id}`

**Parameters**:
- `id`: UUID of segment (required)

**Response**: `200 OK`
```json
{
  "id": "uuid-123",
  "name": "Active Buyers",
  "description": "...",
  "type": "DYNAMIC",
  "rules": [...],
  "parentSegmentId": null,
  "memberCount": 42,
  "lastEvaluatedAt": "2026-06-06T12:00:00Z",
  "isActive": true,
  "createdAt": "2026-06-06T12:00:00Z",
  "updatedAt": "2026-06-06T12:00:00Z",
  "memberships": [
    {
      "id": "membership-1",
      "customerId": "cust-1",
      "joinedAt": "2026-06-05T10:00:00Z"
    }
  ]
}
```

---

### Evaluate Segment

**Endpoint**: `POST /segments/{id}/evaluate`

Triggers delta calculation and publishes to RabbitMQ.

**Parameters**:
- `id`: UUID of segment (required)

**Response**: `200 OK`
```json
[
  {
    "id": "delta-1",
    "segmentId": "segment-123",
    "type": "ADDED",
    "customerIds": ["cust-1", "cust-2", "cust-3"],
    "count": 3,
    "processed": false,
    "createdAt": "2026-06-06T12:00:00Z"
  },
  {
    "id": "delta-2",
    "segmentId": "segment-123",
    "type": "REMOVED",
    "customerIds": ["cust-4"],
    "count": 1,
    "processed": false,
    "createdAt": "2026-06-06T12:00:00Z"
  }
]
```

---

### Get Segment Members

**Endpoint**: `GET /segments/{id}/members`

**Parameters**:
- `id`: UUID of segment (required)
- `limit`: Number, default 100, max 1000
- `offset`: Number, default 0

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "cust-1",
      "email": "john@example.com",
      "name": "John Doe",
      "status": "ACTIVE",
      "totalPurchases": "5500.00",
      "lastTransactionAt": "2026-05-20T10:00:00Z"
    }
  ],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

---

### Get Segment Deltas

**Endpoint**: `GET /segments/{id}/deltas`

Lists historical delta events for a segment.

**Parameters**:
- `id`: UUID of segment (required)

**Response**: `200 OK`
```json
[
  {
    "id": "delta-1",
    "segmentId": "segment-123",
    "type": "ADDED",
    "customerIds": ["cust-1", "cust-2"],
    "count": 2,
    "metadata": {
      "timestamp": "2026-06-06T12:00:00Z"
    },
    "processed": true,
    "createdAt": "2026-06-06T12:00:00Z"
  }
]
```

---

### Delete Segment

**Endpoint**: `DELETE /segments/{id}`

**Parameters**:
- `id`: UUID of segment (required)

**Response**: `204 No Content`

---

## Rule Definitions

### Available Fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `lastTransactionDaysAgo` | number | 30 | Days since last purchase |
| `totalPurchases` | decimal | 5000 | Total purchase amount |
| `status` | string | "ACTIVE" | Customer status |

### Available Operators

| Operator | Supported Fields |
|----------|------------------|
| `>` | lastTransactionDaysAgo, totalPurchases |
| `>=` | lastTransactionDaysAgo, totalPurchases |
| `<` | lastTransactionDaysAgo, totalPurchases |
| `<=` | lastTransactionDaysAgo, totalPurchases |
| `=` | status, totalPurchases |

### Example Rules

```json
// Customers inactive for 30+ days
{
  "field": "lastTransactionDaysAgo",
  "operator": ">=",
  "value": 30
}

// High-value customers
{
  "field": "totalPurchases",
  "operator": ">",
  "value": 5000
}

// Active status
{
  "field": "status",
  "operator": "=",
  "value": "ACTIVE"
}
```

---

## Event Messages

### Delta Event (RabbitMQ)

**Exchange**: `segment-delta`  
**Routing Key**: `segment.delta.{segment-id}`  
**Queues**: 
- `segment-delta.ui`
- `segment-delta.campaigns`
- `segment-delta.analytics`

**Message Format**:
```json
{
  "segmentId": "segment-123",
  "delta": {
    "id": "delta-1",
    "type": "ADDED",
    "customerIds": ["cust-1", "cust-2"],
    "count": 2
  },
  "timestamp": "2026-06-06T12:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request body",
  "details": "Field 'name' is required"
}
```

### 404 Not Found

```json
{
  "error": "Segment not found",
  "segmentId": "invalid-uuid"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "requestId": "req-123"
}
```

---

## Rate Limiting

Currently not implemented. Production should add:
- 1000 requests/minute per IP
- 10 segment evaluations/minute per IP

---

## Pagination

List endpoints support pagination via `limit` and `offset`:

```bash
# Get first 100 records
GET /segments/{id}/members?limit=100&offset=0

# Get next 100 records
GET /segments/{id}/members?limit=100&offset=100
```

---

## Sorting

Deltas are returned sorted by creation date (newest first):

```
GET /segments/{id}/deltas
→ Returns deltas ordered by createdAt DESC
```

---

## Timestamps

All timestamps are in ISO 8601 format with timezone:

```
2026-06-06T12:00:00Z
2026-06-06T12:00:00+02:00
```

---

## Testing with cURL

### Create Segment
```bash
curl -X POST http://localhost:3000/segments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Segment",
    "description": "For testing",
    "type": "DYNAMIC",
    "rules": [{"field": "status", "operator": "=", "value": "ACTIVE"}]
  }'
```

### List Segments
```bash
curl http://localhost:3000/segments
```

### Evaluate Segment
```bash
curl -X POST http://localhost:3000/segments/{id}/evaluate
```

### Get Members
```bash
curl "http://localhost:3000/segments/{id}/members?limit=10&offset=0"
```

---

## Webhooks (Future)

Planned for V2:
- Custom webhook URLs for delta events
- Retry logic with exponential backoff
- Webhook signing for security
