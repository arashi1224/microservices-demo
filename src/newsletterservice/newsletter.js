const fs = require('fs');
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
//template path
const templatePath = path.join(__dirname, 'templates/newsletter-template.html');
let newsletterTemplate;

try {
  newsletterTemplate = fs.readFileSync(templatePath, 'utf8');
  console.log('✅ Email template loaded');
} catch (error) {
  console.log('❌ Failed to load email template:', error);
}

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
    const filePath = '/tmp/user.json'; // path.join(__dirname, 'user.json');
    const data = await fs.promises.readFile(filePath, 'utf8');
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
  const frontendAddr = process.env.FRONTEND_ADDR || 'localhost:8080';
  const baseUrl = process.env.FRONTEND_URL || `http://${frontendAddr}`;
  const httpHost = process.env.HTTP_ADDR || 'localhost:8081';
  const safeEmail = encodeURIComponent(user.email);
  
  const body = newsletterTemplate
    .replaceAll('${randomCatchyText}', randomCatchyText)
    .replaceAll('${user.firstName}', user.firstName)
    .replaceAll('${user.lastName}', user.lastName)
    .replaceAll('${product.name}', product.name)
    .replaceAll('${priceFormatted}', priceFormatted)
    .replaceAll('${baseURL}', baseUrl)
    .replaceAll('${product.description}', product.description)
    .replaceAll('${product.picture}', product.picture)

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

function unsubscribe(user) {
  console.log (user.firstName, " ", user.lastName, " is unsubscribed");
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
  sendNewsletterBatch,
  unsubscribe
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