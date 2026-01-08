# 📚 Database Functions Reference

Quick reference for all PostgreSQL database functions in `db.js`.

---

## 🔌 Connection Management

### `createPool()`
- **Takes:** Nothing
- **Returns:** PostgreSQL connection pool
- **Does:** Creates/returns database connection pool

### `testConnection()`
- **Takes:** Nothing
- **Returns:** `true` if connected, `false` if failed
- **Does:** Tests database connection with `SELECT NOW()`

### `initDatabase()`
- **Takes:** Nothing
- **Returns:** `true` on success
- **Does:** Creates `subscribers` and `email_history` tables if they don't exist

### `closeDatabase()`
- **Takes:** Nothing
- **Returns:** Nothing
- **Does:** Closes all database connections

---

## 👥 Subscriber Operations

### `getAllSubscribers()`
- **Takes:** Nothing
- **Returns:** Array of subscriber objects
  ```javascript
  [{ id, email, firstName, lastName, subscribedAt }]
  ```
- **Does:** Gets all active subscribers from database

### `getSubscriberByEmail(email)`
- **Takes:** `email` (string)
- **Returns:** Subscriber object or `null` if not found
  ```javascript
  { id, email, firstName, lastName, subscribedAt, isActive }
  ```
- **Does:** Finds a specific subscriber by email address

### `addSubscriber(email, firstName, lastName)`
- **Takes:** 
  - `email` (string)
  - `firstName` (string)
  - `lastName` (string)
- **Returns:** Created/updated subscriber object
  ```javascript
  { id, email, firstName, lastName, subscribedAt }
  ```
- **Does:** Adds new subscriber or updates existing one (upsert)

### `deactivateSubscriber(email)`
- **Takes:** `email` (string)
- **Returns:** `true` if deactivated, `false` if not found
- **Does:** Soft deletes subscriber (sets `is_active = false`)

---

## 📧 Email History Operations

### `recordEmailSent(subscriberId, subject, productId, productName, status)`
- **Takes:**
  - `subscriberId` (number)
  - `subject` (string)
  - `productId` (string, optional)
  - `productName` (string, optional)
  - `status` (string) - 'sent' or 'failed'
- **Returns:** Email record object
  ```javascript
  { id, subscriberId, subject, productId, productName, sentAt, status }
  ```
- **Does:** Saves email to history table

### `getEmailHistory(subscriberId, limit = 10)`
- **Takes:**
  - `subscriberId` (number)
  - `limit` (number, default: 10)
- **Returns:** Array of email history objects
  ```javascript
  [{ id, subscriberId, subject, productId, productName, sentAt, status }]
  ```
- **Does:** Gets recent emails sent to a subscriber

### `getEmailStats()`
- **Takes:** Nothing
- **Returns:** Statistics object
  ```javascript
  {
    totalEmails: 100,
    uniqueSubscribers: 25,
    successful: 90,
    failed: 10
  }
  ```
- **Does:** Gets overall email sending statistics

---

## 💡 Quick Examples

### Add a subscriber
```javascript
const subscriber = await db.addSubscriber(
  'john@example.com',
  'John',
  'Doe'
);
// Returns: { id: 1, email: 'john@example.com', ... }
```

### Get all subscribers
```javascript
const subscribers = await db.getAllSubscribers();
// Returns: [{ id, email, firstName, lastName, subscribedAt }, ...]
```

### Record sent email
```javascript
await db.recordEmailSent(
  1,                    // subscriber ID
  'Hot Deal!',          // subject
  'PROD123',           // product ID
  'Cool Product',      // product name
  'sent'               // status
);
```

### Get statistics
```javascript
const stats = await db.getEmailStats();
// Returns: { totalEmails: 50, successful: 45, failed: 5, ... }
```

---

## 🗄️ Database Tables

### `subscribers`
```sql
id              SERIAL PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
first_name      VARCHAR(100) NOT NULL
last_name       VARCHAR(100) NOT NULL
subscribed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
is_active       BOOLEAN DEFAULT true
```

### `email_history`
```sql
id              SERIAL PRIMARY KEY
subscriber_id   INTEGER REFERENCES subscribers(id)
subject         VARCHAR(500) NOT NULL
product_id      VARCHAR(100)
product_name    VARCHAR(255)
sent_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
status          VARCHAR(50) DEFAULT 'sent'
```

---

## 📝 Notes

- All functions are **async** and return **Promises**
- Database connection is **automatically managed** (connection pooling)
- `addSubscriber()` uses **upsert** (update if exists, insert if new)
- Errors are **logged** and **thrown** for handling
- All timestamps use **PostgreSQL's CURRENT_TIMESTAMP**

