const { Pool } = require('pg');

// ============================================
// PostgreSQL Connection Pool
// ============================================

let pool = null;

/**
 * Initialize PostgreSQL connection pool
 */
function createPool() {
  if (pool) {
    return pool;
  }

  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'newsletter',
    user: process.env.POSTGRES_USER || 'newsletter_user',
    password: process.env.POSTGRES_PASSWORD || 'newsletter_pass',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client', err);
  });

  console.log(`✅ PostgreSQL pool created: ${config.host}:${config.port}/${config.database}`);
  return pool;
}

// ============================================
// Initialize Database
// ============================================

async function initDatabase() {
  const client = createPool();

  try {
    console.log('🔧 Checking database schema...');

    // Tables should already exist from init.sql, but check anyway
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_history (
        id SERIAL PRIMARY KEY,
        subscriber_id INTEGER REFERENCES subscribers(id),
        subject VARCHAR(500) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'sent'
      )
    `);

    console.log('✅ Database schema verified');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
}

// ============================================
// Subscriber Operations
// ============================================

/**
 * Get all active subscribers
 */
async function getAllSubscribers() {
  const client = createPool();

  try {
    const result = await client.query(
      'SELECT id, email, first_name, last_name, subscribed_at FROM subscribers WHERE is_active = true ORDER BY id'
    );

    console.log(`✅ Loaded ${result.rows.length} active subscribers`);
    
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      subscribedAt: row.subscribed_at
    }));
  } catch (error) {
    console.error('❌ Error loading subscribers:', error.message);
    throw error;
  }
}

/**
 * Get subscriber by email
 */
async function getSubscriberByEmail(email) {
  const client = createPool();

  try {
    const result = await client.query(
      'SELECT id, email, first_name, last_name, subscribed_at, is_active FROM subscribers WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      subscribedAt: row.subscribed_at,
      isActive: row.is_active
    };
  } catch (error) {
    console.error(`❌ Error getting subscriber ${email}:`, error.message);
    throw error;
  }
}

/**
 * Add a new subscriber
 */
async function addSubscriber(email, firstName, lastName) {
  const client = createPool();

  try {
    const result = await client.query(
      `INSERT INTO subscribers (email, first_name, last_name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE 
       SET first_name = EXCLUDED.first_name, 
           last_name = EXCLUDED.last_name,
           is_active = true
       RETURNING id, email, first_name, last_name, subscribed_at`,
      [email, firstName, lastName]
    );

    const row = result.rows[0];
    console.log(`✅ Added/updated subscriber: ${email}`);
    
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      subscribedAt: row.subscribed_at
    };
  } catch (error) {
    console.error(`❌ Error adding subscriber ${email}:`, error.message);
    throw error;
  }
}

/**
 * Deactivate a subscriber (soft delete)
 */
async function deactivateSubscriber(email) {
  const client = createPool();

  try {
    const result = await client.query(
      'UPDATE subscribers SET is_active = false WHERE email = $1',
      [email]
    );

    console.log(`✅ Deactivated subscriber: ${email}`);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`❌ Error deactivating subscriber ${email}:`, error.message);
    throw error;
  }
}

// ============================================
// Email History Operations
// ============================================

/**
 * Record a sent email
 */
async function recordEmailSent(subscriberId, subject, productId = null, productName = null, status = 'sent') {
  const client = createPool();

  try {
    const result = await client.query(
      `INSERT INTO email_history (subscriber_id, subject, product_id, product_name, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, subscriber_id, subject, product_id, product_name, sent_at, status`,
      [subscriberId, subject, productId, productName, status]
    );

    const row = result.rows[0];
    console.log(`✅ Recorded email for subscriber ${subscriberId}`);
    
    return {
      id: row.id,
      subscriberId: row.subscriber_id,
      subject: row.subject,
//      body: row.body,
      productId: row.product_id,
      productName: row.product_name,
      sentAt: row.sent_at,
      status: row.status
    };
  } catch (error) {
    console.error(`❌ Error recording email:`, error.message);
    throw error;
  }
}

/**
 * Get email history for a subscriber
 */
async function getEmailHistory(subscriberId, limit = 10) {
  const client = createPool();

  try {
    const result = await client.query(
      `SELECT id, subscriber_id, subject, product_id, product_name, sent_at, status 
       FROM email_history 
       WHERE subscriber_id = $1 
       ORDER BY sent_at DESC 
       LIMIT $2`,
      [subscriberId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      subscriberId: row.subscriber_id,
      subject: row.subject,
      productId: row.product_id,
      productName: row.product_name,
      sentAt: row.sent_at,
      status: row.status
    }));
  } catch (error) {
    console.error(`❌ Error getting email history:`, error.message);
    throw error;
  }
}

/**
 * Get email statistics
 */
async function getEmailStats() {
  const client = createPool();

  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_emails,
        COUNT(DISTINCT subscriber_id) as unique_subscribers,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM email_history
    `);

    const row = result.rows[0];
    return {
      totalEmails: parseInt(row.total_emails),
      uniqueSubscribers: parseInt(row.unique_subscribers),
      successful: parseInt(row.successful),
      failed: parseInt(row.failed)
    };
  } catch (error) {
    console.error('❌ Error getting email stats:', error.message);
    throw error;
  }
}

// ============================================
// Connection Management
// ============================================

async function closeDatabase() {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error.message);
      throw error;
    }
  }
}

async function testConnection() {
  const client = createPool();

  try {
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection OK:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  createPool,
  initDatabase,
  getAllSubscribers,
  getSubscriberByEmail,
  addSubscriber,
  deactivateSubscriber,
  recordEmailSent,
  getEmailHistory,
  getEmailStats,
  closeDatabase,
  testConnection
};

