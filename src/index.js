const db = require('./db');
const { sendNewsletterBatch } = require('./newsletter');

// ============================================
// Newsletter Sandbox - Main Entry Point
// ============================================

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        📬 Newsletter PostgreSQL Service                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Test database connection
    console.log('🔌 Connecting to PostgreSQL...');
    const connected = await db.testConnection();
    
    if (!connected) {
      console.error('❌ Could not connect to database. Is PostgreSQL running?');
      process.exit(1);
    }

    // 2. Initialize database schema
    await db.initDatabase();

    // 3. Show current stats
    console.log('\n📊 Current Database Stats:');
    const subscribers = await db.getAllSubscribers();
    const stats = await db.getEmailStats();
    console.log(`   Subscribers: ${subscribers.length}`);
    console.log(`   Emails sent: ${stats.totalEmails} (${stats.successful} successful, ${stats.failed} failed)`);

    // 4. Run newsletter batch
    console.log('\n');
    await sendNewsletterBatch();

    // 5. Show updated stats
    console.log('\n📊 Updated Database Stats:');
    const newStats = await db.getEmailStats();
    console.log(`   Emails sent: ${newStats.totalEmails} (${newStats.successful} successful, ${newStats.failed} failed)`);

    console.log('\n✅ Done! Check the database to see the email history.');
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Open pgAdmin at http://localhost:5050 to browse the database');
    console.log('   - Login: admin@local.com / admin');
    console.log('   - Or connect via CLI: psql -h localhost -U newsletter_user -d newsletter');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await db.closeDatabase();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };


