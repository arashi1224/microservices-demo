// ============================================
// Mock Product Data
// ============================================
// This replaces the gRPC calls to ProductCatalogService
// For Testing Purposes

const mockProducts = [
  {
    id: "OLJCESPC7Z",
    name: "Sunglasses",
    description: "Add a modern touch to your outfits with these sleek aviator sunglasses.",
    picture: "/static/img/products/sunglasses.jpg",
    price_usd: { currency_code: "USD", units: 19, nanos: 990000000 },
    categories: ["accessories"]
  },
  {
    id: "66VCHSJNUP",
    name: "Tank Top",
    description: "Perfectly cropped cotton tank, with a scooped neckline.",
    picture: "/static/img/products/tank-top.jpg",
    price_usd: { currency_code: "USD", units: 18, nanos: 990000000 },
    categories: ["clothing", "tops"]
  },
  {
    id: "1YMWWN1N4O",
    name: "Watch",
    description: "This gold-tone stainless steel watch will work with most of your outfits.",
    picture: "/static/img/products/watch.jpg",
    price_usd: { currency_code: "USD", units: 109, nanos: 990000000 },
    categories: ["accessories"]
  },
  {
    id: "L9ECAV7KIM",
    name: "Loafers",
    description: "A timeless design, our loafers are crafted from premium leather.",
    picture: "/static/img/products/loafers.jpg",
    price_usd: { currency_code: "USD", units: 89, nanos: 990000000 },
    categories: ["footwear"]
  },
  {
    id: "2ZYFJ3GM2N",
    name: "Hairdryer",
    description: "This lightweight hairdryer has 3 heat and speed settings.",
    picture: "/static/img/products/hairdryer.jpg",
    price_usd: { currency_code: "USD", units: 24, nanos: 990000000 },
    categories: ["hair", "beauty"]
  },
  {
    id: "0PUK6V6EV0",
    name: "Candle Holder",
    description: "This glass candle holder is perfect for any occasion.",
    picture: "/static/img/products/candle-holder.jpg",
    price_usd: { currency_code: "USD", units: 18, nanos: 990000000 },
    categories: ["decor", "home"]
  },
  {
    id: "LS4PSXUNUM",
    name: "Salt & Pepper Shakers",
    description: "Add some flavor to your kitchen with these ceramic shakers.",
    picture: "/static/img/products/salt-and-pepper-shakers.jpg",
    price_usd: { currency_code: "USD", units: 18, nanos: 490000000 },
    categories: ["kitchen"]
  },
  {
    id: "9SIQT8TOJO",
    name: "Bamboo Glass Jar",
    description: "This bamboo glass jar is perfect for storing your favorite snacks.",
    picture: "/static/img/products/bamboo-glass-jar.jpg",
    price_usd: { currency_code: "USD", units: 5, nanos: 490000000 },
    categories: ["kitchen"]
  },
  {
    id: "6E92ZMYYFZ",
    name: "Mug",
    description: "A simple white mug that goes with everything.",
    picture: "/static/img/products/mug.jpg",
    price_usd: { currency_code: "USD", units: 8, nanos: 990000000 },
    categories: ["kitchen"]
  }
];

/**
 * Get all products
 */
function getAllProducts() {
  return mockProducts;
}

/**
 * Get a random product (simulates what the real service does)
 */
function getRandomProduct() {
  const randomIndex = Math.floor(Math.random() * mockProducts.length);
  const product = mockProducts[randomIndex];
  console.log(`Selected product: ${product.name} (${product.id})`);
  return product;
}

/**
 * Get a product by ID
 */
function getProductById(productId) {
  return mockProducts.find(p => p.id === productId) || null;
}

/**
 * Search products by name or description
 */
function searchProducts(query) {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  );
}

module.exports = {
  mockProducts,
  getAllProducts,
  getRandomProduct,
  getProductById,
  searchProducts
};

