const fs = require('fs').promises;
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// ============================================
// setup gRPC client for ProductCatalogService
// ============================================

// Proto path - in Docker container it will be copied to protos/demo.proto
const PROTO_PATH = process.env.PROTO_PATH || 
                   path.join(__dirname, 'proto/demo.proto');
const PRODUCT_CATALOG_ADDR = process.env.PRODUCT_CATALOG_SERVICE_ADDR || 'localhost:3550';

let productCatalogClient = null;

/**
 * Initialize gRPC client for ProductCatalogService
 */
function initProductCatalogClient() {
  try {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const hipstershop = protoDescriptor.hipstershop;

    productCatalogClient = new hipstershop.ProductCatalogService(
      PRODUCT_CATALOG_ADDR,
      grpc.credentials.createInsecure()
    );

    console.log(`✅ Connected to ProductCatalogService at ${PRODUCT_CATALOG_ADDR}`);
  } catch (error) {
    console.error('❌ Failed to initialize ProductCatalog client:', error);
    throw error;
  }
}

// ============================================
// Load user data from JSON file
// ============================================

async function loadUsersFromDatabase() {
  try {
    const filePath = path.join(__dirname, 'users.json');
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    console.log(`✅ Loaded ${jsonData.users.length} users from database`);
    return jsonData.users;
  } catch (error) {
    console.error('❌ Error loading users:', error);
    return [];
  }
}

// ============================================
// Extract user info into email format (ONE user)
// ============================================

function extractEmailData(user) {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  };
}

// ============================================
// Get random product via gRPC
// ============================================

/**
 * Get a random product from ProductCatalogService via gRPC
 * @returns {Promise<Object>} Product object
 */
function getRandomProduct() {
  return new Promise((resolve, reject) => {
    if (!productCatalogClient) {
      reject(new Error('ProductCatalog client not initialized'));
      return;
    }

    // Call ProductCatalogService via gRPC
    productCatalogClient.ListProducts({}, (err, response) => {
      if (err) {
        console.error('❌ gRPC Error calling ProductCatalogService:', err);
        reject(err);
        return;
      }

      if (!response.products || response.products.length === 0) {
        reject(new Error('No products available from catalog'));
        return;
      }

      // Pick random product
      const randomIndex = Math.floor(Math.random() * response.products.length);
      const product = response.products[randomIndex];
      
      console.log(`   📦 Fetched product via gRPC: ${product.name} (${product.id})`);
      resolve(product);
    });
  });
}

// ============================================
// Generate newsletter email content
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
  
  // Format price correctly
  const dollars = product.price_usd.units;
  const cents = Math.floor(product.price_usd.nanos / 10000000);
  const priceFormatted = `${product.price_usd.currency_code} $${dollars}.${cents.toString().padStart(2, '0')}`;
  
  const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .product { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .product-name { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
    .product-description { color: #666; margin-bottom: 15px; }
    .price { font-size: 28px; font-weight: bold; color: #764ba2; margin: 15px 0; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${randomCatchyText}</h1>
    </div>
    <div class="content">
      <p>Hi ${user.firstName} ${user.lastName},</p>
      <p>We've handpicked something special just for you from our Hipster Shop!</p>
      
      <div class="product">
        <div class="product-name">${product.name}</div>
        <div class="product-description">${product.description}</div>
        <div class="price">${priceFormatted}</div>
        <a href="https://shop.example.com/product/${product.id}" class="cta-button">Shop Now</a>
      </div>
      
      <p>This is a limited-time offer, so don't wait too long!</p>
      <p>Happy shopping! 🛍️</p>
      <p>- The Hipster Shop Team</p>
    </div>
    <div class="footer">
      <p>You're receiving this because you're a valued customer of Hipster Shop.</p>
      <p>© 2024 Hipster Shop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, body };
}

// ============================================
// Create email object ready to send
// ============================================

function createEmailObject(user, subject, body) {
  return {
    from: 'noreply@hipstershop.com',
    to: user.email,
    subject: subject,
    body: body
  };
}

// ============================================
// Send email
// (Mock)
// ============================================

async function sendEmailViaService(emailObject) {
  // MOCK: Simulate sending email
  console.log(`📧 Sending email to: ${emailObject.to}`);
  console.log(`   Subject: ${emailObject.subject}`);
  console.log(`   body: ${emailObject.body}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In real code with Amin's part, this would be:
  // return emailClient.SendEmail({ email: emailObject });
  
  return { success: true, message: 'Email sent successfully' };
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
    
    // 2. Get random product via gRPC (YOUR PART - REAL gRPC)
    const product = await getRandomProduct();
    console.log(`   ✓ Selected product via gRPC: ${product.name}`);
    
    // 3. Generate email content
    const { subject, body } = generateNewsletterContent(emailData, product);
    console.log('   ✓ Generated email content');
    
    // 4. Create email object
    const emailObject = createEmailObject(emailData, subject, body);
    console.log('   ✓ Created email object');
    
    // 5. Send email
    const result = await sendEmailViaService(emailObject);
    console.log('   ✓ Email sent successfully!');
    
    return {
      success: true,
      user: user.email,
      product: product.name,
      productId: product.id,
      result: result
    };
    
  } catch (error) {
    console.error(`   ❌ Error processing newsletter for ${user.email}:`, error.message);
    return {
      success: false,
      user: user.email,
      error: error.message
    };
  }
}

// ============================================
// BATCH PROCESS: Send newsletters to all users
// ============================================

async function sendNewsletterBatch() {
  console.log('='.repeat(60));
  console.log('🚀 Starting Newsletter Batch Process');
  console.log('='.repeat(60));
  
  // Initialize gRPC client
  try {
    initProductCatalogClient();
  } catch (error) {
    console.error('❌ Failed to initialize gRPC client. Exiting...');
    return;
  }
  
  // Load users from database
  const users = await loadUsersFromDatabase();
  
  if (users.length === 0) {
    console.log('❌ No users found. Exiting...');
    return;
  }
  
  console.log(`\n📊 Processing ${users.length} users...\n`);
  
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
  console.log(`📧 Total processed: ${results.length}`);
  console.log('='.repeat(60));
  
  return results;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
module.exports = {
  initProductCatalogClient,
  loadUsersFromDatabase,
  extractEmailData,
  getRandomProduct,
  generateNewsletterContent,
  createEmailObject,
  sendEmailViaService,
  processNewsletterForUser,
  sendNewsletterBatch
};

// ============================================
// RUN IF EXECUTED DIRECTLY
// ============================================
if (require.main === module) {
  sendNewsletterBatch()
    .then(() => {
      console.log('\n✅ Newsletter batch completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Newsletter batch failed:', error);
      process.exit(1);
    });
}