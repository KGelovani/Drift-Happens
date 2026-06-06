📋 Problem Overview
In Optio, segments represent groups of customers defined by specific business rules. There are two types of segments to work with. Dynamic segments update automatically whenever customer data changes, while Static segments maintain fixed membership and only update when someone manually triggers a refresh. The core challenge is this: when customer data shifts — whether through new transactions, the passage of time, or profile updates — we need to track exactly who was added and who was removed, not just a vague "something changed" notification. We call this precise difference the delta. This delta information has to propagate out to all interested parties — UI components, campaign systems, and other segments that depend on this one — without generating a bunch of unnecessary noise during bulk update operations.

✅ Acceptance Criteria Met
✓ Three or more dynamic segments plus one static segment, each with different rule configurations
✓ One segment uses another segment as a filter, demonstrating cascading update behavior
✓ The system calculates precise deltas showing exactly which customers were ADDED and which were REMOVED
✓ Change signals reach two or more consumer types carrying complete delta data
✓ Cascading updates function correctly between dependent segments
✓ Static segments do not auto-update — they only refresh through manual intervention
✓ Large change batches of up to 50,000 records are processed in manageable chunks
✓ Simulation capability built in for testing purposes

🏗️ Architecture & Tech Stack
The technology stack we're working with includes Angular, NestJS, PostgreSQL, RabbitMQ, Redis, Elasticsearch, and Docker Compose. Here's how the data flows through the system: a Data Change occurs somewhere in the system → this triggers Segment Evaluation against business rules → the system performs Delta Calculation to identify exact membership changes → those deltas go through Batching, where we accumulate 100 records or wait a maximum of 5 seconds → the batched results get published to a RabbitMQ Exchange → from there they reach the UI via Push notifications, the Campaign Simulator, and any Dependent Segments that need to react. Our batching strategy specifically works by accumulating deltas in Redis, then flushing them either when we hit 100 records or when the 5-second timeout fires. The practical result of this approach is impressive — what would have been 500 individual events gets compressed down to roughly 5 batched events, giving us a 100x reduction in message traffic. As for cascading updates, here's how that works: when Segment A (the parent) undergoes changes, Segment B (which uses Segment A as a filter) automatically re-evaluates itself, calculates its own deltas, and publishes those results independently.

🚀 Quick Start
Before diving in, you'll need Docker and Docker Compose set up on your machine, along with at least 4GB of available RAM. To get everything installed, navigate into the "Drift Happens" directory and run docker-compose up. Once that's running, open up another terminal window and execute docker-compose exec api npm run seed to populate the database with our demo data. When everything is up and running, you can access the various components at these addresses: the Frontend lives at http://localhost:4200, the API is available at http://localhost:3000/segments, and the RabbitMQ Admin interface can be reached at http://localhost:15672 using the credentials admin/admin123.

🎮 Demo Scenarios
Customer Makes a Purchase: When a customer enters the "Active Buyers" segment, the system publishes an ADDED event containing the customer's ID. The UI updates in real time to reflect this change, and the campaign simulator logs a notification about the new member.

Time Passes and Inactivity Sets In: After a customer goes 30 or more days without any activity, they leave the "Active Buyers" segment. The system publishes a REMOVED event with that customer's ID, and analytics systems can log this as a churn event.

Cascading Update in Action: When the "VIP Clients" segment experiences a change, the dependent "VIP At Risk" segment automatically re-evaluates itself. Both segments then publish their own independent deltas to the system.

Bulk Import of 500 Customers: The system handles this by batching the changes into approximately 5 events rather than flooding the queue. The queue stays healthy and un-over

no this readme is for a recruiter who is seeing my project so pls make this sound clean
Drift Happens — Dynamic Segment Management System
📋 Problem Overview
In Optio, segments represent groups of customers defined by specific business rules. There are two types of segments to work with. Dynamic segments update automatically whenever customer data changes, while Static segments maintain fixed membership and only update when someone manually triggers a refresh. The core challenge is this: when customer data shifts — whether through new transactions, the passage of time, or profile updates — we need to track exactly who was added and who was removed, not just a vague "something changed" notification. We call this precise difference the delta. This delta information has to propagate out to all interested parties — UI components, campaign systems, and other segments that depend on this one — without generating unnecessary noise during bulk update operations.

✅ Acceptance Criteria Met
✓ Three or more dynamic segments plus one static segment, each with different rule configurations
✓ One segment uses another as a filter, demonstrating cascading update behavior
✓ The system calculates precise deltas showing exactly which customers were ADDED and which were REMOVED
✓ Change signals reach two or more consumer types carrying complete delta data
✓ Cascading updates function correctly between dependent segments
✓ Static segments do not auto-update — they only refresh through manual intervention
✓ Large change batches of up to 50,000 records are processed in manageable chunks
✓ Simulation

DONT MENTION OPTIO WHAT THE HELL
Got it — here's a clean, recruiter-friendly version with no mention of Optio:

Drift Happens — Dynamic Segment Management System
📋 Problem Overview
Segments are groups of customers defined by specific business rules. There are two types: Dynamic segments update automatically whenever customer data changes, while Static segments maintain fixed membership and only update when someone manually triggers a refresh. The core challenge is this: when customer data shifts — whether through new transactions, the passage of time, or profile updates — we need to track exactly who was added and who was removed, not just a vague "something changed" notification. We call this precise difference the delta. This delta information has to propagate out to all interested parties — UI components, campaign systems, and other segments that depend on this one — without generating unnecessary noise during bulk update operations.

✅ Acceptance Criteria Met
✓ Three or more dynamic segments plus one static segment, each with different rule configurations
✓ One segment uses another as a filter, demonstrating cascading update behavior
✓ The system calculates precise deltas showing exactly which customers were ADDED and which were REMOVED
✓ Change signals reach two or more consumer types carrying complete delta data
✓ Cascading updates function correctly between dependent segments
✓ Static segments do not auto-update — they only refresh through manual intervention
✓ Large change batches of up to 50,000 records are processed in manageable chunks
✓ Simulation capability built in for testing purposes

🏗️ Architecture & Tech Stack
Stack: Angular, NestJS, PostgreSQL, RabbitMQ, Redis, Elasticsearch, Docker Compose

Data Flow:
Data Change → Segment Evaluation → Delta Calculation → Batching (100 records or 5 seconds) → RabbitMQ Exchange → UI Push / Campaign Simulator / Dependent Segments

Batching Strategy: Deltas accumulate in Redis and flush when either 100 records are collected or a 5-second timeout fires. This turns 500 individual events into roughly 5 batched events — a 100x reduction in message traffic.

Cascading Updates: When Segment A (parent) changes, Segment B (which uses A as a filter) automatically re-evaluates, calculates its own deltas, and publishes them independently.

🚀 Quick Start
Prerequisites: Docker & Docker Compose, 4GB+ RAM available

Installation:

bash
cd "Drift Happens"
docker-compose up
Then in another terminal:

bash
docker-compose exec api npm run seed
Access Points:

Frontend: http://localhost:4200

API: http://localhost:3000/segments

RabbitMQ Admin: http://localhost:15672 (admin / admin123)

🎮 Demo Scenarios
1. Customer Makes a Purchase
Customer enters the "Active Buyers" segment → System publishes ADDED [customer-id] → UI updates in real time, campaign simulator logs the notification.

2. Time Passes (30+ Days Inactive)
Customer leaves "Active Buyers" → System publishes REMOVED [customer-id] → Analytics logs the churn event.

3. Cascading Update
"VIP Clients" segment changes → Dependent "VIP At Risk" segment auto-re-evaluates → Both segments publish their own independent deltas.

4. Bulk Import (500 Customers)
System batches into roughly 5 events → No queue overload → UI shows smooth incremental updates.

5. Static Segment Protection
"March Campaign" remains frozen → Data changes don't affect membership → Only a manual refresh can update it.

🔌 API Examples
Create a segment:

bash
curl -X POST http://localhost:3000/segments \
  -H "Content-Type: application/json" \
  -d '{"name":"Active Buyers","type":"DYNAMIC","rules":[{"field":"lastTransactionDays","operator":"<=","value":30}]}'
Evaluate a segment:

bash
curl -X POST http://localhost:3000/segments/{id}/evaluate
Get deltas:

bash
curl http://localhost:3000/segments/{id}/deltas
Get members:

bash
curl http://localhost:3000/segments/{id}/members
📊 Seed Data
Customers (5 demo profiles):

John Doe ($5,500 spent, active)

Jane Smith ($3,000 spent, active)

Bob Wilson ($2,000 spent, recently inactive)

Alice Brown ($1,000 spent, long-term inactive)

Charlie Davis ($6,000 spent, very active)

Segments (5 pre-configured):

Active Buyers — Dynamic, last transaction ≤ 30 days

VIP Clients — Dynamic, total purchases > $5,000

Risk Group — Dynamic, inactive 90+ days

March Campaign — Static, fixed campaign audience

VIP At Risk — Dynamic + Dependent, VIP customers inactive 30+ days

🧪 Simulation
The system includes a Campaign Simulator that listens for deltas and reacts in real time. Watch it in action:

bash
docker-compose logs -f simulator
Example output:

text
📬 Delta: Segment 'Active Buyers' - ADDED: 3 customers
→ 📧 Sending welcome notifications to 3 new members
📁 Project Structure
text
Drift Happens/
├── backend/          # NestJS API — delta calculation, batching, RabbitMQ
├── frontend/         # Angular UI — dashboard with real-time updates
├── simulator/        # Campaign consumer
├── docker/           # Postgres initialization
└── docs/             # Architecture decisions, API documentation
🐛 Troubleshooting
No segments showing in UI: Run docker-compose exec api npm run seed

Port already in use: Run docker-compose down && docker-compose up

RabbitMQ connection refused: Run docker-compose restart rabbitmq api

Full reset: Run docker-compose down -v && docker-compose up --build

📈 Scalability
Batching: 100 records or 5-second timeout

Horizontal scaling: Multiple API instances behind a load balancer, plus Redis cluster

Database: PostgreSQL read replicas for query distribution

Message queue: RabbitMQ cluster for high availability
