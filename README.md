# 📬 Newsletter Sandbox

To try the current implementation without having to run kubernetes

## 🚀 Quick Start

### 1. Start the Database

```bash
cd newsletter-sandbox

# Start PostgreSQL and pgAdmin
docker-compose up -d postgres pgadmin

# Wait a few seconds for PostgreSQL to initialize
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Newsletter Service

```bash
# Run once
npm start

# Or watch for changes (auto-restart)
npm run dev
```

### 4. Run Tests

```bash
# Run the tests script
npm run tests
```

## 📊 Access the Database

### Option 1: pgAdmin (Web UI)

1. Open http://localhost:5050
2. Login: `admin@local.com` / `admin`
3. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `newsletter`
   - Username: `newsletter_user`
   - Password: `newsletter_pass`

### Option 2: Command Line (psql)

```bash
# Connect via Docker
npm run db:psql

# Or directly
psql -h localhost -U newsletter_user -d newsletter
# Password: newsletter_pass
```

### Option 3: From Your Code

```javascript
const db = require('./src/db');

// Test connection
await db.testConnection();

// Get all subscribers
const subscribers = await db.getAllSubscribers();

// Add a subscriber
await db.addSubscriber('new@example.com', 'New', 'User');
```

## 📁 Project Structure

```
newsletter-sandbox/
├── docker-compose.yml    # PostgreSQL + pgAdmin setup
├── init.sql              # Database schema + seed data
├── package.json          # Node.js dependencies
├── Dockerfile            # Container build (optional)
├── README.md             # This file
└── src/
    ├── index.js          # Main entry point
    ├── db.js             # Database operations
    ├── newsletter.js     # Newsletter logic
    ├── mock-products.js  # Fake product data
    └── playground.js     # Experimentation script
```

## 🗄️ Database Schema

### `subscribers` table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-incrementing ID |
| email | VARCHAR(255) | Unique email address |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| subscribed_at | TIMESTAMP | When they subscribed |
| is_active | BOOLEAN | Active status |

### `email_history` table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-incrementing ID |
| subscriber_id | INTEGER | Foreign key to subscribers |
| subject | VARCHAR(500) | Email subject |
| product_id | VARCHAR(100) | Product featured |
| product_name | VARCHAR(255) | Product name |
| sent_at | TIMESTAMP | When sent |
| status | VARCHAR(50) | 'sent' or 'failed' |

## 🧪 Useful SQL Queries

```sql
-- View all subscribers
SELECT * FROM subscribers;

-- View active subscribers only
SELECT * FROM subscribers WHERE is_active = true;

-- Add a new subscriber
INSERT INTO subscribers (email, first_name, last_name)
VALUES ('new@example.com', 'New', 'User');

-- View email history
SELECT 
    s.email, 
    e.subject, 
    e.product_name, 
    e.sent_at, 
    e.status
FROM email_history e
JOIN subscribers s ON e.subscriber_id = s.id
ORDER BY e.sent_at DESC;

-- Count emails per subscriber
SELECT 
    s.email,
    COUNT(e.id) as emails_received
FROM subscribers s
LEFT JOIN email_history e ON s.id = e.subscriber_id
GROUP BY s.email;

-- View statistics
SELECT * FROM subscriber_stats;
SELECT * FROM email_stats;
```

## 🛠️ NPM Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the newsletter batch once |
| `npm run playground` | Run the experimentation script |
| `npm run dev` | Run with auto-reload on changes |
| `npm run db:up` | Start PostgreSQL + pgAdmin |
| `npm run db:down` | Stop containers |
| `npm run db:reset` | Reset database (delete all data!) |
| `npm run db:logs` | View PostgreSQL logs |
| `npm run db:psql` | Open psql shell |




