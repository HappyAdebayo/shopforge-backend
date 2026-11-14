/**
 * seed-users-reviews.js
 *
 * Seeds 20 Nigerian users into auth-service/database.sqlite,
 * then seeds 3-5 reviews per user across random products in
 * product-service/database.sqlite.
 *
 * Run from project root:
 *   node shopforge-backend/product-service/scripts/seed-users-reviews.js
 */

import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_DB = path.resolve(__dirname, "../../auth-service/database.sqlite");
const PRODUCT_DB = path.resolve(__dirname, "../database.sqlite");

const USERS = [
  { name: "Amaka Okafor",      email: "amaka.okafor@gmail.com" },
  { name: "Chidi Nwosu",       email: "chidi.nwosu@yahoo.com" },
  { name: "Fatima Abdullahi",  email: "fatima.abdullahi@gmail.com" },
  { name: "Emeka Eze",         email: "emeka.eze@hotmail.com" },
  { name: "Ngozi Adeyemi",     email: "ngozi.adeyemi@gmail.com" },
  { name: "Tunde Bakare",      email: "tunde.bakare@gmail.com" },
  { name: "Chisom Obi",        email: "chisom.obi@outlook.com" },
  { name: "Yusuf Garba",       email: "yusuf.garba@gmail.com" },
  { name: "Blessing Ikenna",   email: "blessing.ikenna@gmail.com" },
  { name: "Kelechi Nwachukwu", email: "kelechi.nwachukwu@yahoo.com" },
  { name: "Aisha Mohammed",    email: "aisha.mohammed@gmail.com" },
  { name: "Seun Afolabi",      email: "seun.afolabi@gmail.com" },
  { name: "Chiamaka Okonkwo",  email: "chiamaka.okonkwo@gmail.com" },
  { name: "Ibrahim Suleiman",  email: "ibrahim.suleiman@gmail.com" },
  { name: "Adaeze Nwoye",      email: "adaeze.nwoye@yahoo.com" },
  { name: "Babatunde Olatunde",email: "babatunde.olatunde@gmail.com" },
  { name: "Nneka Okeke",       email: "nneka.okeke@gmail.com" },
  { name: "Musa Aliyu",        email: "musa.aliyu@outlook.com" },
  { name: "Ifeoma Ejike",      email: "ifeoma.ejike@gmail.com" },
  { name: "Oluwaseun Adeniyi", email: "oluwaseun.adeniyi@gmail.com" },
];

const REVIEWS = [
  { rating: 5, title: "Absolutely love it!", comment: "I bought this for my family and everyone is impressed. The quality is top-notch and delivery was faster than expected. Will definitely order again from ShopForge!" },
  { rating: 5, title: "Exceeded expectations", comment: "Honestly didn't expect this level of quality at this price point. It arrived well-packaged and works perfectly. My neighbours are already asking where I got it from." },
  { rating: 4, title: "Very good product", comment: "Good quality overall. The item matches the description and arrived in good condition. Would have given 5 stars but delivery took a little longer than I hoped." },
  { rating: 4, title: "Nice purchase", comment: "I am satisfied with this purchase. It feels sturdy and well-made. Customer support was also responsive when I had a question. Recommended!" },
  { rating: 5, title: "Best buy this year!", comment: "This is one of the best things I have bought online. It does exactly what it says and the build quality is excellent. I have already recommended it to my colleagues at work." },
  { rating: 3, title: "Decent but could be better", comment: "The product is okay but not exactly as described. It gets the job done but I expected a bit more polish. The packaging was fine. Might buy again if they improve on it." },
  { rating: 5, title: "Perfect! No complaints", comment: "Everything about this product is perfect. From the packaging to the quality of the item itself. ShopForge always delivers and this time was no different." },
  { rating: 4, title: "Great value for money", comment: "For the price, this product is amazing. I compared it with others in the market and this beats them easily. Highly recommend to anyone on a budget who does not want to compromise quality." },
  { rating: 5, title: "Superb quality!", comment: "I was skeptical at first but after using it for a week I can confidently say this is a fantastic product. Very durable and exactly as shown in the pictures." },
  { rating: 3, title: "Average product", comment: "It is okay. Not bad but not great either. It works as described but there are some minor issues I noticed. I might try other products from this seller before judging fully." },
  { rating: 4, title: "Really impressed", comment: "This is my second purchase from this vendor and I am not disappointed. The product is well-made and the quality is consistent. I will keep buying from ShopForge." },
  { rating: 5, title: "A++++ Would buy again", comment: "Fast delivery, excellent packaging, and the product is exactly as described. I have been looking for something like this for a long time. Very happy with my purchase!" },
  { rating: 4, title: "Solid purchase", comment: "Good quality product. Arrived on time and well-packaged. It is exactly what I needed and works well. Minor improvements could be made but overall a solid 4 stars from me." },
  { rating: 5, title: "Highly recommended!", comment: "I bought this as a gift and the recipient loved it! The quality is premium and it looks even better in person than in the photos. ShopForge never disappoints." },
  { rating: 4, title: "Good product, fast delivery", comment: "The product is good and delivery was prompt. I ordered on Monday and it arrived by Wednesday which is impressive. Quality is solid and matches the description perfectly." },
  { rating: 5, title: "Amazing! Worth every kobo", comment: "I have tried similar products before but this one stands out. The build quality is superior and it has been performing consistently. Worth every naira spent!" },
  { rating: 3, title: "Could use some improvements", comment: "The product works but I feel there is room for improvement. The material feels a bit cheap in some areas. However it does what it is supposed to do so I will give it 3 stars." },
  { rating: 5, title: "Excellent product!", comment: "Received the product yesterday and I am beyond happy. The quality is exceptional and it is exactly what I needed. The seller clearly cares about quality. 5 stars well deserved!" },
  { rating: 4, title: "Very satisfied", comment: "I am very satisfied with this purchase. The product quality is great and the price is reasonable. Shipping was a bit slow but the product itself made up for it." },
  { rating: 5, title: "Outstanding purchase", comment: "This is an outstanding product. I have recommended it to my entire family and friends. The quality speaks for itself. ShopForge is my go-to shopping platform from now on!" },
  { rating: 4, title: "Good but packaging could improve", comment: "The product itself is very good but the packaging could be better. The item arrived intact though so no real damage. Quality is great and it works exactly as advertised." },
  { rating: 5, title: "Brilliant! Loved it", comment: "Brilliant product! I was not sure about buying online but this experience changed my mind. The quality is top class and the delivery was smooth. I will definitely shop here again." },
  { rating: 3, title: "Okay product", comment: "It is an okay product. Does what it claims but nothing extraordinary. The build quality is average. Might not buy again but would not say it is a bad product either." },
  { rating: 5, title: "Simply the best!", comment: "No other product compares to this in terms of quality and value. I have been using it daily and it still performs like new. Very impressed with this purchase from ShopForge." },
  { rating: 4, title: "Good quality, happy customer", comment: "Happy with my purchase. The product quality is good and it arrived well before the estimated delivery date. I will definitely consider buying from this seller again." },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}

async function main() {
  console.log("Step 1: Seeding users into auth-service DB...");
  console.log("AUTH_DB:", AUTH_DB);

  const authDb = new Sequelize({
    dialect: "sqlite",
    storage: AUTH_DB,
    logging: false,
  });

  const AuthUser = authDb.define(
    "User",
    {
      id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name:         { type: DataTypes.STRING,  allowNull: false },
      email:        { type: DataTypes.STRING,  allowNull: false, unique: true },
      password:     { type: DataTypes.STRING,  allowNull: false },
      role:         { type: DataTypes.STRING,  allowNull: false, defaultValue: "user" },
      vendorStatus: { type: DataTypes.STRING,  allowNull: false, defaultValue: "none" },
    },
    { tableName: "users", timestamps: true }
  );

  await authDb.authenticate();
  console.log("Auth DB connected");

  const hashedPassword = await bcrypt.hash("Password123!", 10);
  const seededUsers = [];

  for (const u of USERS) {
    try {
      const [user, created] = await AuthUser.findOrCreate({
        where: { email: u.email },
        defaults: {
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: "user",
          vendorStatus: "none",
        },
      });
      const tag = created ? "CREATED" : "EXISTS ";
      console.log(`  [${tag}] ${u.name} (id=${user.id})`);
      seededUsers.push({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
      console.error(`  [ERROR] ${u.email}: ${err.message}`);
    }
  }

  await authDb.close();
  console.log(`\nTotal users for reviews: ${seededUsers.length}\n`);

  console.log("Step 2: Seeding reviews into product-service DB...");
  console.log("PRODUCT_DB:", PRODUCT_DB);

  const productDb = new Sequelize({
    dialect: "sqlite",
    storage: PRODUCT_DB,
    logging: false,
  });

  const Review = productDb.define(
    "Review",
    {
      id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      userId:    { type: DataTypes.INTEGER, allowNull: false },
      userName:  { type: DataTypes.STRING,  allowNull: false, defaultValue: "Customer" },
      userEmail: { type: DataTypes.STRING,  allowNull: true },
      rating:    { type: DataTypes.INTEGER, allowNull: false },
      title:     { type: DataTypes.STRING,  allowNull: true },
      comment:   { type: DataTypes.TEXT,    allowNull: false },
      status:    { type: DataTypes.STRING,  allowNull: false, defaultValue: "approved" },
    },
    {
      tableName: "product_reviews",
      timestamps: true,
      indexes: [
        { fields: ["productId"] },
        { unique: true, fields: ["productId", "userId"] },
      ],
    }
  );

  await productDb.authenticate();
  console.log("Product DB connected");

  const [products] = await productDb.query("SELECT id FROM products ORDER BY id");
  const productIds = products.map((p) => p.id);
  console.log(`Found ${productIds.length} products\n`);

  if (productIds.length === 0) {
    console.error("No products found! Run seed-40-products.js first.");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const user of seededUsers) {
    const count = Math.floor(Math.random() * 3) + 3;
    const targets = pickRandom(productIds, count);
    const pool = shuffle(REVIEWS);

    for (let i = 0; i < targets.length; i++) {
      const productId = targets[i];
      const review = pool[i % pool.length];
      try {
        const [, wasCreated] = await Review.findOrCreate({
          where: { productId, userId: user.id },
          defaults: {
            productId,
            userId:    user.id,
            userName:  user.name,
            userEmail: user.email,
            rating:    review.rating,
            title:     review.title,
            comment:   review.comment,
            status:    "approved",
          },
        });
        if (wasCreated) {
          console.log(`  + ${user.name} -> product #${productId} (${review.rating} stars)`);
          created++;
        } else {
          console.log(`  ~ skipped ${user.name} -> product #${productId}`);
          skipped++;
        }
      } catch (err) {
        console.error(`  ! Error ${user.name} -> product #${productId}: ${err.message}`);
      }
    }
  }

  await productDb.close();

  console.log(`\nDone!`);
  console.log(`  Reviews created: ${created}`);
  console.log(`  Reviews skipped: ${skipped}`);
  console.log(`\nVerify: curl http://localhost:3003/products/1/reviews`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
