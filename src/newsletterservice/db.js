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
    connectionTimeoutMillis: 10000, 
  };

  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client', err.message);
  });

  console.log(`✅ PostgreSQL pool created: ${config.host}:${config.port}/${config.database}`);
  return pool;
}

// Helper function to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testConnection(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    const client = createPool();
    try {
      console.log(`🔌 Attempting database connection (Try ${i + 1}/${retries})...`);
      const result = await client.query('SELECT NOW()');
      console.log('✅ Database connection ESTABLISHED:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error(`⚠️ Connection failed: ${error.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Waiting ${delay / 1000}s before retrying...`);
        await sleep(delay);
      } else {
        console.error('❌ Could not connect to database after multiple attempts.');
        throw error;
      }
    }
  }
}

async function closeDatabase() {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error.message);
    }
  }
}

// ============================================
// Initialize Database
// ============================================

async function initDatabase() {
  // ⚠️ CHANGED: Ensure connection is valid before trying to create tables
  await testConnection(); 

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
        product_id VARCHAR(255),
        product_name VARCHAR(255),
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
       RETURNING id`,
      [subscriberId, subject, productId, productName, status]
    );
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Error recording email:`, error.message);
    return null;
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
  closeDatabase,
  testConnection
};


