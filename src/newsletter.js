const db = require('./db');
const { getRandomProduct } = require('./mock-products');

// ============================================
// Newsletter Service - Sandbox Version
// ============================================
// This is a simplified version for learning PostgreSQL
// No gRPC, no Kubernetes - just Node.js + PostgreSQL

// ============================================
// Extract user info for email
// ============================================

function extractEmailData(user) {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  };
}

// ============================================
// Generate newsletter content
// ============================================

function generateNewsletterContent(user, product) {
  const catchyTexts = [
    '🌟 Exclusive Deal Just for You!',
    '💎 Don\'t Miss This Amazing Offer!',
    '🎁 Special Pick of the Week!',
    '✨ Trending Now in Our Store!',
    '🔥 Hot Deal Alert!'
  ];
  
  const randomCatchyText = catchyTexts[Math.floor(Math.random() * catchyTexts.length)];
  const subject = `${randomCatchyText} - ${product.name}`;
  
  // Format price
  const dollars = product.price_usd.units;
  const cents = Math.floor(product.price_usd.nanos / 10000000);
  const priceFormatted = `${product.price_usd.currency_code} $${dollars}.${cents.toString().padStart(2, '0')}`;
  
  const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .product { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .product-name { font-size: 24px; font-weight: bold; color: #667eea; }
    .price { font-size: 28px; font-weight: bold; color: #764ba2; margin: 15px 0; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${randomCatchyText}</h1>
    </div>
    <div class="content">
      <p>Hi ${user.firstName} ${user.lastName},</p>
      <p>We've handpicked something special just for you!</p>
      
      <div class="product">
        <div class="product-name">${product.name}</div>
        <p>${product.description}</p>
        <div class="price">${priceFormatted}</div>
        <a href="https://shop.example.com/product/${product.id}" class="cta-button">Shop Now</a>
      </div>
      
      <p>Happy shopping! 🛍️</p>
      <p>- The Newsletter Team</p>
    </div>
    <div class="footer">
      <p>© 2024 Newsletter Sandbox</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, body };
}

// ============================================
// Create email object
// ============================================

function createEmailObject(user, subject, body) {
  return {
    from: 'noreply@sandbox.local',
    to: user.email,
    subject: subject,
    body: body
  };
}

// ============================================
// Send email (MOCK - just logs it)
// ============================================

async function sendEmailViaService(emailObject) {
  console.log(`📧 [MOCK] Sending email to: ${emailObject.to}`);
  console.log(`   Subject: ${emailObject.subject}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulate occasional failures (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Simulated email delivery failure');
  }
  
  return { success: true, message: 'Email sent (mock)' };
}

// ============================================
// Process newsletter for ONE user
// ============================================

async function processNewsletterForUser(user) {
  console.log(`\n📝 Processing newsletter for: ${user.firstName} ${user.lastName} (${user.email})`);
  
  try {
    // 1. Extract email data
    const emailData = extractEmailData(user);
    console.log('   ✓ Extracted user email data');
    
    // 2. Get random product (MOCK - no gRPC!)
    const product = getRandomProduct();
    console.log(`   ✓ Selected product: ${product.name}`);
    
    // 3. Generate email content
    const { subject, body } = generateNewsletterContent(emailData, product);
    console.log('   ✓ Generated email content');
    
    // 4. Create email object
    const emailObject = createEmailObject(emailData, subject, body);
    console.log('   ✓ Created email object');
    
    // 5. Send email (mock)
    const result = await sendEmailViaService(emailObject);
    console.log('   ✓ Email sent successfully!');
    
    // 6. Record in database
    await db.recordEmailSent(user.id, subject, body, product.id, product.name, 'sent');
    console.log('   ✓ Recorded in database');
    
    return {
      success: true,
      user: user.email,
      product: product.name,
      productId: product.id
    };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    
    // Record failure in database
    if (user.id) {
      try {
        await db.recordEmailSent(user.id, 'Failed', null, null, 'failed');
      } catch (e) {
        console.error('   ⚠️  Could not record failure');
      }
    }
    
    return {
      success: false,
      user: user.email,
      error: error.message
    };
  }
}

// ============================================
// BATCH PROCESS - Send to all subscribers
// ============================================

async function sendNewsletterBatch() {
  console.log('='.repeat(60));
  console.log('🚀 Starting Newsletter Batch Process');
  console.log('='.repeat(60));
  
  // Load subscribers from database
  const users = await db.getAllSubscribers();
  
  if (users.length === 0) {
    console.log('❌ No subscribers found');
    return;
  }
  
  console.log(`\n📊 Processing ${users.length} subscribers...\n`);
  
  // Process each user
  const results = [];
  for (const user of users) {
    const result = await processNewsletterForUser(user);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 BATCH SUMMARY');
  console.log('='.repeat(60));
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📧 Total: ${results.length}`);
  console.log('='.repeat(60));
  
  return results;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  extractEmailData,
  generateNewsletterContent,
  createEmailObject,
  sendEmailViaService,
  processNewsletterForUser,
  sendNewsletterBatch
};


