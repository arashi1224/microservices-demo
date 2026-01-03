const db = require('./db');
const { getRandomProduct, getAllProducts, searchProducts } = require('./mock-products');

// ============================================
// 🎮 PostgreSQL Playground
// ============================================
// Use this file to experiment with database operations!
// Run with: node src/playground.js

async function playground() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                     PostgreSQL Tests                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Connect to database
    console.log('🔌 Connecting to database...\n');
    await db.testConnection();
    await db.initDatabase();

    // ============================================
    // EXPERIMENT 1: List all subscribers
    // ============================================
    console.log('📋 EXPERIMENT 1: List all subscribers');
    console.log('-'.repeat(50));
    const subscribers = await db.getAllSubscribers();
    subscribers.forEach(s => {
      console.log(`   ${s.id}. ${s.firstName} ${s.lastName} <${s.email}>`);
    });
    console.log('');

    // ============================================
    // EXPERIMENT 2: Add a new subscriber
    // ============================================
    console.log('➕ EXPERIMENT 2: Add a new subscriber');
    console.log('-'.repeat(50));
    const newSubscriber = await db.addSubscriber(
      'test.user@playground.com',
      'Test',
      'User'
    );
    console.log(`   Added: ${newSubscriber.firstName} ${newSubscriber.lastName}`);
    console.log('');

    // ============================================
    // EXPERIMENT 3: Find subscriber by email
    // ============================================
    console.log('🔍 EXPERIMENT 3: Find subscriber by email');
    console.log('-'.repeat(50));
    const found = await db.getSubscriberByEmail('john.doe@example.com');
    if (found) {
      console.log(`   Found: ${found.firstName} ${found.lastName}`);
      console.log(`   Active: ${found.isActive}`);
      console.log(`   Subscribed: ${found.subscribedAt}`);
    } else {
      console.log('   Not found!');
    }
    console.log('');

    // ============================================
    // EXPERIMENT 4: Record an email
    // ============================================
    console.log('📧 EXPERIMENT 4: Record an email sent');
    console.log('-'.repeat(50));
    const product = getRandomProduct();
    const emailRecord = await db.recordEmailSent(
      1, // subscriber ID
      `Special Offer: ${product.name}`,
      product.id,
      product.name,
      'sent'
    );
    console.log(`   Recorded email ID: ${emailRecord.id}`);
    console.log(`   Subject: ${emailRecord.subject}`);
    console.log('');

    // ============================================
    // EXPERIMENT 5: Get email history
    // ============================================
    console.log('📜 EXPERIMENT 5: Get email history for subscriber 1');
    console.log('-'.repeat(50));
    const history = await db.getEmailHistory(1, 5);
    history.forEach(h => {
      console.log(`   [${h.status}] ${h.subject}`);
      console.log(`           Sent: ${h.sentAt}`);
    });
    console.log('');

    // ============================================
    // EXPERIMENT 6: Get statistics
    // ============================================
    console.log('📊 EXPERIMENT 6: Email statistics');
    console.log('-'.repeat(50));
    const stats = await db.getEmailStats();
    console.log(`   Total emails: ${stats.totalEmails}`);
    console.log(`   Unique recipients: ${stats.uniqueSubscribers}`);
    console.log(`   Successful: ${stats.successful}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log('');

    // ============================================
    // EXPERIMENT 7: Deactivate a subscriber
    // ============================================
    console.log('🚫 EXPERIMENT 7: Deactivate test subscriber');
    console.log('-'.repeat(50));
    const deactivated = await db.deactivateSubscriber('test.user@playground.com');
    console.log(`   Deactivated: ${deactivated}`);
    console.log('');

    // ============================================
    // EXPERIMENT 8: Mock products
    // ============================================
    console.log('🛍️ EXPERIMENT 8: Browse mock products');
    console.log('-'.repeat(50));
    const products = getAllProducts();
    products.slice(0, 3).forEach(p => {
      console.log(`   ${p.name} - $${p.price_usd.units}.${Math.floor(p.price_usd.nanos / 10000000)}`);
    });
    console.log(`   ... and ${products.length - 3} more`);
    console.log('');

    // ============================================
    // EXPERIMENT 9: Search products
    // ============================================
    console.log('🔎 EXPERIMENT 9: Search products for "glass"');
    console.log('-'.repeat(50));
    const searchResults = searchProducts('glass');
    searchResults.forEach(p => {
      console.log(`   ${p.name}: ${p.description.substring(0, 50)}...`);
    });
    console.log('');

    console.log('✅ All experiments completed!');
    console.log('');
    console.log('💡 Try modifying this file to run your own experiments!');
    console.log('   Edit: src/playground.js');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await db.closeDatabase();
  }
}

// Run
playground();

