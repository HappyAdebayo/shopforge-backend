/**
 * ShopForge Seed Script
 * Populates:
 *  - auth-service DB:    1 admin, 3 vendor users, 5 regular users
 *  - vendor-service DB:  3 vendor profiles (approved)
 *  - product-service DB: 10 categories, 60+ products with images
 *
 * Usage (from shopforge-backend/):
 *   node seed.js
 */

import bcrypt from "bcrypt";
import { Sequelize, DataTypes } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── DB connections ───────────────────────────────────────────────────────────

const authDB = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "auth-service/database.sqlite"),
  logging: false,
});

const vendorDB = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "vendor-service/database.sqlite"),
  logging: false,
});

const productDB = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "product-service/database.sqlite"),
  logging: false,
});

// ─── Models ───────────────────────────────────────────────────────────────────

const User = authDB.define("User", {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:         { type: DataTypes.STRING,  allowNull: false },
  email:        { type: DataTypes.STRING,  allowNull: false, unique: true },
  password:     { type: DataTypes.STRING,  allowNull: false },
  role:         { type: DataTypes.STRING,  allowNull: false, defaultValue: "user" },
  vendorStatus: { type: DataTypes.STRING,  allowNull: false, defaultValue: "none" },
}, { tableName: "users", timestamps: true });

const Vendor = vendorDB.define("Vendor", {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:       { type: DataTypes.INTEGER, allowNull: false, unique: true },
  businessName: { type: DataTypes.STRING,  allowNull: false },
  description:  { type: DataTypes.TEXT,    allowNull: false },
  logoUrl:      { type: DataTypes.STRING,  allowNull: true },
  status:       { type: DataTypes.STRING,  allowNull: false, defaultValue: "active" },
}, { tableName: "vendors", timestamps: true });

const Category = productDB.define("Category", {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:        { type: DataTypes.STRING,  allowNull: false, unique: true },
  description: { type: DataTypes.TEXT,   allowNull: true },
  status:      { type: DataTypes.STRING, allowNull: false, defaultValue: "active" },
}, { tableName: "categories", timestamps: true });

const Product = productDB.define("Product", {
  id:          { type: DataTypes.INTEGER,       autoIncrement: true, primaryKey: true },
  vendorId:    { type: DataTypes.INTEGER,       allowNull: false },
  categoryId:  { type: DataTypes.INTEGER,       allowNull: false },
  name:        { type: DataTypes.STRING,        allowNull: false },
  description: { type: DataTypes.TEXT,         allowNull: false },
  price:       { type: DataTypes.DECIMAL(10,2), allowNull: false },
  stock:       { type: DataTypes.INTEGER,       allowNull: false, defaultValue: 0 },
  status:      { type: DataTypes.STRING,        allowNull: false, defaultValue: "active" },
}, { tableName: "products", timestamps: true });

const ProductImage = productDB.define("ProductImage", {
  id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  imageUrl:  { type: DataTypes.STRING,  allowNull: false },
  isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: "product_images", timestamps: true });

// ─── Data ────────────────────────────────────────────────────────────────────

const DEFAULT_PASSWORD = "Password123!";

const USERS = [
  { name: "Super Admin",     email: "admin@shopforge.com",   role: "admin",  vendorStatus: "none"     },
  { name: "Elena Martinez",  email: "elena@techvault.com",   role: "vendor", vendorStatus: "approved" },
  { name: "David Okonkwo",   email: "david@freshfinds.com",  role: "vendor", vendorStatus: "approved" },
  { name: "Priya Sharma",    email: "priya@stylehaus.com",   role: "vendor", vendorStatus: "approved" },
  { name: "James Wilson",    email: "james@example.com",     role: "user",   vendorStatus: "none"     },
  { name: "Amara Nwosu",     email: "amara@example.com",     role: "user",   vendorStatus: "none"     },
  { name: "Lucas Fernandez", email: "lucas@example.com",     role: "user",   vendorStatus: "none"     },
  { name: "Sophie Dubois",   email: "sophie@example.com",    role: "user",   vendorStatus: "none"     },
  { name: "Kwame Asante",    email: "kwame@example.com",     role: "user",   vendorStatus: "none"     },
];

const VENDOR_PROFILES = [
  { emailKey: "elena@techvault.com",  businessName: "TechVault",  description: "Your one-stop shop for the latest consumer electronics, gadgets, and smart home devices. We source directly from top manufacturers.", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=techvault"  },
  { emailKey: "david@freshfinds.com", businessName: "Fresh Finds", description: "Curated organic foods, artisan snacks, and health-conscious pantry staples delivered fresh to your door.",                           logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=freshfinds" },
  { emailKey: "priya@stylehaus.com",  businessName: "StyleHaus",  description: "Contemporary fashion for the modern wardrobe. Sustainable, stylish, and affordable clothing & accessories.",                         logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=stylehaus"  },
];

const CATEGORIES = [
  { name: "Electronics",         description: "Gadgets, devices, and consumer electronics"            },
  { name: "Fashion",             description: "Clothing, shoes, and accessories"                      },
  { name: "Home & Living",       description: "Furniture, decor, and home essentials"                 },
  { name: "Food & Grocery",      description: "Fresh produce, pantry, and specialty foods"            },
  { name: "Health & Beauty",     description: "Skincare, supplements, and wellness products"          },
  { name: "Sports & Outdoors",   description: "Equipment, apparel, and gear for active lifestyles"    },
  { name: "Books & Media",       description: "Books, music, movies, and games"                       },
  { name: "Toys & Kids",         description: "Toys, games, and children's essentials"               },
  { name: "Automotive",          description: "Car parts, accessories, and care products"             },
  { name: "Office & Stationery", description: "Office supplies, furniture, and stationery"           },
];

// vendorKey: 0=TechVault  1=FreshFinds  2=StyleHaus
const PRODUCTS = [
  // TechVault
  { v:0, cat:"Electronics",         name:"ProMax Wireless Earbuds",          price:79.99,  stock:150, desc:"Premium true-wireless earbuds with active noise cancellation, 30-hour battery life, and IPX5 water resistance. Effortless pairing with all Bluetooth 5.3 devices.", imgs:["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600","https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600"] },
  { v:0, cat:"Electronics",         name:"UltraSlim 4K Monitor 27-inch",     price:349.99, stock:45,  desc:"27-inch IPS 4K display with 144Hz refresh rate, HDR400 support, and USB-C connectivity. Perfect for creative professionals and gamers.", imgs:["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"] },
  { v:0, cat:"Electronics",         name:"MechaStrike RGB Keyboard",         price:129.99, stock:80,  desc:"Compact TKL mechanical keyboard with Cherry MX Red switches, per-key RGB lighting, and aircraft-grade aluminium body.", imgs:["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600"] },
  { v:0, cat:"Electronics",         name:"Smart Home Hub Pro",               price:89.99,  stock:60,  desc:"Central smart home controller compatible with Zigbee, Z-Wave, Wi-Fi, and Bluetooth devices. Control over 500 device types.", imgs:["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"] },
  { v:0, cat:"Electronics",         name:"Portable Charger 26800mAh",       price:54.99,  stock:200, desc:"High-capacity power bank with 65W USB-C PD fast charging, three output ports, and LED power indicator.", imgs:["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600"] },
  { v:0, cat:"Electronics",         name:"Action Camera 4K60",              price:199.99, stock:55,  desc:"Rugged waterproof action camera with 4K/60fps video, 20MP photos, built-in stabilization, and 2-inch touch display.", imgs:["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600"] },
  { v:0, cat:"Electronics",         name:"Smart LED Desk Lamp",             price:44.99,  stock:120, desc:"Touch-dimmable desk lamp with adjustable colour temperature (2700K-6500K), wireless charging base, and USB-A port.", imgs:["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600"] },
  { v:0, cat:"Electronics",         name:"Bluetooth Tracking Tag 4-Pack",   price:34.99,  stock:300, desc:"Find your keys and valuables instantly. 400ft Bluetooth range, 1-year battery, water-resistant. Compatible with iOS and Android.", imgs:["https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=600"] },
  { v:0, cat:"Electronics",         name:"Smart Security Camera 2K",        price:69.99,  stock:75,  desc:"Indoor/outdoor 2K security camera with colour night vision, AI motion detection, two-way audio, and free 24-hour cloud storage.", imgs:["https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600"] },
  { v:0, cat:"Office & Stationery", name:"Ergonomic Wireless Mouse",        price:59.99,  stock:90,  desc:"Vertical ergonomic design reduces wrist strain by 57%. 4000 DPI adjustable, 60-hour battery, whisper-quiet clicks.", imgs:["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600"] },
  { v:0, cat:"Home & Living",       name:"Smart Air Purifier HEPA H13",     price:189.99, stock:40,  desc:"Medical-grade H13 HEPA filtration removes 99.97% of particles down to 0.1 microns. Built-in air quality sensor and app control.", imgs:["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600"] },
  { v:0, cat:"Sports & Outdoors",   name:"Smart Jump Rope with Counter",    price:29.99,  stock:110, desc:"Digitally counted speed jump rope with ball-bearing handles and built-in LCD showing jump count, calories, and workout time.", imgs:["https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=600"] },
  { v:0, cat:"Books & Media",       name:"Kindle Paperwhite 16GB",          price:139.99, stock:50,  desc:"The thinnest, lightest Paperwhite ever with glare-free display, adjustable warm light, 16GB storage, weeks of battery life. Waterproof.", imgs:["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"] },
  { v:0, cat:"Toys & Kids",         name:"Kids Coding Robot Kit",           price:79.99,  stock:30,  desc:"Beginner coding robot that teaches programming fundamentals through play. Compatible with Scratch 3.0. Ages 7+.", imgs:["https://images.unsplash.com/photo-1555255707-c07966088b7b?w=600"] },
  { v:0, cat:"Automotive",          name:"Dash Cam 4K Front and Rear",     price:119.99, stock:35,  desc:"4K front + 1080p rear dual dash cam with Sony STARVIS night vision, GPS logger, Wi-Fi app control, and 24-hour parking mode.", imgs:["https://images.unsplash.com/photo-1597404294360-feeeda04612e?w=600"] },
  { v:0, cat:"Home & Living",       name:"Coffee Maker with Grinder",       price:219.99, stock:28,  desc:"12-cup drip coffee maker with built-in conical burr grinder, programmable delay brew, and thermal carafe. SCAA certified.", imgs:["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"] },

  // Fresh Finds
  { v:1, cat:"Food & Grocery",   name:"Organic Cold-Pressed Juice Variety Pack", price:32.99, stock:80,  desc:"12-bottle assortment of cold-pressed juices: green detox, tropical mango, beet ginger, and citrus burst. No added sugar, 100% organic.", imgs:["https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600"] },
  { v:1, cat:"Food & Grocery",   name:"Artisan Granola Cluster Box",             price:18.99, stock:150, desc:"Handcrafted with rolled oats, wild honey, roasted almonds, and dried cranberries. No refined sugar, palm-oil free.", imgs:["https://images.unsplash.com/photo-1517093728432-a0440f8d45af?w=600"] },
  { v:1, cat:"Food & Grocery",   name:"Premium Matcha Ceremonial Grade",         price:28.99, stock:60,  desc:"Stone-ground ceremonial-grade matcha from Uji, Japan. Bright green, umami-rich. Perfect for lattes, baking, or traditional preparation.", imgs:["https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600"] },
  { v:1, cat:"Health & Beauty",  name:"Collagen Peptides Powder 500g",           price:42.99, stock:90,  desc:"Grass-fed bovine collagen peptides. Unflavoured, dissolves instantly. Supports skin elasticity, joint health, and gut lining.", imgs:["https://images.unsplash.com/photo-1612532275217-5c920ed3c26d?w=600"] },
  { v:1, cat:"Food & Grocery",   name:"Truffle and Sea Salt Popcorn",            price:12.99, stock:200, desc:"Air-popped non-GMO corn tossed in Italian white truffle oil and hand-harvested sea salt flakes. Gourmet snacking reimagined.", imgs:["https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600"] },
  { v:1, cat:"Food & Grocery",   name:"Raw Honey Collection 3-Jar Set",          price:36.99, stock:70,  desc:"Three 250g jars of single-origin raw honey: Wildflower, Manuka UMF10+, and Orange Blossom. Unheated, unfiltered, enzyme-rich.", imgs:["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600"] },
  { v:1, cat:"Health & Beauty",  name:"Adaptogen Mushroom Blend",               price:49.99, stock:55,  desc:"Dual-extract blend of Lion's Mane, Reishi, Cordyceps, and Chaga. Supports cognitive function, immune resilience, and energy.", imgs:["https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=600"] },
  { v:1, cat:"Food & Grocery",   name:"Extra Virgin Olive Oil 500ml",           price:22.99, stock:100, desc:"First cold-pressed EVOO from Kalamata, Greece. Polyphenol-rich, PDO certified, with a robust fruity finish.", imgs:["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600"] },
  { v:1, cat:"Food & Grocery",   name:"Protein Seed Mix 1kg",                   price:24.99, stock:130, desc:"Power-packed blend of hemp, pumpkin, sunflower, and flaxseeds. 18g protein per 100g serving, rich in omega-3 and zinc.", imgs:["https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=600"] },
  { v:1, cat:"Health & Beauty",  name:"Probiotic Daily Capsules 60-count",       price:34.99, stock:85,  desc:"50 billion CFU multi-strain probiotic with 15 strains. Delayed-release veggie capsules for maximum gut delivery.", imgs:["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"] },
  { v:1, cat:"Health & Beauty",  name:"Vitamin C Serum 20% Plus Hyaluronic Acid",price:38.99, stock:95,  desc:"Brightening serum with 20% L-Ascorbic Acid, 1% Ferulic Acid, and low-molecular-weight Hyaluronic Acid. Reduces dark spots.", imgs:["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"] },
  { v:1, cat:"Home & Living",    name:"Beeswax Candle Collection",               price:46.99, stock:65,  desc:"Set of 4 hand-poured 100% pure beeswax pillar candles in amber, ivory, sage, and terracotta. Burns clean with natural honey scent.", imgs:["https://images.unsplash.com/photo-1602874801006-4cd3b7a39e2b?w=600"] },
  { v:1, cat:"Sports & Outdoors",name:"Resistance Band Set 5 Levels",           price:24.99, stock:180, desc:"Professional latex resistance bands in 5 levels (10-50 lbs). Includes carry bag, door anchor, ankle straps, and exercise guide.", imgs:["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600"] },
  { v:1, cat:"Books & Media",    name:"Atomic Habits by James Clear",            price:16.99, stock:100, desc:"The No.1 New York Times bestseller on building good habits and breaking bad ones. Over 15 million copies sold. Paperback edition.", imgs:["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600"] },
  { v:1, cat:"Automotive",       name:"Car Air Freshener Gel Set",              price:14.99, stock:200, desc:"Set of 4 premium gel car air fresheners: cedar & bergamot, ocean breeze, leather & oud, vanilla bourbon. Each lasts 60+ days.", imgs:["https://images.unsplash.com/photo-1558618047-f4e70e7a30a6?w=600"] },
  { v:1, cat:"Food & Grocery",   name:"Fermented Hot Sauce Trio",               price:27.99, stock:90,  desc:"Three 150ml bottles of small-batch fermented hot sauce: Jalapeno & Lime, Habanero & Mango, Carolina Reaper. No vinegar added.", imgs:["https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600"] },

  // StyleHaus
  { v:2, cat:"Fashion",          name:"Linen Relaxed Blazer",             price:119.99, stock:40,  desc:"Effortlessly sophisticated single-button blazer in 100% European linen. Relaxed drape with notch lapel and two patch pockets.", imgs:["https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=600","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600"] },
  { v:2, cat:"Fashion",          name:"Oversized Cashmere Crewneck",      price:149.99, stock:35,  desc:"Grade-A Mongolian cashmere in a boxy oversized silhouette. Ribbed cuffs and hem, dropped shoulders for cosy layering.", imgs:["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600"] },
  { v:2, cat:"Fashion",          name:"Wide-Leg Tailored Trousers",       price:89.99,  stock:55,  desc:"High-rise wide-leg trousers in crepe-weave fabric. Features flat front, side pockets, and concealed hook-and-bar closure.", imgs:["https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=600"] },
  { v:2, cat:"Fashion",          name:"Leather Mini Crossbody Bag",       price:95.99,  stock:30,  desc:"Buttery-soft genuine leather mini bag with adjustable chain strap, magnetic snap closure, and two interior card slots.", imgs:["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"] },
  { v:2, cat:"Fashion",          name:"Platform Chelsea Boots",           price:134.99, stock:25,  desc:"Vegan leather Chelsea boots with 4cm chunky platform, elasticated side panels, and pull tab. Pairs with everything.", imgs:["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600"] },
  { v:2, cat:"Fashion",          name:"Printed Silk Midi Skirt",          price:109.99, stock:20,  desc:"Flowy 100% silk satin midi skirt with abstract brushstroke print. Elasticated waistband and A-line silhouette.", imgs:["https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600"] },
  { v:2, cat:"Fashion",          name:"Ribbed Modal Lounge Set",          price:74.99,  stock:60,  desc:"Matching two-piece lounge set in ultra-soft TENCEL modal. Cropped long-sleeve top and wide-leg pants.", imgs:["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"] },
  { v:2, cat:"Fashion",          name:"Straw Bucket Hat",                 price:39.99,  stock:80,  desc:"Handwoven natural straw bucket hat with 7cm brim and cotton inner sweatband. Packs flat for travel. UPF 50+.", imgs:["https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600"] },
  { v:2, cat:"Fashion",          name:"Gold-Plated Hoop Earrings Set",   price:29.99,  stock:100, desc:"Set of three 18k gold-plated stainless steel hoops in graduated sizes (20mm, 30mm, 40mm). Nickel-free and hypoallergenic.", imgs:["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600"] },
  { v:2, cat:"Fashion",          name:"Recycled Denim Jacket",            price:99.99,  stock:45,  desc:"Classic trucker jacket crafted from recycled denim (100% post-consumer cotton). Raw-hem finish, sustainably made in Portugal.", imgs:["https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600"] },
  { v:2, cat:"Fashion",          name:"Merino Wool Socks 3-Pack",         price:32.99,  stock:120, desc:"Premium extra-fine 18.5-micron Merino wool socks. Moisture-wicking, temperature-regulating, naturally odour-resistant.", imgs:["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600"] },
  { v:2, cat:"Home & Living",    name:"Linen Duvet Cover Set King",       price:159.99, stock:20,  desc:"Stonewashed 100% French linen duvet cover with two pillowcases. Pre-washed for instant softness. OEKO-TEX certified.", imgs:["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600"] },
  { v:2, cat:"Sports & Outdoors",name:"Yoga Mat Premium 6mm",             price:54.99,  stock:75,  desc:"Eco-friendly natural rubber yoga mat with microfibre top layer for superior grip. 183x68cm, includes carry strap.", imgs:["https://images.unsplash.com/photo-1601925228269-c3e0e9c54b3f?w=600"] },
  { v:2, cat:"Toys & Kids",      name:"Magnetic Building Tiles 100pc",   price:59.99,  stock:55,  desc:"STEM-focused magnetic construction tiles in 8 vibrant translucent colours. BPA-free, CE certified. Ages 3+.", imgs:["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600"] },
  { v:2, cat:"Office & Stationery",name:"Hardcover Dot-Grid Notebook A5",price:19.99,  stock:140, desc:"192-page premium dot-grid notebook with lay-flat binding, 100gsm ivory paper, two ribbon bookmarks, elastic closure.", imgs:["https://images.unsplash.com/photo-1517842645767-c639042777db?w=600"] },
  { v:2, cat:"Office & Stationery",name:"Bamboo Desk Organiser Set",      price:44.99,  stock:60,  desc:"5-piece sustainable bamboo desk organiser set: pen holder, paper tray, phone stand, sticky note holder, and drawer.", imgs:["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600"] },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log("\n Seeding users...");
  await authDB.sync({ alter: true });
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const created = [];
  for (const u of USERS) {
    const [user, wasCreated] = await User.findOrCreate({
      where: { email: u.email },
      defaults: { name: u.name, email: u.email, password: hash, role: u.role, vendorStatus: u.vendorStatus },
    });
    console.log(`  ${wasCreated ? "CREATED" : "EXISTS "} [${u.role.padEnd(6)}] ${u.name} <${u.email}>`);
    created.push(user);
  }
  return created;
}

async function seedVendors(users) {
  console.log("\n Seeding vendor profiles...");
  await vendorDB.sync({ alter: true });
  const userMap = Object.fromEntries(users.map(u => [u.email, u.id]));
  const vendors = [];
  for (const vp of VENDOR_PROFILES) {
    const userId = userMap[vp.emailKey];
    if (!userId) { console.warn(`  WARN: No userId for ${vp.emailKey}`); continue; }
    const [vendor, wasCreated] = await Vendor.findOrCreate({
      where: { userId },
      defaults: { userId, businessName: vp.businessName, description: vp.description, logoUrl: vp.logoUrl, status: "active" },
    });
    console.log(`  ${wasCreated ? "CREATED" : "EXISTS "} vendor | ${vp.businessName} (userId=${userId}, vendorId=${vendor.id})`);
    vendors.push(vendor);
  }
  return vendors;
}

async function seedProducts(users, vendors) {
  console.log("\n Seeding categories...");
  await productDB.sync({ alter: true });

  const emailToUserId = Object.fromEntries(users.map(u => [u.email, u.id]));
  const vendorUserIds = VENDOR_PROFILES.map(vp => emailToUserId[vp.emailKey]);

  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const [c, wasCreated] = await Category.findOrCreate({
      where: { name: cat.name },
      defaults: { name: cat.name, description: cat.description, status: "active" },
    });
    categoryMap[cat.name] = c.id;
    console.log(`  ${wasCreated ? "CREATED" : "EXISTS "} category | ${cat.name}`);
  }

  console.log("\n Seeding products...");
  let createdCount = 0;
  for (const p of PRODUCTS) {
    const vendorId   = vendorUserIds[p.v];
    const categoryId = categoryMap[p.cat];
    if (!vendorId || !categoryId) { console.warn(`  SKIP: "${p.name}"`); continue; }

    const [product, wasCreated] = await Product.findOrCreate({
      where: { name: p.name, vendorId },
      defaults: { vendorId, categoryId, name: p.name, description: p.desc, price: p.price, stock: p.stock, status: "active" },
    });

    if (wasCreated) {
      for (let i = 0; i < p.imgs.length; i++) {
        await ProductImage.create({ productId: product.id, imageUrl: p.imgs[i], isPrimary: i === 0 });
      }
      createdCount++;
    }
    console.log(`  ${wasCreated ? "CREATED" : "EXISTS "} [${p.cat.padEnd(20)}] ${p.name.substring(0,45).padEnd(45)} $${Number(p.price).toFixed(2)}`);
  }
  return { total: PRODUCTS.length, created: createdCount };
}

async function main() {
  console.log("================================================");
  console.log("          ShopForge Database Seeder             ");
  console.log("================================================");
  console.log("Default password for ALL accounts: " + DEFAULT_PASSWORD);

  try {
    const users   = await seedUsers();
    const vendors = await seedVendors(users);
    const { total, created } = await seedProducts(users, vendors);

    console.log("\n================================================");
    console.log("                 Seed Complete!                 ");
    console.log("================================================");
    console.log("Users created:    " + users.length);
    console.log("Vendors created:  " + vendors.length);
    console.log("Products seeded:  " + created + "/" + total);
    console.log("------------------------------------------------");
    console.log("admin@shopforge.com   -> " + DEFAULT_PASSWORD + " (admin)");
    console.log("elena@techvault.com   -> " + DEFAULT_PASSWORD + " (vendor)");
    console.log("david@freshfinds.com  -> " + DEFAULT_PASSWORD + " (vendor)");
    console.log("priya@stylehaus.com   -> " + DEFAULT_PASSWORD + " (vendor)");
    console.log("james@example.com     -> " + DEFAULT_PASSWORD + " (user)");
    console.log("================================================\n");
  } catch (err) {
    console.error("Seed failed:", err.message);
    console.error(err);
    process.exit(1);
  }
  process.exit(0);
}

main();
